/****************************************************************/
/** MENTAL COMPARISON TASK (tag: 'MCT')                        **/
/****************************************************************/

/*
Multimodal mental comparison paradigm adapted from Suggate (2024).
Participants see a question about a sensory property (e.g.,
"Which is shinier?") together with two object names and must
decide which object has more of that property.

Responses:
  F = left word
  J = right word

Trial structure (matching existing tasks):
  1. Fixation cross     400–600 ms (premature responses logged)
  2. Stimulus display   up to 3000 ms (main) / 40 s (practice)
  3. Feedback           practice only — green ✓ / red ✗ / 0
  4. Intertrial interval 1400–1600 ms + progress bar (main only)

Modalities are presented in randomised order within each block
(visual, auditory, tactile items interleaved).

Quality control:
  - Instructional manipulation checks every 15 trials if
    accuracy < 65 % and the previous trial was incorrect.
*/

// ────────────────────────────────────────────────────────────────
// INSTRUCTIONS
// ────────────────────────────────────────────────────────────────

var MCT_instructions = {
  type: jsPsychHtmlKeyboardResponse,
  prompt: "<p>Press the space bar to begin.</p>",
  choices: [" "],
  trial_duration: 40000,
  stimulus:
    "<div>Welcome to the next task. On each screen you will see a " +
    "question about a <b>property</b> of two objects (e.g., " +
    "&ldquo;Which is <i>shinier</i>?&rdquo;)." +
    "<br><br>Please <b>imagine</b> both objects and decide which " +
    "has <i>more</i> of that property." +
    "<br><br><button>F</button> = the <b>left</b> word" +
    "<br><button>J</button> = the <b>right</b> word" +
    "<br><br>Please try to respond as accurately and fast as " +
    "possible. Next, you can practice with a few easy trials.</div>",
};

// ────────────────────────────────────────────────────────────────
// SHARED TRIAL COMPONENTS
// ────────────────────────────────────────────────────────────────

// Fixation cross (shared by practice and main)
var MCT_fixation = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: "+",
  choices: ["f", "j"],
  response_ends_trial: false,
  trial_duration: function () {
    return jsPsych.randomization.sampleWithoutReplacement(
      [400, 450, 500, 550, 600],
      1,
    )[0];
  },
  css_classes: ["stimulus"],
  on_finish: function (data) {
    if (data.response != null) {
      data.premature_response_attempts = 1;
    } else {
      data.premature_response_attempts = 0;
    }
  },
};

// ────────────────────────────────────────────────────────────────
// PRACTICE BLOCK
// ────────────────────────────────────────────────────────────────

var MCT_practice_stim = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function () {
    var p = jsPsych.evaluateTimelineVariable("property");
    var w1 = jsPsych.evaluateTimelineVariable("word1");
    var w2 = jsPsych.evaluateTimelineVariable("word2");
    return (
      "<div><b>Reminder:</b>" +
      "<br><button>F</button> = left word" +
      "<br><button>J</button> = right word</div>" +
      '<p class="stimulus" style="margin-top:24px;">Which is <b>' +
      p +
      "</b>?</p>" +
      '<div style="display:flex; justify-content:space-around; ' +
      'max-width:500px; margin:0 auto;">' +
      '<span class="stimulus">' +
      w1 +
      "</span>" +
      '<span class="stimulus">' +
      w2 +
      "</span></div>"
    );
  },
  choices: ["f", "j"],
  trial_duration: 40000,
  data: {
    task: "MCT_practice",
    modality: jsPsych.timelineVariable("modality"),
    property: jsPsych.timelineVariable("property"),
    word1: jsPsych.timelineVariable("word1"),
    word2: jsPsych.timelineVariable("word2"),
    correct_key: jsPsych.timelineVariable("correct_key"),
  },
  on_finish: function (data) {
    if (data.response != null) {
      data.accuracy = jsPsych.pluginAPI.compareKeys(data.response, data.correct_key)
        ? "correct"
        : "incorrect";
    } else {
      data.accuracy = "unanswered";
    }
  },
};

