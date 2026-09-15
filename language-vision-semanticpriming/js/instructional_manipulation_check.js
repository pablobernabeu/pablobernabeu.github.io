/* Instructional manipulation check, written to Prolific's attention and
   comprehension check policy (researcher-help.prolific.com/en/articles/445153,
   checked 2026-08-20). The reference here was previously to the 2023 policy on
   the retired prolific.co domain, and the rules have changed since.

   Four provisions govern this check, and each shows up in the code below.

   A study of five minutes or longer may not screen a participant out on a
   single failed check, which is why the session ends only on the second
   failure.

   A fair check must test attention to the question itself rather than recall:
   the four-digit number stays on screen alongside the question asking which of
   its digits to report, so nothing has to be remembered.

   "Time limits or internal measures are not permitted for attention or
   comprehension checks", and the policy says again that a check "shouldn't
   rely on speed", exceptionally fast submission being the only speed criterion
   it allows anyone to act on. This check therefore waits indefinitely for a
   response. It used to allow ten seconds and score a timeout as a failure,
   which failed the slow rather than the inattentive and would have made every
   screen-out built on it indefensible. A session nobody is answering now stalls
   instead, and Prolific returns it unpaid at the study's maximum time, which is
   the right outcome for an abandoned or automated session anyway.

   Only the ten digit keys end the trial. With any key accepted, a participant
   who happened to hit Enter or a modifier first failed a check they were paying
   attention to; a stray key is now simply ignored, and nothing about the
   check's difficulty changes for anyone reading the screen.

   The termination message is built by window.prolificExitMessage() in
   js/session_integrity.js, the only place any termination message is written. */

// Random number for the instructional_manipulation_check below
var random_number = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: "",
  trial_duration: 20,
  choices: "NO_KEYS",
  on_finish: function (data) {
    data.random_number = Math.floor(Math.random() * (9999 - 1000 + 1) + 1000);
    data.random_position = jsPsych.randomization.sampleWithoutReplacement(
      [0, 1, 2, 3],
      1,
    )[0];
  },
};

var instructional_manipulation_check = {
  type: jsPsychHtmlKeyboardResponse,
  // No trial_duration: the check must not be scored on speed (see the header).
  choices: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  stimulus: function (data) {
    var lastData = jsPsych.data.getLastTrialData().values()[0];
    var ordinals = ["first", "second", "third", "fourth"];
    var label = ordinals[lastData.random_position];
    return (
      "<p><b>Attention check!</b> Please enter the " +
      "<b>" +
      label +
      "</b> number in the following sequence: " +
      '<span style="font-weight:bold;">' +
      lastData.random_number +
      "</span></p>" +
      // Says which keys are live, now that only digits end the trial. Take your
      // time is not padding: the check is not scored on speed, and a
      // participant who thinks it is may guess rather than read.
      "<p>Press a number key. There is no time limit.</p>"
    );
  },
  on_finish: function (data) {
    if (window.AUTO_TEST) {
      data.instructional_manipulation_check = "passed";
      return;
    }

    // Register the task and trial this check belongs to: the most recent row
    // that carries a task tag. Counting back a fixed three rows, as this once
    // did, reached the response row only where the check directly follows it
    // (the reading-ability and priming tasks); in the visual and comparison
    // tasks an intertrial row sits in between and the tag came out empty.
    var tagged = jsPsych.data
      .get()
      .filterCustom(function (row) {
        return typeof row.task === "string" && row.task !== "";
      })
      .values();
    var origin = tagged.length ? tagged[tagged.length - 1] : {};
    data.task = origin.task;
    data.trial = origin.trial;

    // Categorise passed check
    if (
      data.response ==
      jsPsych.data
        .get()
        .last(2)
        .values()[0]
        .random_number.toString()
        .charAt(jsPsych.data.get().last(2).values()[0].random_position)
    ) {
      data.instructional_manipulation_check = "passed";

      // Categorise failed check
    } else data.instructional_manipulation_check = "failed";

    // Terminate experiment if two instructional manipulation checks have been failed
    if (
      jsPsych.data
        .get()
        .filter({
          instructional_manipulation_check: "failed",
        })
        .count() >= 2
    ) {
      jsPsych.abortExperiment(window.prolificExitMessage("attention"), data);
    }
  },
};
