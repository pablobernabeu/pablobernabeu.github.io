/********************************************/
/** VISUAL ABILITY TASK (tag: 'VisAbil')   **/
/********************************************/

// Motion-coherence adaptive staircase using the ROK plugin in jsPsych
// (https://github.com/jspsych/jspsych-contrib/tree/main/packages/plugin-rok).
//
// Two-alternative forced-choice MOTION-DIRECTION discrimination: many
// non-oriented objects (circles) translate coherently either LEFT or RIGHT,
// and the participant judges the majority direction (F = left, J = right).
// Only MOTION carries the signal: orientation coherence is fixed at 0 and the
// stimulus shape (circle) has no left/right pointing cue, so the sole cue is
// coherent translation.
//
// The task uses TWO interleaved adaptive staircases (A and B) so that a
// split-half reliability estimate is available. Each staircase converges on a
// per-person motion-coherence THRESHOLD (lower coherence = better sensitivity).

/* =========================================================================
   STAIRCASE PARAMETERS
   ------------------------------------------------------------------------
   REGISTERED A-PRIORI VALUES: the constants below are fixed in advance from
   established adaptive-psychophysics practice (Pilly & Seitz, 2009; Watson &
   Pelli, 1983) and form part of the registered design; they are not tuned
   post hoc. Coherence is stored internally as a PROPORTION (0-1) and converted
   to the ROK plugin's 0-100 PERCENTAGE unit (parameter 'coherence_movement')
   only when it is passed to the trial.
   ========================================================================= */

// Starting coherence per staircase (registered a-priori, proportions 0-1).
var VisAbil_START_COH_A = 0.5; // staircase A starts moderately easy
var VisAbil_START_COH_B = 0.35; // staircase B starts a little harder

// 2-down / 1-up transformed rule (targets ~70.7% correct):
//   - decrease coherence (HARDER) after 2 consecutive CORRECT in a staircase
//   - increase coherence (EASIER) after 1 INCORRECT in a staircase
var VisAbil_N_DOWN = 2; // consecutive correct needed before a step down
var VisAbil_N_UP = 1; // incorrect responses needed before a step up

// Multiplicative step factors on coherence. The factor shrinks at successive
// reversals so the staircase brackets the threshold more finely over time.
// coh = coh / factor when going DOWN (harder); coh = coh * factor when UP.
var VisAbil_STEP_FACTORS = [1.5, 1.25, 1.12]; // registered a-priori

// Coherence bounds (proportions). Coherence is clamped to this range.
var VisAbil_COH_MIN = 0.02;
var VisAbil_COH_MAX = 0.95;

// Total number of main staircase trials (≈35 per staircase). The task ALWAYS
// terminates by this trial count, never by accuracy, so it always completes.
var VisAbil_TOTAL_TRIALS = 70;

// Threshold estimation: geometric mean of the coherence at reversal points,
// excluding this many initial reversals (warm-up). If a staircase yields
// fewer than VisAbil_MIN_REVERSALS reversals, fall back to the mean coherence
// over the last third of that staircase's trials.
var VisAbil_REVERSALS_TO_DROP = 2;
var VisAbil_MIN_REVERSALS = 4;

// Per-trial timing (registered a-priori, ms). The ROK plugin animates the moving
// objects for the whole response window (it has no separate stimulus-vs-
// response phase), so trial_duration doubles as the response cap. With a
// ~2000 ms cap, 70 trials fit comfortably in ~3-4 minutes. The motion is
// effectively viewed for the first ~500-1000 ms before most responses arrive.
var VisAbil_RESPONSE_DURATION = 2000; // response cap (was 6000 in old task)

// Movement speed (ROK units) and object count for the main staircase.
var VisAbil_MOVEMENT_SPEED = 5;
var VisAbil_NUMBER_OF_OOBS = 200;