// Practice feedback
var MCT_practice_feedback = {
  type: jsPsychHtmlKeyboardResponse,
  choices: "NO_KEYS",
  trial_duration: 800,
  stimulus: function () {
    var last = jsPsych.data.getLastTrialData().values()[0];
    if (last.accuracy === "unanswered") {
      return "<p><red-button> 0 </red-button></p>";
    } else if (last.accuracy === "correct") {
      return "<p><green-button> &check; </green-button></p>";
    } else {
      return "<p><red-button> &#x2718; </red-button></p>";
    }
  },
};

// Assemble practice procedure
var MCT_practice_procedure = {
  timeline: [MCT_fixation, MCT_practice_stim, MCT_practice_feedback],
  timeline_variables: MCT_practice_stimuli,
  randomize_order: true,
};

// Practice debrief
var MCT_practice_debrief = {
  type: jsPsychHtmlKeyboardResponse,
  choices: [" "],
  trial_duration: 40000,
  stimulus: function () {
    var correct = jsPsych.data
      .get()
      .filter({ task: "MCT_practice", accuracy: "correct" })
      .count();
    var total = jsPsych.data
      .get()
      .filter({ task: "MCT_practice" })
      .filterCustom(function (t) {
        return t.accuracy !== undefined;
      })
      .count();
    var pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    if (pct >= 80) {
      return "<div>Practice completed. Well done! Press the space bar to begin.</div>";
    } else {
      return (
        "<div><b>Results of the practice</b><br>You responded correctly to " +
        pct +
        " % of the trials. Please pay attention to the instructions. " +
        "Press the space bar to repeat the practice.</div>"
      );
    }
  },
};

// Repeat practice if accuracy < 80 %
var MCT_repeated_practice = {
  timeline: [
    {
      type: jsPsychHtmlKeyboardResponse,
      prompt: "<p>Press the space bar to begin.</p>",
      choices: [" "],
      trial_duration: 40000,
      stimulus:
        "<div>Please consider the instructions again. On each screen you " +
        "will see a question about a <b>property</b> of two objects." +
        "<br><br><button>F</button> = the <b>left</b> word" +
        "<br><button>J</button> = the <b>right</b> word" +
        "<br><br>Please <b>imagine</b> the objects and respond as " +
        "accurately and fast as possible.</div>",
    },
    {
      timeline: [MCT_fixation, MCT_practice_stim, MCT_practice_feedback],
      timeline_variables: MCT_practice_stimuli,
      randomize_order: true,
      data: { practice_round: 2 },
    },
    {
      type: jsPsychHtmlKeyboardResponse,
      choices: [" "],
      trial_duration: 40000,
      stimulus: function () {
        var correct = jsPsych.data
          .get()
          .filter({
            task: "MCT_practice",
            practice_round: 2,
            accuracy: "correct",
          })
          .count();
        var total = jsPsych.data
          .get()
          .filter({ task: "MCT_practice", practice_round: 2 })
          .filterCustom(function (t) {
            return t.accuracy !== undefined;
          })
          .count();
        var pct = total > 0 ? Math.round((correct / total) * 100) : 0;

        if (pct >= 80) {
          return "<div>Practice completed. Well done! Press the space bar to begin.</div>";
        } else {
          return (
            "<div><b>Results of the practice</b><br>You responded correctly to " +
            pct +
            " % of the trials. Please pay attention in the next part. " +
            "Press the space bar to begin.</div>"
          );
        }
      },
    },
  ],
  conditional_function: function () {
    var correct = jsPsych.data
      .get()
      .filter({ task: "MCT_practice", accuracy: "correct" })
      .count();
    var total = jsPsych.data
      .get()
      .filter({ task: "MCT_practice" })
      .filterCustom(function (t) {
        return t.accuracy !== undefined;
      })
      .count();
    return total > 0 && correct / total < 0.8;
  },
};

// ────────────────────────────────────────────────────────────────
// MAIN BLOCK
// ────────────────────────────────────────────────────────────────

var MCT_main_trial_number = 0;
var MCT_total_main_trials = MCT_main_stimuli.length; // 45

