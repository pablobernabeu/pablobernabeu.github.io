/* ---------------------------------------------------------------------------
   Full-screen recovery guard

   A departure from full screen can invalidate stimulus timing, particularly
   when a tab is backgrounded. This guard pauses the timeline, covers the task
   and captures keyboard input until the participant explicitly returns to full
   screen. It is not an attention check and never ends a session or changes its
   Prolific completion path.

   The trial active at departure is marked `fullscreen_interrupted: "yes"` by
   the entry point's global on_trial_finish hook. Its timing is therefore never
   analysed, even if it resumes after full screen is restored (preregistration,
   Data exclusion).

   The guard reads the browser Fullscreen API on both entry points, Gorilla
   included. Gorilla's task-level full-screen setting has to be visible through
   that API for the pause to work there, which is why the launch checklist in
   jsPsych_experiment/README.md asks for a Gorilla Preview check that leaving
   full screen pauses the study and that the Return to full screen button
   resumes it.

   The one exception is the local ?autotest=1 smoke test. A headless browser
   cannot grant the user-gesture-only Fullscreen API, so index.html sets
   FULLSCREEN_GUARD_MODE to "disabled" for that run, and its rows record
   "autotest_disabled" in place of a "no" the guard never observed.
   --------------------------------------------------------------------------- */
