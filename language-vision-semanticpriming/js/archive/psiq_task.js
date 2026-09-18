/* ARCHIVED — NOT LOADED. Removed from the registered battery; retained for reference only. See ../../README.md (File layout) for why. */
/****************************************************************/
/** PLYMOUTH SENSORY IMAGERY QUESTIONNAIRE (tag: 'PsiQ')       **/
/** 21-item short form (Andrade et al., 2014)                  **/
/****************************************************************/

/*
The Psi-Q is presented one item per screen using jsPsychHtmlButtonResponse.
Items are grouped by modality in standard order (Vision → Sound →
Smell → Taste → Touch → Body → Feeling); items within each modality
are randomised at runtime.

Rating scale: 0–10
  0 = "No image at all"
  10 = "As vivid as real life"

Each trial logs: task, modality, item name, rating, and RT.
No time limit is imposed on individual items.
*/

// ────────────────────────────────────────────────────────────────
// INSTRUCTIONS
// ────────────────────────────────────────────────────────────────

var PsiQ_instructions = {
  type: jsPsychHtmlKeyboardResponse,
  prompt: "<p>Press the space bar to begin.</p>",
  choices: [" "],
  trial_duration: 40000,
  stimulus: [
    "<div><b>Imagery Survey</b>" +
      "<br><br>In the following screens you will be asked to form " +
      "mental images of various experiences (sights, sounds, smells, " +
      "etc.)." +
      "<br><br>For each scenario, please try to imagine the " +
      "experience as vividly as you can, and then rate <b>how " +
      "clear and vivid</b> your image is by clicking a number " +
      "from <b>0</b> to <b>10</b>." +
      "<br><br><b>0</b> = No image at all" +
      "<br><b>10</b> = As vivid as real life" +
      "<br><br>There are no right or wrong answers.</div>",
  ],
};

// ────────────────────────────────────────────────────────────────
// HELPERS: group items by modality, randomise within modality
// ────────────────────────────────────────────────────────────────

var PsiQ_modality_order = [
  "vision",
  "sound",
  "smell",
  "taste",
  "touch",
  "body",
  "feeling",
];

var PsiQ_modality_labels = {
  vision: "Vision",
  sound: "Sound",
  smell: "Smell",
  taste: "Taste",
  touch: "Touch",
  body: "Body Sensation",
  feeling: "Emotional Feeling",
};

// Build ordered & within-modality-randomised item list at load time
var PsiQ_ordered_items = [];
PsiQ_modality_order.forEach(function (mod) {
  var modItems = PsiQ_items.filter(function (item) {
    return item.modality === mod;
  });
  PsiQ_ordered_items = PsiQ_ordered_items.concat(
    jsPsych.randomization.shuffle(modItems),
  );
});

// ────────────────────────────────────────────────────────────────
// MODALITY HEADER (shown before each modality block)
// ────────────────────────────────────────────────────────────────

var PsiQ_current_modality = "";

var PsiQ_modality_header = {
  type: jsPsychHtmlKeyboardResponse,
  choices: [" "],
  trial_duration: 40000,
  stimulus: function () {
    var mod = jsPsych.timelineVariable("modality");
    var label = PsiQ_modality_labels[mod];
    return (
      "<div style='text-align:center;'>" +
      "<p style='font-size:14px; color:#888;'>Section</p>" +
      "<p style='font-size:26px; font-weight:bold;'>" +
      label +
      "</p>" +
      "<p>For each item, imagine the experience and rate its vividness.</p>" +
      "<p style='font-size:16px; color:#aaa;'>Press the space bar to continue.</p>" +
      "</div>"
    );
  },
  conditional_function: function () {
    var mod = jsPsych.timelineVariable("modality");
    if (mod !== PsiQ_current_modality) {
      PsiQ_current_modality = mod;
      return true; // show header
    }
    return false; // skip header (same modality)
  },
};

// ────────────────────────────────────────────────────────────────
// INDIVIDUAL ITEM TRIAL
// ────────────────────────────────────────────────────────────────

var PsiQ_trial_number = 0;
var PsiQ_total_items = PsiQ_ordered_items.length; // 21

var PsiQ_item_trial = {
  type: jsPsychHtmlButtonResponse,
  stimulus: function () {
    var mod = jsPsych.timelineVariable("modality");
    var label = PsiQ_modality_labels[mod];
    var prompt_text = jsPsych.timelineVariable("prompt");

    return (
      '<div style="text-align:center; max-width:650px; margin:0 auto;">' +
      '<p style="font-size:14px; color:#888; margin-bottom:4px;">' +
      label +
      "</p>" +
      '<p style="font-size:22px; line-height:1.6;">' +
      prompt_text +
      "</p>" +
      '<div style="display:flex; justify-content:space-between; ' +
      'max-width:560px; margin:16px auto 0;">' +
      '<span style="font-size:13px; color:#aaa;">No image<br>at all</span>' +
      '<span style="font-size:13px; color:#aaa;">As vivid as<br>real life</span>' +
      "</div>" +
      "</div>"
    );
  },
  choices: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  button_html: '<button class="psiq-scale-btn">%choice%</button>',
  data: {
    task: "PsiQ",
    modality: jsPsych.timelineVariable("modality"),
    item_name: jsPsych.timelineVariable("name"),
  },
  on_finish: function (data) {
    PsiQ_trial_number++;
    data.trial = PsiQ_trial_number;
    // response is the button index (0–10), which equals the rating
    data.rating = data.response;
  },
};

// Small gap between items
var PsiQ_inter_item = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: "",
  choices: "NO_KEYS",
  trial_duration: 400,
};

// ────────────────────────────────────────────────────────────────
// ASSEMBLE PROCEDURE
// ────────────────────────────────────────────────────────────────

var PsiQ_procedure = {
  timeline: [PsiQ_modality_header, PsiQ_item_trial, PsiQ_inter_item],
  timeline_variables: PsiQ_ordered_items,
  // No randomize_order here: items are pre-ordered by modality
  // with within-modality randomisation already applied above
};

// ────────────────────────────────────────────────────────────────
// ASSEMBLE COMPLETE TASK & PUSH TO GENERAL TIMELINE
// ────────────────────────────────────────────────────────────────

var PsiQ_timeline = {
  timeline: [PsiQ_instructions, PsiQ_procedure],
};

// Break before Psi-Q (reuses existing break_between_tasks)
language_vision_SemPri_TIMELINE.push(break_between_tasks);
language_vision_SemPri_TIMELINE.push(PsiQ_timeline);
