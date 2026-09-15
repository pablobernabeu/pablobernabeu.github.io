/**********************************************/
/** SEMANTIC PRIMING TASK (tag: 'SemPri')   **/
/**********************************************/

/*
Create components of the semantic priming trials. These components are used
in both the practice block and the single main block. Some components appear
only in one context: instructions and feedback are shown only during practice;
the conditional IMC check and the progress bar are shown only in the main
block. The practice block uses `SemPri_practice_stimuli` as its timeline
variables; the main block uses `final_SemPri_main_STIMULI`.
*/

var SemPri_instructions = {
  type: jsPsychHtmlKeyboardResponse,
  prompt: "<p>Press the space bar to begin.</p>",
  choices: [" "],
  trial_duration: 70000,
  stimulus:
    "<div>Each screen will first show a word in <b>UPPER CASE</b> very briefly, " +
    "followed by a word in <b>lower case</b>. Please read both words.<br><br>" +
    "Your task is to classify the <b>lowercase</b> word as abstract or concrete:" +
    "<br><br><button>F</button> = <b>Abstract</b> &mdash; concepts we cannot " +
    "normally experience physically (e.g., <i>wait</i>)" +
    "<br><button>J</button> = <b>Concrete</b> &mdash; concepts we can experience " +
    "more directly (e.g., <i>water</i>)" +
    "<br><br>Please try to respond as accurately and fast as possible. " +
    "Next, you can practise with some trials. Correct " +
    "responses will be indicated with <green-button> &check; </green-button>, " +
    "incorrect responses with <red-button> &#x2718; </red-button>, and unanswered " +
    "trials with <red-button> 0 </red-button>.</div>",
};
// Add to general timeline
language_vision_SemPri_TIMELINE.push(SemPri_instructions);

// Fixation cross
var SemPri_fixation = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: "+",
  // Choices set below to allow logging any premature response attempts
  choices: ["f", "j"],
  response_ends_trial: false,
  trial_duration: function () {
    // Set fixations with a varying duration to boost participants' attention
    return jsPsych.randomization.sampleWithoutReplacement(
      [400, 450, 500, 550, 600],
      1,
    )[0];
  },
  css_classes: ["stimulus"],
  // Custom data to be included in output
  on_finish: function (data) {
    // Adjust trial number
    TrialNum += 1;

    // Save trial number
    data.trial = TrialNum;

    // Log premature response attempts by writing 1
    if (data.response != null) {
      data.premature_response_attempts = 1;
    } else {
      data.premature_response_attempts = 0;
    }
  },
};

var prime = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: jsPsych.timelineVariable("prime"),
  // Choices set below to allow logging any premature response attempts
  choices: ["f", "j"],
  response_ends_trial: false,
  trial_duration: 100,
  css_classes: ["stimulus"],
  // Custom data to be included in output
  on_finish: function (data) {
    // Save trial number
    data.trial = TrialNum;

    // Log premature response attempts by writing 1
    if (data.response != null) {
      data.premature_response_attempts = 1;
    } else {
      data.premature_response_attempts = 0;
    }
  },
};

var ISInterval = {
  type: jsPsychHtmlKeyboardResponse,
  trial_duration: jsPsych.timelineVariable("ISInterval"),
  response_ends_trial: false,
  stimulus: " ",
  // Choices set below to allow logging any premature response attempts
  choices: ["f", "j"],
  css_classes: ["stimulus"],
  // Custom data to be included in output
  on_finish: function (data) {
    // Save trial number
    data.trial = TrialNum;

    // Log premature response attempts by writing 1
    if (data.response != null) {
      data.premature_response_attempts = 1;
    } else {
      data.premature_response_attempts = 0;
    }
  },
};

/* Register any premature response attempts during the first 100 ms after
onset of the target word. These attempts are not considered as responses. */

var target_100ms = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: jsPsych.timelineVariable("target"),
  // Choices set below to allow logging any premature response attempts
  choices: ["f", "j"],
  response_ends_trial: false,
  trial_duration: 100,
  css_classes: ["stimulus"],
  // Custom data to be included in output
  on_finish: function (data) {
    // Save trial number
    data.trial = TrialNum;

    // Log premature response attempts by writing 1
    if (data.response != null) {
      data.premature_response_attempts = 1;
    } else {
      data.premature_response_attempts = 0;
    }
  },
};