/* =========================================================================
   RUNTIME STATE
   ------------------------------------------------------------------------
   Globals updated by each setup_trial (a jsPsychCallFunction) and READ by the
   following rok_trial through dynamic (function) parameters. Writing the state
   in the preceding call-function avoids dynamic-parameter evaluation-order
   problems within a single rok trial object.
   ========================================================================= */

// Per-staircase mutable state.
var VisAbil_staircases = {
  A: {
    coherence: VisAbil_START_COH_A, // current coherence (proportion)
    n_correct_run: 0, // consecutive correct since last step
    last_step_direction: 0, // -1 = last step harder, +1 = last step easier, 0 = none yet
    reversal_count: 0, // total reversals so far
    reversal_coherences: [], // coherence at each reversal point
    trial_coherences: [], // coherence presented on every trial (in order)
  },
  B: {
    coherence: VisAbil_START_COH_B,
    n_correct_run: 0,
    last_step_direction: 0,
    reversal_count: 0,
    reversal_coherences: [],
    trial_coherences: [],
  },
};

// Counter of completed main trials and the order in which staircases are run.
var VisAbil_main_trial_number = 0;
var VisAbil_staircase_order = []; // built once, pseudo-random fixed interleave

// Per-trial values written by setup_trial and read by the rok_trial.
var VisAbil_current_staircase = "A";
var VisAbil_current_coherence = VisAbil_START_COH_A; // proportion
var VisAbil_current_direction = "right"; // 'left' | 'right'
var VisAbil_current_movement_degrees = 0; // 0 = right, 180 = left
var VisAbil_current_correct_key = "j"; // 'f' (left) | 'j' (right)

// Build a fixed pseudo-random interleave of the two staircases, balanced so
// that each staircase gets exactly half of the trials.
function VisAbil_build_staircase_order() {
  var order = [];
  var half = VisAbil_TOTAL_TRIALS / 2;
  var i;
  for (i = 0; i < half; i++) {
    order.push("A");
    order.push("B");
  }
  // Shuffle once for a fixed pseudo-random (but balanced) interleave.
  return jsPsych.randomization.shuffle(order);
}

// Clamp a coherence value (proportion) to the allowed range.
function VisAbil_clamp_coherence(coh) {
  if (coh < VisAbil_COH_MIN) return VisAbil_COH_MIN;
  if (coh > VisAbil_COH_MAX) return VisAbil_COH_MAX;
  return coh;
}

// Geometric mean of an array of positive numbers.
function VisAbil_geometric_mean(values) {
  if (!values || values.length === 0) return null;
  var sum_log = 0;
  var i;
  for (i = 0; i < values.length; i++) {
    sum_log += Math.log(values[i]);
  }
  return Math.exp(sum_log / values.length);
}

// Arithmetic mean of an array of numbers.
function VisAbil_arithmetic_mean(values) {
  if (!values || values.length === 0) return null;
  var total = 0;
  var i;
  for (i = 0; i < values.length; i++) {
    total += values[i];
  }
  return total / values.length;
}

// Compute the threshold for one staircase per the registered rule.
function VisAbil_compute_threshold(state) {
  var reversals = state.reversal_coherences;
  if (reversals.length >= VisAbil_MIN_REVERSALS) {
    // Geometric mean of reversal coherences, excluding the first few.
    var kept = reversals.slice(VisAbil_REVERSALS_TO_DROP);
    if (kept.length === 0) kept = reversals; // safety: keep all if slice empties
    return VisAbil_geometric_mean(kept);
  }
  // Fallback: mean coherence over the last third of this staircase's trials.
  var trials = state.trial_coherences;
  if (trials.length === 0) return null;
  var third = Math.max(1, Math.round(trials.length / 3));
  var last_third = trials.slice(trials.length - third);
  return VisAbil_arithmetic_mean(last_third);
}

/* =========================================================================
   PRACTICE / INSTRUCTIONS / DEBRIEF
   ========================================================================= */

