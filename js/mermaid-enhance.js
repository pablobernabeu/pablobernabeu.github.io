/**
 * Mermaid diagram enhancer
 * - Reveals each diagram only once Mermaid has converted it to an SVG
 *   (the CSS hides ".mermaid" until ".mermaid-ready" is added), preventing the
 *   raw diagram source from flashing on screen while Mermaid loads.
 * - For diagrams too wide to be legible when scaled into the content column,
 *   enables interactive pan/zoom (drag to pan, +/- controls to zoom).
 * - Small diagrams are left to render normally (crisp, full size).
 */
(function () {
  "use strict";

  // Only switch a diagram to interactive pan/zoom once it is this many times
  // wider than the column. Below it, scaling-to-fit stays legible
  // (e.g. 1.8x -> ~56% scale); above it, text gets too small to read so an
  // interactive viewport is worth the trade-off. Single knob: tune to taste.
  var WIDE_RATIO = 1.8;

  // Bounds for the pan/zoom viewport height (px). The height is otherwise
  // derived from the diagram's own aspect ratio so the box hugs the content
  // instead of leaving large empty bands above/below it on load. The floor only
  // bites for extreme wide-short diagrams (aspect > ~3); everything narrower
  // gets a height that matches its shape exactly.
  var MIN_VIEW_H = 220;
  var MAX_VIEW_H = 540;

  // Intrinsic pixel size of the rendered SVG, from its viewBox (preferred) or
  // its width/height attributes. Returns {w, h}; either may be 0 if unknown.
  function intrinsicDims(svg) {
    var vb = svg.getAttribute("viewBox");
    if (vb) {
      var p = vb.split(/[\s,]+/);
      if (p.length === 4) {
        var w = parseFloat(p[2]);
        var h = parseFloat(p[3]);
        if (!isNaN(w) && !isNaN(h)) return { w: w, h: h };
      }
    }
    var wa = parseFloat(svg.getAttribute("width"));
    var ha = parseFloat(svg.getAttribute("height"));
    return { w: isNaN(wa) ? 0 : wa, h: isNaN(ha) ? 0 : ha };
  }

  // Width the diagram would occupy if shown statically (full-bleed, capped).
  function containerWidth() {
    var vw = document.documentElement.clientWidth || window.innerWidth || 700;
    return Math.min(960, vw * 0.94);
  }

  // Size the pan/zoom viewport to the diagram's aspect ratio (clamped), so the
  // fitted diagram fills the box with minimal padding on load.
  function sizeViewport(el, dims) {
    if (!dims.w || !dims.h) return;
    var boxW = el.clientWidth || containerWidth();
    var h = Math.round((boxW * dims.h) / dims.w);
    h = Math.max(MIN_VIEW_H, Math.min(MAX_VIEW_H, h));
    el.style.height = h + "px";
  }

  function enhance(el) {
    if (el.getAttribute("data-mz") === "1") return;
    var svg = el.querySelector("svg");
    if (!svg) return;
    el.setAttribute("data-mz", "1");

    var dims = intrinsicDims(svg);
    var needsZoom = dims.w > containerWidth() * WIDE_RATIO;

    if (needsZoom && typeof window.svgPanZoom === "function") {
      el.classList.add("pz");
      sizeViewport(el, dims); // set the box height before init so fit() is accurate
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
      svg.style.maxWidth = "none";
      el.classList.add("mermaid-ready"); // reveal before init so sizing is correct
      try {
        var pz = window.svgPanZoom(svg, {
          zoomEnabled: true,
          panEnabled: true,
          controlIconsEnabled: true,
          fit: true,
          center: true,
          minZoom: 0.3,
          maxZoom: 16,
          zoomScaleSensitivity: 0.3,
          dblClickZoomEnabled: true,
          mouseWheelZoomEnabled: false // don't hijack page scrolling
        });
        window.addEventListener("resize", function () {
          try { sizeViewport(el, dims); pz.resize(); pz.fit(); pz.center(); } catch (e) {}
        });
      } catch (e) {
        // Fall back to a normally-displayed diagram if pan/zoom init fails.
        el.classList.remove("pz");
        el.style.height = "";
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.style.maxWidth = "";
      }
    } else {
      el.classList.add("mermaid-ready");
    }
  }

  function start() {
    var els = document.querySelectorAll(".mermaid");
    for (var i = 0; i < els.length; i++) {
      (function (el) {
        enhance(el);
        var obs = new MutationObserver(function () { enhance(el); });
        obs.observe(el, { childList: true, subtree: true });
      })(els[i]);
    }
    // Safety net: reveal anything still hidden so content is never lost.
    setTimeout(function () {
      var hidden = document.querySelectorAll(".mermaid:not(.mermaid-ready)");
      for (var j = 0; j < hidden.length; j++) hidden[j].classList.add("mermaid-ready");
    }, 6000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