/* In the target word section of trials, all the key data are gathered, 
including information from previous sections of the same trial, such 
as the prime word and the interstimulus interval. */

var target = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: jsPsych.timelineVariable("target"),
  choices: ["f", "j"],
  /* Set 3,000 ms as the maximum trial duration, the same as in the lexical decision task
  of Hutchison et al. (2013; https://doi.org/10.3758/s13428-012-0304-z) and the semantic 
  decision task of Pexman et al. (2017; https://doi.org/10.3758/s13428-016-0720-6). The 
  duration is formed of 100 ms in the 'target_100ms' item and 2,900 ms in the 'target' 
  item. */
  trial_duration: 2900,
  css_classes: ["stimulus"],
  data: {
    // add info to output
    task: jsPsych.timelineVariable("task"),
    prime: jsPsych.timelineVariable("prime"),
    target: jsPsych.timelineVariable("target"),
    corr_rsp: jsPsych.timelineVariable("corr_rsp"),
    ISInterval: jsPsych.timelineVariable("ISInterval"),
  },

  // Custom data to be included in output
  on_finish: function (data) {
    // Save trial number
    data.trial = TrialNum;

    if (data.response != null) {
      // Label correct responses
      if (
        (data.corr_rsp == "A" && data.response == "f") ||
        (data.corr_rsp == "C" && data.response == "j")
      ) {
        data.accuracy = "correct";
        // Label incorrect responses
      } else if (
        (data.corr_rsp == "A" && data.response == "j") ||
        (data.corr_rsp == "C" && data.response == "f")
      ) {
        data.accuracy = "incorrect";
      }
      // Label unanswered trials
    } else {
      data.accuracy = "unanswered";
    }

    // Overall accuracy rate so far, ranging between 0 and 1

    var task = jsPsych.evaluateTimelineVariable("task");
    var SemPri_total_correct = jsPsych.data
      .get()
      .filter({
        task: task,
        accuracy: "correct",
      })
      .count();

    var SemPri_total_incorrect = jsPsych.data
      .get()
      .filter({
        task: task,
        accuracy: "incorrect",
      })
      .count();

    var SemPri_total_unanswered = jsPsych.data
      .get()
      .filter({
        task: task,
        accuracy: "unanswered",
      })
      .count();

    data.accuracy_rate =
      SemPri_total_correct /
      (SemPri_total_correct + SemPri_total_incorrect + SemPri_total_unanswered);

    /* Aggregate any premature response attempts on this trial. 
    If there were any, write 'yes'. */

    function hasPrematureResponse(d) {
      return (
        d != null &&
        d.premature_response_attempts != null &&
        d.premature_response_attempts != 0
      );
    }
    if (
      hasPrematureResponse(jsPsych.data.get().last(5).values()[0]) ||
      hasPrematureResponse(jsPsych.data.get().last(4).values()[0]) ||
      hasPrematureResponse(jsPsych.data.get().last(3).values()[0]) ||
      hasPrematureResponse(jsPsych.data.get().last(2).values()[0])
    ) {
      data.premature_response_attempts = "yes";
    } else {
      data.premature_response_attempts = "no";
    }
  },
};

// Every 20 trials, administer an instructional manipulation check if the previous
// response was incorrect or missing and running accuracy is below 65%
// (preregistration, Procedure).
var SemPri_conditional_instructional_manipulation_check = {
  timeline: [random_number, instructional_manipulation_check],
  conditional_function: function () {
    var last = jsPsych.data.getLastTrialData().values()[0];
    return (
      last != null &&
      last.trial % 20 === 0 && // every 20th trial
      last.trial !== 0 && // not the first trial
      last.accuracy !== "correct" &&
      last.accuracy_rate < 0.65
    );
  },
};

