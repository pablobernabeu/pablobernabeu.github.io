

/********************************************/
/** VISUAL ABILITY TASK (tag: 'VisAbil')   **/
/********************************************/


// PRACTICE TRIALS

// Instructions
var VisAbil_instructions = {
  type: jsPsychHtmlKeyboardResponse,
  prompt: "<p>Press the space bar to begin.</p>",
  choices: [' '],
  trial_duration: 40000,
  stimulus: [
    '<div>Welcome to the next task. Each screen will show many icons of birds. Your task is ' +
    'to identify the <b>orientation</b> of <i>most</i> birds (that is, where their ' +
    'heads are pointing): either left or right. Please do <i>not</i> pay attention ' +
    'to the direction of the movement. Please press <button>F</button> if most birds ' +
    'are orientated to the left, or press <button>J</button> if most are orientated ' +
    'to the right. Please try to respond as accurately and fast as possible. Next, ' +
    'you can practice with two easy trials.</div>'
  ]
};

var VisAbil_practice_trial_1 = {
    type: jsPsychRok,
    data: { 
      task: 'VisAbil_practice',
      trial: 1
      },
    choices: ['f', 'j'],
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

var VisAbil_practice_trial_1_feedback = {
  type: jsPsychHtmlKeyboardResponse,
    data: { 
      task: 'VisAbil_practice',
      trial: 1
      },
  stimulus: function() {
    var last_trial_correct =
      jsPsych.data.getLastTrialData().values()[0].correct;
    if(jsPsych.data.getLastTrialData().values()[0].key_press == '') {
      return '<p><red-button> 0 </red-button></p>'
    } else if(last_trial_correct == true) {
      return '<p><green-button> &check; </green-button></p>'
    } else if(last_trial_correct == false) {
      return '<p><red-button> &#x2718; </red-button></p>'
    }
  },
  choices: 'NO_KEYS',
  trial_duration: 800
};

var VisAbil_practice_trial_2 = {
    type: jsPsychRok,
    data: { 
      task: 'VisAbil_practice',
      trial: 2
      },
    choices: ['f', 'j'],
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

var VisAbil_practice_trial_2_feedback = {
  type: jsPsychHtmlKeyboardResponse,
    data: { 
      task: 'VisAbil_practice',
      trial: 2
      },
  stimulus: function() {
    var last_trial_correct =
      jsPsych.data.getLastTrialData().values()[0].correct;
    if(jsPsych.data.getLastTrialData().values()[0].key_press == '') {
      return '<p><red-button> 0 </red-button></p>'
    } else if(last_trial_correct == true) {
      return '<p><green-button> &check; </green-button></p>'
    } else if(last_trial_correct == false) {
      return '<p><red-button> &#x2718; </red-button></p>'
    }
  },
  choices: 'NO_KEYS',
  trial_duration: 800
};

// Assemble practice trials timeline
var VisAbil_practice_timeline = {
  timeline: [ VisAbil_practice_trial_1,
  VisAbil_practice_trial_1_feedback,
  VisAbil_practice_trial_2,
  VisAbil_practice_trial_2_feedback ]
};

// Overall feedback on all the initial practice trials
var VisAbil_practice_debrief = {
  type: jsPsychHtmlKeyboardResponse,
  choices: [' '],
  trial_duration: 40000,
  
  stimulus: function() {
    
    // Tailor message to the results. If results good, keep message short.
    if(jsPsych.data.get().filter({task:'VisAbil_practice', correct:true}).count() == 2) {
      return "<div>Practice completed. Well done! Please press the space bar to begin.</div><br>"
        
    // If results not so good, show them
    } else if(jsPsych.data.get().filter({task:'VisAbil_practice', correct:true}).count() == 1) {
      return "<div><b>Results of the practice</b><br>" +
        "You responded correctly to one trial. Please press the space bar to repeat the practice." +
        "</div>"
        
    } else if(jsPsych.data.get().filter({task:'VisAbil_practice', correct:true}).count() == 0) {
      return "<div><b>Results of the practice</b><br>" +
        "There were no correct responses. Please press the space bar to repeat the practice." +
        "</div>"
    }
    }
  };

/* Prepare repeated instructions */
var repeat_VisAbil_instructions = {
  type: jsPsychHtmlKeyboardResponse,
  prompt: "<p>Press the space bar to begin.</p>",
  choices: [' '],
  trial_duration: 40000,
  stimulus: [
    '<div>Please consider the instructions again. Each screen will show many icons of birds. ' +
    'Your task is to identify the <b>orientation</b> of <i>most</i> birds (that is, ' +
    'where their heads are pointing): either left or right. Please do <i>not</i> pay ' +
    'attention to the direction of the movement. Please press <button>F</button> if ' +
    'most birds are orientated to the left, or press <button>J</button> if most are ' +
    'orientated to the right. Please try to respond as accurately and fast as ' +
    'possible.</div>'
  ]
};

// Repeat instructions, practice and debrief if accuracy rate < 100%

var conditional_repeat_VisAbil_instructions = {
  timeline: [repeat_VisAbil_instructions],
  conditional_function: function() {
    if(jsPsych.data.get().filter({
      task: 'VisAbil_practice', 
      correct: true
      }).count() < 2) {
          return true;
      } else { return false }
  }
};

var VisAbil_repeated_practice_trials = {
  timeline: [VisAbil_practice_timeline],
  data: {practice_round: 2},
  conditional_function: function() {
    if(jsPsych.data.get().filter({
      task: 'VisAbil_practice', 
      correct: true
      }).count() < 2) {
        return true;
    } else { return false }
  }
};

var VisAbil_repeated_practice_debrief = {
  type: jsPsychHtmlKeyboardResponse,
  choices: [' '],
  trial_duration: 40000,
  
  stimulus: function() {
    
    // Tailor message to the results. If 
    // results good, keep message short.
    if(jsPsych.data.get().filter({
      task: 'VisAbil_practice', 
      practice_round: 2, 
      correct: true
    }).count() == 2) {
      return "<div>Practice completed. Well done! Please press the space bar to begin.</div><br>"
        
    // If results not so good, show them
    } else if(jsPsych.data.get().filter({
      task: 'VisAbil_practice', 
      practice_round: 2, 
      correct: true
      }).count() == 1) {
      return "<div><b>Results of the practice</b><br>You responded correctly to one trial. " +
      "Please press the space bar to begin.</div>"
        
    } else if(jsPsych.data.get().filter({
      task: 'VisAbil_practice', 
      practice_round: 2, 
      correct: true
      }).count() == 0) {
      return "<div><b>Results of the practice</b><br> There were no correct responses. " +
        "Therefore, the experiment cannot continue, unfortunately. Thank you for your " +
        "attention.</div>"
    }
  },
  // Terminate experiment if no correct trials
  on_finish: function(data) {
    if(jsPsych.data.get().filter({
      task: 'VisAbil_practice', 
      practice_round: 2, 
      correct: true
      }).count() == 0) {
        jsPsych.endExperiment('Thank you for your attention.', data)
      }
  }
};
    
// Show second-round feedback if practice trials were repeated
var conditional_VisAbil_repeated_practice_debrief = {
  timeline: [VisAbil_repeated_practice_debrief],
  conditional_function: function() {
      if(jsPsych.data.get().filter({
        task: 'VisAbil_practice', 
        practice_round: 2
      }).count() >= 1) {
          return true;
      } else { return false }
  },
  repetitions: 1
};



// MAIN TRIALS

var VisAbil_trial_1 = {
    type: jsPsychRok,
    data: { 
      task: 'VisAbil_main',
      trial: 1
      },
    choices: ['f', 'j'],
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

var VisAbil_trial_2 = {
    type: jsPsychRok,
    data: { 
      task: 'VisAbil_main',
      trial: 2
      },
    choices: ['f', 'j'],
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

var VisAbil_trial_3 = {
    type: jsPsychRok,
    data: { 
      task: 'VisAbil_main',
      trial: 3
      },
    choices: ['f', 'j'],
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

var VisAbil_trial_4 = {
    type: jsPsychRok,
    data: { 
      task: 'VisAbil_main',
      trial: 4
      },
    choices: ['f', 'j'],
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

var VisAbil_trial_5 = {
    type: jsPsychRok,
    data: { 
      task: 'VisAbil_main',
      trial: 5
      },
    choices: ['f', 'j'],
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

var VisAbil_trial_6 = {
    type: jsPsychRok,
    data: { 
      task: 'VisAbil_main',
      trial: 6
      },
    choices: ['f', 'j'],
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

var VisAbil_trial_7 = {
    type: jsPsychRok,
    data: { 
      task: 'VisAbil_main',
      trial: 7
      },
    choices: ['f', 'j'],
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

var VisAbil_trial_8 = {
    type: jsPsychRok,
    data: { 
      task: 'VisAbil_main',
      trial: 8
      },
    choices: ['f', 'j'],
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

var VisAbil_trial_9 = {
    type: jsPsychRok,
    data: { 
      task: 'VisAbil_main',
      trial: 9
      },
    choices: ['f', 'j'],
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

var VisAbil_trial_10 = {
    type: jsPsychRok,
    data: { 
      task: 'VisAbil_main',
      trial: 10
      },
    choices: ['f', 'j'],
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

var VisAbil_trial_11 = {
    type: jsPsychRok,
    data: { 
      task: 'VisAbil_main',
      trial: 11
      },
    choices: ['f', 'j'],
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

var VisAbil_trial_12 = {
    type: jsPsychRok,
    data: { 
      task: 'VisAbil_main',
      trial: 12
      },
    choices: ['f', 'j'],
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

var VisAbil_trial_13 = {
    type: jsPsychRok,
    data: { 
      task: 'VisAbil_main',
      trial: 13
      },
    choices: ['f', 'j'],
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

var VisAbil_trial_14 = {
    type: jsPsychRok,
    data: { 
      task: 'VisAbil_main',
      trial: 14
      },
    choices: ['f', 'j'],
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

var VisAbil_trial_15 = {
    type: jsPsychRok,
    data: { 
      task: 'VisAbil_main',
      trial: 15
      },
    choices: ['f', 'j'],
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

var VisAbil_trial_16 = {
    type: jsPsychRok,
    data: { 
      task: 'VisAbil_main',
      trial: 16
      },
    choices: ['f', 'j'],
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

var VisAbil_trial_17 = {
    type: jsPsychRok,
    data: { 
      task: 'VisAbil_main',
      trial: 17
      },
    choices: ['f', 'j'],
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

var VisAbil_trial_18 = {
    type: jsPsychRok,
    data: { 
      task: 'VisAbil_main',
      trial: 18
      },
    choices: ['f', 'j'],
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

var VisAbil_trial_19 = {
    type: jsPsychRok,
    data: { 
      task: 'VisAbil_main',
      trial: 19
      },
    choices: ['f', 'j'],
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

var VisAbil_trial_20 = {
    type: jsPsychRok,
    data: { 
      task: 'VisAbil_main',
      trial: 20
      },
    choices: ['f', 'j'],
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


// Terminate experiment if unanswered trials > 70%

var terminate_experiment = {
  type: jsPsychHtmlKeyboardResponse,
  choices: [' '],
  trial_duration: 15000,
  
  stimulus: function() {
    
    var VisAbil_unanswered_trials =
      jsPsych.data.get().filter({task:'VisAbil_main', key_press:''}).count();
    
    var VisAbil_total_trials = jsPsych.data.get().filter({task:'VisAbil_main'}).count();
      
    var unanswered_rate = VisAbil_unanswered_trials / VisAbil_total_trials;
          
    return '<div>Unfortunately, the experiment cannot continue because ' + 
      Math.round(unanswered_rate * 100) + '% of trials were not responded to. ' +
      ' Thank you for your attention.</div>'
  }
};

var conditional_terminate_experiment = {
  timeline: [terminate_experiment],
  conditional_function: function() {
    var VisAbil_unanswered_trials =
      jsPsych.data.get().filter({task: 'VisAbil_main', key_press: ''}).count();
    
    var VisAbil_total_trials =
      jsPsych.data.get().filter({task: 'VisAbil_main'}).count();
      
    var unanswered_rate = 
      VisAbil_unanswered_trials / VisAbil_total_trials;
    
    if(unanswered_rate > .7) {
        return true
    } else { return false }
  },
  on_timeline_finish: function(data) { 
    jsPsych.endExperiment("<div>Please return to <b>Prolific</b> and click " +
      "<button>Stop without Completing</button>. Thank you very much.</div>", data)
  }
};


// Assemble main trials timeline
var VisAbil_main_timeline = {
  timeline: [ VisAbil_trial_1, VisAbil_trial_2,
    VisAbil_trial_3, VisAbil_trial_4, VisAbil_trial_5, 
    VisAbil_trial_6, VisAbil_trial_7, VisAbil_trial_8, 
    VisAbil_trial_9, VisAbil_trial_10, VisAbil_trial_11, 
    VisAbil_trial_12, VisAbil_trial_13, VisAbil_trial_14, 
    VisAbil_trial_15, VisAbil_trial_16, VisAbil_trial_17, 
    VisAbil_trial_18, VisAbil_trial_19, VisAbil_trial_20,
    conditional_terminate_experiment ]
};


// Assemble complete task
var VisAbil_timeline = {
  timeline: [
    VisAbil_instructions, VisAbil_practice_timeline, VisAbil_practice_debrief, 
    conditional_repeat_VisAbil_instructions, VisAbil_repeated_practice_trials,
    conditional_VisAbil_repeated_practice_debrief, VisAbil_main_timeline
    ]
}

