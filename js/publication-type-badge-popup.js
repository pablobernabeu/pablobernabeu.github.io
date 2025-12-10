// Publication Type Badge Hover Popup
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    // Create the popup element
    var popup = document.createElement("div");
    popup.id = "pub-type-popup";
    popup.innerHTML =
      '<span class="pub-type-popup-text"><a href="#">See publications<br>of this type</a></span>';
    document.body.appendChild(popup);

    var popupLink = popup.querySelector("a");
    var hideTimeout;

    // Map publication type classes to URL fragments
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

    function showPopup(badge) {
      clearTimeout(hideTimeout);

      // Get or set the URL
      var url = badge.getAttribute("data-pub-type-url");
      if (!url) {
        // Find which type this badge is and set the URL
        for (var className in pubTypeToNumber) {
          if (badge.classList.contains(className)) {
            url = "/publication/#" + pubTypeToNumber[className];
            badge.setAttribute("data-pub-type-url", url);
            break;
          }
        }
      }

      if (url) {
        popupLink.href = url;
      }

      // Show popup temporarily to measure its actual width
      popup.style.display = "block";
      popup.style.visibility = "hidden";

      // Position popup above or below the badge
      var rect = badge.getBoundingClientRect();
      var popupHeight = popup.offsetHeight;
      var popupWidth = popup.offsetWidth;

      // Calculate position relative to page (not viewport)
      var badgeCenterX = rect.left + window.pageXOffset + rect.width / 2;
      var badgeTop = rect.top + window.pageYOffset;
      var badgeBottom = rect.bottom + window.pageYOffset;

      // Center popup horizontally on badge
      var left = badgeCenterX - popupWidth / 2;
      var top = badgeTop - popupHeight - 5; // Position above with 5px gap

      // If not enough room above, show below
      if (rect.top < popupHeight + 10) {
        top = badgeBottom + 5;
      }

      // Keep popup in viewport horizontally
      var minLeft = window.pageXOffset + 10;
      var maxLeft = window.pageXOffset + window.innerWidth - popupWidth - 10;
      if (left < minLeft) left = minLeft;
      if (left > maxLeft) left = maxLeft;

      popup.style.left = left + "px";
      popup.style.top = top + "px";
      popup.style.visibility = "visible";
    }

    function hidePopup() {
      popup.style.display = "none";
    }

    // Add event listeners to all publication type badges
    document.querySelectorAll(".pub-type-badge").forEach(function (badge) {
      // Mouse events for desktop
      badge.addEventListener("mouseenter", function (e) {
        showPopup(this);
      });

      badge.addEventListener("mouseleave", function () {
        hideTimeout = setTimeout(function () {
          hidePopup();
        }, 100);
      });

      // Touch events for mobile
      badge.addEventListener("touchstart", function (e) {
        e.preventDefault();
        showPopup(this);
      });
    });

    // Keep popup visible when hovering over it (desktop)
    popup.addEventListener("mouseenter", function () {
      clearTimeout(hideTimeout);
    });

    popup.addEventListener("mouseleave", function () {
      hidePopup();
    });

    // Close popup on any tap/touch anywhere on the screen (mobile)
    document.addEventListener("touchstart", function (e) {
      var isBadge = e.target.classList.contains("pub-type-badge");
      var isPopup = popup.contains(e.target);

      if (popup.style.display === "block" && !isBadge && !isPopup) {
        hidePopup();
      }
    });
  });
})();