// Instructions
var VisAbil_instructions = {
  type: jsPsychHtmlKeyboardResponse,
  prompt: "<p>Press the space bar to begin.</p>",
  choices: [" "],
  trial_duration: 40000,
  stimulus:
    "<div>Welcome to the next task. Each screen will show many small dots moving " +
    "across the screen. Most of the dots will drift together in one direction, " +
    "while the rest move randomly. Your task is to judge whether <i>most</i> of " +
    "the dots are moving to the <b>left</b> or to the <b>right</b>." +
    "<br><br><button>F</button> = most dots move <b>left</b>" +
    "<br><button>J</button> = most dots move <b>right</b>" +
    "<br><br>The task gets gradually harder or easier depending on your answers, " +
    "so some trials will be tricky. Just give your best guess on every trial. " +
    "Please try to respond as accurately and fast as possible. Next, " +
    "you can practice with two easy trials.</div>",
};

// Practice trial 1: clearly LEFT motion (easy, high coherence).
var VisAbil_practice_trial_1 = {
  type: jsPsychRok,
  data: {
    task: "VisAbil_practice",
    trial: 1,
  },
  choices: ["f", "j"],
  correct_choice: ["f"], // most dots move left -> F
  trial_duration: VisAbil_RESPONSE_DURATION,
  stimulus_type: 1, // circles (non-oriented: no left/right pointing cue)
  oob_color: "white",
  coherent_movement_direction: 180, // 180 deg = movement to the LEFT
  coherence_movement: 90, // % moving left (high = easy)
  coherent_orientation: 0,
  coherence_orientation: 0, // no orientation signal
  coherence_orientation_opposite: 0,
  movement_speed: VisAbil_MOVEMENT_SPEED,
  number_of_oobs: VisAbil_NUMBER_OF_OOBS,
  random_movement_type: 1,
  random_orientation_type: 1,
};

var VisAbil_practice_trial_1_feedback = {
  type: jsPsychHtmlKeyboardResponse,
  data: {
    task: "VisAbil_practice",
    trial: 1,
  },
  stimulus: function () {
    var last = jsPsych.data.getLastTrialData().values()[0];
    if (!last.key_press && last.key_press !== 0) {
      return "<p><red-button> 0 </red-button></p>";
    } else if (last.correct === true) {
      return "<p><green-button> &check; </green-button></p>";
    } else {
      return "<p><red-button> &#x2718; </red-button></p>";
    }
  },
  choices: "NO_KEYS",
  trial_duration: 800,
};

// Practice trial 2: clearly RIGHT motion (easy, high coherence).
var VisAbil_practice_trial_2 = {
  type: jsPsychRok,
  data: {
    task: "VisAbil_practice",
    trial: 2,
  },
  choices: ["f", "j"],
  correct_choice: ["j"], // most dots move right -> J
  trial_duration: VisAbil_RESPONSE_DURATION,
  stimulus_type: 1, // circles
  oob_color: "white",
  coherent_movement_direction: 0, // 0 deg = movement to the RIGHT
  coherence_movement: 85, // % moving right (high = easy)
  coherent_orientation: 0,
  coherence_orientation: 0, // no orientation signal
  coherence_orientation_opposite: 0,
  movement_speed: VisAbil_MOVEMENT_SPEED,
  number_of_oobs: VisAbil_NUMBER_OF_OOBS,
  random_movement_type: 1,
  random_orientation_type: 1,
};

var VisAbil_practice_trial_2_feedback = {
  type: jsPsychHtmlKeyboardResponse,
  data: {
    task: "VisAbil_practice",
    trial: 2,
  },
  stimulus: function () {
    var last = jsPsych.data.getLastTrialData().values()[0];
    if (!last.key_press && last.key_press !== 0) {
      return "<p><red-button> 0 </red-button></p>";
    } else if (last.correct === true) {
      return "<p><green-button> &check; </green-button></p>";
    } else {
      return "<p><red-button> &#x2718; </red-button></p>";
    }
  },
  choices: "NO_KEYS",
  trial_duration: 800,
};

