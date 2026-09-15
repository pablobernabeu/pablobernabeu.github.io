/* =============================================================================
   Session integrity: one definition of the conditions that hold for the whole
   session, shared by both entry points and by every task script.

   Three of those conditions used to be stated in several places and agreed in
   none of them.

   1. How a terminated session is routed back to Prolific.
      Four separate termination messages each hard-coded the same Prolific
      completion code, told the participant to "Stop without Completing", and
      then linked them to a URL that COMPLETES the submission. Those are
      opposite actions, so whichever the participant followed, one of them was
      wrong. The code itself was this study's own, checked against the Prolific
      study on 2026-08-20, but a literal in the source says nothing about which
      completion path it belongs to and would go silently stale if the study
      were ever recreated. Every termination message is now written in one
      place, prolificExitMessage() below.

      The two checks answer to different rules (policy:
      researcher-help.prolific.com/en/articles/445153, checked 2026-08-21), and
      this study satisfies both.

      A comprehension check "must be given at the start of the study so
      participants are not screened out after having put in significant time
      and effort", must allow at least two attempts, and may never be grounds
      for rejection: a participant who fails one twice "should be immediately
      asked to return their submission". Ours is the reading-ability practice,
      the first task of the session, run in two rounds.

      An attention check carries no placement restriction, and in a study of
      five minutes or longer a participant must fail at least two before being
      screened out. Ours are the instructional manipulation checks, spread
      across all four tasks, and they end the session on the second failure,
      which is the point at which the policy permits acting on them.

      Neither ending is paid, and both are routed the same way: the participant
      is sent to a Prolific completion path whose action is "Request a return",
      which ends the submission without a payment and without a penalty on the
      participant's record. Only the path differs, because the path is what
      records WHY the session ended, and because the two failures carry
      different consequences: an attention-check failure is a valid ground for
      rejection under the policy, a comprehension-check failure never is. The
      study description states before anyone starts that missing more than one
      attention check ends the session unpaid, so nobody meets this message
      without having been told the terms.

      Completion codes are never written into this file. They arrive per study
      on the entry URL (completion_code for a finished session,
      screen_out_code for a failed attention check, return_code for a failed
      comprehension check), so each code and the completion path it belongs to
      are configured together in one place. Where return_code is absent the
      attention-check path is used for a comprehension failure as well: both
      paths request a return, so the participant's outcome is identical and
      only Prolific's label for the reason is coarser, which the data make up
      for. Where no return path is configured at all, the participant is asked
      to end the submission from the Prolific study page by hand. Never send a
      terminated participant to a code you have not verified belongs to this
      study: an unverified code may complete a submission you meant to return.

      How the hand-back happens differs by entry point, and the difference is
      the reason the message ends in a button rather than a link. On Gorilla a
      session is closed by gorilla.finish(), which moves the participant to the
      experiment's Finish node and from there to its onward URL; anything still
      on screen at that moment is gone. The bootstrap therefore does NOT call
      gorilla.finish() for a terminated session. Instead the message's button
      calls window.prolificReturn(), which the bootstrap has pointed at a
      function that waits until jsPsych has saved and streamed the session's
      last row, writes the right completion code into the participant Store
      and only then finishes, so the Finish node's onward URL
      (https://app.prolific.com/submissions/complete?cc=${store:prolific_cc})
      carries the code for the way this session actually ended. Locally the
      same button navigates to the completion URL directly.

   2. Whether the session ran full screen, on a computer.
      The local entry point enters full screen through the jsPsych plugin, and
      on Gorilla the platform handles it. Neither recorded whether it worked, so
      the manuscript's claim that the session is administered in full-screen
      mode could not be checked against the data. The state is now read at the
      first response and departures from it counted, which makes the claim
      auditable for each participant.

   3. Whether a person produced the responses.
      Browser-driving AI agents answer studies by dispatching synthetic events,
      and a synthetic KeyboardEvent carries isTrusted === false where a real key
      press carries true. Nothing checked this, and the project's own autotest
      driver shows what that allowed: it completed whole batteries by
      dispatching untrusted events that no part of the experiment noticed.

      Automation is counted, never blocked. Blocking mid-session would act on a
      single signal at the moment it is weakest, and assistive input methods
      also dispatch untrusted events, so a wrong ejection is both possible and
      costlier than a late detection. The counts bear on exclusion, not on
      payment: Prolific calls researcher-side detection of this kind "guidance
      for cleaner data, not for rejections", so a session the counts condemn is
      excluded from the analysis under the registered rule, and suspected bot
      activity is reported to Prolific support for the platform to act on.

      The registered rule is that a session with responses and none of them
      user-generated is excluded. A second record helps read the rest:
      entering full screen requires a user gesture the browser trusts, so a
      session driven entirely by synthetic events cannot begin in full screen,
      and scripts/sanity_check.R reports that conjunction alongside the rule.

   Loaded first, before any task script, by both entry points.
   ============================================================================= */

