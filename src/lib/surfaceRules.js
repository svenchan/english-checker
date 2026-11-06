import { catalogEntry } from "./mistakeCatalog.js";

const FIRST_PERSON_CODE = "first_person_i";
const APOSTROPHE = "['’]";
const FIRST_PERSON_PATTERN = new RegExp(
  `(?<![A-Za-z])(?:i${APOSTROPHE}(?:[mM]|[lL][lL]|[vV][eE]|[dD])|i(?!\\.[A-Za-z]))(?![A-Za-z'’])`,
  "g"
);

const CORRECTIONS = {
  i: "I",
  "i'm": "I'm",
  "i'll": "I'll",
  "i've": "I've",
  "i'd": "I'd"
};

export function spellingExplanation(original, corrected) {
  return `つづりが間違っています。${original} → ${corrected}`;
}

function correctFirstPerson(token) {
  const key = token.toLowerCase().replace(/’/g, "'");
  return CORRECTIONS[key] ?? token;
}

/**
 * Lowercase first-person i, i'm, i'll, i've, and i'd.
 * Straight and curly apostrophes both match. it, isn't, and i.e. do not.
 * @param {string} text
 * @returns {Array<{ code: string, type: string, original: string, corrected: string, explanation: string, start: number, end: number }>}
 */
export function findFirstPersonMistakes(text) {
  if (typeof text !== "string" || text.length === 0) {
    return [];
  }

  const entry = catalogEntry(FIRST_PERSON_CODE);
  const mistakes = [];
  FIRST_PERSON_PATTERN.lastIndex = 0;

  for (const match of text.matchAll(FIRST_PERSON_PATTERN)) {
    const original = match[0];
    const corrected = correctFirstPerson(original);
    if (corrected === original) {
      continue;
    }
    const start = match.index ?? 0;
    mistakes.push({
      code: FIRST_PERSON_CODE,
      type: entry.type,
      original,
      corrected,
      explanation: spellingExplanation(original, corrected),
      start,
      end: start + original.length
    });
  }

  return mistakes;
}