// Main stimulus display
var MCT_main_stim = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function () {
    var p = jsPsych.evaluateTimelineVariable("property");
    var w1 = jsPsych.evaluateTimelineVariable("word1");
    var w2 = jsPsych.evaluateTimelineVariable("word2");
    return (
      '<p class="stimulus" style="margin-top:24px;">Which is <b>' +
      p +
      "</b>?</p>" +
      '<div style="display:flex; justify-content:space-around; ' +
      'max-width:500px; margin:0 auto;">' +
      '<span class="stimulus">' +
      w1 +
      "</span>" +
      '<span class="stimulus">' +
      w2 +
      "</span></div>" +
      '<p style="margin-top:40px; font-size:16px; color:#888;">' +
      "(F = left &nbsp;&nbsp;|&nbsp;&nbsp; J = right)</p>"
    );
  },
  choices: ["f", "j"],
  trial_duration: 3000,
  data: {
    task: "MCT_main",
    modality: jsPsych.timelineVariable("modality"),
    property: jsPsych.timelineVariable("property"),
    word1: jsPsych.timelineVariable("word1"),
    word2: jsPsych.timelineVariable("word2"),
    correct_key: jsPsych.timelineVariable("correct_key"),
  },
  on_finish: function (data) {
    MCT_main_trial_number++;
    data.trial = MCT_main_trial_number;

    // Score accuracy
    if (data.response != null) {
      data.accuracy = jsPsych.pluginAPI.compareKeys(data.response, data.correct_key)
        ? "correct"
        : "incorrect";
    } else {
      data.accuracy = "unanswered";
    }

    // Running accuracy rate
    var correct_count = jsPsych.data
      .get()
      .filter({ task: "MCT_main", accuracy: "correct" })
      .count();
    var total_count = jsPsych.data
      .get()
      .filter({ task: "MCT_main" })
      .filterCustom(function (t) {
        return t.accuracy !== undefined;
      })
      .count();
    data.main_accuracy_rate = total_count > 0 ? correct_count / total_count : 0;
  },
};

// Intertrial interval with progress bar (main only)
var MCT_intertrial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function () {
    var pct = Math.round((MCT_main_trial_number / MCT_total_main_trials) * 100);
    return (
      '<div class="trial-progress-container-centre">' +
      '<div class="trial-progress-bar" style="width:' +
      pct +
      '%;"></div>' +
      "</div>"
    );
  },
  choices: "NO_KEYS",
  response_ends_trial: false,
  trial_duration: function () {
    return jsPsych.randomization.sampleWithoutReplacement(
      [1400, 1450, 1500, 1550, 1600],
      1,
    )[0];
  },
};

// Instructional manipulation check (every 15 trials if accuracy < 65 %)
var MCT_conditional_instructional_manipulation_check = {
  timeline: [random_number, instructional_manipulation_check],
  conditional_function: function () {
    // This node sits after the intertrial screen, so getLastTrialData()
    // would return the ITI row (which carries no accuracy fields) and the
    // check could never fire. Read the last MCT_main response row instead.
    var last = jsPsych.data.get().filter({ task: "MCT_main" }).last(1).values()[0];
    if (!last) return false;
    // Only trigger at checkpoint trials (every 15 trials)
    if (MCT_main_trial_number % 15 !== 0) return false;
    if (last.accuracy !== "correct" && last.main_accuracy_rate < 0.65) {
      return true;
    }
    return false;
  },
};

// Assemble main procedure
var MCT_main_procedure = {
  timeline: [
    MCT_fixation,
    MCT_main_stim,
    MCT_intertrial,
    MCT_conditional_instructional_manipulation_check,
  ],
  timeline_variables: MCT_main_stimuli,
  randomize_order: true,
};

// ────────────────────────────────────────────────────────────────
// ASSEMBLE COMPLETE TASK & PUSH TO GENERAL TIMELINE
// ────────────────────────────────────────────────────────────────

var MCT_timeline = {
  timeline: [
    MCT_instructions,
    MCT_practice_procedure,
    MCT_practice_debrief,
    MCT_repeated_practice,
    MCT_main_procedure,
  ],
};

// Break before MCT (reuses existing break_between_tasks)
language_vision_SemPri_TIMELINE.push(break_between_tasks);
language_vision_SemPri_TIMELINE.push(MCT_timeline);

// The session-level debrief is defined in study_debrief.js.
