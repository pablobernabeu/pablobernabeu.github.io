/* ARCHIVED — NOT LOADED. Removed from the registered battery; retained for reference only. See ../../README.md (File layout) for why. */
/****************************************************************/
/** PLYMOUTH SENSORY IMAGERY QUESTIONNAIRE – STIMULI            **/
/** (Psi-Q 21-item short form; tag: 'PsiQ')                   **/
/****************************************************************/

/*
The Psi-Q measures the vividness of mental imagery across seven
sensory modalities (Andrade et al., 2014). This 21-item short form
uses the three highest-loading items per modality, which produces
scores highly correlated with the full 35-item version.

Each item has:
  - modality : one of the seven sensory modalities
  - name     : unique identifier for the data output
  - prompt   : the imagery scenario to be rated

Participants rate items on a 0–10 scale:
  0 = "No image at all"
  10 = "As vivid as real life"

Modalities are presented in their standard order; items within
each modality are randomized at runtime.

References:
  Andrade, J., May, J., Deeprose, C., Baugh, S.-J., & Ganis, G.
  (2014). Assessing vividness of mental imagery: The Plymouth
  Sensory Imagery Questionnaire. British Journal of Psychology,
  105(4), 547–563. https://doi.org/10.1111/bjop.12050
*/

// ── Psi-Q ITEMS ────────────────────────────────────────────────

var PsiQ_items = [
  // ── 1. Vision ────────────────────────────────────────────────

  {
    modality: "vision",
    name: "vis_1",
    prompt:
      "Think of the appearance of a friend you see frequently. How clearly can you see their face in your mind?",
  },
  {
    modality: "vision",
    name: "vis_2",
    prompt:
      "Think of the front of a shop you often visit. How clearly can you see its overall appearance?",
  },
  {
    modality: "vision",
    name: "vis_3",
    prompt:
      "Think of a familiar landscape or view. How clearly can you see it in your mind?",
  },

  // ── 2. Sound ─────────────────────────────────────────────────

  {
    modality: "sound",
    name: "snd_1",
    prompt:
      "Think of the sound of a car horn. How clearly can you hear it in your mind?",
  },
  {
    modality: "sound",
    name: "snd_2",
    prompt:
      "Think of the voice of a friend you hear frequently. How clearly can you hear it?",
  },
  {
    modality: "sound",
    name: "snd_3",
    prompt:
      "Think of the sound of a door slamming. How clearly can you hear it in your mind?",
  },

  // ── 3. Smell ─────────────────────────────────────────────────

  {
    modality: "smell",
    name: "sml_1",
    prompt:
      "Think of the smell of fresh paint. How clearly can you smell it in your mind?",
  },
  {
    modality: "smell",
    name: "sml_2",
    prompt:
      "Think of the smell of freshly baked bread. How clearly can you smell it in your mind?",
  },
  {
    modality: "smell",
    name: "sml_3",
    prompt:
      "Think of the smell of a bonfire. How clearly can you smell it in your mind?",
  },

  // ── 4. Taste ─────────────────────────────────────────────────

  {
    modality: "taste",
    name: "tst_1",
    prompt:
      "Think of the taste of salt. How clearly can you taste it in your mind?",
  },
  {
    modality: "taste",
    name: "tst_2",
    prompt:
      "Think of the taste of your favourite food. How clearly can you taste it in your mind?",
  },
  {
    modality: "taste",
    name: "tst_3",
    prompt:
      "Think of the taste of orange juice. How clearly can you taste it in your mind?",
  },

  // ── 5. Touch ─────────────────────────────────────────────────

  {
    modality: "touch",
    name: "tch_1",
    prompt:
      "Think of the feeling of sand under your bare feet. How clearly can you feel it in your mind?",
  },
  {
    modality: "touch",
    name: "tch_2",
    prompt:
      "Think of the feeling of a warm bath or shower. How clearly can you feel it in your mind?",
  },
  {
    modality: "touch",
    name: "tch_3",
    prompt:
      "Think of the feeling of a cold breeze on your face. How clearly can you feel it in your mind?",
  },

  // ── 6. Body sensation ────────────────────────────────────────

  {
    modality: "body",
    name: "bod_1",
    prompt:
      "Think of the feeling of a headache. How clearly can you feel it in your mind?",
  },
  {
    modality: "body",
    name: "bod_2",
    prompt:
      "Think of the feeling of tiredness in your muscles after exercise. How clearly can you feel it?",
  },
  {
    modality: "body",
    name: "bod_3",
    prompt:
      "Think of the feeling of hunger. How clearly can you feel it in your mind?",
  },

  // ── 7. Emotional feeling ─────────────────────────────────────

  {
    modality: "feeling",
    name: "emo_1",
    prompt:
      "Think of the feeling of excitement. How clearly can you feel it in your mind?",
  },
  {
    modality: "feeling",
    name: "emo_2",
    prompt:
      "Think of the feeling of contentment and calm. How clearly can you feel it in your mind?",
  },
  {
    modality: "feeling",
    name: "emo_3",
    prompt:
      "Think of the feeling of being amused. How clearly can you feel it in your mind?",
  },
];