(function () {
  "use strict";

  // Prolific completion-path codes for the two ways a session can end early,
  // supplied per study on the entry URL rather than compiled in. Set them up
  // under Data collection -> Completion paths on the Prolific study, both with
  // the action "Request a return", and append ?screen_out_code=XXXX and
  // &return_code=YYYY to the launch links. Either may be omitted, in which case
  // the participant is asked to end the submission from the Prolific study page
  // instead. The names are historical: screen_out_code is the attention-check
  // path and return_code the comprehension-check path.
  function config(name) {
    var v = null;
    try {
      if (typeof window._queryParam === "function") v = window._queryParam(name);
      if (!v) {
        // The local entry point has no _queryParam helper. On Gorilla this
        // second read finds nothing, because Gorilla empties the task page's
        // query string; _queryParam reads the participant Store instead.
        v = new URLSearchParams(window.location.search).get(name);
      }
    } catch (e) {}
    return v || null;
  }
  window.PROLIFIC_COMPLETION_CODE = config("completion_code");
  window.PROLIFIC_SCREEN_OUT_CODE = config("screen_out_code");
  window.PROLIFIC_RETURN_CODE = config("return_code");

  // Which codes reached the session, recorded in the data so a launch link
  // that dropped one is visible in the first export rather than discovered
  // from a participant's complaint. Written as a string because Gorilla
  // exports a logical FALSE as an empty cell.
  window.PROLIFIC_CODES_CONFIGURED =
    [
      window.PROLIFIC_COMPLETION_CODE ? "completion" : null,
      window.PROLIFIC_SCREEN_OUT_CODE ? "screen_out" : null,
      window.PROLIFIC_RETURN_CODE ? "return" : null,
    ]
      .filter(Boolean)
      .join("+") || "none";

  // Set by prolificExitMessage() so the entry point's on_finish can tell a
  // terminated session from a completed one: "attention", "comprehension" or
  // null. The code chosen for the hand-back is kept alongside it.
  window.SESSION_TERMINATED = null;
  window.SESSION_EXIT_CODE = null;

  // Hand a terminated participant back to Prolific. The Gorilla bootstrap
  // defines this before the resource loads (see the header), so it is only
  // filled in here when nothing has: the local entry point, where the
  // completion URL can be opened directly.
  if (typeof window.prolificReturn !== "function") {
    window.prolificReturn = function () {
      // Finish the trial the message may still be showing in, then leave.
      // The Gorilla bootstrap waits for jsPsych to save and stream that row
      // before handing back. Nothing is streamed locally, and the data held
      // in the page are lost on leaving it whichever comes first, so this
      // version does not wait.
      try {
        if (window.jsPsych && jsPsych.getCurrentTrial()) jsPsych.finishTrial();
      } catch (e) {}
      var code = window.SESSION_EXIT_CODE;
      if (code) {
        window.location.href =
          "https://app.prolific.com/submissions/complete?cc=" + code;
      }
    };
  }

  var integrity = {
    // Static facts about the environment, read once at the start.
    webdriver: false,
    touch_points: 0,
    screen_dimensions: "",
    fullscreen_at_start: false,
    // Running counts over the session.
    untrusted_responses: 0,
    trusted_responses: 0,
    fullscreen_exits: 0,
    focus_losses: 0,
  };
  window.SESSION_INTEGRITY = integrity;

  try {
    // navigator.webdriver is set by every mainstream automation stack
    // (WebDriver, Puppeteer, Playwright, and the Chrome DevTools Protocol
    // drivers a browser-based agent uses). A determined actor can spoof it in
    // one line, which is why it is only recorded: it catches the ordinary case
    // and claims nothing about the rest.
    integrity.webdriver = navigator.webdriver === true;

    // A desktop machine reports no touch points. Prolific's device screening
    // already restricts participation to computers, and Gorilla's device
    // requirements restrict it again, so this is a third and independent
    // record: should either platform restriction ever be misconfigured, the
    // data would show it, and the study would not quietly admit phones.
    integrity.touch_points =
      typeof navigator.maxTouchPoints === "number" ? navigator.maxTouchPoints : 0;

    if (window.screen) {
      integrity.screen_dimensions = screen.width + "x" + screen.height;
    }
  } catch (e) {}

  function inFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }
  window.inFullscreen = inFullscreen;

  // Whether the session was in full screen when the first response arrived.
  // A timer used to sample this three seconds after load, but both entry
  // points copy the static fields into the data before any timer can fire,
  // so the value was "no" for everyone. The first key press is a moment that
  // exists in every session, comes after the full-screen request on both entry
  // points, and is observed by the listener below; the field is attached at
  // the end with the other counts rather than at the start.
  var fullscreen_sampled = false;

  // Count departures from full screen after the session has begun. jsPsych's
  // interaction log already records these events, but it is stored as a JSON
  // blob on a single row; a count is what a quality check can actually read.
  document.addEventListener("fullscreenchange", function () {
    if (!inFullscreen()) integrity.fullscreen_exits += 1;
  });

  // Losing focus means another window, or another tab, was in front. It matters
  // beyond attentiveness: a browser throttles timers in a backgrounded tab to
  // roughly one per minute, which stretches stimulus durations far beyond their
  // registered values, so a session with many focus losses has degraded timing
  // regardless of how attentive the participant was.
  window.addEventListener("blur", function () {
    integrity.focus_losses += 1;
  });

  // Capture phase, on window, so this sees the event before any task handler
  // and regardless of which element the dispatcher targeted.
  window.addEventListener(
    "keydown",
    function (ev) {
      if (!fullscreen_sampled) {
        integrity.fullscreen_at_start = inFullscreen();
        fullscreen_sampled = true;
      }
      if (ev && ev.isTrusted === false) integrity.untrusted_responses += 1;
      else integrity.trusted_responses += 1;
    },
    true,
  );

  var yn = function (v) {
    return v ? "yes" : "no";
  };

  // Facts available at the start, attached to every row. Written as strings
  // because Gorilla exports a logical FALSE as an empty cell, which is
  // indistinguishable from a column that was never declared.
  window.sessionIntegrityStatic = function () {
    return {
      automation_webdriver: yn(integrity.webdriver),
      device_touch_points: integrity.touch_points,
      screen_dimensions: integrity.screen_dimensions,
      completion_codes_configured: window.PROLIFIC_CODES_CONFIGURED,
    };
  };

  // Counts, meaningful only once the session has run. They are merged into
  // the LAST ROW BEFORE IT IS STREAMED, from the entry point's on_trial_finish
  // hook, because anything attached to a row after it has been sent only
  // reaches the local copy: Gorilla receives each row once, through
  // gorilla.metric(), and never sees a later mutation of it. The entry points'
  // on_finish hooks attach the same fields again for the local download.
  window.sessionIntegritySummary = function () {
    var summary = {
      automation_untrusted_responses: integrity.untrusted_responses,
      automation_trusted_responses: integrity.trusted_responses,
      fullscreen_at_start: fullscreen_sampled
        ? yn(integrity.fullscreen_at_start)
        : "no_response",
      fullscreen_exits: integrity.fullscreen_exits,
      focus_losses: integrity.focus_losses,
      fullscreen_at_end: yn(inFullscreen()),
      // "attention", "comprehension" or "no": how the session ended.
      session_terminated: window.SESSION_TERMINATED || "no",
    };
    // Loaded after this file, the full-screen guard contributes a count of
    // recovery pauses. It is descriptive only and never changes a Prolific
    // completion path.
    if (typeof window.fullscreenGuardSummary === "function") {
      var guard_summary = window.fullscreenGuardSummary();
      for (var key in guard_summary) summary[key] = guard_summary[key];
    }
    return summary;
  };

  // True while the row being finished is the session's last one: either the
  // debrief (which sets window.SESSION_ENDING when it starts) or the trial
  // whose on_finish ended the session through prolificExitMessage(). The entry
  // points call this from on_trial_finish, which jsPsych runs after the trial's
  // own on_finish and before on_data_update streams the row.
  window.attachSessionSummaryIfLast = function (data) {
    if (window.SESSION_TERMINATED || window.SESSION_ENDING) {
      var summary = window.sessionIntegritySummary();
      for (var k in summary) data[k] = summary[k];
      // jsPsych's own timestamped focus/blur/fullscreen log rides along on the
      // same row, for the same reason the counts do: attached any later, it
      // reaches only the local copy, never the streamed export.
      try {
        if (window.jsPsych && jsPsych.data && jsPsych.data.getInteractionData) {
          data.interactions = jsPsych.data.getInteractionData().json();
        }
      } catch (e) {}
    }
  };

  /* ---------------------------------------------------------------------------
     The single termination message.

     `kind` is 'attention' for a failed instructional manipulation check and
     'comprehension' for a failed practice comprehension check. The two are
     routed differently because Prolific permits different outcomes for them.
     --------------------------------------------------------------------------- */
  window.prolificExitMessage = function (kind) {
    var attention = kind === "attention";
    var reason = attention
      ? "more than one attention check was missed"
      : "the practice questions were not answered correctly on either attempt";

    // Each kind has its own Prolific completion path, so that the reason a
    // session ended is recorded on the submission rather than inferred later.
    // Both paths are configured with the "Request a return" action, which is
    // why the attention-check path can stand in when no comprehension-check
    // path has been configured (see the header). With neither, the
    // participant is told how to do the same thing by hand.
    var code = attention
      ? window.PROLIFIC_SCREEN_OUT_CODE
      : window.PROLIFIC_RETURN_CODE || window.PROLIFIC_SCREEN_OUT_CODE;
    window.SESSION_TERMINATED = attention ? "attention" : "comprehension";
    window.SESSION_EXIT_CODE = code || null;

    var opening =
      "<div style='max-width:40em;margin:auto;text-align:left'>" +
      "<p>Thank you for the time you have given. The study has ended early, " +
      "because " +
      reason +
      ". The study description said before you began " +
      "that this would end the session.</p>" +
      // Stated plainly rather than left to be discovered on the Prolific page.
      // Returning a submission carries no penalty on a participant's record,
      // which is the part they are most likely to worry about, so it is said
      // in the same breath as the part about payment.
      "<p>This means your submission is <b>returned rather than paid</b>. " +
      "Returning a submission counts against nothing on your Prolific record " +
      "and leaves you free to take other studies straight away.</p>";

    var closing =
      "<p>If you believe the study ended in error, please message us through " +
      "Prolific and we will look into it.</p></div>";

    if (code) {
      return (
        opening +
        "<p>Please click the button below to go back to Prolific and end your " +
        "submission.</p>" +
        "<p><button class='jspsych-btn' onclick='window.prolificReturn()'>" +
        "Back to Prolific</button></p>" +
        closing
      );
    }

    // With no verified code, send nobody to a completion URL: an unverified
    // code may belong to another study, and it may complete a submission that
    // was meant to be returned. Doing it by hand reaches the right outcome.
    return (
      opening +
      "<p>Please close this tab, go back to the study page on Prolific, and " +
      "choose <b>Stop without completing</b>. That returns your submission and " +
      "frees the place for someone else.</p>" +
      closing
    );
  };
})();
