

// VISUAL ABILITY TASK


// PRACTICE TRIALS

// Instructions
var visual_ability_instructions = {
  type: jsPsychHtmlKeyboardResponse,
  prompt: "<br><p style='font-size:20px;'>Press the space bar to begin the practice.</p>",
  choices: [' '],
  trial_duration: 40000,
  stimulus: [
    "<div style = 'max-width:700px; text-align:left; font-size:20px; line-height:2.1;'>" +
    'Welcome to the next task. Each screen will show many icons of birds. Your task is ' +
    'to identify the <b>orientation</b> of <i>most</i> birds (that is, where their ' +
    'heads are pointing): either left or right. Please do <i>not</i> pay attention ' +
    'to the direction of the movement. Please press <button>F</button> if most birds ' +
    'are orientated to the left, or press <button>J</button> if most are orientated ' +
    'to the right. Please try to respond accurately and as fast as possible. Also ' +
    'important: if you do not know the correct response, press the space bar. Next, ' +
    'you can practice with two easy trials.</div>'
  ]
};

// Primary orientations of the practice trials: left, right

var visual_ability_practice_trial_1 = {
    type:jsPsychRok,
    data: { 
      visual_ability_part: 'practice',
      visual_ability_trial: 1
      },
    choices: ['f', 'j', ' '],
    correct_choice: ['f'],
    trial_duration: 6000,
    stimulus_type: 3,  // origami birds
    oob_color: 'brown',
    coherent_orientation: 180,  // orientation to the left
    coherent_movement_direction: 210,  // movement down
    coherence_orientation: 95,  // % orientated left
    coherence_orientation_opposite: 2,  // % orientated right (rest random)
    movement_speed: 6,
    random_movement_type: 1,
    random_orientation_type: 1
};

var visual_ability_practice_trial_1_feedback = {
  type: jsPsychHtmlKeyboardResponse,
    data: { 
      visual_ability_part: 'practice',
      visual_ability_trial: 1
      },
  stimulus: function() {
    var last_trial_accuracy =
      jsPsych.data.getLastTrialData().values()[0].correct;
    if(jsPsych.data.getLastTrialData().values()[0].key_press == '') {
      return '<p><red-button> 0 </red-button></p>'
    } else if(last_trial_accuracy == true) {
      return '<p><green-button> &check; </green-button></p>'
    } else if(last_trial_accuracy == false) {
      return '<p><red-button> &#x2718; </red-button></p>'
    }
  },
  choices: 'NO_KEYS',
  trial_duration: 800
};

var visual_ability_practice_trial_2 = {
    type:jsPsychRok,
    data: { 
      visual_ability_part: 'practice',
      visual_ability_trial: 2
      },
    choices: ['f', 'j', ' '],
    correct_choice: ['j'],
    trial_duration: 6000,
    stimulus_type: 3,  // origami birds
    oob_color: 'red',
    coherent_orientation: 0,  // orientation to the right
    coherent_movement_direction: 120,  // movement up
    coherence_orientation: 87,  // % orientated right
    coherence_orientation_opposite: 10,  // % orientated left (rest random)
    movement_speed: 10,
    random_movement_type: 1,
    random_orientation_type: 1
};

var visual_ability_practice_trial_2_feedback = {
  type: jsPsychHtmlKeyboardResponse,
    data: { 
      visual_ability_part: 'practice',
      visual_ability_trial: 2
      },
  stimulus: function() {
    var last_trial_accuracy =
      jsPsych.data.getLastTrialData().values()[0].correct;
    if(jsPsych.data.getLastTrialData().values()[0].key_press == '') {
      return '<p><red-button> 0 </red-button></p>'
    } else if(last_trial_accuracy == true) {
      return '<p><green-button> &check; </green-button></p>'
    } else if(last_trial_accuracy == false) {
      return '<p><red-button> &#x2718; </red-button></p>'
    }
  },
  choices: 'NO_KEYS',
  trial_duration: 800
};

// Assemble practice trials timeline
var visual_ability_practice_timeline = {
  timeline: [ visual_ability_practice_trial_1,
  visual_ability_practice_trial_1_feedback,
  visual_ability_practice_trial_2,
  visual_ability_practice_trial_2_feedback ]
};

