// APA 7 captions.
//
// knitr, bookdown and the figure shortcode all put a caption in one run of text
// underneath the thing it describes: "Figure 4: Title of the figure. Source: ...
// Units: ...". APA 7 asks for that to be three parts in two places. Above the
// object: the number on its own line, then the title on the next. Below it: the
// note. This script performs that rearrangement on the page, so the caption
// stays a single string in the source and bookdown keeps doing the numbering.
//
// Only pages whose front matter sets `apa_captions: true` load this file, so a
// post written to another convention is left alone.
(function () {
  "use strict";

  // Sentence ends that are not sentence ends. A caption cites work in the form
  // "(Crippa et al., 2025)", and "et al." would otherwise close the title.
  var ABBREVIATION =
    /(?:\b(?:al|e\.g|i\.e|cf|vs|no|fig|eq|approx|ca|St|Dr|Mr|Ms|Mrs|Prof)\.|\b[A-Z]\.)$/;

  // The number bookdown writes is wrapped in the anchor its cross-references
  // point at, so the span is lifted out and kept: dropping it would break every
  // \@ref() on the page.
  function takeAnchor(node) {
    var first = node.firstElementChild;
    if (first && first.tagName === "SPAN" && first.id &&
        /^(fig|tab):/.test(first.id) && !first.firstElementChild) {
      return first;
    }
    return null;
  }

  // The anchor is re-used for its id alone. Its text is the number bookdown
  // wrote, which is now written out again by the element it is nested in, so
  // leaving it in place would print "Table 1: Table 1".
  function emptied(anchor) {
    if (anchor) anchor.textContent = "";
    return anchor;
  }

  function splitCaption(html) {
    var s = String(html).replace(/^\s+|\s+$/g, "");
    var number = null;
    var m = s.match(/^(Figure|Table)\s*(\d+)\s*[:.]\s*/);
    if (m) {
      number = m[1] + " " + m[2];
      s = s.slice(m[0].length);
    }
    // The title is the first sentence of what is left. Each ". " is tested in
    // turn and the first one that closes a sentence, rather than an
    // abbreviation or an initial, ends it.
    var cut = -1, from = 0;
    for (;;) {
      var i = s.indexOf(". ", from);
      if (i < 0) break;
      var after = s.slice(i + 2).replace(/^<[^>]+>/, "");
      if (!ABBREVIATION.test(s.slice(0, i + 1)) && /^[A-Z(0-9]/.test(after)) { cut = i; break; }
      from = i + 2;
    }
    if (cut < 0) return { number: number, title: s.replace(/\.\s*$/, ""), note: null };
    return { number: number, title: s.slice(0, cut), note: s.slice(cut + 2) };
  }

  function el(tag, cls, html) {
    var node = document.createElement(tag);
    node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }

  // Where the number and title go, and what they go above. A knitr figure keeps
  // its caption inside the .figure wrapper; a widget or a diagram is followed by
  // a caption written by hand; a table carries one in <caption>.
  function target(caption) {
    var parent = caption.parentElement;
    if (!parent) return null;
    if (parent.tagName === "TABLE") return { before: parent, inside: parent.parentElement };
    if (parent.classList.contains("figure") || parent.tagName === "FIGURE") {
      var first = parent.firstElementChild;
      while (first && first === caption) first = first.nextElementSibling;
      return first ? { before: first, inside: parent } : null;
    }
    // A caption written by hand follows the thing it describes, but htmlwidgets
    // leaves its <script> and <style> between the two. Those draw nothing, and
    // stopping at one put the heading below the figure rather than above it.
    var prev = caption.previousElementSibling;
    while (prev && (prev.tagName === "SCRIPT" || prev.tagName === "STYLE" ||
                    prev.tagName === "LINK")) {
      prev = prev.previousElementSibling;
    }
    return prev ? { before: prev, inside: prev.parentElement } : null;
  }

  function run() {
    var captions = document.querySelectorAll(
      ".article-style p.caption, .article-style figcaption, .article-style table > caption");
    var next = { Figure: 0, Table: 0 };
    Array.prototype.forEach.call(captions, function (caption) {
      if (caption.getAttribute("data-apa") === "done") return;
      var spot = target(caption);
      if (!spot) return;

      var anchor = takeAnchor(caption);
      var html = caption.innerHTML;
      if (anchor) html = html.replace(anchor.outerHTML, anchor.textContent);
      var parts = splitCaption(html);

      // A caption with no number of its own is numbered in the order it appears,
      // continuing whatever sequence the page is already using.
      var kind = caption.parentElement.tagName === "TABLE" ? "Table" : "Figure";
      if (parts.number) {
        var n = parseInt(parts.number.split(" ")[1], 10);
        kind = parts.number.split(" ")[0];
        if (n > next[kind]) next[kind] = n;
      } else {
        next[kind] += 1;
        parts.number = kind + " " + next[kind];
      }

      var number = el("p", "apa-caption-number", parts.number);
      if (anchor) number.insertBefore(emptied(anchor), number.firstChild);
      var title = el("p", "apa-caption-title", parts.title);

      // A <caption> may not be moved out of its table and a <p> may not be put
      // inside one, so the table's heading rides in the <caption> itself, which
      // the stylesheet turns over to caption-side: top.
      if (spot.before.tagName === "TABLE") {
        caption.innerHTML = "";
        caption.appendChild(el("span", "apa-caption-number", parts.number));
        if (anchor) caption.firstChild.insertBefore(emptied(anchor), caption.firstChild.firstChild);
        caption.appendChild(el("span", "apa-caption-title", parts.title));
        caption.setAttribute("data-apa", "done");
        if (parts.note) {
          var tnote = el("p", "apa-caption-note", "<em>Note.</em> " + parts.note);
          spot.before.parentNode.insertBefore(tnote, spot.before.nextSibling);
        }
        return;
      }

      spot.inside.insertBefore(number, spot.before);
      spot.inside.insertBefore(title, spot.before);
      if (parts.note) {
        caption.innerHTML = "<em>Note.</em> " + parts.note;
        caption.className = (caption.className + " apa-caption-note").replace(/^\s+/, "");
        caption.setAttribute("data-apa", "done");
      } else {
        caption.parentNode.removeChild(caption);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
