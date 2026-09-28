// Links to the sections of an article.
//
// Every h2 and h3 in the body of a post, a software page or a publication page is
// given a link to itself, a "#" that custom.scss shows beside the heading on hover
// or keyboard focus, so that a reader can copy the address of one section. A long
// post also opens with a list of its sections, folded shut in a <details> so that
// it takes a single line until it is wanted. Both are built here rather than by
// Hugo because most posts are knitted from R Markdown and reach Hugo as finished
// HTML, whose headings .TableOfContents never sees.
//
// layouts/partials/custom_js.html loads this file on those three kinds of page when
// the body holds an h2 or h3, and layouts/post/single.html marks the body of a
// long post with data-contents to ask for the list.
(function () {
  "use strict";

  var body = document.querySelector(".article-container > .article-style");
  if (!body) return;

  // Four h2 sections, the figure layouts/post/single.html uses to hold room for
  // the list. With fewer, a post is short enough to take in by scrolling, and a
  // list of two or three entries would cost the reader more than it saves.
  var MIN_SECTIONS = 4;

  // A heading takes part only where it is visible body text that can hold a link.
  // An .sr-only heading is never seen. One inside a <details> may be folded away,
  // so the list could send the reader to a place that shows nothing. One inside a
  // link or a button cannot contain another link, and the related references
  // block belongs to related-references.js, which rebuilds it.
  var EXCLUDED = "details, summary, a, button, label, .related-references";

  function eligible(heading) {
    if (heading.classList.contains("sr-only")) return false;
    if (!/\S/.test(heading.textContent)) return false;
    var outer = heading.parentElement.closest(EXCLUDED);
    return !(outer && body.contains(outer));
  }

  // The heading's text as a line of the list. Footnote markers are left out, as
  // their numbers would read as part of the title.
  function label(heading) {
    var copy = heading.cloneNode(true);
    var notes = copy.querySelectorAll(".footnote-ref");
    for (var i = 0; i < notes.length; i++) notes[i].remove();
    return copy.textContent.replace(/\s+/g, " ").trim();
  }

  // Goldmark puts the id on the heading itself. Pandoc puts it on the
  // <div class="section"> (or, in HTML5 output, the <section>) that the heading
  // opens, and leaves the heading without one. Only the heading that opens the
  // section takes its id, since a later one would send the reader to the top of
  // the section instead of to itself.
  function existingId(heading) {
    if (heading.id) return heading.id;
    var parent = heading.parentElement;
    if (parent !== body && parent.id && parent.firstElementChild === heading &&
        (parent.tagName === "SECTION" || parent.classList.contains("section"))) {
      return parent.id;
    }
    return "";
  }

  // A heading written as raw HTML may have no id at all, so one is made from its
  // text: accents removed, lower case, and each run of other characters turned
  // into a hyphen. It starts with a letter, which keeps it a valid
  // CSS identifier for the scripts that look targets up by selector, and it is
  // numbered if the page already holds the same id.
  function newId(heading, text) {
    var base = text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!/^[a-z]/.test(base)) base = "section" + (base ? "-" + base : "");
    var id = base;
    for (var n = 1; document.getElementById(id); n++) id = base + "-" + n;
    heading.id = id;
    return id;
  }

  function link(id, text) {
    var a = document.createElement("a");
    a.setAttribute("href", "#" + id);
    a.textContent = text;
    return a;
  }

  // The list nests each h3 under the h2 before it. An h3 that comes before the
  // first h2 subdivides the untitled opening of the post, which sits at the same
  // level as the h2 sections, so it is listed at the top level.
  function buildContents(sections) {
    var nav = document.createElement("nav");
    nav.className = "article-toc";
    nav.setAttribute("aria-label", "Contents");
    var details = document.createElement("details");
    var summary = document.createElement("summary");
    summary.textContent = "Contents";
    var list = document.createElement("ul");
    details.appendChild(summary);
    details.appendChild(list);
    nav.appendChild(details);

    var parent = null;
    var sublist = null;
    sections.forEach(function (section) {
      var item = document.createElement("li");
      item.appendChild(link(section.id, section.text));
      if (section.level === 3 && parent) {
        if (!sublist) {
          sublist = document.createElement("ul");
          parent.appendChild(sublist);
        }
        sublist.appendChild(item);
        return;
      }
      list.appendChild(item);
      if (section.level === 2) {
        parent = item;
        sublist = null;
      }
    });

    // First in the body, so that it opens the post. custom.scss has no rule keyed
    // to the body's first child that it could take over.
    body.insertBefore(nav, body.firstChild);
  }

  function build() {
    var sections = [];
    var made = [];
    var candidates = body.querySelectorAll("h2, h3");
    for (var i = 0; i < candidates.length; i++) {
      var heading = candidates[i];
      if (!eligible(heading)) continue;
      var text = label(heading);
      var id = existingId(heading);
      if (!id) {
        id = newId(heading, text);
        made.push(id);
      }
      sections.push({ heading: heading, level: heading.tagName === "H2" ? 2 : 3, id: id, text: text });
    }

    var h2Count = sections.filter(function (section) { return section.level === 2; }).length;
    if (body.hasAttribute("data-contents") && h2Count >= MIN_SECTIONS &&
        !body.querySelector("#TOC, #TableOfContents, .article-toc")) {
      buildContents(sections);
    }
    // Hands back the room custom.scss held for the list, now filled by it or not
    // needed after all.
    body.removeAttribute("data-contents");

    // The link is the heading's last child and is taken out of the flow in
    // custom.scss, so the heading wraps exactly as it did without it. Its visible
    // text is the "#"; screen readers hear the label instead.
    sections.forEach(function (section) {
      var anchor = link(section.id, "#");
      anchor.className = "heading-anchor";
      anchor.setAttribute("aria-label", "Link to this section");
      section.heading.appendChild(anchor);
    });

    // An address that points at an id made here arrives before the id exists. The
    // HTML standard has the browser look for its target only while the page is
    // being parsed, which is over before this runs, so the scroll is made here.
    // scroll-padding-top in custom.scss keeps the heading clear of the navbar.
    var hash = "";
    try {
      hash = decodeURIComponent(window.location.hash.slice(1));
    } catch (e) {}
    if (hash && made.indexOf(hash) !== -1) {
      document.getElementById(hash).scrollIntoView();
    }
  }

  // This file is deferred, so it runs just before DOMContentLoaded. The build
  // waits for that event, and so comes after the handlers already listening for
  // it. One post folds every <details> on the page from such a handler and gives
  // each the label of a code chunk's fold control, which would otherwise reach
  // the list's summary as well.
  document.addEventListener("DOMContentLoaded", build);
})();