// Overall feedback on all the initial practice trials
var visual_ability_practice_debrief = {
  type: jsPsychHtmlKeyboardResponse,
  choices: [' '],
  trial_duration: 40000,
  
  stimulus: function() {
    
    // Tailor message to the results. If results good, keep message short.
    if(jsPsych.data.get().filter({visual_ability_part:'practice', correct:true}).count() == 2) {
      return "<div style='text-align:left; font-size:20px;'>Practice completed. Well done! " +
        "Please press the space bar to begin the task.</div><br>"
        
    // If results not so good, show them
    } else if(jsPsych.data.get().filter({visual_ability_part:'practice', correct:true}).count() == 1) {
      return "<div style='text-align:left; font-size:20px;'><p><b>Results of the practice</b></p>" +
        "<p>You responded correctly to one trial. Please press the space bar to repeat the practice." +
        "</p></div>"
        
    } else if(jsPsych.data.get().filter({visual_ability_part:'practice', correct:true}).count() == 0) {
      return "<div style='text-align:left; font-size:20px;'><p><b>Results of the practice</b></p>" +
        "<p>There were no correct responses. Please press the space bar to repeat the practice." +
        "</p></div>"
    }
    }
  };

/* Prepare repeated instructions */
var repeat_visual_ability_instructions = {
  type: jsPsychHtmlKeyboardResponse,
  prompt: "<br><p style='font-size:20px;'>Press the space bar to begin the practice.</p>",
  choices: [' '],
  trial_duration: 40000,
  stimulus: [
    "<div style = 'max-width:700px; text-align:left; font-size:20px; line-height:2.1;'>" +
    'Please consider the instructions again. Each screen will show many icons of birds. ' +
    'Your task is to identify the <b>orientation</b> of <i>most</i> birds (that is, ' +
    'where their heads are pointing): either left or right. Please do <i>not</i> pay ' +
    'attention to the direction of the movement. Please press <button>F</button> if ' +
    'most birds are orientated to the left, or press <button>J</button> if most are ' +
    'orientated to the right. Please try to respond accurately and as fast as ' +
    'possible. Also important: if you do not know the correct response, press the ' +
    'space bar. Next, you can practice with two easy trials.</div>'
  ]
};

// Repeat instructions, practice and debrief if accuracy rate < 100%

var conditional_repeat_visual_ability_instructions = {
  timeline: [repeat_visual_ability_instructions],
  conditional_function: function() {
    if(jsPsych.data.get().filter({
      visual_ability_part:'practice', 
      correct:true
      }).count() < 2) {
          return true;
      } else { return false }
  }
};

var visual_ability_repeated_practice_trials = {
  timeline: [visual_ability_practice_timeline],
  data: {visual_ability_practice_round: 2},
  conditional_function: function() {
    if(jsPsych.data.get().filter({
      visual_ability_part:'practice', 
      correct:true
      }).count() < 2) {
        return true;
    } else { return false }
  }
};

var visual_ability_repeated_practice_debrief = {
  type: jsPsychHtmlKeyboardResponse,
  choices: [' '],
  trial_duration: 40000,
  
  stimulus: function() {
    
    // Tailor message to the results. If 
    // results good, keep message short.
    if(jsPsych.data.get().filter({
      visual_ability_part: 'practice', 
      visual_ability_practice_round: 2, 
      correct: true
      }).count() == 2) {
      return "<div style='text-align:left; font-size:20px;'>Practice completed. Well done! " +
        "Please press the space bar to begin the task.</div><br>"
        
    // If results not so good, show them
    } else if(jsPsych.data.get().filter({
      visual_ability_part: 'practice', 
      visual_ability_practice_round: 2, 
      correct: true
      }).count() == 1) {
      return
        "<div style='text-align:left; font-size:20px;'><p><b>Results of the practice</b></p>" +
        "<p>You responded correctly to one trial. Please press the space bar to begin the task." +
        "</p></div>"
        
    } else if(jsPsych.data.get().filter({
      visual_ability_part: 'practice', 
      visual_ability_practice_round: 2, 
      correct: true
      }).count() == 0) {
      return
        "<div style='text-align:left; font-size:20px;'><p><b>Results of the practice</b></p>" +
        "<p>There were no correct responses. Therefore, the experiment cannot continue, " +
        "unfortunately. Please press the space bar to begin the finish." +
        "</p></div>"
    }
  },
  // Terminate experiment if no correct trials
  on_finish: function(data) {
    if(jsPsych.data.get().filter({
      visual_ability_part: 'practice', 
      visual_ability_practice_round: 2, 
      correct: true
      }).count() == 0) {
        jsPsych.endExperiment('Thank you for your interest in this experiment.', data)
      }
  }
};
    
