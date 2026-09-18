/* ARCHIVED — NOT LOADED. Removed from the registered battery; retained for reference only. See ../../README.md (File layout) for why. */
/********************************************/
/** WORKING MEMORY TASK (tag: 'WorkMem')   **/
/********************************************/

/* 
The working memory task is operationalised with a backward digit span task.
This task draws on the code shared by Stephen Van Hedger at 
https://github.com/svanhedger/jspsych/blob/master/scripts/backward-digit-span 

Procedure. On each trial, participants see a string of digits. Then, they 
must click on buttons to report these digits in reverse order. The task 
is adaptive based on a 1:2 staircase procedure. That is, a correct answer 
will increase the digit span by one, whereas two incorrect answers in a 
row will decrease the span by one.
*/

// General variables and functions for the backward digit span task

var currentDigitList; // current digit list
var reversedDigitString; // reversed digit string
var totalCorrect = 0; // counter for total correct
var totalTrials = 0; // counter for total trials
var TrialNum = 1; // counter for trials
var WorkMem_PracticeTrials = 3; // number of trials in the practice part
var practice1_passed = "no"; // first attempt
var practice2_over = "no"; // second attempt
var WorkMem_MainTrials = 15; // number of trials in the main part
var response = []; // for storing partcipants' responses
var WorkMem_correct_ans; // for storing the correct answer on a given trial
var staircaseChecker = []; // for assessing whether the span should move up/down/stay
var staircaseIndex = 0; // index for the current staircase
var digit_list = [1, 2, 3, 4, 5, 6, 7, 8, 9]; // digits to be used

var startingSpan = 3; // where we begin in terms of span
var currentSpan; // to reference where participants currently are
var spanHistory = []; // easy logging of the participant's trajectory
var stimList; // this is going to house the ordering of the stimuli for each trial
var idx = 0; // for indexing the current digit to be presented
var exitDigits; // for exiting the digit loop

var arrSum = (arr) => arr.reduce((a, b) => a + b, 0); // simple variable for calculating sum of an array

/* Function to push button responses to array and submit 
   automatically once all digits have been entered. */

var recordClick = function (elm) {
  response.push(Number($(elm).text())); // Add clicked number to response

  // Update the displayed input
  document.getElementById("echoed_txt").innerHTML = response.join(" "); // Separate digits by space

  // Check if the response is complete (equal to currentSpan)
  if (response.length === currentSpan) {
    // Hide only the number buttons, not the echoed text
    var numberButtons = document.querySelectorAll(".num-button");
    numberButtons.forEach(function (button) {
      button.style.display = "none"; // Hide each button
    });

    // Center the echoed_txt on the screen
    var echoedTxt = document.getElementById("echoed_txt");
    echoedTxt.style.position = "absolute"; // Absolute positioning
    echoedTxt.style.top = "50%"; // Vertically center
    echoedTxt.style.left = "50%"; // Horizontally center
    echoedTxt.style.transform = "translate(-50%, -50%)"; // Adjust to center correctly
    echoedTxt.style.fontFamily = "monospace"; // Optional: Monospace font for better number alignment
    echoedTxt.style.whiteSpace = "nowrap"; // Ensure the text stays on one line
    echoedTxt.style.fontSize = "160%"; // Adjust font size as
    echoedTxt.style.width = "auto"; // Set the width to auto

    // Set a dynamic width (adjust this based on the number of digits or screen size)
    echoedTxt.style.minWidth = response.length * 40 + "px"; // 40px per digit for a good fit

    // Keep echoed_txt visible for an additional 100 milliseconds per digit
    setTimeout(function () {
      jsPsych.finishTrial({
        response: response, // Send the response array
        accuracy:
          JSON.stringify(response) === JSON.stringify(WorkMem_correct_ans)
            ? 1
            : 0, // Check accuracy
      });
    }, window.AUTO_TEST ? 0 : 100 * currentSpan); // Delay per digit; fire immediately under autotest so finishTrial beats the compressed trial_duration
  }
};

// function to clear the response array
var clearResponse = function () {
  response = [];
  document.getElementById("echoed_txt").innerHTML = response;
};

