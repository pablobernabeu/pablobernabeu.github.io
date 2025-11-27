// Open Science Badge Hover Popup
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    // Create the popup element
    var popup = document.createElement("div");
    popup.id = "open-science-popup";
    popup.innerHTML =
      '<img src="" alt=""><a href="https://www.cos.io/initiatives/badges" target="_blank" rel="noopener">Badge by Center for Open Science</a>';
    document.body.appendChild(popup);

    var popupImg = popup.querySelector("img");
    var hideTimeout;

    // Add event listeners to all open science badges
    document.querySelectorAll(".open-science-badge").forEach(function (badge) {
      badge.addEventListener("mouseenter", function (e) {
        clearTimeout(hideTimeout);
        var badgeSrc = this.src;
        popupImg.src = badgeSrc;
        popupImg.alt = this.alt;

        // Position popup above or below the badge
        var rect = this.getBoundingClientRect();
        var popupHeight = 170; // actual height with padding
        var popupWidth = 200; // actual width

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
        popup.style.display = "block";
      });

      badge.addEventListener("mouseleave", function () {
        hideTimeout = setTimeout(function () {
          popup.style.display = "none";
        }, 100);
      });
    });

    // Keep popup visible when hovering over it
    popup.addEventListener("mouseenter", function () {
      clearTimeout(hideTimeout);
    });

    popup.addEventListener("mouseleave", function () {
      popup.style.display = "none";
    });
  });
})();