// Show second-round feedback if practice trials were repeated
var conditional_visual_ability_repeated_practice_debrief = {
  timeline: [visual_ability_repeated_practice_debrief],
  conditional_function: function() {
      if(jsPsych.data.get().filter({visual_ability_practice_round:2}).count() >= 1) {
          return true;
      } else { return false }
  },
  repetitions: 1
};



// MAIN TRIALS

/* Primary orientation across the 20 main trials: 
   right, right, left, right, left, left, left, right, left, right, 
   right, right, left, right, left, right, right, left, left, left. */

var visual_ability_trial_1 = {
    type:jsPsychRok,
    data: { 
      visual_ability_part: 'main',
      visual_ability_trial: 1
      },
    choices: ['f', 'j', ' '],
    correct_choice: ['j'],
    trial_duration: 6000,
    stimulus_type: 3,  // origami birds
    oob_color: 'yellow',
    coherent_orientation: 0,  // orientation to the right
    coherent_movement_direction: 270,  // movement down
    coherence_orientation: 97,  // % orientated right
    coherence_orientation_opposite: 2,  // % orientated left (rest random)
    movement_speed: 3,
    random_movement_type: 1,
    random_orientation_type: 1
};

var visual_ability_trial_2 = {
    type:jsPsychRok,
    data: { 
      visual_ability_part: 'main',
      visual_ability_trial: 2
      },
    choices: ['f', 'j', ' '],
    correct_choice: ['j'],
    trial_duration: 6000,
    stimulus_type: 3,  // origami birds
    oob_color: 'black',
    coherent_orientation: 0,  // orientation to the right
    coherent_movement_direction: 60,  // movement up
    coherence_orientation: 92,  // % orientated right
    coherence_orientation_opposite: 1,  // % orientated left (rest random)
    movement_speed: 3,
    random_movement_type: 1,
    random_orientation_type: 1
};

var visual_ability_trial_3 = {
    type:jsPsychRok,
    data: { 
      visual_ability_part: 'main',
      visual_ability_trial: 3
      },
    choices: ['f', 'j', ' '],
    correct_choice: ['f'],
    trial_duration: 6000,
    stimulus_type: 3,  // origami birds
    oob_color: 'yellow',
    coherent_orientation: 180,  // orientation to the left
    coherent_movement_direction: 90,  // movement up
    coherence_orientation: 90,  // % orientated left
    coherence_orientation_opposite: 3,  // % orientated right (rest random)
    movement_speed: 4,
    random_movement_type: 1,
    random_orientation_type: 1
};

var visual_ability_trial_4 = {
    type:jsPsychRok,
    data: { 
      visual_ability_part: 'main',
      visual_ability_trial: 4
      },
    choices: ['f', 'j', ' '],
    correct_choice: ['j'],
    trial_duration: 6000,
    stimulus_type: 3,  // origami birds
    oob_color: 'black',
    coherent_orientation: 0,  // orientation to the right
    coherent_movement_direction: 310,  // movement down
    coherence_orientation: 93,  // % orientated right
    coherence_orientation_opposite: 7,  // % orientated left (rest random)
    movement_speed: 4,
    random_movement_type: 1,
    random_orientation_type: 1
};

var visual_ability_trial_5 = {
    type:jsPsychRok,
    data: { 
      visual_ability_part: 'main',
      visual_ability_trial: 5
      },
    choices: ['f', 'j', ' '],
    correct_choice: ['f'],
    trial_duration: 6000,
    stimulus_type: 3,  // origami birds
    oob_color: 'yellow',
    coherent_orientation: 180,  // orientation to the left
    coherent_movement_direction: 210,  // movement down
    coherence_orientation: 86,  // % orientated left
    coherence_orientation_opposite: 3,  // % orientated right (rest random)
    movement_speed: 5,
    random_movement_type: 1,
    random_orientation_type: 1
};

