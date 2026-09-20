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
 * Rendered diagrams scale to the available content width, down to the point at
 * which their labels would stop being readable. Past that they keep their size
 * and the block scrolls sideways instead, which is what the legibility floor
 * below is for.
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
   * Legibility floor
   * ---------------------------------------------------------------------- */

  // The smallest the labels are allowed to become, in CSS pixels. It is a
  // floor, not a size anything is set to.
  var MIN_LABEL_PX = 12;

  var SCROLL_LABEL = "Diagram, scrollable sideways";

  // Every block that has reached the ready state, paired with its drawing, so
  // that the floor and the scroll affordance can both be worked out again when
  // the width or the font size changes under them.
  var readyBlocks = [];

  // Mermaid never sets a font size. It lays the graph out at whatever size the
  // page is using, writes the resulting pixel width on the SVG, and the
  // "max-width: 100%" rule in custom_head.html then scales the finished
  // drawing down to the block, glyphs included. Label size is therefore a
  // dependent variable, and a graph half again as wide as its column loses a
  // third of its text: on a phone the widest diagrams came out under 5px,
  // which is no longer reading. A minimum width holds the scale above the
  // floor, because min-width is applied after max-width whichever order the
  // two are declared in, and .mermaid-ready's overflow-x carries what no
  // longer fits. Panning a diagram sideways is a real cost, accepted here only
  // because the alternative is text nobody can read.
  //
  // The floor is taken from the block's own computed size rather than written
  // as a fixed ratio, so that it follows a reader who has raised the font size
  // from the navbar or in the browser instead of quietly undoing their choice.
  // The user coordinate system comes from the viewBox, not from the width
  // attribute, which a future Mermaid configured with useMaxWidth would set to
  // "100%".
  function holdLegible(el, svg) {
    var box = svg.viewBox && svg.viewBox.baseVal;
    if (!box || !box.width) return;
    var base = parseFloat(window.getComputedStyle(el).fontSize);
    if (!base) return;
    svg.style.minWidth = Math.round(box.width * Math.min(1, MIN_LABEL_PX / base)) + "px";
  }

  // Anything that scrolls has to be reachable from the keyboard, and anything
  // focusable needs a name. Both are conditional, because a diagram that fits
  // is not a scroll region and should not collect a tab stop on its way past.
  // The block is sized from the viewport, so the same diagram crosses that
  // threshold when a window is resized or a phone is turned, and the
  // attributes have to come back off as readily as they go on. The label is
  // checked before the role is cleared, so that this cannot strip the
  // labelling fail() puts on a diagram that never arrived.
  // The hint that a clipped diagram can be panned. A diagram cut off at the
  // right edge of a phone reads as a broken image rather than as something to
  // drag, and nothing else on the page says otherwise. It lives outside the
  // block, because anything inside would scroll away with the drawing, and it
  // is hidden from assistive technology, which is told the same thing by the
  // block's own label.
  function scrollHint(el, wanted) {
    var hint = el.nextElementSibling;
    var isHint = hint && hint.className === "mermaid-scroll-hint";
    if (wanted && !isHint) {
      hint = document.createElement("p");
      hint.className = "mermaid-scroll-hint";
      hint.setAttribute("aria-hidden", "true");
      hint.textContent = "Drag sideways to see the whole diagram";
      el.parentNode.insertBefore(hint, el.nextSibling);
    } else if (!wanted && isHint) {
      hint.parentNode.removeChild(hint);
    }
  }

  function markScrollable(el) {
    if (el.scrollWidth - el.clientWidth > 1) {
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "group");
      el.setAttribute("aria-label", SCROLL_LABEL);
      scrollHint(el, true);
    } else {
      scrollHint(el, false);
      // Not while the reader is standing on it: taking the tab stop off a
      // focused element hands focus back to the document, which on a widening
      // window would drop a keyboard reader at the top of the page.
      if (document.activeElement !== el) el.removeAttribute("tabindex");
      if (el.getAttribute("aria-label") === SCROLL_LABEL) {
        el.removeAttribute("role");
        el.removeAttribute("aria-label");
      }
    }
  }

  // The caption that a results='asis' chunk writes under a diagram. It is a
  // sibling of the block rather than a child of it, so the stylesheet can give
  // it the block's full-bleed geometry but cannot give it the drawing's. Those
  // are not the same thing: the block is 94vw wide up to 960px, while the
  // drawing inside it is only as wide as Mermaid drew it and is centred, so a
  // caption left-aligned at the block's width starts well to the left of the
  // diagram, and on a narrow window to the left of the prose as well. Matching
  // the drawing is what makes it read as a caption.
  //
  // Only the width is set here. The stylesheet centres the caption on the same
  // axis as the block, by the same left/transform pair, and that centring holds
  // at any width, so the box lands under the drawing once it is the right size.
  function hasClass(node, name) {
    return node && typeof node.className === "string" &&
      (" " + node.className + " ").indexOf(" " + name + " ") > -1;
  }

  // Every part of the caption, wherever apa-captions.js has put it. The note
  // stays below the block; the number and the title are moved above it. All of
  // them have to be narrowed, or the heading sits at the prose column's left
  // edge while the drawing it names is centred somewhere to the right of it.
  function captionParts(el) {
    var parts = [];
    var next = el.nextElementSibling;
    // scrollHint() puts its own paragraph directly after the block.
    if (next && next.className === "mermaid-scroll-hint") next = next.nextElementSibling;
    if (hasClass(next, "caption-diagram") || hasClass(next, "apa-caption-note")) {
      parts.push(next);
    }
    var prev = el.previousElementSibling;
    while (prev && (hasClass(prev, "apa-caption-title") ||
                    hasClass(prev, "apa-caption-number"))) {
      parts.push(prev);
      prev = prev.previousElementSibling;
    }
    return parts;
  }

  function alignCaption(el, svg) {
    var parts = captionParts(el);
    if (!parts.length) return;
    var drawn = svg ? svg.getBoundingClientRect().width : 0;
    // A drawing held wider than the block is panned rather than centred, and
    // its caption belongs at the block's width. So does one that cannot be
    // measured, which is what the stylesheet already gives it.
    var width = (drawn > 0 && drawn < el.clientWidth) ? Math.round(drawn) + "px" : "";
    for (var i = 0; i < parts.length; i++) {
      parts[i].style.width = width;
      // The stylesheet centres .caption-diagram on the block's own axis. The
      // APA parts are ordinary paragraphs at prose width, so they are told to
      // do the same only while they are naming a diagram.
      if (hasClass(parts[i], "apa-caption-number") || hasClass(parts[i], "apa-caption-title")) {
        parts[i].className = parts[i].className.replace(/ ?apa-caption-wide/, "") +
          (width ? " apa-caption-wide" : "");
      }
    }
  }

  // One pass over every ready block, coalesced so that dragging a window edge
  // does not run it on each pixel. The floor is worked out again as well as the
  // affordance, because it is a ratio between the label size and the block's
  // font size and the reader can change the latter from the navbar at any time.
  var remarkTimer;
  function refreshBlocks() {
    clearTimeout(remarkTimer);
    remarkTimer = setTimeout(function () {
      for (var i = 0; i < readyBlocks.length; i++) {
        holdLegible(readyBlocks[i].el, readyBlocks[i].svg);
        markScrollable(readyBlocks[i].el);
        alignCaption(readyBlocks[i].el, readyBlocks[i].svg);
      }
    }, 150);
  }

  window.addEventListener("resize", refreshBlocks);
  window.addEventListener("orientationchange", refreshBlocks);

  // The reader's own text size is applied by the theme's font-size-toggle.js,
  // which runs from the end of the body and so settles after this file has
  // already drawn and measured. It writes data-font-size on the root element,
  // both on load and on every press of the navbar control, and neither is a
  // resize, so nothing else here would notice. Without this a reader who had
  // pinned 12px was held to a floor computed from 15px and still got labels
  // under 10px, which is the size this exists to prevent.
  window.addEventListener("load", refreshBlocks);
  if (window.MutationObserver) {
    new MutationObserver(refreshBlocks).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-font-size"]
    });
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
    // After .mermaid-ready, because markScrollable compares scrollWidth with
    // clientWidth and the block only starts scrolling once that class carries
    // its overflow-x, and after clearError above, which strips the role and
    // label this may put back.
    holdLegible(el, svg);
    markScrollable(el);
    // After both, because holdLegible can change the width being matched.
    alignCaption(el, svg);
    // Opened in the middle rather than at the left edge. Every diagram here is
    // a graph TD, whose root sits centred above its branches, so a block that
    // has to be panned otherwise starts on a corner of the tree with the node
    // the reader should begin at cut off the right-hand side. Done once, on the
    // way in, so that it never argues with a reader who has already scrolled.
    if (el.scrollWidth - el.clientWidth > 1) {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    }
    readyBlocks.push({ el: el, svg: svg });
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