// Assemble practice trials timeline
var VisAbil_practice_timeline = {
  timeline: [
    VisAbil_practice_trial_1,
    VisAbil_practice_trial_1_feedback,
    VisAbil_practice_trial_2,
    VisAbil_practice_trial_2_feedback,
  ],
};

// Overall feedback on all the initial practice trials
var VisAbil_practice_debrief = {
  type: jsPsychHtmlKeyboardResponse,
  choices: [" "],
  trial_duration: 40000,

  stimulus: function () {
    // Tailor message to the results. If results good, keep message short.
    if (
      jsPsych.data.get().filter({ task: "VisAbil_practice", correct: true }).count() ==
      2
    ) {
      return "<div>Practice completed. Well done! Please press the space bar to begin.</div><br>";

      // If results not so good, show them
    } else if (
      jsPsych.data.get().filter({ task: "VisAbil_practice", correct: true }).count() ==
      1
    ) {
      return (
        "<div><b>Results of the practice</b><br>" +
        "You responded correctly to one trial. Please press the space bar to repeat the practice." +
        "</div>"
      );
    } else if (
      jsPsych.data.get().filter({ task: "VisAbil_practice", correct: true }).count() ==
      0
    ) {
      return (
        "<div><b>Results of the practice</b><br>" +
        "There were no correct responses. Please press the space bar to repeat the practice." +
        "</div>"
      );
    }
  },
};

/* Prepare repeated instructions */
var repeat_VisAbil_instructions = {
  type: jsPsychHtmlKeyboardResponse,
  prompt: "<p>Press the space bar to begin.</p>",
  choices: [" "],
  trial_duration: 40000,
  stimulus:
    "<div>Please consider the instructions again. Each screen will show many small " +
    "dots moving across the screen. Most of the dots will drift together in one " +
    "direction, while the rest move randomly. Your task is to judge whether " +
    "<i>most</i> of the dots are moving to the <b>left</b> or to the <b>right</b>." +
    "<br><br><button>F</button> = most dots move <b>left</b>" +
    "<br><button>J</button> = most dots move <b>right</b>" +
    "<br><br>Please try to respond as accurately and fast as " +
    "possible.</div>",
};

// Repeat instructions, practice and debrief if accuracy rate < 100%

var conditional_repeat_VisAbil_instructions = {
  timeline: [repeat_VisAbil_instructions],
  conditional_function: function () {
    if (
      jsPsych.data
        .get()
        .filter({
          task: "VisAbil_practice",
          correct: true,
        })
        .count() < 2
    ) {
      return true;
    } else {
      return false;
    }
  },
};

var VisAbil_repeated_practice_trials = {
  timeline: [VisAbil_practice_timeline],
  data: { practice_round: 2 },
  conditional_function: function () {
    if (
      jsPsych.data
        .get()
        .filter({
          task: "VisAbil_practice",
          correct: true,
        })
        .count() < 2
    ) {
      return true;
    } else {
      return false;
    }
  },
};

var VisAbil_repeated_practice_debrief = {
  type: jsPsychHtmlKeyboardResponse,
  choices: [" "],
  trial_duration: 40000,

  stimulus: function () {
    // Tailor message to the results. If
    // results good, keep message short.
    if (
      jsPsych.data
        .get()
        .filter({
          task: "VisAbil_practice",
          practice_round: 2,
          correct: true,
        })
        .count() == 2
    ) {
      return "<div>Practice completed. Well done! Please press the space bar to begin.</div><br>";

      // If results not so good, show them
    } else if (
      jsPsych.data
        .get()
        .filter({
          task: "VisAbil_practice",
          practice_round: 2,
          correct: true,
        })
        .count() == 1
    ) {
      return (
        "<div><b>Results of the practice</b><br>You responded correctly to one trial. " +
        "Please press the space bar to begin.</div>"
      );
    } else if (
      jsPsych.data
        .get()
        .filter({
          task: "VisAbil_practice",
          practice_round: 2,
          correct: true,
        })
        .count() == 0
    ) {
      return (
        "<div><b>Results of the practice</b><br> There were no correct responses. " +
        "Please pay attention in the next part. Press the space bar to begin.</div>"
      );
    }
  },
};