var SemPri_feedback = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function () {
    if (jsPsych.data.getLastTrialData().values()[0].accuracy == "correct") {
      return "<p><green-button> &check; </green-button></p>";
    } else if (jsPsych.data.getLastTrialData().values()[0].accuracy == "incorrect") {
      return "<p><red-button> &#x2718; </red-button></p>";
    } else if (jsPsych.data.getLastTrialData().values()[0].accuracy == "unanswered") {
      return "<p><red-button> 0 </red-button></p>";
    } else {
      return "<p>&nbsp;</p>";
    }
  },
  choices: "NO_KEYS",
  trial_duration: 800,

  // Custom data to be included in output
  on_finish: function (data) {
    // Save trial number
    data.trial = TrialNum;
  },
};

// The intertrial interval is the last part of every trial
var SemPri_intertrial_interval = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function () {
    // Show progress bar only in main trials
    if (typeof final_SemPri_main_STIMULI !== "undefined") {
      var total = final_SemPri_main_STIMULI.length;
      var completed =
        jsPsych.data
          .get()
          .filter({ task: "SemPri_main", accuracy: "correct" })
          .count() +
        jsPsych.data
          .get()
          .filter({ task: "SemPri_main", accuracy: "incorrect" })
          .count() +
        jsPsych.data
          .get()
          .filter({ task: "SemPri_main", accuracy: "unanswered" })
          .count();
      if (completed > 0) {
        var pct = Math.round((completed / total) * 100);
        return (
          '<div class="trial-progress-container-centre">' +
          '<div class="trial-progress-bar" style="width:' +
          pct +
          '%"></div></div>'
        );
      }
    }
    return " ";
  },
  trial_duration: function () {
    // Set interval with a varying duration to boost participants' attention
    return jsPsych.randomization.sampleWithoutReplacement(
      [1400, 1450, 1500, 1550, 1600],
      1,
    )[0];
  },
  response_ends_trial: false,
  css_classes: ["stimulus"],

  // Custom data to be included in output
  on_finish: function (data) {
    // Save trial number
    data.trial = TrialNum;
  },
};

/*********************************************

  Semantic priming PRACTICE trials

*********************************************/

/* First, create set of interstimulus intervals from a range between 60 and 
1,200 ms. The range is split into as many integers as the minimum number of 
trials, equally for all participants. Afterwards, all SOAs are randomised 
within participants. */

// Create range of SOAs
var ISIntervals_practice_trials = makeArr(60, 1200, SemPri_practice_stimuli.length);

// Randomise SOAs using Fisher-Yates shuffle
ISIntervals_practice_trials = jsPsych.randomization.shuffle(
  ISIntervals_practice_trials,
);

/* Repeat the random sequence of SOAs to cater for the repetition of the
practice trials, which happens when the first round is insufficient. */
ISIntervals_practice_trials = new Array(SemPri_practice_stimuli.length)
  .fill(ISIntervals_practice_trials)
  .flat();

// Create a new array to hold the updated stimuli
var updated_SemPri_practice_stimuli = [];

// Run loop to create practice block. Names of some variables are expanded.
for (let i = 0; i < SemPri_practice_stimuli.length; i++) {
  updated_SemPri_practice_stimuli.push({
    task: "SemPri_practice",
    prime: SemPri_practice_stimuli[i].PW, // name changed to 'prime'
    target: SemPri_practice_stimuli[i].TW, // name changed to 'target'
    corr_rsp: SemPri_practice_stimuli[i].CR, // correct response
    ISInterval: ISIntervals_practice_trials[i],
  });
}

// Optionally, if you want to overwrite the original array:
SemPri_practice_stimuli = updated_SemPri_practice_stimuli;

/* Assemble practice trials timeline using some of the components 
created near the top of this script. */

var SemPri_practice_timeline = {
  timeline: [
    SemPri_fixation,
    prime,
    ISInterval,
    target_100ms,
    target,
    SemPri_feedback,
    SemPri_intertrial_interval,
  ],
  timeline_variables: SemPri_practice_stimuli,
  randomize_order: true,
  // restart trial count at the beginning of this timeline
  on_timeline_start: function () {
    TrialNum = 0;
  },
};
// Add to general timeline
language_vision_SemPri_TIMELINE.push(SemPri_practice_timeline);

