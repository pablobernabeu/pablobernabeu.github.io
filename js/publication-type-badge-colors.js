// Apply background colors to publication type badges using JavaScript
// This approach bypasses Hugo's template rendering limitations and theme CSS conflicts

(function () {
  // Prevent multiple initializations
  if (window.pubTypeBadgesInitialized) return;
  window.pubTypeBadgesInitialized = true;

  // Keep in step with static/css/publication-type-badges.css, which lists the
  // contrast of each colour with the white label. All of them meet the WCAG
  // AA ratio of 4.5:1.
  var pubTypeColors = {
    "pub-type-uncat": "#757575",
    "pub-type-conf": "#0277BD",
    "pub-type-journal": "#2E7D32",
    "pub-type-preprint": "#B85500",
    "pub-type-report": "#B85500",
    "pub-type-book": "#795548",
    "pub-type-book-section": "#795548",
    "pub-type-thesis": "#1565C0",
    "pub-type-patent": "#00796B",
    "pub-type-software": "#9C27B0",
  };

  var pubTypeToNumber = {
    "pub-type-uncat": "0",
    "pub-type-conf": "1",
    "pub-type-journal": "2",
    "pub-type-preprint": "3",
    "pub-type-report": "4",
    "pub-type-book": "5",
    "pub-type-book-section": "6",
    "pub-type-thesis": "7",
    "pub-type-patent": "8",
    "pub-type-software": "9",
  };

  // The card a badge opens belongs to static/js/publication-type-badge-popup.js,
  // and nothing here touches it. This file used to carry a second copy of the
  // whole popup -- its own show, hide and hover handlers, driving the same
  // #pub-type-popup element -- which quietly undid that file's work: the badge
  // began to rock and count down its hover intent while this copy threw the card
  // open on contact, and the card's "View publication" link, being the first
  // anchor in it, was overwritten with the type filter URL. Colours and the data
  // attributes are this file's whole job; hover behaviour is not.

  function initBadges() {
    // Apply colors and add data attributes to all badges
    Object.keys(pubTypeColors).forEach(function (className) {
      var badges = document.querySelectorAll(".pub-type-badge." + className);
      badges.forEach(function (badge) {
        badge.style.setProperty(
          "background-color",
          pubTypeColors[className],
          "important"
        );
        badge.style.setProperty("color", "#fff", "important");
        badge.style.setProperty("display", "inline-block", "important");
        badge.style.setProperty("padding", "0.4em 0.6em", "important");
        badge.style.setProperty("border-radius", "3px", "important");
        badge.style.setProperty("text-decoration", "none", "important");
        badge.style.setProperty("cursor", "pointer", "important");

        if (!badge.hasAttribute("data-pub-type-url")) {
          badge.setAttribute(
            "data-pub-type-url",
            "/publication/#" + pubTypeToNumber[className]
          );
        }
      });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBadges);
  } else {
    initBadges();
  }
})();
