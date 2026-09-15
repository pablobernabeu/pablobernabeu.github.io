/****************************************************************/
/** MENTAL COMPARISON TASK – STIMULI (tag: 'MCT')              **/
/****************************************************************/

/*
Multimodal mental comparison paradigm adapted from Suggate (2024).
Participants compare pairs of real-world objects on a sensory
property (visual, auditory, or tactile) and indicate which object
possesses more of that property.

Each item has:
  - modality : 'visual' | 'auditory' | 'tactile'
  - property : the comparative adjective shown in the question
  - word1    : left word  (response key F)
  - word2    : right word (response key J)
  - correct_key : 'f' or 'j' (which word has *more* of the property)

Items are counterbalanced so the correct answer is F on half the
trials and J on the other half within each modality.

ITEM ORDER IS LOAD-BEARING – DO NOT SORT THIS FILE.
The registered split-half reliability (Outcome-neutral criteria in
preregistration.qmd) is computed on a fixed odd-even split of the
items IN THE ORDER LISTED HERE. Each modality block therefore runs
f, f, j, j, f, f, j, j, ... so that both halves hold a near-equal
mix of F-correct and J-correct items (odd half 4 F / 4 J, even half
4 F / 3 J). A strictly alternating f, j, f, j order would put every
F-correct item in one half and every J-correct item in the other, so
a participant's key bias would drive the two halves apart and bias
the reliability estimate downward for reasons unrelated to imagery.
Presentation order is randomised at run time, so this ordering
affects only how the split-half is formed, never what a participant
sees.
*/

// ── PRACTICE STIMULI (6 items: 2 per modality) ─────────────────

var MCT_practice_stimuli = [
  // Visual
  {
    modality: "visual",
    property: "brighter",
    word1: "sun",
    word2: "candle",
    correct_key: "f",
  },
  {
    modality: "visual",
    property: "darker",
    word1: "milk",
    word2: "coal",
    correct_key: "j",
  },
  // Auditory
  {
    modality: "auditory",
    property: "louder",
    word1: "whisper",
    word2: "thunder",
    correct_key: "j",
  },
  {
    modality: "auditory",
    property: "quieter",
    word1: "library",
    word2: "concert",
    correct_key: "f",
  },
  // Tactile
  {
    modality: "tactile",
    property: "softer",
    word1: "pillow",
    word2: "brick",
    correct_key: "f",
  },
  {
    modality: "tactile",
    property: "rougher",
    word1: "silk",
    word2: "sandpaper",
    correct_key: "j",
  },
];

// ── MAIN STIMULI (45 items: 15 per modality) ───────────────────

