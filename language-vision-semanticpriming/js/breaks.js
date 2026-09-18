/* Between-task countdown break shown between the four tasks of the battery.
Code adapted from https://github.com/jspsych/jsPsych/discussions/1690

Only break_between_tasks is used. The earlier break_between_blocks (a 120 s
mid-task break between two semantic-priming blocks) was removed when the
semantic priming task became a single block; see the git history for that
version.

Main-task progress is deliberately shown only at checkpoints rather than
during every inter-trial interval. Keeping this helper here means all task
modules use the same participant-facing explanation and frequency. */

var TASK_PROGRESS_INTERVAL = 20;

function taskProgressMarkup(completed, total) {
  if (!total || completed <= 0) return " ";

  var is_checkpoint = completed % TASK_PROGRESS_INTERVAL === 0;
  var is_complete = completed >= total;
  if (!is_checkpoint && !is_complete) return " ";

  var percentage = Math.min(100, Math.round((completed / total) * 100));
  return (
    '<div class="trial-progress-update" role="status" aria-live="polite">' +
    '<div class="trial-progress-label">Task progress: ' +
    percentage +
    "%</div>" +
    '<div class="trial-progress-container-centre" role="progressbar" ' +
    'aria-label="Task progress" aria-valuemin="0" aria-valuemax="100" ' +
    'aria-valuenow="' +
    percentage +
    '">' +
    '<div class="trial-progress-bar" style="width:' +
    percentage +
    '%"></div></div></div>'
  );
}

var break_between_tasks = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus:
    '<div style="text-align:center;">Task completed! The next task will begin in ' +
    "<b><span id='clock'>30</span> seconds</b>." +
    '<p class="break-progress-label">The bar shows how much of the break has passed.</p>' +
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