// Keyboard input handler for the number pad
function handleDigitKey(e) {
  // Only allow keys 1-9 (main keyboard or numpad)
  if (/^[1-9]$/.test(e.key)) {
    // Find the corresponding button element
    var btn = document.getElementById("button_" + e.key);
    if (btn && btn.style.display !== "none") {
      recordClick(btn);
    }
  }
}

// Attach/detach keyboard listener when the response grid is shown/hidden
function enableDigitKeyboard() {
  document.addEventListener("keydown", handleDigitKey);
}
function disableDigitKeyboard() {
  document.removeEventListener("keydown", handleDigitKey);
}

// function to shuffle an array (Fisher-Yates)
function shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

// function to get digit list for a trial
function getDigitList(len) {
  var shuff_final = [];
  //shuffle the digit list
  if (len <= digit_list.length) {
    shuff_final = shuffle(digit_list);
  } else {
    // this is overkill (generating too many digits) but it works and we slice it later anyway
    for (var j = 0; j < len; j++) {
      var interim_digits = shuffle(digit_list);
      shuff_final = [...shuff_final, ...interim_digits];
    }
  }
  var digitList = shuff_final.slice(0, len); // array to hold the final digits
  return digitList;
}

// function to push the stimuli to an array
function getStimuli(numDigits) {
  var digit;
  var stimList = [];
  currentDigitList = getDigitList(numDigits);
  reversedDigitString = "";
  for (var i = 0; i < currentDigitList.length; i += 1) {
    digit = currentDigitList[i].toString();
    stimList.push(
      '<p style="font-size:60px; font-weight:600;">' + digit + "</p>",
    );
    reversedDigitString = digit + reversedDigitString;
  }
  // reversed array for assessing performance
  WorkMem_correct_ans = currentDigitList.slice().reverse();
  return stimList;
}

// function to update the span as appropriate (using a 1:2 staircase procedure)
function updateSpan() {
  // If they got the last trial correct, increase the span
  if (arrSum(staircaseChecker) == 1) {
    currentSpan += 1;
    staircaseChecker = [];
    staircaseIndex = 0;
  } else {
    if (currentSpan > startingSpan && staircaseChecker.length == 2) {
      currentSpan -= 1;
      staircaseChecker = [];
      staircaseIndex = 0;
    }
  }
}

/* General components of the trials, which will be used 
in the practice trials and in the main trials. */

var response_grid =
  "<div class = numbox>" +
  '<button id = button_1 class = "square num-button" onclick = "recordClick(this)"><div class = content><div class = numbers>1</div></div></button>' +
  '<button id = button_2 class = "square num-button" onclick = "recordClick(this)"><div class = content><div class = numbers>2</div></div></button>' +
  '<button id = button_3 class = "square num-button" onclick = "recordClick(this)"><div class = content><div class = numbers>3</div></div></button>' +
  '<button id = button_4 class = "square num-button" onclick = "recordClick(this)"><div class = content><div class = numbers>4</div></div></button>' +
  '<button id = button_5 class = "square num-button" onclick = "recordClick(this)"><div class = content><div class = numbers>5</div></div></button>' +
  '<button id = button_6 class = "square num-button" onclick = "recordClick(this)"><div class = content><div class = numbers>6</div></div></button>' +
  '<button id = button_7 class = "square num-button" onclick = "recordClick(this)"><div class = content><div class = numbers>7</div></div></button>' +
  '<button id = button_8 class = "square num-button" onclick = "recordClick(this)"><div class = content><div class = numbers>8</div></div></button>' +
  '<button id = button_9 class = "square num-button" onclick = "recordClick(this)"><div class = content><div class = numbers>9</div></div></button>' +
  // '<button class = clear_button id = "ClearButton" onclick = "clearResponse()">Clear</button>' +
  // Padding space and user's input below
  '<p style="font-size:1px"> &nbsp; </p>' +
  '<button id=echoed_txt style="padding-top:5%; padding-right:8%; padding-bottom:5%; padding-left:8%;"><b></b></button>' +
  "</div>";