var visual_ability_trial_6 = {
    type:jsPsychRok,
    data: { 
      visual_ability_part: 'main',
      visual_ability_trial: 6
      },
    choices: ['f', 'j', ' '],
    correct_choice: ['f'],
    trial_duration: 6000,
    stimulus_type: 3,  // origami birds
    oob_color: 'black',
    coherent_orientation: 180,  // orientation to the left
    coherent_movement_direction: 130,  // movement up
    coherence_orientation: 87,  // % orientated left
    coherence_orientation_opposite: 7,  // % orientated right (rest random)
    movement_speed: 5,
    random_movement_type: 1,
    random_orientation_type: 1
};

var visual_ability_trial_7 = {
    type:jsPsychRok,
    data: { 
      visual_ability_part: 'main',
      visual_ability_trial: 7
      },
    choices: ['f', 'j', ' '],
    correct_choice: ['f'],
    trial_duration: 6000,
    stimulus_type: 3,  // origami birds
    oob_color: 'yellow',
    coherent_orientation: 180,  // orientation to the left
    coherent_movement_direction: 90,  // movement up
    coherence_orientation: 85,  // % orientated left
    coherence_orientation_opposite: 11,  // % orientated right (rest random)
    movement_speed: 5,
    random_movement_type: 1,
    random_orientation_type: 1
};

var visual_ability_trial_8 = {
    type:jsPsychRok,
    data: { 
      visual_ability_part: 'main',
      visual_ability_trial: 8
      },
    choices: ['f', 'j', ' '],
    correct_choice: ['j'],
    trial_duration: 6000,
    stimulus_type: 3,  // origami birds
    oob_color: 'black',
    coherent_orientation: 0,  // orientation to the right
    coherent_movement_direction: 70,  // movement up
    coherence_orientation: 80,  // % orientated right
    coherence_orientation_opposite: 10,  // % orientated left (rest random)
    movement_speed: 6,
    random_movement_type: 1,
    random_orientation_type: 1
};

var visual_ability_trial_9 = {
    type:jsPsychRok,
    data: { 
      visual_ability_part: 'main',
      visual_ability_trial: 9
      },
    choices: ['f', 'j', ' '],
    correct_choice: ['f'],
    trial_duration: 6000,
    stimulus_type: 3,  // origami birds
    oob_color: 'yellow',
    coherent_orientation: 180,  // orientation to the left
    coherent_movement_direction: 270,  // movement down
    coherence_orientation: 70,  // % orientated left
    coherence_orientation_opposite: 15,  // % orientated right (rest random)
    movement_speed: 6,
    random_movement_type: 1,
    random_orientation_type: 1
};

var visual_ability_trial_10 = {
    type:jsPsychRok,
    data: { 
      visual_ability_part: 'main',
      visual_ability_trial: 10
      },
    choices: ['f', 'j', ' '],
    correct_choice: ['j'],
    trial_duration: 6000,
    stimulus_type: 3,  // origami birds
    oob_color: 'black',
    coherent_orientation: 0,  // orientation to the right
    coherent_movement_direction: 220,  // movement down
    coherence_orientation: 70,  // % orientated right
    coherence_orientation_opposite: 20,  // % orientated left (rest random)
    movement_speed: 7,
    random_movement_type: 1,
    random_orientation_type: 1
};

var visual_ability_trial_11 = {
    type:jsPsychRok,
    data: { 
      visual_ability_part: 'main',
      visual_ability_trial: 11
      },
    choices: ['f', 'j', ' '],
    correct_choice: ['j'],
    trial_duration: 6000,
    stimulus_type: 3,  // origami birds
    oob_color: 'yellow',
    coherent_orientation: 0,  // orientation to the right
    coherent_movement_direction: 270,  // movement down
    coherence_orientation: 75,  // % orientated right
    coherence_orientation_opposite: 25,  // % orientated left (rest random)
    movement_speed: 6,
    random_movement_type: 1,
    random_orientation_type: 1
};

