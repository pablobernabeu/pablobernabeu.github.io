// Links back from a reference list to the places that cite each entry.
//
// Pandoc's citeproc, given link-citations: true in a post's front matter, links
// every citation in the body to its entry in the reference list: an <a> whose href
// is the entry's id, #ref-<key>. Pandoc marks such a link role="doc-biblioref" only
// in HTML5, and blogdown writes HTML4, so the href is what identifies a citation
// here. It makes no link the other way, so a reader who follows a citation down to
// the list has only the browser's Back button to return. Here each entry gets a back-link to every place
// that cites it: one arrow when there is a single citation, and an arrow followed
// by 1, 2, 3 ... when there are several. Each back-link is named for the section it
// returns to, since a bare number says nothing about where it leads.
//
// layouts/partials/custom_js.html loads this file on pages whose body holds such a
// citation, so any post that adopts citeproc with link-citations gets it.
(function () {
  "use strict";

  var body = document.querySelector(".article-container > .article-style");
  if (!body) return;

  var entries = body.querySelectorAll('.csl-entry[id^="ref-"]');
  if (!entries.length) return;

  // U+FE0E asks for the text form of the arrow, which some systems would
  // otherwise draw as an emoji. Pandoc's own footnote back-links use the same.
  var ARROW = "↩︎";

  // The title of the innermost section holding a citation. Pandoc wraps each
  // section in a <div class="section"> (or a <section>) that opens with its
  // heading. The "#" that section-links.js adds to a heading, and any footnote
  // marker, are left out of the name.
  function sectionOf(element) {
    var section = element.closest(".section, section");
    while (section && body.contains(section)) {
      var heading = section.firstElementChild;
      if (heading && /^H[2-6]$/.test(heading.tagName)) {
        var copy = heading.cloneNode(true);
        var extras = copy.querySelectorAll(".heading-anchor, .footnote-ref");
        for (var i = 0; i < extras.length; i++) extras[i].remove();
        var name = copy.textContent.replace(/\s+/g, " ").trim();
        if (name) return name;
      }
      section = section.parentElement.closest(".section, section");
    }
    return "";
  }

  // The citations of each entry, in the order they appear in the body. A
  // citation inside the reference list itself, such as a cross-reference in an
  // annotated entry, is not a place to return to.
  var citing = {};
  var refs = document.getElementById("refs");
  var links = body.querySelectorAll('a[href^="#ref-"]');
  for (var i = 0; i < links.length; i++) {
    if (refs && refs.contains(links[i])) continue;
    var target = decodeURIComponent(links[i].getAttribute("href").slice(1));
    (citing[target] = citing[target] || []).push(links[i]);
  }

  var made = [];
  for (var e = 0; e < entries.length; e++) {
    var entry = entries[e];
    var citations = citing[entry.id];
    if (!citations) continue;

    var holder = document.createElement("span");
    holder.className = "csl-backlinks";
    if (citations.length > 1) holder.appendChild(document.createTextNode(ARROW + " "));

    for (var c = 0; c < citations.length; c++) {
      var citation = citations[c];
      // The citation's own id is kept if it has one; otherwise it takes the
      // entry's key and its position among the entry's citations.
      if (!citation.id) {
        citation.id = "cite-" + entry.id.slice(4) + "-" + (c + 1);
        made.push(citation.id);
      }
      var section = sectionOf(citation);
      var back = document.createElement("a");
      back.className = "csl-backlink";
      back.href = "#" + citation.id;
      if (citations.length === 1) {
        back.textContent = ARROW;
        back.setAttribute("aria-label", "Back to the citation" + (section ? " in " + section : ""));
      } else {
        back.textContent = String(c + 1);
        back.setAttribute("aria-label", "Back to citation " + (c + 1) + " of " + citations.length +
                          (section ? ", in " + section : ""));
      }
      if (section) back.title = "Back to " + section;
      if (c > 0) holder.appendChild(document.createTextNode(" "));
      holder.appendChild(back);
    }
    entry.appendChild(document.createTextNode(" "));
    entry.appendChild(holder);
  }

  // An address that points at an id made here arrives before the id exists, and
  // the browser looks for its target only while the page is being parsed, so the
  // scroll is made here, as section-links.js does for the headings.
  // scroll-padding-top in custom.scss keeps the citation clear of the navbar.
  var hash = "";
  try {
    hash = decodeURIComponent(window.location.hash.slice(1));
  } catch (err) {}
  if (hash && made.indexOf(hash) !== -1) {
    document.getElementById(hash).scrollIntoView();
  }
})();