// Overall feedback on all the initial practice trials
var SemPri_practice_debrief = {
  type: jsPsychHtmlKeyboardResponse,
  choices: [" "],
  trial_duration: 40000,

  stimulus: function () {
    var round1_result = SemPri_practice_result(1);

    // Tailor message to the results. One premature attempt is enough to
    // repeat, as registered, so the message uses the same verdict as the
    // repeat condition.
    if (round1_result.passed) {
      return (
        "<div>Practice completed. In the next part, no feedback will be " +
        "shown after your responses. Please press the space bar to begin.</div>"
      );

      // If results not so good, present them
    } else {
      var message =
        "<div><b>Results of the practice</b><br>" +
        "Your accuracy rate was " +
        Math.round(round1_result.accuracy_rate * 100) +
        "%.</div>";

      // Report any premature response attempts
      if (round1_result.premature_attempts === 1) {
        message =
          message +
          "<div>There was a response attempt before the lowercase word had been presented. " +
          "Please respond only when you have read the lowercase word and decided whether " +
          "it is abstract or concrete.</div>";
      } else if (round1_result.premature_attempts > 1) {
        message =
          message +
          "<div>There were " +
          round1_result.premature_attempts +
          " response attempts before the lowercase word had been presented. Please " +
          "respond only when you have read the lowercase word and decided whether " +
          "it is abstract or concrete.</div>";
      }

      // Display entire message
      return message + "<div>Please press the space bar to repeat the practice.</div>";
    }
  },
};
// Add to general timeline
language_vision_SemPri_TIMELINE.push(SemPri_practice_debrief);

// Prepare repeated instructions
var repeat_SemPri_instructions = {
  type: jsPsychHtmlKeyboardResponse,
  prompt: "<p>Press the space bar to begin.</p>",
  choices: [" "],
  trial_duration: 40000,
  stimulus:
    "<div>Please consider the instructions again. Each screen will first show a word in " +
    "<b>UPPER CASE</b> very briefly, followed by a word in <b>lower case</b>. Please " +
    "read both words, and classify the lowercase word as abstract or concrete." +
    "<br><br><button>F</button> = <b>Abstract</b> &mdash; concepts we cannot " +
    "normally experience physically (e.g., <i>wait</i>)" +
    "<br><button>J</button> = <b>Concrete</b> &mdash; concepts we can experience " +
    "more directly (e.g., <i>water</i>)" +
    "<br><br>Please try to respond as accurately and fast as possible.</div>",
};

/* One practice verdict is shared by feedback and the repeat branch. This keeps
   the implemented criterion identical to the preregistration: any premature
   response, or accuracy below 65%, requires a second practice round. */
function SemPri_practice_result(round) {
  var rows = jsPsych.data
    .get()
    .filter({ task: "SemPri_practice" })
    .values()
    .filter(function (d) {
      return (
        typeof d.accuracy === "string" &&
        (round === 1 ? d.practice_round == null : d.practice_round === round)
      );
    });
  var correct = rows.filter(function (d) {
    return d.accuracy === "correct";
  }).length;
  var premature_attempts = rows.filter(function (d) {
    return d.premature_response_attempts === "yes";
  }).length;
  var accuracy_rate = rows.length ? correct / rows.length : 0;

  return {
    accuracy_rate: accuracy_rate,
    premature_attempts: premature_attempts,
    passed:
      rows.length === SemPri_practice_stimuli.length &&
      premature_attempts === 0 &&
      accuracy_rate >= 0.65,
  };
}

function SemPri_should_repeat_practice() {
  return !window.AUTO_TEST && !SemPri_practice_result(1).passed;
}

/* Present repeated instructions if there were any premature 
response attempts or if accuracy rate < 65%. */
var conditional_repeat_SemPri_instructions = {
  timeline: [repeat_SemPri_instructions],
  conditional_function: function () {
    return SemPri_should_repeat_practice();
  },
};
// Add to general timeline
language_vision_SemPri_TIMELINE.push(conditional_repeat_SemPri_instructions);