var WorkMem_practice_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus:
    "<div>In the next task, you will see a sequence of digits and be asked to type " +
    "them in the <b>reverse order</b>, using either your keyboard or the number pad " +
    "on the screen. For example, if you saw the digits <button>1</button> " +
    "<button>2</button> <button>3</button>, you would need to enter " +
    "<button>3</button> <button>2</button> <button>1</button>. Please do not use " +
    "any recording aids, and try to respond as accurately and fast as possible." +
    "<br><br></div>",
  choices: ["Click to begin the practice"],
  trial_duration: 40000,
};

// Prepare repeated instructions
var repeat_WorkMem_practice_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus:
    "<div>Some responses were incorrect so let's try again. Like before, you will " +
    "see a sequence of digits and be asked to type them back in <b>reverse " +
    "order</b>, using either your keyboard or the number pad on the " +
    "screen. For example, if you saw the digits <button>1</button> " +
    "<button>2</button> <button>3</button>, you would need to enter " +
    "<button>3</button> <button>2</button> <button>1</button>. Please do not " +
    "use any recording aids, and try to respond as accurately and fast as possible." +
    "<br><br></div>",
  choices: ["Click to repeat the practice"],
  trial_duration: 40000,
};

var WorkMem_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus:
    "<div>The following trials are similar to the previous ones, requiring the " +
    "recollection of digits in reverse order. However, the number of digits " +
    "presented will vary across trials, and faster responses will be required." +
    "<br><br></div>",
  choices: ["Click to proceed"],
  trial_duration: 40000,
};

// set-up screen
var setup_fixation = {
  type: jsPsychHtmlKeyboardResponse,
  choices: "NO_KEYS",
  stimulus: function () {
    return "+";
  },
  trial_duration: function () {
    // Set interval with a varying duration to boost participants' attention
    return jsPsych.randomization.sampleWithoutReplacement(
      [1000, 1050, 1100, 1150, 1200],
      1,
    )[0];
  },
  post_trial_gap: 600,
  on_finish: function () {
    // Set trial number to 1 and reset span if practice section was finished in previous trial
    if (
      (jsPsych.data.getLastTrialData().values()[0].task == "WorkMem_practice" &&
        jsPsych.data.get().last(5).values()[0].reset_TrialNum == "yes") ||
      (jsPsych.data.getLastTrialData().values()[0].task == "WorkMem_main" &&
        jsPsych.data.get().last(6).values()[0].reset_TrialNum == "yes")
    ) {
      TrialNum = 1;
      currentSpan = startingSpan;
    }

    // Defensive check
    if (typeof currentSpan === "undefined" || isNaN(currentSpan)) {
      currentSpan = startingSpan;
    }
    stimList = getStimuli(currentSpan); // get the current stimuli for the trial
    spanHistory[TrialNum] = currentSpan; // log the current span in an array

    idx = 0; // reset the index prior to the digit presentation
    exitDigits = 0; // reset the exit digit variable
  },
};

// visual digit presentation
var digit_WorkMem_vis = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function () {
    return stimList[idx];
  },
  choices: "NO_KEYS",
  trial_duration: 500,
  post_trial_gap: 250,
  on_finish: function () {
    idx += 1; // update the index
    // check to see if we are at the end of the digit array
    if (idx == stimList.length) {
      exitDigits = 1;
    } else {
      exitDigits = 0;
    }
  },
};

// conditional loop of digits for the length of stimList
var digit_proc = {
  type: jsPsychHtmlKeyboardResponse,
  timeline: [digit_WorkMem_vis],
  loop_function: function () {
    if (exitDigits == 0) {
      return true;
    } else {
      return false;
    }
  },
};

