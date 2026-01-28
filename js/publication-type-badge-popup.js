// Publication Type Badge Hover Popup
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    // Check if popup already exists to prevent duplicates
    if (document.getElementById("pub-type-popup")) {
      return;
    }

    // Detect if we're on the home page
    var isHomePage = document.querySelector('.home-section') !== null;

    // Create the popup element
    var popup = document.createElement("div");
    popup.id = "pub-type-popup";
    if (isHomePage) {
      popup.classList.add("home-page-popup");
    }
    popup.innerHTML =
      '<span class="pub-type-popup-text"><a href="#" class="content-link">View publication</a><span class="popup-separator" style="display: block; height: 1px; background: #ccc; margin: 4px 0;"></span><a href="/publication/" class="type-link"><i class="fas fa-search"></i> Filter works</a></span>';
    document.body.appendChild(popup);

    var contentLink = popup.querySelector(".content-link");
    var typeLink = popup.querySelector(".type-link");
    var separator = popup.querySelector(".popup-separator");
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

      // Check if we're on an individual publication/post page
      var isIndividualPage = document.querySelector('.article-container, .pub, article.article');
      
      // Show/hide content link and separator based on page type
      if (isIndividualPage) {
        contentLink.style.display = "none";
        separator.style.display = "none";
      } else {
        contentLink.style.display = "inline";
        separator.style.display = "block";
        
        // Get the individual content URL from closest link
        var parentLink = badge.closest("a");
        if (!parentLink) {
          parentLink = badge.closest(".media");
          if (parentLink) {
            var titleLink = parentLink.querySelector("h3 a");
            if (titleLink) {
              parentLink = titleLink;
            }
          }
        }
        if (parentLink && parentLink.href) {
          contentLink.href = parentLink.href;
        } else {
          contentLink.href = "#";
        }
      }

      // Get or set the publication type filter URL
      var typeUrl = "/publication/";
      
      typeLink.href = typeUrl;

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

    // Hide popup when scrolling
    var scrollTimeout;
    window.addEventListener("scroll", function() {
      if (popup.style.display === "block") {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
          hidePopup();
        }, 50);
      }
    });
  });
})();
