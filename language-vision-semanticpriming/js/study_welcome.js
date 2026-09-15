/* ---------------------------------------------------------------------------
   Study welcome and consent

   The information sheet and the consent screen open the session. They sit in
   a module of their own, independent of the task battery, which both entry
   points load after fullscreen_guard.js and before the first task resource, so
   one copy serves the Gorilla deployment and the local one.

   The text is the information sheet and the consent statements registered in
   sections 12 and 13 of preregistration/ethics_application_SSH_IDREC.md, and
   the two must be changed together. STUDY_WELCOME_CONFIG holds the details the
   application leaves to be filled in. They are shown to the participant as
   written here.

   The consent is a tick-box consent: the button to begin stays disabled until
   every statement has been ticked. It is built on the ordinary button-response
   plugin, so nothing new has to be loaded, and the ticks are written to the
   data so that consent is on the record for every participant.

   Welcome and consent rows carry an explicit study_phase ("welcome" or
   "consent") and no task tag, which labels them as session administration.
   --------------------------------------------------------------------------- */

var STUDY_WELCOME_CONFIG = {
  study_title: "Linguistic and sensorimotor contributions to word meaning",
  researcher:
    "Pablo Bernabeu, Department of Education, University of Oxford; Dermot Lynott, Department of Psychology, Maynooth University; Louise Connell, Department of Psychology, Maynooth University",
  // Change both fields together before participant recruitment (launch
  // checklist in jsPsych_experiment/README.md). Keeping the draft state
  // explicit prevents a preview or local test from claiming an approval that
  // has not yet been assigned, and tests/experiment_structure.test.mjs fails if
  // "approved" is set while the reference is still the bracketed placeholder.
  ethics_status: "pending",
  ethics_reference: "[to be inserted once approved]",
  ethics_committee:
    "the Department of Education Research Ethics Committee, University of Oxford",
  withdrawal_deadline: "four weeks after you take part",
  // The University's route for concerns raised independently of the research
  // team, as given on the Department of Education's own information sheets.
  independent_contact:
    "the University of Oxford Research Governance, Ethics and Assurance team, rgea.complaints@admin.ox.ac.uk",
};

function studyWelcomeEthicsParagraph() {
  if (STUDY_WELCOME_CONFIG.ethics_status === "approved") {
    return (
      "<p><b>Who has approved this study?</b> This study has been reviewed and " +
      "approved by " +
      STUDY_WELCOME_CONFIG.ethics_committee +
      " (reference " +
      STUDY_WELCOME_CONFIG.ethics_reference +
      ").</p>"
    );
  }

  if (STUDY_WELCOME_CONFIG.ethics_status === "pending") {
    return (
      "<p><b>Ethics review.</b> This is a draft/testing configuration. We will " +
      "not recruit participants until the study has been reviewed and approved " +
      "by " +
      STUDY_WELCOME_CONFIG.ethics_committee +
      ". The approval reference will be displayed here before recruitment.</p>"
    );
  }

  throw new Error(
    "STUDY_WELCOME_CONFIG.ethics_status must be 'pending' or 'approved'.",
  );
}

var STUDY_WELCOME_CONSENT_STATEMENTS = [
  "I have read and understood the information about this study, and I have had the opportunity to consider it.",
  "I am 18 years of age or over.",
  "I understand that taking part is voluntary and that I can stop at any time by closing the window, without giving a reason.",
  "I understand that the study contains attention checks, and that if more than one is missed, or the opening practice is not passed on either attempt, the study will end and my submission will be returned rather than paid.",
  "I understand what information will be collected about me, and that my Prolific ID will be used only to pay me and to manage my submission on Prolific, and will not be published.",
  "I understand that my anonymised responses will be published openly on the internet, where they may be used by other researchers, and that once this has happened my data can no longer be withdrawn.",
  "I agree to take part in this study.",
];