// Show second-round feedback if practice trials were repeated
var conditional_VisAbil_repeated_practice_debrief = {
  timeline: [VisAbil_repeated_practice_debrief],
  conditional_function: function () {
    if (
      jsPsych.data
        .get()
        .filter({
          task: "VisAbil_practice",
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

/* =========================================================================
   MAIN TRIALS: interleaved two-staircase loop
   ------------------------------------------------------------------------
   The main block is a LOOPING timeline whose body is
   [setup_trial, rok_trial, fixation/ITI, conditional IMC]. The loop_function
   returns true until VisAbil_TOTAL_TRIALS trials have completed.
   ========================================================================= */

// Reset all runtime state at the start of the main block (also rebuilds the
// fixed pseudo-random staircase order).
var VisAbil_main_reset = {
  type: jsPsychCallFunction,
  func: function () {
    VisAbil_main_trial_number = 0;
    VisAbil_staircases.A.coherence = VisAbil_START_COH_A;
    VisAbil_staircases.A.n_correct_run = 0;
    VisAbil_staircases.A.last_step_direction = 0;
    VisAbil_staircases.A.reversal_count = 0;
    VisAbil_staircases.A.reversal_coherences = [];
    VisAbil_staircases.A.trial_coherences = [];
    VisAbil_staircases.B.coherence = VisAbil_START_COH_B;
    VisAbil_staircases.B.n_correct_run = 0;
    VisAbil_staircases.B.last_step_direction = 0;
    VisAbil_staircases.B.reversal_count = 0;
    VisAbil_staircases.B.reversal_coherences = [];
    VisAbil_staircases.B.trial_coherences = [];
    VisAbil_staircase_order = VisAbil_build_staircase_order();
  },
};

// setup_trial: select the next staircase, randomise the coherent direction
// ~50/50, and write the current coherence + correct key + direction into the
// runtime globals that the rok_trial reads through dynamic parameters.
var VisAbil_setup_trial = {
  type: jsPsychCallFunction,
  func: function () {
    // Pick the staircase for this trial from the fixed interleave order.
    VisAbil_current_staircase =
      VisAbil_staircase_order[VisAbil_main_trial_number] || "A";
    var state = VisAbil_staircases[VisAbil_current_staircase];

    // Current coherence for this staircase (clamped just in case).
    VisAbil_current_coherence = VisAbil_clamp_coherence(state.coherence);
    state.coherence = VisAbil_current_coherence;

    // Randomise the coherent direction ~50/50 each trial.
    if (Math.random() < 0.5) {
      VisAbil_current_direction = "left";
      VisAbil_current_movement_degrees = 180; // 180 deg = left
      VisAbil_current_correct_key = "f"; // F = left
    } else {
      VisAbil_current_direction = "right";
      VisAbil_current_movement_degrees = 0; // 0 deg = right
      VisAbil_current_correct_key = "j"; // J = right
    }
  },
};

// rok_trial: reads the runtime globals through dynamic (function) parameters
// for coherence_movement, coherent_movement_direction and correct_choice.
// Scoring, stepping and reversal detection happen in on_finish, where the
// chosen staircase is updated.
var VisAbil_rok_trial = {
  type: jsPsychRok,
  data: function () {
    // Static-at-onset fields; the response/correct/reversal fields are filled
    // in on_finish below.
    return {
      task: "VisAbil_main",
      staircase: VisAbil_current_staircase,
      coherence: VisAbil_current_coherence, // proportion (0-1)
      motion_direction: VisAbil_current_direction, // 'left' | 'right'
    };
  },
  choices: ["f", "j"],
  correct_choice: function () {
    return [VisAbil_current_correct_key];
  },
  trial_duration: VisAbil_RESPONSE_DURATION,
  stimulus_type: 1, // circles (non-oriented: only motion carries the signal)
  oob_color: "white",
  coherent_movement_direction: function () {
    return VisAbil_current_movement_degrees; // 0 = right, 180 = left
  },
  coherence_movement: function () {
    return VisAbil_current_coherence * 100; // proportion -> 0-100 percentage
  },
  coherent_orientation: 0,
  coherence_orientation: 0, // no orientation signal whatsoever
  coherence_orientation_opposite: 0,
  movement_speed: VisAbil_MOVEMENT_SPEED,
  number_of_oobs: VisAbil_NUMBER_OF_OOBS,
  random_movement_type: 1,
  random_orientation_type: 1,

  on_finish: function (data) {
    var state = VisAbil_staircases[VisAbil_current_staircase];

    // The ROK plugin computes `correct` (key_press vs correct_choice). Derive
    // a robust boolean (a missing response counts as incorrect).
    var is_correct = data.correct === true;

    // Normalise the logged fields (overwrite the plugin's 0-100
    // coherence_movement echo with our proportion-based fields).
    data.coherence = VisAbil_current_coherence; // proportion
    data.motion_direction = VisAbil_current_direction;
    data.staircase = VisAbil_current_staircase;
    data.response = data.key_press; // 'f' | 'j' | null
    data.correct = is_correct;

    // Record the coherence presented on this staircase trial (for the
    // last-third fallback threshold).
    state.trial_coherences.push(VisAbil_current_coherence);

    // Pick the multiplicative step factor for the current reversal stage.
    var factor_index = Math.min(state.reversal_count, VisAbil_STEP_FACTORS.length - 1);
    var factor = VisAbil_STEP_FACTORS[factor_index];

    // Apply the 2-down / 1-up transformed rule.
    var step_direction = 0; // -1 = harder (down), +1 = easier (up)
    if (is_correct) {
      state.n_correct_run += 1;
      if (state.n_correct_run >= VisAbil_N_DOWN) {
        // 2 consecutive correct -> make it HARDER (decrease coherence).
        state.coherence = VisAbil_clamp_coherence(state.coherence / factor);
        state.n_correct_run = 0;
        step_direction = -1;
      }
    } else {
      // 1 incorrect -> make it EASIER (increase coherence).
      state.coherence = VisAbil_clamp_coherence(state.coherence * factor);
      state.n_correct_run = 0;
      step_direction = +1;
    }

    // Reversal detection: a reversal occurs when the step direction flips
    // relative to the previous (non-zero) step direction.
    var is_reversal = false;
    if (step_direction !== 0) {
      if (
        state.last_step_direction !== 0 &&
        step_direction !== state.last_step_direction
      ) {
        is_reversal = true;
        state.reversal_count += 1;
        // Record the coherence at which the reversal occurred (the coherence
        // that was just presented, i.e. before this step was applied).
        state.reversal_coherences.push(VisAbil_current_coherence);
      }
      state.last_step_direction = step_direction;
    }
    data.reversal = is_reversal;

    // Advance the global main-trial counter and accuracy rate (the latter is
    // used by the conditional instructional-manipulation check below).
    VisAbil_main_trial_number += 1;
    data.trial = VisAbil_main_trial_number;

    var VisAbil_correct_trials = jsPsych.data
      .get()
      .filter({ task: "VisAbil_main", correct: true })
      .count();
    // Attention-check rows carry the same task tag (so the sanity check can
    // place them) but no `correct` field; counting them would deflate the
    // running accuracy each time a check fires.
    var VisAbil_total_trials = jsPsych.data
      .get()
      .filter({ task: "VisAbil_main" })
      .filterCustom(function (row) {
        return typeof row.correct === "boolean";
      })
      .count();
    data.main_accuracy_rate = VisAbil_correct_trials / VisAbil_total_trials;
  },
};

// Fixation cross with a varying duration to boost attention (style matches
// the other tasks in this experiment).
var VisAbil_fixation = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: "+",
  choices: "NO_KEYS",
  response_ends_trial: false,
  trial_duration: function () {
    return jsPsych.randomization.sampleWithoutReplacement(
      [400, 450, 500, 550, 600],
      1,
    )[0];
  },
  css_classes: ["stimulus"],
};

// Jittered intertrial interval.
var VisAbil_intertrial_interval = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: "",
  choices: "NO_KEYS",
  response_ends_trial: false,
  trial_duration: function () {
    return jsPsych.randomization.sampleWithoutReplacement(
      [300, 350, 400, 450, 500],
      1,
    )[0];
  },
};

// Instructional manipulation check, interleaved at two fixed points in the
// 70-trial loop. It fires only if the previous trial was incorrect and the
// running accuracy is below 60% (same policy as the other tasks).
var VisAbil_conditional_instructional_manipulation_check = {
  timeline: [random_number, instructional_manipulation_check],
  conditional_function: function () {
    // This node sits after the intertrial screen, so getLastTrialData()
    // would return the ITI row (which carries no `correct` field) and the
    // check could never fire. Read the last VisAbil response row instead.
    var last = jsPsych.data.get().filter({ task: "VisAbil_main" }).last(1).values()[0];
    if (!last) return false;
    // Only at fixed checkpoints (after trials 25 and 50).
    if (VisAbil_main_trial_number !== 25 && VisAbil_main_trial_number !== 50) {
      return false;
    }
    if (last.correct === false && last.main_accuracy_rate < 0.6) {
      return true;
    }
    return false;
  },
};

// Main staircase loop body. Repeats until VisAbil_TOTAL_TRIALS trials done.
var VisAbil_main_loop = {
  timeline: [
    VisAbil_fixation,
    VisAbil_setup_trial,
    VisAbil_rok_trial,
    VisAbil_intertrial_interval,
    VisAbil_conditional_instructional_manipulation_check,
  ],
  loop_function: function () {
    // Continue looping until the full trial count is reached. Termination is
    // ALWAYS by trial count, never by accuracy, so the task always completes.
    return VisAbil_main_trial_number < VisAbil_TOTAL_TRIALS;
  },
};

// Final call-function trial: compute the thresholds and add them as data
// properties on every row of the dataset.
var VisAbil_compute_thresholds = {
  type: jsPsychCallFunction,
  func: function () {
    var threshold_A = VisAbil_compute_threshold(VisAbil_staircases.A);
    var threshold_B = VisAbil_compute_threshold(VisAbil_staircases.B);

    var valid = [];
    if (threshold_A != null) valid.push(threshold_A);
    if (threshold_B != null) valid.push(threshold_B);
    var threshold_overall = valid.length > 0 ? VisAbil_arithmetic_mean(valid) : null;

    jsPsych.data.addProperties({
      VisAbil_threshold: threshold_overall, // mean of the two (lower = better)
      VisAbil_threshold_A: threshold_A,
      VisAbil_threshold_B: threshold_B,
      VisAbil_reversals_A: VisAbil_staircases.A.reversal_count,
      VisAbil_reversals_B: VisAbil_staircases.B.reversal_count,
    });
  },
};

// Assemble main trials timeline
var VisAbil_main_timeline = {
  timeline: [VisAbil_main_reset, VisAbil_main_loop, VisAbil_compute_thresholds],
};

// Assemble complete task
var VisAbil_timeline = {
  timeline: [
    VisAbil_instructions,
    VisAbil_practice_timeline,
    VisAbil_practice_debrief,
    conditional_repeat_VisAbil_instructions,
    VisAbil_repeated_practice_trials,
    conditional_VisAbil_repeated_practice_debrief,
    VisAbil_main_timeline,
  ],
};
// Push task to general timeline
language_vision_SemPri_TIMELINE.push(VisAbil_timeline);