var visual_ability_trial_12 = {
    type:jsPsychRok,
    data: { 
      visual_ability_part: 'main',
      visual_ability_trial: 12
      },
    choices: ['f', 'j', ' '],
    correct_choice: ['j'],
    trial_duration: 6000,
    stimulus_type: 3,  // origami birds
    oob_color: 'black',
    coherent_orientation: 0,  // orientation to the right
    coherent_movement_direction: 60,  // movement up
    coherence_orientation: 75,  // % orientated right
    coherence_orientation_opposite: 21,  // % orientated left (rest random)
    movement_speed: 6,
    random_movement_type: 1,
    random_orientation_type: 1
};

var visual_ability_trial_13 = {
    type:jsPsychRok,
    data: { 
      visual_ability_part: 'main',
      visual_ability_trial: 13
      },
    choices: ['f', 'j', ' '],
    correct_choice: ['f'],
    trial_duration: 6000,
    stimulus_type: 3,  // origami birds
    oob_color: 'yellow',
    coherent_orientation: 180,  // orientation to the left
    coherent_movement_direction: 90,  // movement up
    coherence_orientation: 72,  // % orientated left
    coherence_orientation_opposite: 22,  // % orientated right (rest random)
    movement_speed: 7,
    random_movement_type: 1,
    random_orientation_type: 1
};

var visual_ability_trial_14 = {
    type:jsPsychRok,
    data: { 
      visual_ability_part: 'main',
      visual_ability_trial: 14
      },
    choices: ['f', 'j', ' '],
    correct_choice: ['j'],
    trial_duration: 6000,
    stimulus_type: 3,  // origami birds
    oob_color: 'black',
    coherent_orientation: 0,  // orientation to the right
    coherent_movement_direction: 310,  // movement down
    coherence_orientation: 70,  // % orientated right
    coherence_orientation_opposite: 28,  // % orientated left (rest random)
    movement_speed: 8,
    random_movement_type: 1,
    random_orientation_type: 1
};

var visual_ability_trial_15 = {
    type:jsPsychRok,
    data: { 
      visual_ability_part: 'main',
      visual_ability_trial: 15
      },
    choices: ['f', 'j', ' '],
    correct_choice: ['f'],
    trial_duration: 6000,
    stimulus_type: 3,  // origami birds
    oob_color: 'yellow',
    coherent_orientation: 180,  // orientation to the left
    coherent_movement_direction: 210,  // movement down
    coherence_orientation: 65,  // % orientated left
    coherence_orientation_opposite: 15,  // % orientated right (rest random)
    movement_speed: 8,
    random_movement_type: 1,
    random_orientation_type: 1
};

var visual_ability_trial_16 = {
    type:jsPsychRok,
    data: { 
      visual_ability_part: 'main',
      visual_ability_trial: 16
      },
    choices: ['f', 'j', ' '],
    correct_choice: ['f'],
    trial_duration: 6000,
    stimulus_type: 3,  // origami birds
    oob_color: 'black',
    coherent_orientation: 0,  // orientation to the right
    coherent_movement_direction: 130,  // movement up
    coherence_orientation: 65,  // % orientated right
    coherence_orientation_opposite: 27,  // % orientated left (rest random)
    movement_speed: 8,
    random_movement_type: 1,
    random_orientation_type: 1
};

var visual_ability_trial_17 = {
    type:jsPsychRok,
    data: { 
      visual_ability_part: 'main',
      visual_ability_trial: 17
      },
    choices: ['f', 'j', ' '],
    correct_choice: ['f'],
    trial_duration: 6000,
    stimulus_type: 3,  // origami birds
    oob_color: 'yellow',
    coherent_orientation: 0,  // orientation to the right
    coherent_movement_direction: 90,  // movement up
    coherence_orientation: 62,  // % orientated right
    coherence_orientation_opposite: 11,  // % orientated left (rest random)
    movement_speed: 9,
    random_movement_type: 1,
    random_orientation_type: 1
};

var visual_ability_trial_18 = {
    type:jsPsychRok,
    data: { 
      visual_ability_part: 'main',
      visual_ability_trial: 18
      },
    choices: ['f', 'j', ' '],
    correct_choice: ['j'],
    trial_duration: 6000,
    stimulus_type: 3,  // origami birds
    oob_color: 'black',
    coherent_orientation: 180,  // orientation to the left
    coherent_movement_direction: 70,  // movement up
    coherence_orientation: 60,  // % orientated left
    coherence_orientation_opposite: 35,  // % orientated right (rest random)
    movement_speed: 10,
    random_movement_type: 1,
    random_orientation_type: 1
};

