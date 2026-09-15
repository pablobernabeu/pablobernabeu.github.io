/* Between-task countdown break shown between the four tasks of the battery.
Code adapted from https://github.com/jspsych/jsPsych/discussions/1690

Only break_between_tasks is used. The earlier break_between_blocks (a 120 s
mid-task break between two semantic-priming blocks) was removed when the
semantic priming task became a single block; see the git history for that
version. */

var break_between_tasks = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus:
    '<div style="text-align:center;">Task completed! The next task will begin in ' +
    "<b><span id='clock'>30</span> seconds</b>." +
    '<div class="break-progress-container">' +
    '<div class="break-progress-bar" id="break-progress"></div>' +
    "</div></div>",
  // In autotest mode use ALL_KEYS so triggerAutoResponse can end the trial
  // immediately via key dispatch (30 ms), avoiding any dependency on
  // trial_duration compression reaching the plugin.
  choices: window.AUTO_TEST ? "ALL_KEYS" : "NO_KEYS",
  trial_duration: window.AUTO_TEST ? 2000 : 30100, // fallback in autotest
  on_load: function () {
    var wait_time = 30000;
    var start_time = performance.now();
    var interval = setInterval(function () {
      // Guard: trial may have ended (DOM cleared) before the full timer elapses
      // (e.g. in autotest mode where plugin durations are capped at 80 ms).
      var clock = document.querySelector("#clock");
      if (!clock) {
        clearInterval(interval);
        return;
      }
      var time_left = wait_time - (performance.now() - start_time);
      var seconds = Math.max(0, Math.floor(time_left / 1000));
      var seconds_str = seconds.toString().padStart(2, "0");
      clock.innerHTML = seconds_str;
      var progress = Math.min(100, ((wait_time - time_left) / wait_time) * 100);
      var bar = document.querySelector("#break-progress");
      if (bar) bar.style.width = progress + "%";
      if (time_left <= 0) {
        clock.innerHTML = "00";
        if (bar) bar.style.width = "100%";
        clearInterval(interval);
      }
    }, 250);
  },
};