(function () {
  "use strict";

  // `entered` records whether the session has been in full screen at all. On
  // Gorilla the session opens outside full screen, so the first time the
  // screen appears it asks the participant to enter full screen. That is not
  // a departure, so it neither counts as a pause nor marks a trial.
  var state = {
    armed: false,
    disarmed: false,
    paused: false,
    entered: false,
    trial_interrupted: false,
    pauses: 0,
    overlay: null,
  };

  var SCREEN_TEXT = {
    entry: {
      heading: "Full screen needed",
      message:
        "This study runs in full screen, which keeps the timing of the tasks accurate. Please press the button below to switch to full screen and begin.",
      note: "If you leave full screen later, the study will pause until you return to it.",
      button: "Switch to full screen",
    },
    paused: {
      heading: "Study paused",
      message:
        "To protect the timing of the task, please return to full screen before continuing.",
      note: "You cannot respond while the study is outside full screen. Returning to full screen does not affect your payment.",
      button: "Return to full screen",
    },
  };

  // Read when the guard is used, because index.html sets the mode only after
  // this resource has loaded and ?autotest=1 has been parsed.
  function isDisabled() {
    return window.FULLSCREEN_GUARD_MODE === "disabled";
  }

  function isFullscreen() {
    if (typeof window.inFullscreen === "function") return window.inFullscreen();
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  // `mode` is "entry" or "paused" and sets the heading, text and button label.
  // A `message` passed on its own replaces only the main sentence, for the
  // case where the browser refused full screen.
  function showOverlay(message, mode) {
    if (!state.overlay) {
      var overlay = document.createElement("div");
      overlay.id = "fullscreen-recovery-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-live", "assertive");
      // Both style sheets cap every div at 900px and left-align it for the
      // instruction text. Set inline, these values keep that rule from
      // shrinking the overlay to a panel that leaves the task visible beside it.
      overlay.style.cssText =
        "position:fixed;inset:0;width:100%;height:100%;max-width:none;margin:0;" +
        "z-index:2147483647;display:flex;" +
        "align-items:center;justify-content:center;padding:24px;" +
        "box-sizing:border-box;background:#222227;color:#fff;text-align:center;" +
        "font:20px/1.55 Arial,sans-serif;";
      overlay.innerHTML =
        "<div style='max-width:38em;margin:0 auto;text-align:center'>" +
        "<h2 id='fullscreen-recovery-heading' style='margin-top:0'></h2>" +
        "<p id='fullscreen-recovery-message'></p>" +
        "<p id='fullscreen-recovery-note'></p>" +
        "<button id='fullscreen-recovery-button' class='jspsych-btn' " +
        "style='margin:1.25em 0;padding:.65em 1.2em'></button>" +
        "</div>";
      document.documentElement.appendChild(overlay);
      state.overlay = overlay;
      overlay
        .querySelector("#fullscreen-recovery-button")
        .addEventListener("click", requestFullscreen);
    }
    if (mode) {
      var text = SCREEN_TEXT[mode];
      state.overlay.querySelector("#fullscreen-recovery-heading").textContent =
        text.heading;
      state.overlay.querySelector("#fullscreen-recovery-message").textContent =
        text.message;
      state.overlay.querySelector("#fullscreen-recovery-note").textContent = text.note;
      state.overlay.querySelector("#fullscreen-recovery-button").textContent =
        text.button;
    }
    state.overlay.style.display = "flex";
    var message_node = state.overlay.querySelector("#fullscreen-recovery-message");
    if (message_node && message) message_node.textContent = message;
    var button = state.overlay.querySelector("#fullscreen-recovery-button");
    if (button) button.focus();
  }

  function hideOverlay() {
    if (state.overlay) state.overlay.style.display = "none";
  }

  function pauseForFullscreen() {
    if (isDisabled() || state.disarmed || !state.armed || state.paused) return;
    state.paused = true;
    if (window.jsPsych && typeof window.jsPsych.pauseExperiment === "function") {
      window.jsPsych.pauseExperiment();
    }
    if (!state.entered) {
      // Not yet in full screen at all: ask the participant to enter it.
      showOverlay(null, "entry");
      return;
    }
    state.trial_interrupted = true;
    state.pauses += 1;
    showOverlay(null, "paused");
  }

  function resumeAfterFullscreen() {
    if (!isFullscreen()) return;
    state.entered = true;
    if (!state.paused) return;
    state.paused = false;
    hideOverlay();
    if (window.jsPsych && typeof window.jsPsych.resumeExperiment === "function") {
      window.jsPsych.resumeExperiment();
    }
  }

  function requestFullscreen() {
    var element = document.documentElement;
    var request =
      element.requestFullscreen ||
      element.webkitRequestFullscreen ||
      element.mozRequestFullScreen ||
      element.msRequestFullscreen;
    if (!request) {
      showOverlay(
        "This browser cannot return the study to full screen. Please use a supported desktop browser or end the study by closing this window.",
      );
      return;
    }
    try {
      var result = request.call(element);
      if (result && typeof result.catch === "function") {
        result.catch(function () {
          showOverlay(
            "Full screen was not enabled. Please allow it in your browser, then press the button again.",
          );
        });
      }
    } catch (e) {
      showOverlay(
        "Full screen was not enabled. Please allow it in your browser, then press the button again.",
      );
    }
  }

  function handleFullscreenChange() {
    if (isDisabled() || !state.armed || state.disarmed) return;
    if (isFullscreen()) resumeAfterFullscreen();
    else pauseForFullscreen();
  }
  [
    "fullscreenchange",
    "webkitfullscreenchange",
    "mozfullscreenchange",
    "MSFullscreenChange",
  ].forEach(function (event_name) {
    document.addEventListener(event_name, handleFullscreenChange);
  });

  // This listener runs before jsPsych's task listeners, so no keyboard
  // response reaches an active trial while the recovery screen is visible.
  function blockInput(event) {
    if (!state.paused) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  window.addEventListener("keydown", blockInput, true);
  window.addEventListener("keyup", blockInput, true);

  window.fullscreenGuardArm = function () {
    state.armed = true;
    state.disarmed = false;
    if (isFullscreen()) state.entered = true;
    else pauseForFullscreen();
  };

  // The local entry point deliberately exits full screen before its debrief;
  // the shared debrief also disarms the guard on Gorilla.
  window.fullscreenGuardDisarm = function () {
    state.disarmed = true;
    state.armed = false;
    state.paused = false;
    hideOverlay();
    if (window.jsPsych && typeof window.jsPsych.resumeExperiment === "function") {
      window.jsPsych.resumeExperiment();
    }
  };

  window.fullscreenGuardMarkTrial = function (data) {
    if (!data) return;
    if (isDisabled()) {
      data.fullscreen_interrupted = "autotest_disabled";
    } else {
      data.fullscreen_interrupted = state.trial_interrupted ? "yes" : "no";
    }
    state.trial_interrupted = false;
  };

  window.fullscreenGuardSummary = function () {
    return {
      fullscreen_guard_pauses: isDisabled() ? "autotest_disabled" : state.pauses,
    };
  };
})();
