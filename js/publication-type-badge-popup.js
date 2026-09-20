// Publication Type Badge Hover Popup
(function () {
  // How long the pointer has to rest on a badge before the card opens. These
  // badges sit directly under the title on every entry of a listing, so a
  // pointer on its way to a title crosses them constantly and the card used to
  // open on contact. The badge rocks gently for exactly this long while it
  // waits, so the pause reads as a pause rather than as a control that has
  // stopped answering, and a click opens the card at once for anyone who has
  // already decided they want it. The animation length is repeated in
  // static/css/publication-type-badges.css, and the same wait is used by the
  // open science badges in static/js/open-science-badges.js; the three are
  // changed together.
  var HOVER_INTENT_MS = 3200;

  // With a card already open the pointer has declared itself, and moving to a
  // neighbouring badge only needs enough of a gap to survive a sweep across the
  // row. Too short to be worth animating.
  var FOLLOW_ON_MS = 120;

  // A tap fires touchstart and, on machines carrying both a touchscreen and a
  // trackpad, can be followed by an emulated mouseenter. Without this window
  // that emulated event would start a wait and reopen the card the tap had just
  // opened. Emulated events trail a tap by up to about half a second.
  var TOUCH_MOUSE_GRACE_MS = 700;

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
    var showTimeout;
    var nudgingBadge = null;
    var lastTouchAt = 0;

    // Which badge the visible card belongs to, so that re-entering that badge
    // can leave the card alone instead of tearing it down and building it again.
    var currentBadge = null;
    var popupVisible = false;

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

    // Only one badge is ever mid-rock, and none is left holding a transform once
    // the pointer has gone.
    function stopNudge() {
      if (nudgingBadge) {
        nudgingBadge.classList.remove("is-nudging");
        nudgingBadge = null;
      }
    }

    function cancelPendingShow() {
      clearTimeout(showTimeout);
      stopNudge();
    }

    // Every arming clears the last one first, so that a timer armed on the badge
    // and a timer armed on the card cannot overwrite one another and leave one
    // of them running beyond the reach of any later clearTimeout.
    function scheduleHide() {
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(hidePopup, 100);
    }

    function showPopup(badge) {
      // positionPopup reads getBoundingClientRect(), which reports the rotated
      // bounding box while the badge is still tilted. The animation ends on zero
      // degrees, so in practice the error is negligible; dropping the class here
      // makes that a guarantee rather than a coincidence.
      stopNudge();
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

      // Shown but not yet painted, so the card can be measured and placed
      // before anyone sees it.
      popup.style.display = "block";
      popup.style.visibility = "hidden";

      popupVisible = true;
      currentBadge = badge;

      positionPopup();
      popup.style.visibility = "visible";

      // A second placement on the next frame, by which point the card's box is
      // whatever it is finally going to be. It runs before the frame is painted,
      // so there is nothing to see even when it moves the card.
      requestAnimationFrame(function () {
        if (popupVisible && currentBadge === badge) {
          positionPopup();
        }
      });
    }

    // Centre the card under (or over) the badge it belongs to. Split out of
    // showPopup because placing the card correctly needs doing more than once:
    // the box it is measured from can still change after the card has opened.
    function positionPopup() {
      var badge = currentBadge;
      if (!badge) {
        return;
      }

      // Parked at a known position, and parked BEFORE the badge is measured.
      // That order is the whole of the first-appearance fix. A card shown
      // without a `top` of its own sits at its static position, which is the
      // foot of the document, and since this site gives `body` its own
      // overflow-y the extra height hands the body a scrollbar of its own. The
      // centred column then shifts half a scrollbar width to the left, and a
      // badge measured in that shifted layout reports a centre about 7.5px
      // left of where it sits once the card has a real `top` and the scrollbar
      // has gone. The card therefore opened that far to the left of its badge,
      // on the first appearance and only on the first, since every later one
      // still carried a `top` from the last. Parking at 0,0 leaves the document
      // the size it already was.
      //
      // The reset also matters for the width. The card is absolutely
      // positioned, so a width carried over from an earlier placement is a
      // width it would be centred on but not necessarily drawn at, and half of
      // any difference lands in the centring.
      popup.style.width = "";
      popup.style.left = "0px";
      popup.style.top = "0px";

      var rect = badge.getBoundingClientRect();
      // getBoundingClientRect, not offsetWidth/offsetHeight: those round to
      // whole pixels, and half of the rounding error lands in the centring.
      var popupRect = popup.getBoundingClientRect();
      var popupWidth = popupRect.width;
      var popupHeight = popupRect.height;

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

      // Keep popup in viewport horizontally. documentElement.clientWidth rather
      // than window.innerWidth, which counts the vertical scrollbar and would
      // let a card at the right edge slide under it. The lower bound is applied
      // last so that a card wider than the viewport hangs off the right rather
      // than off the left, where the start of its text would be the part lost.
      var minLeft = window.pageXOffset + 10;
      var maxLeft =
        window.pageXOffset + document.documentElement.clientWidth - popupWidth - 10;
      if (left > maxLeft) left = maxLeft;
      if (left < minLeft) left = minLeft;

      // Pinned rather than left to shrink-to-fit, so the width the card is
      // centred on is the width it is drawn at whatever `left` it is given.
      popup.style.width = popupWidth + "px";
      popup.style.left = left + "px";
      popup.style.top = top + "px";
    }

    function hidePopup() {
      popup.style.display = "none";
      popupVisible = false;
      currentBadge = null;
    }

    // Add event listeners to all publication type badges
    document.querySelectorAll(".pub-type-badge").forEach(function (badge) {
      // Mouse events for desktop. The card no longer opens on contact: the badge
      // rocks first and opens only if the pointer is still on it at the end.
      badge.addEventListener("mouseenter", function () {
        if (Date.now() - lastTouchAt < TOUCH_MOUSE_GRACE_MS) {
          return;
        }
        cancelPendingShow();
        // The hide the previous badge's mouseleave armed is 100ms out, and the
        // follow-on wait below is longer than that, so leaving it running would
        // blink the card off for a frame or two on the way from one badge to the
        // next. Whichever branch follows, mouseleave will arm a fresh one if the
        // pointer goes again.
        clearTimeout(hideTimeout);

        // Back on the badge the open card already belongs to. The card is right
        // as it stands, so there is nothing left to do. Opening it again would
        // blink it off and back.
        if (popupVisible && currentBadge === badge) {
          return;
        }

        var wait = popupVisible ? FOLLOW_ON_MS : HOVER_INTENT_MS;
        if (wait === HOVER_INTENT_MS) {
          nudgingBadge = badge;
          badge.classList.add("is-nudging");
        }
        showTimeout = setTimeout(function () {
          showPopup(badge);
        }, wait);
      });

      badge.addEventListener("mouseleave", function () {
        // Leaving before the wait is out is a decision not to open the card.
        cancelPendingShow();
        scheduleHide();
      });

      // Clicking says the same thing the pause is there to wait for, so it is
      // answered at once rather than after the rest of the wait. The badge is a
      // span carrying a pointer cursor, and it sits beside the entry's title
      // link rather than inside it, so a click on it was spent on nothing.
      badge.addEventListener("click", function () {
        // A tap has already been served by the touchstart handler below. Its
        // preventDefault suppresses the click that would otherwise follow, but
        // only where the browser honours it, so the tap window is checked here
        // as well.
        if (Date.now() - lastTouchAt < TOUCH_MOUSE_GRACE_MS) {
          return;
        }
        cancelPendingShow();
        clearTimeout(hideTimeout);
        showPopup(this);
      });

      // Touch events for mobile. A tap is unambiguous, so it keeps the card
      // instant and skips both the wait and the movement.
      badge.addEventListener("touchstart", function (e) {
        e.preventDefault(); // Prevent mouse events from firing
        lastTouchAt = Date.now();
        cancelPendingShow();
        showPopup(this);
      });
    });

    // A resize changes the width the card is kept inside, and on a phone so
    // does turning it over.
    window.addEventListener("resize", function () {
      if (popupVisible) {
        positionPopup();
      }
    });

    // Keep popup visible when hovering over it (desktop)
    popup.addEventListener("mouseenter", function () {
      clearTimeout(hideTimeout);
    });

    // Deferred rather than immediate, matching the badge's own mouseleave. The
    // card sits flush under the badge, so moving down into it and back up is a
    // routine gesture, and hiding on the instant would make that return trip
    // serve the full wait again.
    popup.addEventListener("mouseleave", scheduleHide);

    // Close popup on any tap/touch anywhere on the screen (mobile)
    document.addEventListener("touchstart", function (e) {
      var isBadge = e.target.classList.contains("pub-type-badge");
      var isPopup = popup.contains(e.target);

      // If the card is open and the touch is on neither a badge nor the card,
      // close it. A wait still counting down is dropped either way: a tap
      // elsewhere is a decision to look at something else, and on a device with
      // both a touchscreen and a pointer the wait could otherwise open a card
      // moments after the tap that was meant to dismiss one.
      if (!isBadge && !isPopup) {
        cancelPendingShow();
        if (popup.style.display !== "none") {
          hidePopup();
        }
      }
    });

    // Escape closes the card. WCAG 2.2 success criterion 1.4.13 asks that
    // content shown on hover be dismissible without moving the pointer, and that
    // weighs more now the card arrives a beat after the pointer settles, over
    // whatever text it happens to cover.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" || e.key === "Esc") {
        cancelPendingShow();
        hidePopup();
      }
    });

    // Hide popup when scrolling
    var scrollTimeout;
    window.addEventListener("scroll", function() {
      // Scrolling abandons whatever the pointer was resting on, so a wait still
      // counting down is dropped before it can open a card over new content.
      cancelPendingShow();
      if (popup.style.display !== "none") {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
          hidePopup();
        }, 50);
      }
    });
  });
})();
