/* ---------------------------------------------------------------------------
   Study debrief

   The session's final screen. Both entry points load this module after
   mct_task.js, so the Gorilla deployment and the local one show the same
   debrief. Gorilla once had none: the session ended on the last comparison
   trial and gorilla.finish() moved the participant on without a word, which is
   not what the information sheet and the ethics application say happens. The
   text is the debrief registered in section 14 of
   preregistration/ethics_application_SSH_IDREC.md, and the two must be changed
   together.

   The button ends the trial, and with it the timeline, so each entry point's
   on_finish does the hand-back: gorilla.finish() on Gorilla, a redirect to the
   completion URL locally. Manual review is stated as such, twice over.
   "Approved shortly" would be a timing promise the review queue does not
   always keep, and "your payment approved" would promise approval itself,
   which the ethics application conditions on Prolific's exceptionally-fast
   flag and demonstrated low effort. Review is promised, and approval follows.

   The row carries study_phase "debrief" and no task tag, so it is never read
   as an MCT observation. Its section label still inherits the last task,
   because the entry points' section labelling follows task tags only.
   --------------------------------------------------------------------------- */

var study_debrief = {
  type: jsPsychHtmlButtonResponse,
  choices: ["Back to Prolific"],
  data: { study_phase: "debrief" },
  stimulus:
    "<div style='max-width:42em;margin:auto;text-align:left'>" +
    "<h2>Thank you</h2>" +
    "<p>That is the end of the study. Your responses have been saved. Your " +
    "submission will now be reviewed on Prolific, usually within a few days, " +
    "and your payment released on approval.</p>" +
    "<p><b>What were we studying?</b> When you read a word, your understanding " +
    "of it draws on two kinds of knowledge: the patterns of language you have " +
    "been exposed to, and your sensory experience of the things words refer to. " +
    "In the main task, each word was preceded by another word, and we measured " +
    "how much that first word sped up or slowed down your decision. By varying " +
    "how closely the two words were related, either in the way they are used in " +
    "language or in how the things they name look, sound and feel, and by " +
    "varying the gap between them, we can estimate how much each kind of " +
    "knowledge contributed, and when.</p>" +
    "<p>The other three tasks measured reading fluency, sensitivity to visual " +
    "motion, and how quickly you compare remembered properties of objects. " +
    "These let us ask whether people who differ in these respects rely on the " +
    "two kinds of knowledge to different degrees.</p>" +
    "<p>There was no deception in this study, and there were no right answers " +
    "we were hoping you would give.</p>" +
    "<p><b>Finding out what we found.</b> The results will be published " +
    "openly, and a plain-language summary will be posted with them.</p>" +
    "<p><b>Questions or concerns?</b> Message us through Prolific.</p>" +
    "<p>Thank you for your time. Press the button to return to Prolific.</p>" +
    "</div>",
  // Marks this as the session's last row, so the session-integrity counts
  // are merged into it as it finishes (see js/session_integrity.js).
  on_start: function () {
    window.SESSION_ENDING = true;
    if (typeof window.fullscreenGuardDisarm === "function") {
      window.fullscreenGuardDisarm();
    }
  },
};
language_vision_SemPri_TIMELINE.push(study_debrief);
