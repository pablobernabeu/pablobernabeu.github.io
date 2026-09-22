// Editable R chunks.
//
// On a post that sets `editable_r: true`, the chunks named below gain a control
// that turns the published code into a text box and runs whatever the visitor
// types. R itself runs in the browser, through webR, so nothing is sent
// anywhere and no server is involved.
//
// Nothing is downloaded until the visitor asks. The R runtime is about 13 MB
// and a package set can be another 7 MB, which is far too much to spend on
// someone who came to read, so the control states the size before it is
// pressed and the runtime is fetched on that press and never before. A visitor
// who does not press it is served exactly the page that shipped.
//
// The card only ever reaches chunks named in CONFIG below, matched by a
// substring of their own published source rather than by position. If the post
// is re-knitted and a chunk changes, the match simply fails and the page stays
// as it is, which is the right way round for a progressive enhancement.
//
// GitHub Pages cannot send Cross-Origin-Opener-Policy or
// Cross-Origin-Embedder-Policy, so SharedArrayBuffer is unavailable and webR
// has to use its PostMessage channel. That channel cannot interrupt running R
// code (webR says so itself, and the bundle's interrupt() only logs an error),
// so a runaway loop can be stopped in one way only: by closing the session.
// Hence the watchdog below.
(function () {
  "use strict";

  var WEBR_VERSION = "0.6.0";
  var WEBR_BASE = "https://cdn.jsdelivr.net/npm/webr@" + WEBR_VERSION + "/dist/";
  // webr.js, not the webr.mjs that the package's "main" points at. That one is
  // the Node build and opens with `import { createRequire } from 'module'`,
  // which a browser cannot resolve. webr.js is the package's own "browser"
  // entry and has no bare imports. The version is pinned into the URL because a
  // dynamic import cannot carry an integrity hash, and a pinned jsDelivr path
  // is at least immutable.
  var WEBR_MODULE = WEBR_BASE + "webr.js";

  // Where packages are fetched from, in order. repo.r-wasm.org is webR's own
  // repository and carries CRAN built for WebAssembly; it does not carry the
  // packages written for this site. R-universe builds a Wasm binary for every
  // package in a universe alongside the Windows, macOS and Linux ones, so
  // naming the universe first makes depictr, lexsync, pilotr, scopusflow and
  // theoryforge installable by the same call that installs dplyr. lexsync
  // arrived there only on reaching CRAN (2026-09-22): its R package sits in
  // R_workflow/ rather than the repository root, so the universe's
  // root-DESCRIPTION discovery never saw it, and it came in by cran-to-git
  // like pilotr and theoryforge before it. Both hosts send
  // Access-Control-Allow-Origin: *, on the redirect to storage as well as on
  // the index, which is what lets a page on another origin read them at all.
  //
  // This works only while the two agree on an R version: R-universe publishes
  // Wasm binaries under bin/emscripten/contrib/<R major>.<R minor>/ for the
  // current release only, and webR looks under its own R version. webR 0.6.0 is
  // R 4.6.0 and the universe publishes 4.6, so they meet. A webR upgrade that
  // moves to 4.7 before the universe does would find an empty index, which is
  // why the version above is pinned and why the check below is worth keeping.
  var REPOS = ["https://pablobernabeu.r-universe.dev",
               "https://repo.r-wasm.org"];

  // Long enough for a first dplyr pipeline on a cold session, short enough that
  // a visitor who has written an endless loop is not left watching a dead page.
  var RUN_TIMEOUT_MS = 20000;

  // knitr wrote the published output with comment = '#>', so a recomputed block
  // has to be prefixed the same way or it would not look like the one it
  // replaces.
  var OUTPUT_PREFIX = "#> ";

  // The post's setup chunk is `include = FALSE`, so its options() call is not on
  // the page. Without it a recomputed tibble wraps at a different width from the
  // published one.
  var WIDTH = "options(width = 95)\n";

  // The theoryforge post sets a narrower one, and a named vector printed at
  // 95 wraps in a different place from the one on the page.
  var WIDTH_92 = "options(width = 92)\n";

  // And the pilotr post a third. A formula printed at 95 breaks in a
  // different place from the one on the page.
  var WIDTH_90 = "options(width = 90)\n";

  // The greenhouse and scopusflow posts set no width of their own, so their
  // output was printed at R's default. Stated here rather than assumed,
  // because a runtime is free to start with another one.
  var WIDTH_80 = "options(width = 80)\n";

  // Verbatim from the post's own chunk, so a reader who compares the two finds
  // the same lines. It is repeated here rather than lifted from the page
  // because the published chunk also builds `records`, which needs dplyr, and
  // the first editable chunk is deliberately the one that needs no packages at
  // all.
  var READ_IF_PRESENT =
    "read_if_present <- function(file, source) {\n" +
    "  path <- file.path('searches', file)\n" +
    "  if (!file.exists(path)) return(NULL)\n" +
    "  x <- read.csv(path, stringsAsFactors = FALSE)\n" +
    "  x$source <- source\n" +
    "  x\n" +
    "}\n";

  // Two chunks on the allFit post work on the Scopus any-field table alone, so
  // the lines that rebuild it are named once and shared. Naming them also keeps
  // the two entries honestly identical: a visitor who has opened either one has
  // already paid for the other.
  var SCOPUS_ANY = READ_IF_PRESENT +
    "scopus_any <- read_if_present('scopus_allfit_any_field.csv', " +
    "'Scopus, any indexed field')\n";

  // The closure of dplyr as the webR repository states it, resolved against
  // https://repo.r-wasm.org/bin/emscripten/contrib/4.6/PACKAGES. webR resolves
  // dependencies itself, but naming them means the status line can say what is
  // coming and a change at the repository cannot quietly turn one download into
  // fifteen.
  var DPLYR = ["R6", "cli", "dplyr", "generics", "glue", "lifecycle", "magrittr",
               "pillar", "pkgconfig", "rlang", "tibble", "tidyselect", "utf8",
               "vctrs", "withr"];

  // theoryforge's whole closure, from the universe index and
  // repo.r-wasm.org: 1.3 MB against dplyr's 6.5 MB. The example theory
  // travels inside the package, so this chunk needs no data file at all.
  var THEORYFORGE = ["jsonlite", "theoryforge", "yaml"];

  // The speculation post's own loading chunk, less its library(ggplot2),
  // shared by the two editable chunks on that page: a visitor who has opened
  // either one has already paid for the other.
  var SPECULATION = WIDTH + "library(dplyr)\n\n" +
    "comparisons <- readRDS('searches/speculation_comparisons.rds')\n" +
    "speculation <- bind_rows(comparisons) |>\n" +
    "  filter(query_type == 'comparison') |>\n" +
    "  transmute(topic, year, reference_n, n,\n" +
    "            percentage = comparison_percentage)\n";

  // pilotr brings in one package, and it is one dplyr brings in too.
  var PILOTR = ["jsonlite", "pilotr"];

  // scopusflow's closure. httr2 is what makes it the dearest of the four:
  // curl and openssl come to 4.3 MB between them, and the post never makes a
  // request, since every fetch in it is served by a stand-in.
  var SCOPUSFLOW = ["R6", "askpass", "cli", "curl", "glue", "httr2", "jsonlite",
                    "lifecycle", "magrittr", "openssl", "pillar", "pkgconfig",
                    "rappdirs", "rlang", "scopusflow", "sys", "tibble", "utf8",
                    "vctrs", "withr"];

  var CONFIG = {
    "/2026/publications-that-used-allfit-to-compare-optimisers/": [
      {
        match: "mixed_terms <- ",
        name: "the search term",
        hint: "Widen the pattern, say to 'model|effect', and watch the count leave zero.",
        packages: [],
        size: "about 13 MB",
        files: ["searches/scopus_allfit_any_field.csv"],
        prelude: WIDTH + SCOPUS_ANY
      },
      {
        // Same prelude, same file and no packages, so this costs a visitor who
        // has already opened the chunk above exactly nothing.
        match: "head(sort(table(scopus_any$publication)",
        name: "the venue tally",
        hint: "Raise the 4 to see further down the list, or put $year in place " +
              "of $publication to tally the records by year instead.",
        packages: [],
        size: "about 13 MB",
        files: ["searches/scopus_allfit_any_field.csv"],
        prelude: WIDTH + SCOPUS_ANY
      },
      {
        match: "allfit_year <- 2014L",
        name: "the screening year",
        hint: "The comment above the line says allFit shipped in June 2015. Try 2015L, " +
              "or 2018L to see the counts move.",
        packages: DPLYR,
        size: "about 20 MB",
        files: ["searches/retrieved.txt",
                "searches/scopus_allfit_any_field.csv",
                "searches/scopus_convergence_proxy.csv",
                "searches/europepmc_allfit_fulltext.csv",
                "searches/openalex_allfit_fulltext.csv"],
        // The post's own loading chunk, less its `library(ggplot2)`. ggplot2 is
        // loaded there for a figure further down the post, not for anything the
        // editable chunk touches, and it would add about 16 MB to the download.
        prelude: WIDTH + "library(dplyr)\n\n" + READ_IF_PRESENT +
          "retrieved <- readLines('searches/retrieved.txt')\n" +
          "scopus_any   <- read_if_present('scopus_allfit_any_field.csv', 'Scopus, any indexed field')\n" +
          "scopus_proxy <- read_if_present('scopus_convergence_proxy.csv', 'Scopus, convergence proxy')\n" +
          "europepmc    <- read_if_present('europepmc_allfit_fulltext.csv', 'Europe PMC, full text')\n" +
          "openalex     <- read_if_present('openalex_allfit_fulltext.csv', 'OpenAlex, full text')\n" +
          "standardise <- function(x) {\n" +
          "  if (is.null(x)) return(NULL)\n" +
          "  tibble(source = x$source,\n" +
          "         doi = tolower(sub('^https?://doi.org/', '', x$doi)),\n" +
          "         year = as.integer(x$year),\n" +
          "         authors = x$authors,\n" +
          "         title = x$title,\n" +
          "         venue = if ('journal' %in% names(x)) x$journal else x$publication)\n" +
          "}\n" +
          "records <- bind_rows(lapply(list(scopus_any, scopus_proxy, europepmc, openalex),\n" +
          "                            standardise))\n"
      }
    ],

    "/2026/speculation-across-various-scientific-topics/": [
      {
        match: "recent <- speculation |>",
        name: "the start of the comparison window",
        hint: "The post opens the window at 2016. Try 1980 for the whole period, " +
              "or 2020 to see how far the ranking moves.",
        packages: DPLYR,
        size: "about 20 MB",
        // 4 KB, against the 126 KB of the CSV beside it, and the post reads
        // this same file, so the prelude below is the published line rather
        // than a paraphrase of it.
        files: ["searches/speculation_comparisons.rds"],
        // The post's own loading chunk, less its `library(ggplot2)`. ggplot2 is
        // loaded there for the two figures further down and for nothing this
        // chunk touches, and it would add about 16 MB to the download.
        prelude: SPECULATION
      },
      {
        // Same prelude and the same packages as the chunk above, so this costs
        // a visitor who has opened that one nothing at all.
        match: "totals <- speculation |>",
        name: "the summary over the whole period",
        hint: "This is the table the post's ranking comes from. Order it by " +
              "something else, with arrange(desc(records)) in place of " +
              "arrange(desc(share)), or add a column to the summarise() call.",
        packages: DPLYR,
        size: "about 20 MB",
        files: ["searches/speculation_comparisons.rds"],
        prelude: SPECULATION
      }
    ],

    // The first chunk wired to one of this site's own packages. It needs no
    // data file: tf_example_path() points inside the installed package, so
    // the theory a visitor edits is the one the post read.
    "/2026/theoryforge-a-theory-you-can-check/": [
      {
        match: "check <- tf_check(switching)",
        name: "the theory being checked",
        hint: "The theory is loaded as switching, exactly as the post read " +
              "it. Edit it above the check and the score moves: " +
              "switching$alternatives <- NULL lowers it, and dropping the " +
              "links a prediction derives from, with switching$predictions " +
              "<- lapply(switching$predictions, function(p) " +
              "{ p$derives_from <- NULL; p }), fails a blocker and closes " +
              "the gate.",
        packages: THEORYFORGE,
        size: "about 14 MB",
        files: [],
        // The post's own first chunk, echoed a few lines above this one on
        // the page, less the packageVersion() call that only prints a
        // version number.
        prelude: WIDTH_92 + "library(theoryforge)\n" +
          "switching <- tf_read(tf_example_path('modality-switching.theory.yaml'))\n"
      },
      {
        // The chunk above this one on the page. Only the package is needed:
        // the theory it reads travels inside that package.
        match: "switching <- tf_read(tf_example_path(",
        name: "what the theory is summarised by",
        hint: "The whole document is in switching. Add " +
              "alternatives = length(switching$alternatives) to the tally, or " +
              "replace the c(...) call with str(switching$predictions[[1]]) to " +
              "read one prediction in full.",
        packages: THEORYFORGE,
        size: "about 14 MB",
        files: [],
        prelude: WIDTH_92 + "library(theoryforge)\n"
      }
    ],

    // The post's setup chunk is include = FALSE and echo = FALSE, so of its
    // fourteen chunks only two reach the page at all. This is the cheap one:
    // the spec that holds every knob is built in the prelude, because the
    // chunk that defines it is not echoed either.
    "/2026/pilotr-pilot-the-study-before-running-it/": [
      {
        match: "model_formula(spec)",
        name: "the design specification",
        hint: "The spec the post describes is already built, so edit it " +
              "above the call and the formula follows. " +
              "spec$random$item$slopes <- NULL leaves items a random " +
              "intercept only, and " +
              "spec$fixed$coefficients[['prime:z_vocab']] <- NULL " +
              "drops the interaction term.",
        packages: PILOTR,
        size: "about 15 MB",
        files: [],
        // Lifted from the post's define-spec chunk, less the validate_spec()
        // call, which prints nothing and leaves spec untouched.
        prelude: WIDTH_90 + "library(pilotr)\n" +
          "spec <- list(\n" +
          "  spec_version = '0.3',\n" +
          "  name = 'semantic_priming_ldt',\n" +
          "  seed = 90210,\n" +
          "  units = list(subject = list(n = 30), item = list(n = 24)),\n" +
          "  factors = list(list(\n" +
          "    name = 'prime', levels = c('related', 'unrelated'),\n" +
          "    contrasts = list(prime = c(-0.5, 0.5)),\n" +
          "    vary_within = c('subject', 'item'))),\n" +
          "  predictors = list(\n" +
          "    list(name = 'z_freq', varies_by = 'item', mean = 0, sd = 1),\n" +
          "    list(name = 'z_vocab', varies_by = 'subject', mean = 0, sd = 1,\n" +
          "         reliability = 0.8)),\n" +
          "  fixed = list(\n" +
          "    intercept = 6,\n" +
          "    coefficients = list(prime = 0.05, z_freq = -0.03, z_vocab = -0.02,\n" +
          "                        `prime:z_vocab` = 0.02)),\n" +
          "  random = list(\n" +
          "    subject = list(intercept_sd = 0.12, slopes = list(prime = 0.04),\n" +
          "                   correlations = list(`intercept,prime` = 0.2)),\n" +
          "    item = list(intercept_sd = 0.08, slopes = list(prime = 0.02),\n" +
          "                correlations = list(`intercept,prime` = -0.1))),\n" +
          "  response = list(family = 'shifted_lognormal', name = 'RT', sigma = 0.30,\n" +
          "                  shift = 200, round = 4)\n" +
          ")\n"
      }
    ],

    // The post's data-bearing chunk. It reads three CSVs from the page bundle,
    // which is what the directory-making above was generalised for: these live
    // under data/ rather than the searches/ the first two posts use.
    "/2026/greenhouse-gas-emissions-in-context/": [
      {
        match: "ghg <- read.csv('data/ghg_long.csv'",
        name: "the tally over the data",
        hint: "The three files are the post's own, so anything written here runs " +
              "against the real data. Try head(ghg) to see its shape, or put " +
              "n_distinct(countries$continent) in the tally at the end.",
        packages: DPLYR,
        // 945 KB, 87 KB and 7 KB. The post reads these same three files.
        files: ["data/ghg_long.csv", "data/sectors_2024.csv", "data/hdi_2023.csv"],
        size: "about 21 MB",
        // Only the libraries: the chunk does its own reading. tibble is named
        // because tribble() is its export and dplyr does not re-export it.
        prelude: WIDTH_80 + "library(dplyr)\nlibrary(tibble)\n"
      }
    ],

    // Every fetch in this post is served by a stand-in, so nothing here reaches
    // the network, and the plan is built offline.
    "/2026/scopusflow-a-literature-search-you-can-rerun/": [
      {
        match: "query <- scopus_query(",
        name: "the search itself",
        hint: "Change the term, or the field to 'TITLE' alone, and the query " +
              "follows. The years are here too: 2015:2024 sets how many cells " +
              "the plan has. Write plan instead of query on the last line to " +
              "see it.",
        packages: SCOPUSFLOW,
        size: "about 25 MB",
        files: [],
        prelude: WIDTH_80 + "library(scopusflow)\n"
      }
    ]
  };

  // One session for the page, shared by every chunk on it, so a visitor who
  // opens the second chunk after the first pays only for the packages the
  // second one adds.
  var session = null;
  var installed = {};
  var seeded = {};

  function text(el, s) {
    el.textContent = s;
  }

  // Marking a recomputed output block, as an attribute rather than a class.
  // The stylesheet reaches knitr's output blocks by `pre:not([class])` -- that
  // is what an output block is, the one <pre> on the page that carries no
  // language -- and those rules give it its wrapping, its overflow and the
  // discarding of highlight.js's guessed colours. A class here would drop the
  // block out of all three the moment it was recomputed, and classList.remove()
  // leaves `class=""` behind, which is still an attribute, so even a reset
  // would not have put them back.
  function mark(pre, on) {
    if (on) pre.setAttribute("data-editable-r", "recomputed");
    else pre.removeAttribute("data-editable-r");
  }

  function el(tag, cls, content) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (content) node.textContent = content;
    return node;
  }

  // A browser that cannot do any one of these cannot run webR, and is better
  // left with the page exactly as it shipped than with a control that fails.
  function supported() {
    if (!window.WebAssembly || typeof Worker === "undefined") return false;
    if (!window.URL || typeof URL.createObjectURL !== "function") return false;
    if (typeof Promise === "undefined" || typeof fetch !== "function") return false;
    // Dynamic import is a syntax error in engines that do not know it, so it is
    // reached through the Function constructor and never parsed here.
    try {
      new Function("u", "return import(u)");
    } catch (e) {
      return false;
    }
    return true;
  }

  var dynamicImport = null;

  function loadWebR() {
    if (!dynamicImport) dynamicImport = new Function("u", "return import(u)");
    return dynamicImport(WEBR_MODULE);
  }

  // Everything the visitor's code needs in place before it runs: the runtime,
  // the packages, the post's own data files and the prelude that rebuilds the
  // objects the published chunk was written against.
  function prepare(entry, status) {
    return Promise.resolve()
      .then(function () {
        if (session) return null;
        status("Fetching R. This is the " + entry.size.replace("about ", "") +
               " download, and it happens once.");
        return loadWebR().then(function (webr) {
          var webR = new webr.WebR({
            baseUrl: WEBR_BASE,
            // Stated rather than left to Automatic, so the channel does not
            // depend on a browser's SharedArrayBuffer gating policy.
            channelType: webr.ChannelType.PostMessage,
            interactive: false
          });
          return webR.init().then(function () {
            session = webR;
          });
        });
      })
      .then(function () {
        var missing = entry.packages.filter(function (p) { return !installed[p]; });
        if (!missing.length) return null;
        status("Installing " + missing.length + " R packages.");
        return session.installPackages(missing, { repos: REPOS }).then(function () {
          missing.forEach(function (p) { installed[p] = true; });
        });
      })
      .then(function () {
        var wanted = entry.files.filter(function (f) { return !seeded[f]; });
        if (!wanted.length) return null;
        status("Loading the post's own data.");
        // The directories come from the paths themselves. They used to be one
        // hard-coded "searches", which is where the first two posts keep their
        // files and nowhere else; a post whose data sits under data/ could not
        // be wired at all until this stopped assuming.
        var dirs = {};
        wanted.forEach(function (f) {
          var parts = f.split("/");
          parts.pop();
          var path = "/home/web_user";
          parts.forEach(function (part) {
            path += "/" + part;
            dirs[path] = true;
          });
        });
        return Object.keys(dirs).sort().reduce(function (chain, dir) {
          return chain.then(function () {
            // Parents before children, hence the sort, and an existing
            // directory is not an error worth stopping for.
            return session.FS.mkdir(dir).catch(function () { /* already there */ });
          });
        }, Promise.resolve())
          .then(function () {
            return Promise.all(wanted.map(function (f) {
              return fetch(new URL(f, location.href).href)
                .then(function (r) {
                  if (!r.ok) throw new Error("could not fetch " + f);
                  return r.arrayBuffer();
                })
                .then(function (buf) {
                  return session.FS.writeFile("/home/web_user/" + f,
                                              new Uint8Array(buf));
                })
                .then(function () { seeded[f] = true; });
            }));
          });
      });
  }

  // The integrity check compares two printings of one result, not two strings
  // a person wrote, so the characters a runtime may render either way are
  // levelled first. A tibble header carries U+00D7 where the console is sure of
  // UTF-8 and a plain "x" where it is not, and pillar pads its columns to a
  // width that can differ by a space between versions.
  function comparable(s) {
    return s.replace(/\u00d7/g, "x").replace(/[ \t]+$/gm, "").trim();
  }

  // captureR gathers what R printed as well as what it returned, which is what
  // a knitr chunk shows. Conditions are left uncaptured so a warning still
  // reaches stderr and is shown alongside the result rather than swallowed.
  function runR(code) {
    return session.globalShelter.captureR(code, {
      withAutoprint: true,
      captureStreams: true,
      captureConditions: false
    }).then(function (out) {
      var lines = [];
      out.output.forEach(function (o) {
        String(o.data).replace(/\n$/, "").split("\n").forEach(function (line) {
          // Both streams take the same prefix knitr gave the published block.
          // R's own stderr already opens with "Error in" or "Warning message:",
          // so a second label here would only repeat it.
          lines.push(OUTPUT_PREFIX + line);
        });
      });
      return session.destroy(out.result).then(function () {
        return lines.join("\n");
      });
    });
  }

  // The PostMessage channel cannot interrupt R, so the only way out of code that
  // never finishes is to throw the session away. Everything installed goes with
  // it, which is why the wait is generous.
  function runWithWatchdog(code, status) {
    var settled = false;
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        if (settled) return;
        settled = true;
        var dead = session;
        session = null;
        installed = {};
        seeded = {};
        try { dead.close(); } catch (e) { /* nothing left to close */ }
        reject(new Error("The code did not finish within " +
                         (RUN_TIMEOUT_MS / 1000) + " seconds, so R was stopped. " +
                         "Press Run again to start a fresh session."));
      }, RUN_TIMEOUT_MS);
      runR(code).then(function (v) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(v);
      }, function (e) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(e);
      });
      status("Running.");
    });
  }

  function attach(details, entry) {
    var pre = details.querySelector("pre.r");
    var code = pre.querySelector("code");
    var published = code.textContent;
    var publishedHTML = code.innerHTML;

    // knitr writes a chunk's output as the next sibling of the block, a <pre>
    // with no class on it or on its <code>. academic.js folds classed blocks
    // only, so the output is never inside the <details>.
    var outPre = details.nextElementSibling;
    if (!outPre || outPre.tagName !== "PRE" || outPre.className) outPre = null;
    var outCode = outPre ? outPre.querySelector("code") : null;
    var publishedOut = outCode ? outCode.textContent : null;
    var publishedOutHTML = outCode ? outCode.innerHTML : null;

    details.classList.add("has-editable-r");

    var bar = el("div", "editable-r");
    var buttons = el("div", "editable-r-buttons");
    var editBtn = el("button", "editable-r-btn editable-r-edit", "Edit this code");
    editBtn.type = "button";
    var runBtn = el("button", "editable-r-btn editable-r-run", "Run");
    runBtn.type = "button";
    runBtn.hidden = true;
    var resetBtn = el("button", "editable-r-btn editable-r-reset", "Reset");
    resetBtn.type = "button";
    resetBtn.hidden = true;
    var note = el("span", "editable-r-note",
                  "Runs R in your browser. The first run downloads " + entry.size + ".");
    var statusLine = el("p", "editable-r-status");
    statusLine.setAttribute("role", "status");

    buttons.appendChild(editBtn);
    buttons.appendChild(runBtn);
    buttons.appendChild(resetBtn);
    buttons.appendChild(note);
    bar.appendChild(buttons);
    bar.appendChild(statusLine);
    pre.parentNode.insertBefore(bar, pre.nextSibling);

    var editor = null;
    var busy = false;

    function status(s, kind) {
      text(statusLine, s || "");
      statusLine.className = "editable-r-status" + (kind ? " is-" + kind : "");
    }

    // A textarea replaces the highlighted block rather than sitting invisibly on
    // top of it. An overlay keeps the colours but only while its metrics match
    // the block underneath to the pixel, and a caret that drifts from the text
    // is a worse trade than plain black on the code's own background.
    function openEditor() {
      if (editor) return;
      editor = document.createElement("textarea");
      editor.className = "editable-r-editor";
      editor.value = published;
      editor.spellcheck = false;
      editor.setAttribute("aria-label", "R code for " + entry.name +
                                        ", editable. Press Escape to restore the published code.");
      // The box grows with what is typed into it rather than scrolling, so a
      // visitor who adds a few lines can still see the whole chunk.
      function fitRows() {
        editor.rows = editor.value.replace(/\n$/, "").split("\n").length;
      }
      fitRows();
      editor.addEventListener("input", fitRows);
      editor.addEventListener("keydown", function (e) {
        // Tab is deliberately not captured, so focus can always leave.
        if (e.key === "Escape" || e.key === "Esc") {
          e.stopPropagation();
          reset();
          editBtn.focus();
        }
      });
      pre.hidden = true;
      pre.parentNode.insertBefore(editor, pre);
      editBtn.hidden = true;
      runBtn.hidden = false;
      resetBtn.hidden = false;
      text(note, entry.hint);
      editor.focus();
    }

    function closeEditor() {
      if (!editor) return;
      editor.parentNode.removeChild(editor);
      editor = null;
      pre.hidden = false;
      editBtn.hidden = false;
      runBtn.hidden = true;
      resetBtn.hidden = true;
      text(note, "Runs R in your browser. The first run downloads " + entry.size + ".");
    }

    function showOutput(s) {
      if (!outCode) return;
      // textContent, not innerHTML: whatever R printed is data, and it also
      // leaves the clipboard button, a sibling of this <code>, where it was.
      text(outCode, s);
      // highlight.js is deliberately NOT run over this. The stylesheet already
      // throws away the colours it puts on a knitr output block, because it has
      // no language to go on and guesses one: it reads a leading "#>" as a
      // preprocessor directive and paints the whole block in the comment colour,
      // bold, at under 3:1 against either background. Leaving the text plain
      // gives exactly what the published block shows once that rule has undone
      // the guess, and costs a pass over the DOM less.
      mark(outPre, true);
    }

    function reset() {
      code.innerHTML = publishedHTML;
      if (outCode) {
        outCode.innerHTML = publishedOutHTML;
        mark(outPre, false);
      }
      closeEditor();
      status("");
    }

    function run() {
      if (busy) return;
      busy = true;
      runBtn.disabled = true;
      if (outPre) outPre.setAttribute("aria-busy", "true");
      bar.classList.add("is-busy");

      prepare(entry, status)
        .then(function () {
          // Before the visitor's own code is trusted, the published code is run
          // once and its result compared with the result printed on the page.
          // The prelude here is an excerpt of the post rather than the post
          // itself, so this is the one check that it still stands for the same
          // thing. A mismatch is reported rather than hidden.
          if (seeded["__checked__" + entry.match]) return null;
          return session.evalRVoid(entry.prelude)
            .then(function () { return runR(published); })
            .then(function (out) {
              seeded["__checked__" + entry.match] = true;
              if (publishedOut !== null &&
                  comparable(out) !== comparable(publishedOut)) {
                status("The published code gives a different answer here from the " +
                       "one printed on the page, so treat what follows as a " +
                       "demonstration rather than a reproduction.", "warn");
              }
            });
        })
        .then(function () {
          return session.evalRVoid(entry.prelude);
        })
        .then(function () {
          return runWithWatchdog(editor ? editor.value : published, status);
        })
        .then(function (out) {
          showOutput(out);
          if (statusLine.className.indexOf("is-warn") === -1) status("");
        })
        .catch(function (e) {
          status(e && e.message ? e.message : String(e), "error");
        })
        .then(function () {
          busy = false;
          runBtn.disabled = false;
          if (outPre) outPre.removeAttribute("aria-busy");
          bar.classList.remove("is-busy");
        });
    }

    editBtn.addEventListener("click", function () {
      openEditor();
      // The chunk is folded shut on this post, so anyone who reaches the button
      // has opened it already; nothing to do but let them type.
    });
    runBtn.addEventListener("click", run);
    resetBtn.addEventListener("click", reset);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var entries = CONFIG[location.pathname];
    if (!entries || !supported()) return;

    // academic.js moves every classed <pre> inside a generated <details> when
    // the theme bundle executes, which is before this listener runs, so the
    // wrappers are already there.
    var blocks = document.querySelectorAll(".article-style details > pre.r");
    entries.forEach(function (entry) {
      for (var i = 0; i < blocks.length; i++) {
        var code = blocks[i].querySelector("code");
        if (code && code.textContent.indexOf(entry.match) !== -1) {
          attach(blocks[i].parentNode, entry);
          return;
        }
      }
    });
  });
})();