// response screen
var WorkMem_response_screen = {
  type: jsPsychHtmlKeyboardResponse,
  data: { WorkMem_section: "response" },
  // Set interval with a varying duration to boost participants' attention
  // and to ensure that the response screen is not too short.
  trial_duration: function () {
    if (
      jsPsych.data.getLastTrialData().values()[0].task == "WorkMem_practice"
    ) {
      return 20000;
    } else if (currentSpan == 3) {
      return 6000;
    } else if (currentSpan == 4) {
      return 8000;
    } else if (currentSpan == 5) {
      return 10000;
    } else if (currentSpan == 6) {
      return 12000;
    } else if (currentSpan == 7) {
      return 14000;
    } else if (currentSpan == 8) {
      return 17000;
    } else if (currentSpan == 9) {
      return 20000;
    } else if (currentSpan == 10) {
      return 24000;
    } else if (currentSpan == 11) {
      return 29000;
    } else if (currentSpan > 11) {
      return 35000;
    }
  },
  post_trial_gap: function () {
    // Set interval with a varying duration to boost participants' attention
    return jsPsych.randomization.sampleWithoutReplacement(
      [1400, 1450, 1500, 1550, 1600],
      1,
    )[0];
  },
  stimulus: response_grid,
  choices: "NO_KEYS",
  on_load: function () {
    enableDigitKeyboard(); // Enable keyboard input
    // Autotest: drive the on-screen digit pad with the correct backward-span
    // sequence so the response screen records a real (correct) answer instead
    // of timing out as "unanswered". WorkMem_correct_ans and currentSpan are
    // already set by the preceding digit-presentation phase, and the pad DOM is
    // present at on_load, so the presses resolve synchronously.
    if (window.AUTO_TEST) {
      response = [];
      document.getElementById("echoed_txt").innerHTML = "";
      WorkMem_correct_ans.forEach(function (d) {
        var btn = document.getElementById("button_" + d);
        if (btn) recordClick(btn);
      });
    }
  },
  // Custom data to be included in output
  on_finish: function (data) {
    disableDigitKeyboard(); // Disable keyboard input

    // Save trial number
    data.trial = TrialNum;

    // Accuracy
    if (data.response !== null) {
      if (JSON.stringify(response) === JSON.stringify(WorkMem_correct_ans)) {
        data.accuracy = 1;
        console.log("correct");
        staircaseChecker[staircaseIndex] = 1;
      } else {
        data.accuracy = 0;
        console.log("incorrect");
        staircaseChecker[staircaseIndex] = 0;
      }
    } else {
      data.accuracy = "unanswered";
      console.log("unanswered");
      staircaseChecker[staircaseIndex] = 0;
    }

    // Calculate practice1_accuracy_rate

    WorkMem_total_correct = jsPsych.data
      .get()
      .filter({
        task: "WorkMem_practice",
        practice_round: 1,
        accuracy: 1,
      })
      .count();

    WorkMem_total_incorrect = jsPsych.data
      .get()
      .filter({
        task: "WorkMem_practice",
        practice_round: 1,
        accuracy: 0,
      })
      .count();

    WorkMem_total_unanswered = jsPsych.data
      .get()
      .filter({
        task: "WorkMem_practice",
        practice_round: 1,
        accuracy: "unanswered",
      })
      .count();

    practice1_accuracy_rate =
      WorkMem_total_correct /
      (WorkMem_total_correct +
        WorkMem_total_incorrect +
        WorkMem_total_unanswered);

    // Transform any NA values to 0
    if (isNaN(practice1_accuracy_rate)) practice1_accuracy_rate = 0;

    data.practice1_accuracy_rate = practice1_accuracy_rate;

    // Calculate practice2_accuracy_rate

    WorkMem_total_correct = jsPsych.data
      .get()
      .filter({
        task: "WorkMem_practice",
        practice_round: 2,
        accuracy: 1,
      })
      .count();

    WorkMem_total_incorrect = jsPsych.data
      .get()
      .filter({
        task: "WorkMem_practice",
        practice_round: 2,
        accuracy: 0,
      })
      .count();

    WorkMem_total_unanswered = jsPsych.data
      .get()
      .filter({
        task: "WorkMem_practice",
        practice_round: 2,
        accuracy: "unanswered",
      })
      .count();

    practice2_accuracy_rate =
      WorkMem_total_correct /
      (WorkMem_total_correct +
        WorkMem_total_incorrect +
        WorkMem_total_unanswered);

    // Transform any NA values to 0
    if (isNaN(practice2_accuracy_rate)) practice2_accuracy_rate = 0;

    data.practice2_accuracy_rate = practice2_accuracy_rate;

    // Calculate main_accuracy_rate

    WorkMem_total_correct = jsPsych.data
      .get()
      .filter({
        task: "WorkMem_main",
        accuracy: 1,
      })
      .count();

    WorkMem_total_incorrect = jsPsych.data
      .get()
      .filter({
        task: "WorkMem_main",
        accuracy: 0,
      })
      .count();

    WorkMem_total_unanswered = jsPsych.data
      .get()
      .filter({
        task: "WorkMem_main",
        accuracy: "unanswered",
      })
      .count();

    main_accuracy_rate =
      WorkMem_total_correct /
      (WorkMem_total_correct +
        WorkMem_total_incorrect +
        WorkMem_total_unanswered);

    // Transform any NA values to 0
    if (isNaN(main_accuracy_rate)) main_accuracy_rate = 0;

    data.main_accuracy_rate = main_accuracy_rate;

    console.log(staircaseChecker);
    data.span = currentSpan;
    data.answer = response;
    data.correct = WorkMem_correct_ans;
    data.spanHistory = spanHistory;
    data.maxSpan = Math.max(...spanHistory);

    // clear the response for the next trial
    response = [];

    // update the staircase index
    staircaseIndex += 1;

    console.log("trial = ", data.trial);
    console.log("jsPsych.data.get().count() = ", jsPsych.data.get().count());

    // If practice1 has been passed, record state and reset trial number for next stage

    if (
      data.trial == WorkMem_PracticeTrials &&
      jsPsych.data
        .get()
        .filter({
          task: "WorkMem_practice",
          practice_round: 1,
          accuracy: "unanswered",
        })
        .count() +
        jsPsych.data
          .get()
          .filter({ task: "WorkMem_practice", practice_round: 1, accuracy: 0 })
          .count() ==
        0
    ) {
      practice1_passed = "yes";
      data.reset_TrialNum = "yes";

      // If practice1 has been failed, reset trial number for next stage
    } else if (
      data.trial == WorkMem_PracticeTrials &&
      jsPsych.data
        .get()
        .filter({
          task: "WorkMem_practice",
          practice_round: 1,
          accuracy: "unanswered",
        })
        .count() +
        jsPsych.data
          .get()
          .filter({ task: "WorkMem_practice", practice_round: 1, accuracy: 0 })
          .count() >
        0
    ) {
      practice1_passed = "no";
      data.reset_TrialNum = "yes";

      // If practice2 is over, record state and reset trial number for next stage
    } else if (
      jsPsych.data
        .get()
        .filter({
          task: "WorkMem_practice",
          WorkMem_section: "response",
          practice_round: 2,
        })
        .count() == WorkMem_PracticeTrials
    ) {
      practice2_over = "yes";
      data.reset_TrialNum = "yes";
    }

    // Increase trial number
    TrialNum += 1;
  },
};