/* Repeat practice trials if there were any premature 
response attempts or if accuracy rate < 65%. */
var SemPri_repeated_practice_trials = {
  timeline: [
    {
      timeline: [
        SemPri_fixation,
        prime,
        ISInterval,
        target_100ms,
        target,
        SemPri_feedback,
        SemPri_intertrial_interval,
      ],
      timeline_variables: SemPri_practice_stimuli,
      randomize_order: true,
      on_timeline_start: function () {
        TrialNum = 0;
      },
    },
  ],
  data: {
    practice_round: 2,
  },
  conditional_function: function () {
    return SemPri_should_repeat_practice();
  },
};
// Add to general timeline
language_vision_SemPri_TIMELINE.push(SemPri_repeated_practice_trials);

// Overall feedback on all the repeated practice trials
var SemPri_repeated_practice_debrief = {
  type: jsPsychHtmlKeyboardResponse,
  choices: [" "],
  trial_duration: 20000,

  stimulus: function () {
    var round2_result = SemPri_practice_result(2);

    // Tailor message introduction to the results
    if (round2_result.passed) {
      var message = "<div>Practice completed.</div>";
    } else {
      var message =
        "<div>The results were not so good. <br>Your accuracy rate was " +
        Math.round(round2_result.accuracy_rate * 100) +
        "%." +
        "</div>";
    }

    // Report any premature response attempts

    if (round2_result.premature_attempts === 1) {
      var message =
        message +
        "<div>There was a response attempt before the lowercase word had been presented. " +
        "Please respond only when you have read the lowercase word and decided whether " +
        "it is abstract or concrete.</div>";
    } else if (round2_result.premature_attempts > 1) {
      var message =
        message +
        "<div>There were " +
        round2_result.premature_attempts +
        " response attempts before the lowercase word had been presented. Please " +
        "respond only when you have read the lowercase word and decided whether " +
        "it is abstract or concrete.</div>";
    }

    // Finish message
    var message =
      message +
      "<div>In the next part, no feedback will be shown after your " +
      "responses. Please press the space bar to begin.</div>";

    // Display message
    return message + "<br>";
  },
};

// Show second-round feedback if practice trials were repeated
var conditional_SemPri_repeated_practice_debrief = {
  timeline: [SemPri_repeated_practice_debrief],
  conditional_function: function () {
    if (
      jsPsych.data
        .get()
        .filter({
          task: "SemPri_practice",
          practice_round: 2,
        })
        .count() >= 1
    ) {
      return true;
    } else {
      return false;
    }
  },
};
// Add to general timeline
language_vision_SemPri_TIMELINE.push(conditional_SemPri_repeated_practice_debrief);

/*************************************************************************

 After the practice trials, create stimuli for the main part of the task.

*************************************************************************/

/* Merge the two variables containing the main stimuli, which
were separated due to the 100 MB limit of files on GitHub. */
if (
  typeof SemPri_main_stimuli_1 === "undefined" ||
  typeof SemPri_main_stimuli_2 === "undefined"
) {
  throw new Error(
    "[SemPri] One or both stimulus files failed to load " +
      "(SemPri_main_stimuli_1=" +
      typeof SemPri_main_stimuli_1 +
      ", " +
      "SemPri_main_stimuli_2=" +
      typeof SemPri_main_stimuli_2 +
      "). " +
      "Re-upload the missing .js file(s) to Gorilla Resources.",
  );
}
var SemPri_main_stimuli = SemPri_main_stimuli_1.concat(SemPri_main_stimuli_2);

/* Assign participant to a unique (list, version) pair drawn from the
pre-generated matched counterbalancing. Each participant sees exactly
175 trials — one balanced sublist of the base 350-item stimulus list.
The assignment is recorded in the data so it can be joined back to
stimulus covariates (stored in semanticpriming_stimuli.rds) at analysis
time. */

var list_version_pairs = [].concat.apply(
  [],
  [
    ...new Set(
      SemPri_main_stimuli.map(function (el) {
        return el.list + "_" + el.version;
      }),
    ),
  ],
);