var study_welcome_information_sheet = {
  type: jsPsychHtmlButtonResponse,
  choices: ["Continue"],
  data: { study_phase: "welcome", study_welcome_version: "2026-09-13" },
  stimulus:
    "<div style='max-width:44em;margin:auto;text-align:left;font-size:95%'>" +
    "<h2>A world of words</h2>" +
    "<p><b>Information for participants</b></p>" +
    "<p><b>Study title.</b> " +
    STUDY_WELCOME_CONFIG.study_title +
    "<br>" +
    "<b>Researchers.</b> " +
    STUDY_WELCOME_CONFIG.researcher +
    "<br>" +
    "<b>Ethics reference.</b> " +
    STUDY_WELCOME_CONFIG.ethics_reference +
    "</p>" +
    "<p><b>What is this study about?</b> We are interested in how people " +
    "understand the meanings of words. Some of what we know about a word comes " +
    "from the other words it appears with in language, and some comes from our " +
    "experience of the things themselves: how they look, sound and feel. We want " +
    "to find out how people differ in the balance between these two sources, and " +
    "how that balance unfolds in the fraction of a second it takes to recognise " +
    "a word.</p>" +
    "<p><b>Do I have to take part?</b> No. Taking part is entirely voluntary. If " +
    "you would rather not, simply return the study on Prolific; there is no " +
    "penalty and you do not need to give a reason.</p>" +
    "<p><b>What will I be asked to do?</b> The study takes about 30 minutes and " +
    "is done in one sitting on a desktop or laptop computer with a keyboard, in " +
    "full screen. You will complete four short computer tasks, with short breaks " +
    "in between. In three of them you will read words and press one of two keys, " +
    "for example to say whether a string of letters is a real English word, or " +
    "to choose which of two things is rougher. In the fourth you will watch a " +
    "pattern of small moving dots and indicate which way they are moving. Each " +
    "task begins with a few practice trials. Please do the study somewhere quiet " +
    "where you can concentrate, and try to answer quickly as well as accurately. " +
    "Everyone makes mistakes on these tasks; that is expected and is not a " +
    "problem.</p>" +
    "<p><b>Keeping the task in full screen.</b> If you leave full screen, the " +
    "study will pause and ask you to return to full screen by pressing a button. " +
    "You will not be able to respond until it has been restored. This does not " +
    "end the study or affect your payment, but we may not use the response from " +
    "the interrupted screen when analysing the results.</p>" +
    "<p><b>Are there any risks?</b> We do not expect the study to cause you any " +
    "distress. The tasks are simple and the words are ordinary, everyday words. " +
    "You will be looking at a screen for about half an hour, which some people " +
    "find tiring, and one task shows a pattern of moving dots. If you would " +
    "prefer not to look at moving dots, please do not take part. You can stop at " +
    "any time by closing the window.</p>" +
    "<p><b>Occasional attention checks.</b> Now and then the study may show a " +
    "short check that you are still paying attention, by asking you to report " +
    "one digit of a number that is on the screen in front of you. There is no " +
    "time limit on these, and they are easy to pass if you are reading the " +
    "screen. <b>If more than one is missed, the study will end and you will be " +
    "asked to return your submission, which means it will not be paid.</b> The " +
    "same applies to the short practice at the very beginning, if it is not " +
    "passed on either of the two attempts. Returning a submission carries no " +
    "penalty on your Prolific record.</p>" +
    "<p><b>Will I be paid?</b> Yes, £7.70 through Prolific, equivalent to " +
    "£15.40 per hour, once you have finished the study. You do not need to " +
    "do well: your payment does not depend on how accurate or how fast you are, " +
    "and it does not depend on whether we can use your data. It does depend on " +
    "the attention checks described above, and Prolific's own rules on " +
    "submissions that are exceptionally fast or evidently careless still " +
    "apply.</p>" +
    "<p><b>What information do you collect about me?</b> Which keys you pressed " +
    "and how quickly, and basic technical information about your browser and " +
    "screen so that we can check the timing worked properly on your computer. " +
    "So that we can check that each session was done as intended, the study " +
    "also records whether it stayed in full screen, whether the window lost " +
    "focus, and whether key presses came from the keyboard or from software. We " +
    "receive your Prolific ID, which we use to pay you and to manage your " +
    "submission on Prolific: to check that nobody takes part twice, and, if " +
    "our checks suggest a session was completed by software rather than a " +
    "person, to report that submission to Prolific, which decides what follows " +
    "under its own rules. We do not collect " +
    "your name, your email address, or any other contact detail, and there are " +
    "no questions about you or your circumstances.</p>" +
    "<p><b>What happens to my data?</b> Your Prolific ID is replaced with a " +
    "meaningless code as soon as we prepare the data, and the link between the " +
    "two is deleted once the data set is complete. After that, nobody, including " +
    "us, can tell which responses were yours. The anonymous data will then be " +
    "published openly on the internet, together with the study materials and " +
    "our analysis code, so that other researchers can check and reuse our work. " +
    "This is a requirement of the journal we are submitting to. The published " +
    "data contain only key presses, response times, task labels and the " +
    "technical checks described above. They cannot be used to identify you.</p>" +
    "<p><b>Can I change my mind afterwards?</b> Yes. If you would like your data " +
    "removed, message us through Prolific quoting your Prolific ID, and we will " +
    "delete it, up until " +
    STUDY_WELCOME_CONFIG.withdrawal_deadline +
    ". After that " +
    "we cannot promise removal: your Prolific ID is replaced with a meaningless " +
    "code when we prepare the data, and once the link between them has been " +
    "destroyed and the anonymised data set made public, nobody, including us, " +
    "can tell which data are yours, so removal is no longer possible.</p>" +
    studyWelcomeEthicsParagraph() +
    "<p><b>Who can I contact?</b> For questions about the study, message us " +
    "through Prolific. If you have a concern or complaint you would rather raise " +
    "with someone independent: " +
    STUDY_WELCOME_CONFIG.independent_contact +
    ".</p>" +
    "<p>The platforms we use have their own privacy notices: Prolific " +
    "(https://www.prolific.com/privacy-and-legal) and Gorilla " +
    "(https://app.gorilla.sc/privacy). Information about how the University of " +
    "Oxford uses personal data in research is at " +
    "https://www.ox.ac.uk/about/how-we-are-run/policies-and-statements/" +
    "policy-hub/research-data.</p>" +
    "</div>",
  // The information sheet can extend beyond a laptop viewport. Give its sole
  // navigation control enough lower clearance that it is comfortable to reach
  // once a reader has scrolled to the end, without changing other buttons.
  on_load: function () {
    var continue_button = document.querySelector(
      "#jspsych-html-button-response-btngroup .jspsych-btn",
    );
    if (continue_button) continue_button.classList.add("information-sheet-continue");
  },
  on_start: function () {
    if (typeof window.fullscreenGuardArm === "function") {
      window.fullscreenGuardArm();
    }
  },
};
language_vision_SemPri_TIMELINE.push(study_welcome_information_sheet);