// Trial feedback
var WorkMem_feedback = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function () {
    if (jsPsych.data.getLastTrialData().values()[0].accuracy == 1) {
      return "<p><green-button> &check; </green-button></p>";
    } else if (jsPsych.data.getLastTrialData().values()[0].accuracy == 0) {
      return "<p><red-button> &#x2718; </red-button></p>";
    } else if (
      jsPsych.data.getLastTrialData().values()[0].accuracy == "unanswered"
    ) {
      return "<p><red-button> 0 </red-button></p>";
    }
  },
  choices: "NO_KEYS",
  trial_duration: 800,
};

// Call function to update the span
var staircase_assess = {
  type: jsPsychCallFunction,
  func: updateSpan,
};

// Every seven trials, administer instructional manipulation check if previous trial was
// incorrect or the response was missing, and the average accuracy is lower than 60%,
// administer instructional manipulation check.
var WorkMem_conditional_instructional_manipulation_check = {
  timeline: [random_number, instructional_manipulation_check],
  on_timeline_start: function (data) {
    console.log(jsPsych.data.getLastTrialData().values()[0].main_accuracy_rate);
    console.log(jsPsych.data.getLastTrialData().values()[0].trial);
  },
  conditional_function: function (data) {
    var last = jsPsych.data
      .get()
      .filter({ task: "WorkMem_main", WorkMem_section: "response" })
      .last(1)
      .values()[0];

    // Accept both 0 and "unanswered" as incorrect
    var incorrectOrUnanswered =
      last.accuracy === 0 || last.accuracy === "unanswered";

    if (
      last.trial % 7 === 0 && // every 7th trial
      last.trial !== 0 && // not the first trial
      incorrectOrUnanswered && // incorrect or unanswered
      last.main_accuracy_rate < 0.6
    ) {
      return true;
    } else {
      return false;
    }
  },
};