// Assign participant to a (list, version) cell.
//
// Priority order:
//   1. Window globals set by index-in-Gorilla.html (bootstrap parses
//      ?stimulus_assignment=listNNNN_vX from the Prolific Taskflow group URL
//      and writes _gorilla_stimulus_list / _gorilla_stimulus_version). This is
//      the live deployment path.
//   2. URL parameters ?stimulus_list=NNNN&stimulus_version=X — convenience path
//      for local development (e.g. index.html?stimulus_list=1724&stimulus_version=A).
//   3. Client-side random sampling — fallback for local runs and autotest mode
//      when neither of the above params is present.
var assigned_list, assigned_version;

if (
  typeof window["_gorilla_stimulus_list"] !== "undefined" &&
  typeof window["_gorilla_stimulus_version"] !== "undefined"
) {
  // Gorilla bootstrap path: values written by index-in-Gorilla.html.
  assigned_list = window["_gorilla_stimulus_list"];
  assigned_version = window["_gorilla_stimulus_version"];
} else if (
  // getURLVariable returns undefined (not null) when a parameter is absent, so
  // use != null to catch both null and undefined and otherwise fall through to
  // the random-sampling fallback below.
  jsPsych.data.getURLVariable("stimulus_list") != null &&
  jsPsych.data.getURLVariable("stimulus_version") != null
) {
  // Local development path: ?stimulus_list=NNNN&stimulus_version=X in the URL.
  assigned_list = parseInt(jsPsych.data.getURLVariable("stimulus_list"), 10);
  assigned_version = jsPsych.data.getURLVariable("stimulus_version");
} else {
  // Random-sampling fallback: used in autotest mode and any other case where
  // neither of the above params is present. No counterbalancing guarantee.
  var random_pair = jsPsych.randomization.sampleWithoutReplacement(
    list_version_pairs,
    1,
  )[0];
  assigned_list = parseInt(random_pair.split("_")[0], 10);
  assigned_version = random_pair.split("_")[1];
}

jsPsych.data.addProperties({
  stimulus_list: assigned_list,
  stimulus_version: assigned_version,
});

var SemPri_main_stimuli = SemPri_main_stimuli.filter(function (el) {
  return el.list === assigned_list && el.version === assigned_version;
});

/* Create a set of interstimulus intervals spanning 60–1,200 ms, evenly
spaced across as many steps as there are trials (175), then shuffled.
This pseudorandomisation ensures a broad, balanced SOA distribution
within each participant's single-block session. */

// Create range of SOAs
var ISIntervals_main_trials = makeArr(60, 1200, SemPri_main_stimuli.length);

// Randomise SOAs using Fisher-Yates shuffle
ISIntervals_main_trials = jsPsych.randomization.shuffle(ISIntervals_main_trials);

/* Shuffle the items once and pair each position with one shuffled SOA.
   randomize_order stays false on the main timeline, so the presentation order
   is this order and the ISI recorded on each row is the one presented. Trial
   numbers come from TrialNum. */
var final_SemPri_main_STIMULI = jsPsych.randomization
  .shuffle(SemPri_main_stimuli)
  .map(function (item, index) {
    return {
      task: "SemPri_main",
      prime: item.PW,
      target: item.TW,
      corr_rsp: item.CR,
      ISInterval: ISIntervals_main_trials[index],
    };
  });

/*********************************************

 Semantic priming MAIN block (single block)

*********************************************/

/* Assemble the main timeline using the components defined near the
top of this script. */

var SemPri_main_timeline = {
  timeline: [
    SemPri_fixation,
    prime,
    ISInterval,
    target_100ms,
    target,
    SemPri_conditional_instructional_manipulation_check,
    SemPri_intertrial_interval,
  ],
  timeline_variables: final_SemPri_main_STIMULI,
  randomize_order: false,
  // restart trial count at the beginning of this timeline
  on_timeline_start: function () {
    TrialNum = 0;
  },
};
// Add to general timeline
language_vision_SemPri_TIMELINE.push(SemPri_main_timeline);

// Transition to next task
language_vision_SemPri_TIMELINE.push(break_between_tasks);
