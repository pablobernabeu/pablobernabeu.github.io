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
   * State machine: loading -> ready | error
   * ---------------------------------------------------------------------- */

  function state(el) {
    return el.getAttribute("data-mermaid-state");
  }

  // Reveal a block once Mermaid has produced its SVG. Returns false while there
  // is still nothing to show, so the caller knows to keep waiting.
  function reveal(el) {
    if (state(el) === "ready") return true;
    var svg = el.querySelector("svg");
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
      if (state(els[i]) === "ready" || state(els[i]) === "loading") continue;
      // Mermaid stamps "data-processed" before it renders, so a failed block
      // carrying it is one Mermaid itself could not draw. Handing that back
      // would only cycle it through the spinner to the same message.
      if (els[i].getAttribute("data-processed")) continue;
      els[i].setAttribute("data-mermaid-state", "loading");
      els[i].setAttribute("aria-busy", "true");
      clearError(els[i]);
      fresh.push(els[i]);
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

    try {
      // Mermaid stamps each element "data-processed" before rendering it, so a
      // block that has already been through here is skipped.
      window.mermaid.init(undefined, els);
    } catch (e) {
      // A diagram Mermaid cannot parse throws out of the whole batch. Whatever
      // it finished before the throw still has its SVG; the loop below reports
      // the rest.
    }

    for (var j = 0; j < els.length; j++) {
      if (!reveal(els[j])) waitFor(els[j]);
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
