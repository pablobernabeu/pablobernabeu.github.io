/**
 * Mermaid diagram enhancer
 *
 * Takes charge of every ".mermaid" block on a `diagram: true` page and moves it
 * through exactly one of three states: loading (the spinner drawn by the CSS in
 * layouts/partials/custom_head.html), ready (the SVG revealed), or error (a
 * short "Diagram unavailable" message). The raw diagram source stays hidden in
 * all three -- it is never revealed as a fallback, because a wall of
 * "graph TD ..." reads as a broken page rather than as a diagram.
 *
 * It also drives the render itself instead of leaving it to Mermaid's own
 * startOnLoad hook. That hook runs on window "load", which waits for every
 * image and iframe on the page, so a diagram sitting under an embedded web app
 * used to stay blank until the embed had finished loading.
 *
 * Rendered diagrams scale responsively to the available content width.
 */
(function () {
  "use strict";

  // How long to keep waiting on a block that has been handed to Mermaid but has
  // not produced an SVG. Rendering a flowchart is synchronous, so in practice
  // this only covers a diagram type that renders asynchronously; the slow- and
  // blocked-CDN cases are handled by the watchdog in custom_head.html, which
  // runs whether or not this file ever gets to execute.
  var SETTLE_MS = 5000;

  var ERROR_LABEL = "Diagram unavailable";

  /* -------------------------------------------------------------------------
   * Edge labels
   * ---------------------------------------------------------------------- */

  // Mermaid renders every edge label as <span class="edgeLabel">...</span>,
  // including the unlabelled arrows, whose span comes out empty; without this
  // the lavender pill the CSS puts on real labels shows up as a blank box
  // sitting on each plain connector. The ":empty" rule in custom_head.html
  // covers that; this catches a span holding nothing but whitespace, which
  // ":empty" does not match.
  function unpadBlankEdgeLabels(svg) {
    var spans = svg.querySelectorAll("span.edgeLabel");
    for (var i = 0; i < spans.length; i++) {
      var text = spans[i].textContent;
      if (!text || !text.trim()) spans[i].classList.add("mermaid-blank-label");
    }
  }

  /* -------------------------------------------------------------------------
   * Source normalisation
   * ---------------------------------------------------------------------- */

  // The {{< diagram >}} shortcode emits a bare <div class="mermaid">, but a
  // fenced mermaid block knitted by blogdown arrives as
  // <pre class="mermaid"><code>...</code></pre>. Mermaid parses the block's
  // innerHTML, so the <code> tag reaches its parser and the diagram fails,
  // leaving an empty box. Being a <pre>, the block is also taken for code by
  // two other scripts. The xaringanExtra clipboard, at DOMContentLoaded, would
  // append a "Copy Code" button to it; swapping the <pre> for a plain <div>
  // holding the source as text gets in first, because deferred scripts such as
  // this one run before DOMContentLoaded. The code-folding pass in academic.js
  // cannot be beaten that way: it runs as soon as the theme bundle executes at
  // the end of <body>, and has already moved the <pre> into an open <details>
  // behind a "Collapse" summary. That wrapper is recognised by its summary and
  // replaced along with the <pre>, so a diagram does not read as a code chunk.
  function isCodeFold(node) {
    if (!node || node.tagName !== "DETAILS" || node.children.length !== 2) return false;
    var summary = node.firstElementChild;
    return summary.tagName === "SUMMARY" && /^(Collapse|Expand)$/.test(summary.textContent.trim());
  }

  function normalise(el) {
    var code = el.tagName === "PRE" ? el.querySelector("code") : null;
    if (!code || !el.parentNode) return el;
    var div = document.createElement("div");
    div.className = el.className;
    if (el.id) div.id = el.id;
    div.textContent = code.textContent;
    var target = isCodeFold(el.parentNode) ? el.parentNode : el;
    target.parentNode.replaceChild(div, target);
    return div;
  }

  // The theme pins Mermaid 8.4.4, which predates the "flowchart" keyword that
  // current Mermaid documents and only accepts "graph", the older name for the
  // same diagram. A "flowchart" source therefore fails to parse. Rename the
  // header, but only when the loaded library rejects it, so that nothing is
  // rewritten once the library is upgraded.
  var FLOWCHART_HEADER = /^(\s*)flowchart(?:-v2)?(?=\s)/;
  var flowchartKeyword; // undetermined until a block needs it

  function libraryParsesFlowchart() {
    if (flowchartKeyword === undefined) {
      try {
        window.mermaid.parse("flowchart LR\nA-->B");
        flowchartKeyword = true;
      } catch (e) {
        flowchartKeyword = false;
      }
    }
    return flowchartKeyword;
  }

  function renameFlowchartHeader(el) {
    var first = el.firstChild;
    if (!first || first.nodeType !== 3 || !FLOWCHART_HEADER.test(first.nodeValue)) return;
    if (libraryParsesFlowchart()) return;
    first.nodeValue = first.nodeValue.replace(FLOWCHART_HEADER, "$1graph");
  }

  /* -------------------------------------------------------------------------
   * State machine: loading -> ready | error
   * ---------------------------------------------------------------------- */

  function state(el) {
    return el.getAttribute("data-mermaid-state");
  }

  // The finished diagram. Mermaid renders into a scratch <div id="dmermaid-...">
  // inside the block and, once done, replaces the block's content with the SVG.
  // A source it cannot parse leaves the scratch <div> behind with an empty <svg>
  // in it, which must not pass for a diagram: counting it used to reveal a
  // blank box in the diagram's place.
  function drawnSvg(el) {
    for (var c = el.firstElementChild; c; c = c.nextElementSibling) {
      if (c.tagName.toLowerCase() === "svg") return c;
    }
    return null;
  }

  // Reveal a block once Mermaid has produced its SVG. Returns false while there
  // is still nothing to show, so the caller knows to keep waiting.
  function reveal(el) {
    if (state(el) === "ready") return true;
    var svg = drawnSvg(el);
    if (!svg) return false;

    el.setAttribute("data-mermaid-state", "ready");
    el.removeAttribute("aria-busy");
    clearError(el);
    unpadBlankEdgeLabels(svg);
    el.classList.add("mermaid-ready");
    return true;
  }

  // Give up on a block: show the message rather than the source it is hiding.
  function fail(el) {
    if (state(el) === "ready" || state(el) === "error") return;
    // Drop what an abandoned render left behind (see drawnSvg).
    var scratch = el.querySelectorAll("div[id^='dmermaid']");
    for (var i = 0; i < scratch.length; i++) scratch[i].parentNode.removeChild(scratch[i]);
    el.setAttribute("data-mermaid-state", "error");
    el.classList.add("mermaid-error");
    el.removeAttribute("aria-busy");
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", ERROR_LABEL);
  }

  // Undo an error, so that a verdict reached early can still be taken back --
  // see claim() on why the head watchdog's is provisional.
  function clearError(el) {
    el.classList.remove("mermaid-error");
    el.removeAttribute("role");
    el.removeAttribute("aria-label");
  }

  // Watch one straggler for its SVG, and give up on it after SETTLE_MS. The
  // observer and the timer are torn down together, whichever fires first.
  function waitFor(el) {
    var obs = new MutationObserver(function () {
      if (reveal(el)) stop();
    });
    var timer = setTimeout(function () {
      fail(el);
      stop();
    }, SETTLE_MS);
    function stop() {
      obs.disconnect();
      clearTimeout(timer);
    }
    obs.observe(el, { childList: true, subtree: true });
  }

  /* -------------------------------------------------------------------------
   * Driver
   * ---------------------------------------------------------------------- */

  // Take ownership of any diagram not already rendered, and return it. Blocks
  // the head watchdog has already failed are picked back up: it fires on a
  // deadline, blind to whether the download is merely slow, so its verdict is
  // provisional and a library that turns up late still gets to render.
  function claim() {
    var els = document.querySelectorAll(".mermaid");
    var fresh = [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (state(el) === "ready" || state(el) === "loading") continue;
      // Mermaid stamps "data-processed" before it renders, so a failed block
      // carrying it is one Mermaid itself could not draw. Handing that back
      // would only cycle it through the spinner to the same message.
      if (el.getAttribute("data-processed")) continue;
      el = normalise(el);
      el.setAttribute("data-mermaid-state", "loading");
      el.setAttribute("aria-busy", "true");
      clearError(el);
      fresh.push(el);
    }
    return fresh;
  }

  function start() {
    var els = claim();
    if (!els.length) return;

    if (!window.mermaid || typeof window.mermaid.init !== "function") {
      for (var i = 0; i < els.length; i++) fail(els[i]);
      return;
    }

    for (var j = 0; j < els.length; j++) {
      var el = els[j];
      renameFlowchartHeader(el);
      try {
        // One block per call. A source Mermaid cannot parse throws, and in a
        // batch the throw would abandon every block after it. Mermaid stamps
        // each element "data-processed" before rendering it, so a block that
        // has already been through here is skipped.
        window.mermaid.init(undefined, [el]);
      } catch (e) {
        fail(el);
        continue;
      }
      if (!reveal(el)) waitFor(el);
    }
  }

  // Render on our own schedule, not on window "load".
  if (window.mermaid) window.mermaid.startOnLoad = false;

  // This file executing at all means the deferred Mermaid download resolved one
  // way or the other, so the head's watchdog has nothing left to catch.
  if (window.mermaidWatchdog) {
    clearTimeout(window.mermaidWatchdog);
    window.mermaidWatchdog = null;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  // A second, idempotent pass for anything created late -- the theme's
  // academic.js rewrites fenced "mermaid" code blocks into .mermaid divs from a
  // jQuery ready handler, which jQuery 3 runs in a task of its own after
  // DOMContentLoaded.
  window.addEventListener("load", start);
})();
