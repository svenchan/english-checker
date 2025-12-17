import { JAPANESE_LOANWORD_SET } from "../features/writing-checker/constants.js";

const PUNCTUATION_REGEX = /[.,!?;:'"()[\]{}—–-]/g;

export function countEffectiveWords(input = "") {
  if (!input || typeof input !== "string") {
    return 0;
  }

  const rawWords = input
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (!rawWords.length) {
    return 0;
  }

  const filtered = rawWords.filter((word, index) => {
    const cleanWord = word.replace(PUNCTUATION_REGEX, "");
    if (!cleanWord) {
      return false;
    }

    const lowerWord = cleanWord.toLowerCase();
    if (JAPANESE_LOANWORD_SET.has(lowerWord)) {
      return false;
    }

    if (lowerWord === "i") {
      return true;
    }

    const isStartOfSentence = index === 0 || /[.!?]$/.test(rawWords[index - 1] || "");
    const firstChar = cleanWord[0];
    const isAlpha = firstChar?.toLowerCase() !== firstChar?.toUpperCase();
    const isCapitalized = isAlpha && firstChar === firstChar.toUpperCase();

    if (!isStartOfSentence && isCapitalized) {
      return false;
    }

    return lowerWord.length > 0;
  });

  return filtered.length;
}

export function countSentences(input = "") {
  if (!input || typeof input !== "string") {
    return 0;
  }

  return input
    .split(/[.!?]+/g)
    .map((part) => part.trim())
    .filter(Boolean).length;
}
