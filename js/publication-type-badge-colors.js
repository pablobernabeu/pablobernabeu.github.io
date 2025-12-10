// Apply background colors to publication type badges using JavaScript
// This approach bypasses Hugo's template rendering limitations and theme CSS conflicts

(function () {
  // Prevent multiple initializations
  if (window.pubTypeBadgesInitialized) return;
  window.pubTypeBadgesInitialized = true;

  // Define colors for each publication type
  var pubTypeColors = {
    "pub-type-uncat": "#757575",
    "pub-type-conf": "#2196F3",
    "pub-type-journal": "#4CAF50",
    "pub-type-preprint": "#FF9800",
    "pub-type-report": "#FF9800",
    "pub-type-book": "#795548",
    "pub-type-book-section": "#795548",
    "pub-type-thesis": "#1565C0",
    "pub-type-patent": "#009688",
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

  var pubTypePopup = null;
  var popupLink = null;
  var hideTimeout = null;

  function createPopup() {
    if (pubTypePopup) return;
    pubTypePopup = document.createElement("div");
    pubTypePopup.id = "pub-type-popup";
    pubTypePopup.innerHTML =
      '<span class="pub-type-popup-text"><a href="#">See publications<br>of this type</a></span>';
    pubTypePopup.style.display = "none";
    document.body.appendChild(pubTypePopup);
    popupLink = pubTypePopup.querySelector("a");

    pubTypePopup.addEventListener("mouseenter", function () {
      clearTimeout(hideTimeout);
    });
    pubTypePopup.addEventListener("mouseleave", function () {
      hidePopup();
    });
  }

  function showPopup(badge) {
    if (!pubTypePopup) createPopup();
    clearTimeout(hideTimeout);

    var url = badge.getAttribute("data-pub-type-url");
    if (url && popupLink) {
      popupLink.href = url;
    }

    pubTypePopup.style.display = "block";
    pubTypePopup.style.visibility = "hidden";

    var rect = badge.getBoundingClientRect();
    var popupHeight = pubTypePopup.offsetHeight;
    var popupWidth = pubTypePopup.offsetWidth;

    var badgeCenterX = rect.left + window.pageXOffset + rect.width / 2;
    var badgeTop = rect.top + window.pageYOffset;
    var badgeBottom = rect.bottom + window.pageYOffset;

    var left = badgeCenterX - popupWidth / 2;
    var top = badgeTop - popupHeight - 5;

    if (rect.top < popupHeight + 10) {
      top = badgeBottom + 5;
    }

    var minLeft = window.pageXOffset + 10;
    var maxLeft = window.pageXOffset + window.innerWidth - popupWidth - 10;
    if (left < minLeft) left = minLeft;
    if (left > maxLeft) left = maxLeft;

    pubTypePopup.style.left = left + "px";
    pubTypePopup.style.top = top + "px";
    pubTypePopup.style.visibility = "visible";
  }

  function hidePopup() {
    if (pubTypePopup) {
      pubTypePopup.style.display = "none";
    }
  }

  function initBadges() {
    // Create popup first
    createPopup();

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

        // Add event listeners directly
        badge.addEventListener("mouseenter", function () {
          showPopup(this);
        });
        badge.addEventListener("mouseleave", function () {
          hideTimeout = setTimeout(hidePopup, 100);
        });
        badge.addEventListener("touchstart", function (e) {
          e.preventDefault();
          showPopup(this);
        });
      });
    });

    // Close on touch outside
    document.addEventListener("touchstart", function (e) {
      if (
        pubTypePopup &&
        pubTypePopup.style.display === "block" &&
        !e.target.classList.contains("pub-type-badge") &&
        !pubTypePopup.contains(e.target)
      ) {
        hidePopup();
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBadges);
  } else {
    initBadges();
  }
})();