var visual_ability_trial_19 = {
    type:jsPsychRok,
    data: { 
      visual_ability_part: 'main',
      visual_ability_trial: 19
      },
    choices: ['f', 'j', ' '],
    correct_choice: ['f'],
    trial_duration: 6000,
    stimulus_type: 3,  // origami birds
    oob_color: 'yellow',
    coherent_orientation: 180,  // orientation to the left
    coherent_movement_direction: 270,  // movement down
    coherence_orientation: 55,  // % orientated left
    coherence_orientation_opposite: 30,  // % orientated right (rest random)
    movement_speed: 11,
    random_movement_type: 1,
    random_orientation_type: 1
};

var visual_ability_trial_20 = {
    type:jsPsychRok,
    data: { 
      visual_ability_part: 'main',
      visual_ability_trial: 20
      },
    choices: ['f', 'j', ' '],
    correct_choice: ['j'],
    trial_duration: 6000,
    stimulus_type: 3,  // origami birds
    oob_color: 'black',
    coherent_orientation: 180,  // orientation to the left
    coherent_movement_direction: 250,  // movement down
    coherence_orientation: 55,  // % orientated left
    coherence_orientation_opposite: 40,  // % orientated right (rest random)
    movement_speed: 12,
    random_movement_type: 1,
    random_orientation_type: 1
};


/* Terminate experiment if unanswered trials > 30%. Instructions 
   advised pressing space bar when response unknown. */

var terminate_experiment = {
  type: jsPsychHtmlKeyboardResponse,
  prompt: "<p style='font-size:20px;'>Please press the space bar to finish.</p>",
  choices: [' '],
  
  stimulus: function() {
    
    var visual_ability_unanswered_trials =
      jsPsych.data.get().filter({
        visual_ability_part: 'main',
        key_press: '' 
      }).count();
    
    var visual_ability_total_trials =
      jsPsych.data.get().filter({visual_ability_part: 'main'}).count();
      
    var unanswered_rate = 
      visual_ability_unanswered_trials / visual_ability_total_trials;
          
    return "<div style='text-align:left; font-size:20px;'><p>The experiment " +
      'cannot continue as ' + Math.round(unanswered_rate * 100) + 
      '% of trials were not responded to.</p></div>'
  }
};

var conditional_terminate_experiment = {
  timeline: [terminate_experiment],
  conditional_function: function() {
    
    var visual_ability_unanswered_trials =
      jsPsych.data.get().filter({
        visual_ability_part: 'main',
        key_press: ''
      }).count();
    
    var visual_ability_total_trials =
      jsPsych.data.get().filter({visual_ability_part: 'main'}).count();
      
    var unanswered_rate = 
      visual_ability_unanswered_trials / visual_ability_total_trials;
    
    if(unanswered_rate > .3) {
        return true
    } else { return false }
  },
  on_timeline_finish: function(data) { 
    
    var visual_ability_unanswered_trials =
      jsPsych.data.get().filter({
        visual_ability_part: 'main',
        key_press: ''
      }).count();
    
    var visual_ability_total_trials =
      jsPsych.data.get().filter({visual_ability_part: 'main'}).count();
      
    var unanswered_rate = 
      visual_ability_unanswered_trials / visual_ability_total_trials;
    
    jsPsych.endExperiment('Thank you for your interest in this experiment.', data)
  }
};


// Assemble main trials timeline
var visual_ability_timeline = {
  timeline: [ visual_ability_trial_1, visual_ability_trial_2,
  visual_ability_trial_3, visual_ability_trial_4, visual_ability_trial_5, 
  visual_ability_trial_6, visual_ability_trial_7, visual_ability_trial_8, 
  visual_ability_trial_9, visual_ability_trial_10, visual_ability_trial_11, 
  visual_ability_trial_12, visual_ability_trial_13, visual_ability_trial_14, 
  visual_ability_trial_15, visual_ability_trial_16, visual_ability_trial_17, 
  visual_ability_trial_18, visual_ability_trial_19, visual_ability_trial_20,
  conditional_terminate_experiment ]
};


