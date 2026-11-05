const SPELLING_PENALTY = 5;
const GRAMMAR_OR_VOCAB_PENALTY = 10;

function penaltyForType(type) {
  return type === "spelling" ? SPELLING_PENALTY : GRAMMAR_OR_VOCAB_PENALTY;
}

/**
 * Score writing from 100 based on the number of corrections.
 * Spelling mistakes cost 5 points; grammar and vocabulary cost 10 each.
 * The result is clamped to 0–100.
 * @param {Array<{ type?: string }>} mistakes
 * @returns {number}
 */
export function scoreFromMistakes(mistakes = []) {
  if (!Array.isArray(mistakes) || mistakes.length === 0) {
    return 100;
  }

  const deducted = mistakes.reduce((total, mistake) => {
    return total + penaltyForType(mistake?.type);
  }, 0);

  return Math.max(0, 100 - deducted);
}