var study_welcome_consent_form = {
  type: jsPsychHtmlButtonResponse,
  choices: ["Begin the study"],
  data: { study_phase: "consent", study_welcome_version: "2026-09-13" },
  stimulus: function () {
    var items = STUDY_WELCOME_CONSENT_STATEMENTS.map(function (text, i) {
      return (
        "<label style='display:block;margin:0.6em 0'>" +
        "<input type='checkbox' class='consent-box' data-index='" +
        i +
        "'> " +
        (i === 5 ? "<b>" + text + "</b>" : text) +
        "</label>"
      );
    }).join("");
    return (
      "<div style='max-width:44em;margin:auto;text-align:left'>" +
      "<h2>Consent</h2>" +
      "<p>Please confirm each of the following. The button becomes available " +
      "once every statement has been ticked.</p>" +
      items +
      "</div>"
    );
  },
  on_load: function () {
    var button = document.querySelector(".jspsych-btn");
    var boxes = document.querySelectorAll(".consent-box");
    function update() {
      var all = true;
      for (var i = 0; i < boxes.length; i++) if (!boxes[i].checked) all = false;
      if (button) button.disabled = !all;
    }
    for (var i = 0; i < boxes.length; i++) boxes[i].addEventListener("change", update);
    if (window.AUTO_TEST) {
      // The smoke test does not consent; it ticks the boxes so the session
      // can run, and the data say so (consent_given is "autotest").
      for (var j = 0; j < boxes.length; j++) boxes[j].checked = true;
    }
    update();
  },
  on_finish: function (data) {
    data.consent_given = window.AUTO_TEST ? "autotest" : "yes";
    data.consent_statements = STUDY_WELCOME_CONSENT_STATEMENTS.length;
  },
};
language_vision_SemPri_TIMELINE.push(study_welcome_consent_form);
