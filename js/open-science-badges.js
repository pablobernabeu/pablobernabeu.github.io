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
    var popupSpan = popup.querySelector("span");
    var hideTimeout;

    function showPopup(badge) {
      clearTimeout(hideTimeout);
      var badgeSrc = badge.src;
      var badgeType = badge.dataset.badgeType;
      var badgeUrl = badge.dataset.badgeUrl;
      
      // Don't show popup if badge has no src or empty src
      if (!badgeSrc || badgeSrc.trim() === '' || badgeSrc.endsWith('/')) {
        return;
      }
      
      popupImg.src = badgeSrc;
      popupImg.alt = badge.alt;

      // Build popup content dynamically
      var popupContent = '';
      
      // Add badge-specific link if URL is available
      if (badgeUrl && badgeUrl !== 'undefined' && badgeUrl.trim() !== '') {
        // Map badge type to display text and color
        var linkText = '';
        var linkColor = '';
        if (badgeType === 'Preregistered') {
          linkText = '<i class="fa fa-external-link" style="font-size: 11px; color: #666;"></i> Prereg';
          linkColor = '#b31b1b';  // Dark red
        } else if (badgeType === 'Open Materials') {
          linkText = '<i class="fa fa-external-link" style="font-size: 11px; color: #666;"></i> Materials';
          linkColor = '#f68212';  // Orange
        } else if (badgeType === 'Open Data') {
          linkText = '<i class="fa fa-external-link" style="font-size: 11px; color: #666;"></i> Data';
          linkColor = '#2996cc';  // Blue
        }
        
        popupContent += '<a href="' + badgeUrl + '" target="_blank" rel="noopener" style="color: ' + linkColor + '; text-decoration: none; font-weight: bold; display: block; text-align: center; margin-left: -6px; margin-bottom: 8px; font-size: 15px;">';
        popupContent += linkText;
        popupContent += '</a>';
        
        // Add horizontal separator
        popupContent += '<span class="popup-separator" style="display: block; height: 1px; background: #ccc; margin: 8px 0;"></span>';
      }
      
      // Add COS link
      popupContent += '<a href="https://www.cos.io/initiatives/badges" target="_blank" rel="noopener" style="font-size: 10px; white-space: nowrap; display: block; text-align: center;">Center for Open Science</a>';
      
      popupSpan.innerHTML = popupContent;

      // Show popup temporarily to measure its actual width
      popup.style.display = "inline-flex";
      popup.style.visibility = "hidden";

      // Position popup above or below the badge
      var rect = badge.getBoundingClientRect();
      var popupHeight = popup.offsetHeight;
      var popupWidth = popup.offsetWidth;

      // Calculate position relative to page (not viewport) so it scrolls with content
      var badgeCenterX = rect.left + window.pageXOffset + rect.width / 2;
      var badgeTop = rect.top + window.pageYOffset;
      var badgeBottom = rect.bottom + window.pageYOffset;

      // Center popup horizontally on badge
      var left = badgeCenterX - popupWidth / 2;

      // Check if there's enough space below; if not, position above
      var spaceBelow = window.innerHeight + window.pageYOffset - badgeBottom;
      var top;
      if (spaceBelow < popupHeight + 15) {
        // Not enough space below, position above
        top = badgeTop - popupHeight;
      } else {
        // Enough space, position below
        top = badgeBottom;
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

      // If popup is visible and touch is not on a badge or popup, close it
      if (popup.style.display !== "none" && !isBadge && !isPopup) {
        hidePopup();
      }
    });

    // Hide popup when scrolling
    var scrollTimeout;
    window.addEventListener("scroll", function() {
      if (popup.style.display !== "none") {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
          hidePopup();
        }, 50);
      }
    });
  });
})();
