// Open Science Badge Hover Popup
(function () {
  // How long the pointer has to rest on a badge before the card opens. The card
  // used to open on contact, so crossing a row of three badges on the way to the
  // title threw three cards open behind the pointer. The badge rocks gently for
  // exactly this long while it waits, so the pause reads as a pause rather than
  // as a control that has stopped answering. A click opens the card at once, so
  // the wait costs nothing to anyone who has decided they want it, and it is set
  // long enough that a pointer merely passing over the badges is very unlikely
  // to reach the end of it. The animation length is repeated in
  // static/css/publication-type-badges.css and has to be changed with this
  // number.
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
    // Create the popup element (styling handled in CSS)
    var popup = document.createElement("div");
    popup.id = "open-science-popup";
    // width and height carry the badge files' intrinsic 155x151, which every
    // one of them shares. CSS overrides the width; the pair is here so the
    // browser can reserve the right box before the file arrives, rather than
    // reserving a zero-height one and changing its mind after the card has
    // already been placed against it.
    popup.innerHTML =
      '<img src="" alt="" width="155" height="151"><span><a href="https://www.cos.io/initiatives/badges" rel="noopener">Center for Open Science</a></span>';
    document.body.appendChild(popup);

    var popupImg = popup.querySelector("img");
    var popupSpan = popup.querySelector("span");
    var hideTimeout;
    var showTimeout;
    var nudgingBadge = null;
    var lastTouchAt = 0;

    // Which badge the visible card belongs to, so that re-entering that badge
    // can leave the card alone instead of tearing it down and building it again.
    var currentBadge = null;
    var popupVisible = false;

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

    // Every arming clears the last one first. Two of these were written
    // independently, one on the badge and one on the card, and either could
    // overwrite a timer the other had left running, putting it beyond the reach
    // of any later clearTimeout. One helper makes that impossible to reopen.
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
          linkColor = '#B85500';  // Orange, darkened from the badge's #f68212 to 4.8:1 on the white popup
        } else if (badgeType === 'Open Data') {
          linkText = '<i class="fa fa-external-link" style="font-size: 11px; color: #666;"></i> Data';
          linkColor = '#1F75A3';  // Blue, darkened from the badge's #2996cc to 5.1:1 on the white popup
        }
        
        popupContent += '<a href="' + badgeUrl + '" rel="noopener" style="color: ' + linkColor + '; text-decoration: none; font-weight: bold; display: block; text-align: center; margin-left: -6px; margin-bottom: 8px; font-size: 15px;">';
        popupContent += linkText;
        popupContent += '</a>';
        
        // Add horizontal separator
        popupContent += '<span class="popup-separator" style="display: block; height: 1px; background: #ccc; margin: 8px 0;"></span>';
      }
      
      // Add COS link
      popupContent += '<a href="https://www.cos.io/initiatives/badges" rel="noopener" style="font-size: 10px; white-space: nowrap; display: block; text-align: center;">Center for Open Science</a>';
      
      popupSpan.innerHTML = popupContent;

      // Shown but not yet painted, so the card can be measured and placed
      // before anyone sees it.
      popup.style.display = "inline-flex";
      popup.style.visibility = "hidden";

      // Recorded past the empty-src guard above, so the card is only claimed as
      // open once it really is.
      popupVisible = true;
      currentBadge = badge;

      positionPopup();
      popup.style.visibility = "visible";

      // A second placement on the next frame, by which point the card's box is
      // whatever it is finally going to be. It costs one measurement and it is
      // the only thing standing between a card measured a moment too early and
      // a card sitting several pixels to one side of its badge. It runs before
      // the frame is painted, so there is nothing to see even when it moves the
      // card.
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

      // Measured from a known position, with any width from a previous placement
      // given back first. The card is absolutely positioned with width:auto,
      // which makes it shrink-to-fit, and the width available to it is its
      // containing block less its own `left` — so a card measured where it
      // currently sits, or placed near the right edge after being measured
      // elsewhere, is centred on one width and drawn at another. Half of that
      // difference is how far off its badge it ends up.
      popup.style.width = "";
      popup.style.left = "0px";
      popup.style.top = "0px";

      var rect = badge.getBoundingClientRect();
      // getBoundingClientRect, not offsetWidth/offsetHeight: those round to
      // whole pixels, and half of the rounding error lands in the centring.
      var popupRect = popup.getBoundingClientRect();
      var popupWidth = popupRect.width;
      var popupHeight = popupRect.height;

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

    // Add event listeners to all open science badges
    document.querySelectorAll(".open-science-badge").forEach(function (badge) {
      // Mouse events for desktop. The card no longer opens on contact: the badge
      // rocks first and opens only if the pointer is still on it at the end.
      badge.addEventListener("mouseenter", function () {
        if (Date.now() - lastTouchAt < TOUCH_MOUSE_GRACE_MS) {
          return;
        }
        cancelPendingShow();
        // The hide the previous badge's mouseleave armed is 100ms out, and the
        // follow-on wait below is longer than that, so leaving it running blinked
        // the card off for a frame or two on the way from one badge to the next.
        // Whichever branch follows, mouseleave will arm a fresh one if the
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
      // answered at once rather than after the rest of the wait. The badge
      // carries a pointer cursor and nothing else on the page answers a click
      // on it, so a click here was previously spent on nothing.
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

    // The image is the largest thing in the card, so until it has arrived the
    // card is the wrong height and the choice between opening below the badge
    // and opening above it was made on the wrong number. The file is the one
    // the badge is already showing, so the cache usually answers within the
    // same frame, but a badge hovered while the page is still loading will not
    // have that.
    popupImg.addEventListener("load", function () {
      if (popupVisible) {
        positionPopup();
      }
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
      // Check if the touch is on a badge or the popup itself
      var isBadge = e.target.classList.contains("open-science-badge");
      var isPopup = popup.contains(e.target);

      // If popup is visible and touch is not on a badge or popup, close it.
      // A wait still counting down is dropped either way: a tap elsewhere is a
      // decision to look at something else, and on a device with both a
      // touchscreen and a pointer the wait could otherwise open a card moments
      // after the tap that was meant to dismiss one.
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
