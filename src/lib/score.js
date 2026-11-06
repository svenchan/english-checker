import { catalogEntry } from "./mistakeCatalog.js";

const SPELLING_PENALTY = 5;
const GRAMMAR_OR_VOCAB_PENALTY = 10;

function penaltyForType(type) {
  return type === "spelling" ? SPELLING_PENALTY : GRAMMAR_OR_VOCAB_PENALTY;
}

/**
 * A coded mistake uses its catalog weight. A mistake with no known code
 * keeps the previous rule: spelling costs 5, every other type costs 10.
 * @param {{ code?: string, type?: string }} mistake
 * @returns {number}
 */
export function penaltyForMistake(mistake) {
  const entry = catalogEntry(mistake?.code);
  if (entry) {
    return entry.weight;
  }
  return penaltyForType(mistake?.type);
}

/**
 * Score writing from 100 based on the mistake list.
 * The result is clamped to 0–100.
 * @param {Array<{ code?: string, type?: string }>} mistakes
 * @returns {number}
 */
export function scoreFromMistakes(mistakes = []) {
  if (!Array.isArray(mistakes) || mistakes.length === 0) {
    return 100;
  }

  const deducted = mistakes.reduce((total, mistake) => {
    return total + penaltyForMistake(mistake);
  }, 0);

  return Math.max(0, 100 - deducted);
}