// Main trials

var WorkMem_main_trials = {
  timeline: [
    setup_fixation,
    digit_proc,
    WorkMem_response_screen,
    staircase_assess,
    WorkMem_conditional_instructional_manipulation_check,
  ],
  data: { task: "WorkMem_main" },
  // When total number of trials have been completed, exit
  loop_function: function () {
    if (TrialNum <= WorkMem_MainTrials) {
      return true;
    } else {
      return false;
    }
  },
};

// Complete main trials timeline (incl. instructions)

var reset_main_trials = {
  type: jsPsychCallFunction,
  func: function () {
    TrialNum = 1;
    currentSpan = startingSpan;
  },
};

var WorkMem_main_timeline = {
  timeline: [WorkMem_instructions, reset_main_trials, WorkMem_main_trials],
  data: { task: "WorkMem_practice" },
};

// PRACTICE TRIALS

var WorkMem_practice_timeline = {
  timeline: [
    setup_fixation,
    digit_proc,
    WorkMem_response_screen,
    WorkMem_feedback,
    staircase_assess,
  ],
  data: { task: "WorkMem_practice" },
  // When total number of trials have been completed, exit
  loop_function: function () {
    if (
      (jsPsych.data.getLastTrialData().values()[0].practice_round == 1 &&
        jsPsych.data
          .get()
          .filter({
            task: "WorkMem_practice",
            WorkMem_section: "response",
            practice_round: 1,
          })
          .count() <=
          WorkMem_PracticeTrials - 1) ||
      (jsPsych.data.getLastTrialData().values()[0].practice_round == 2 &&
        jsPsych.data
          .get()
          .filter({
            task: "WorkMem_practice",
            WorkMem_section: "response",
            practice_round: 2,
          })
          .count() <=
          WorkMem_PracticeTrials - 1)
    ) {
      return true;
    } else {
      return false;
    }
  },
};

// Round 1 timeline
var WorkMem_practice1_timeline = {
  timeline: [WorkMem_practice_instructions, WorkMem_practice_timeline],
  data: { practice_round: 1 },
  conditional_function: function () {
    if (
      jsPsych.data
        .get()
        .filter({
          task: "WorkMem_practice",
          WorkMem_section: "response",
          practice_round: 1,
        })
        .count() <=
      WorkMem_PracticeTrials - 1
    ) {
      return true;
    } else {
      return false;
    }
  },
};

// Prepare repeated practice timeline, which will be presented if accuracy < 100%

// Overall feedback on second round of practice trials
var WorkMem_practice2_debrief = {
  type: jsPsychHtmlKeyboardResponse,
  choices: [" "],
  trial_duration: 40000,

  stimulus: function () {
    // Tailor message to the results

    // If results good, keep message short
    if (jsPsych.data.get().last(3).values()[0].practice2_accuracy_rate >= 0.7) {
      return (
        "<div>The practice was completed successfully. Please press the " +
        "space bar to read the instructions about the next stage.</div>"
      );

      // If results not so good, present them
    } else {
      return (
        "<div><b>Results of the practice</b><br>Your accuracy rate was " +
        Math.round(
          jsPsych.data.get().last(3).values()[0].practice2_accuracy_rate * 100,
        ) +
        "%. " +
        "Please press the space bar to read the instructions about the " +
        "next stage.</div>"
      );
    }
  },
};

var WorkMem_practice2_timeline = {
  timeline: [
    repeat_WorkMem_practice_instructions,
    WorkMem_practice_timeline,
    WorkMem_practice2_debrief,
  ],
  data: { practice_round: 2 },
  conditional_function: function () {
    if (practice1_passed == "no" && practice2_over == "no") {
      return true;
    } else {
      return false;
    }
  },
};

// Complete timeline of the working memory task
var working_memory_task = {
  timeline: [
    WorkMem_practice1_timeline,
    WorkMem_practice2_timeline,
    WorkMem_main_timeline,
  ],
};
// Push task to general timeline
language_vision_SemPri_TIMELINE.push(working_memory_task);

// Transition to next task
language_vision_SemPri_TIMELINE.push(break_between_tasks);