var MCT_main_stimuli = [
  // ── Visual (15 items) ────────────────────────────────────────

  {
    modality: "visual",
    property: "shinier",
    word1: "diamond",
    word2: "coal",
    correct_key: "f",
  },
  {
    modality: "visual",
    property: "rounder",
    word1: "basketball",
    word2: "book",
    correct_key: "f",
  },
  {
    modality: "visual",
    property: "shinier",
    word1: "rust",
    word2: "mirror",
    correct_key: "j",
  },
  {
    modality: "visual",
    property: "rounder",
    word1: "ruler",
    word2: "orange",
    correct_key: "j",
  },
  {
    modality: "visual",
    property: "bigger",
    word1: "elephant",
    word2: "mouse",
    correct_key: "f",
  },
  {
    modality: "visual",
    property: "brighter",
    word1: "spotlight",
    word2: "shadow",
    correct_key: "f",
  },
  {
    modality: "visual",
    property: "bigger",
    word1: "ant",
    word2: "horse",
    correct_key: "j",
  },
  {
    modality: "visual",
    property: "brighter",
    word1: "cellar",
    word2: "lighthouse",
    correct_key: "j",
  },
  {
    modality: "visual",
    property: "taller",
    word1: "giraffe",
    word2: "rabbit",
    correct_key: "f",
  },
  {
    modality: "visual",
    property: "darker",
    word1: "midnight",
    word2: "noon",
    correct_key: "f",
  },
  {
    modality: "visual",
    property: "taller",
    word1: "worm",
    word2: "skyscraper",
    correct_key: "j",
  },
  {
    modality: "visual",
    property: "darker",
    word1: "snowflake",
    word2: "charcoal",
    correct_key: "j",
  },
  {
    modality: "visual",
    property: "wider",
    word1: "ocean",
    word2: "stream",
    correct_key: "f",
  },
  {
    modality: "visual",
    property: "longer",
    word1: "train",
    word2: "coin",
    correct_key: "f",
  },
  {
    modality: "visual",
    property: "wider",
    word1: "needle",
    word2: "highway",
    correct_key: "j",
  },

  // ── Auditory (15 items) ──────────────────────────────────────

  {
    modality: "auditory",
    property: "louder",
    word1: "explosion",
    word2: "whisper",
    correct_key: "f",
  },
  {
    modality: "auditory",
    property: "quieter",
    word1: "snowfall",
    word2: "jackhammer",
    correct_key: "f",
  },
  {
    modality: "auditory",
    property: "louder",
    word1: "feather",
    word2: "siren",
    correct_key: "j",
  },
  {
    modality: "auditory",
    property: "quieter",
    word1: "firework",
    word2: "butterfly",
    correct_key: "j",
  },
  {
    modality: "auditory",
    property: "higher-pitched",
    word1: "whistle",
    word2: "drum",
    correct_key: "f",
  },
  {
    modality: "auditory",
    property: "lower-pitched",
    word1: "bass",
    word2: "bell",
    correct_key: "f",
  },
  {
    modality: "auditory",
    property: "higher-pitched",
    word1: "tuba",
    word2: "flute",
    correct_key: "j",
  },
  {
    modality: "auditory",
    property: "lower-pitched",
    word1: "piccolo",
    word2: "foghorn",
    correct_key: "j",
  },
  {
    modality: "auditory",
    property: "louder",
    word1: "cannon",
    word2: "mouse",
    correct_key: "f",
  },
  {
    modality: "auditory",
    property: "quieter",
    word1: "breeze",
    word2: "trumpet",
    correct_key: "f",
  },
  {
    modality: "auditory",
    property: "louder",
    word1: "leaf",
    word2: "chainsaw",
    correct_key: "j",
  },
  {
    modality: "auditory",
    property: "quieter",
    word1: "alarm",
    word2: "cloud",
    correct_key: "j",
  },
  {
    modality: "auditory",
    property: "higher-pitched",
    word1: "robin",
    word2: "lion",
    correct_key: "f",
  },
  {
    modality: "auditory",
    property: "lower-pitched",
    word1: "cello",
    word2: "triangle",
    correct_key: "f",
  },
  {
    modality: "auditory",
    property: "higher-pitched",
    word1: "whale",
    word2: "cricket",
    correct_key: "j",
  },

  // ── Tactile (15 items) ───────────────────────────────────────

  {
    modality: "tactile",
    property: "rougher",
    word1: "gravel",
    word2: "glass",
    correct_key: "f",
  },
  {
    modality: "tactile",
    property: "smoother",
    word1: "marble",
    word2: "sandpaper",
    correct_key: "f",
  },
  {
    modality: "tactile",
    property: "rougher",
    word1: "satin",
    word2: "bark",
    correct_key: "j",
  },
  {
    modality: "tactile",
    property: "smoother",
    word1: "cactus",
    word2: "pearl",
    correct_key: "j",
  },
  {
    modality: "tactile",
    property: "harder",
    word1: "steel",
    word2: "cotton",
    correct_key: "f",
  },
  {
    modality: "tactile",
    property: "softer",
    word1: "velvet",
    word2: "stone",
    correct_key: "f",
  },
  {
    modality: "tactile",
    property: "harder",
    word1: "sponge",
    word2: "granite",
    correct_key: "j",
  },
  {
    modality: "tactile",
    property: "softer",
    word1: "iron",
    word2: "feather",
    correct_key: "j",
  },
  {
    modality: "tactile",
    property: "heavier",
    word1: "anvil",
    word2: "balloon",
    correct_key: "f",
  },
  {
    modality: "tactile",
    property: "lighter",
    word1: "paper",
    word2: "brick",
    correct_key: "f",
  },
  {
    modality: "tactile",
    property: "heavier",
    word1: "tissue",
    word2: "boulder",
    correct_key: "j",
  },
  {
    modality: "tactile",
    property: "lighter",
    word1: "lead",
    word2: "leaf",
    correct_key: "j",
  },
  {
    modality: "tactile",
    property: "warmer",
    word1: "fire",
    word2: "ice",
    correct_key: "f",
  },
  {
    modality: "tactile",
    property: "colder",
    word1: "frost",
    word2: "lava",
    correct_key: "f",
  },
  {
    modality: "tactile",
    property: "warmer",
    word1: "glacier",
    word2: "oven",
    correct_key: "j",
  },
];
