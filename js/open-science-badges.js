// Open Science Badge Hover Popup
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    // Create the popup element (styling handled in CSS)
    var popup = document.createElement("div");
    popup.id = "open-science-popup";
    popup.innerHTML =
      '<img src="" alt=""><span><a href="https://www.cos.io/initiatives/badges" target="_blank" rel="noopener">Center for Open Science</a></span>';
    document.body.appendChild(popup);

    var popupImg = popup.querySelector("img");
    var hideTimeout;

    function showPopup(badge) {
      clearTimeout(hideTimeout);
      var badgeSrc = badge.src;
      popupImg.src = badgeSrc;
      popupImg.alt = badge.alt;

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

    // Add event listeners to all open science badges
    document.querySelectorAll(".open-science-badge").forEach(function (badge) {
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
        e.preventDefault(); // Prevent mouse events from firing
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
      // Check if the touch is on a badge or the popup itself
      var isBadge = e.target.classList.contains("open-science-badge");
      var isPopup = popup.contains(e.target);

      // If popup is visible and touch is not on a badge, close it
      if (popup.style.display === "block" && !isBadge && !isPopup) {
        hidePopup();
      }
    });
  });
})();
