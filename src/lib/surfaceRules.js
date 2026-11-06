import { catalogEntry } from "./mistakeCatalog.js";

const FIRST_PERSON_CODE = "first_person_i";
const SENTENCE_START_CODE = "sentence_start_cap";
const MISSING_END_CODE = "missing_end_punct";
const CLOSING_QUOTE = /["“”'’]/;
const TITLE_ABBREVIATIONS = new Set(["mr", "mrs", "ms", "dr", "prof", "st", "jr", "sr"]);
const SENTENCE_BOUNDARY = /([.!?])(["“”']*)(\s+)/g;
const WORD_AT_START = /^[A-Za-z]+(?:['’][A-Za-z]+)*/;
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
  return `つづりが間違っている。${original} → ${corrected}`;
}

export function firstPersonExplanation(original, corrected) {
  return `私を表す"I"は大文字で書く。${original} → ${corrected}`;
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
      explanation: firstPersonExplanation(original, corrected),
      start,
      end: start + original.length
    });
  }

  return mistakes;
}

export function sentenceStartExplanation(original, corrected) {
  return `文のはじめは大文字にする。${original} → ${corrected}`;
}

/**
 * Lowercase word at the start of the text, or after . ? ! that really ends
 * a sentence. Mr./Mrs./Ms./Dr./Prof./St./Jr./Sr. and single initials do not.
 * @param {string} text
 */
export function findSentenceStartMistakes(text) {
  if (typeof text !== "string" || text.length === 0) {
    return [];
  }

  const entry = catalogEntry(SENTENCE_START_CODE);
  const mistakes = [];
  const seen = new Set();

  considerSentenceStart(text, indexAfterOpening(text), mistakes, entry, seen);

  SENTENCE_BOUNDARY.lastIndex = 0;
  for (const match of text.matchAll(SENTENCE_BOUNDARY)) {
    const punctIndex = match.index ?? 0;
    if (match[1] === "." && !periodEndsSentence(text, punctIndex)) {
      continue;
    }
    considerSentenceStart(text, punctIndex + match[0].length, mistakes, entry, seen);
  }

  return mistakes;
}

export function missingEndExplanation(original, corrected) {
  return `文の最後には . か ? か ! をつける。${original} → ${corrected}`;
}

/**
 * One mistake when the writing does not end in . ? or !.
 * A closing quote is ignored, so kind." already counts as ended.
 * @param {string} text
 */
export function findMissingEndPunctuation(text) {
  if (typeof text !== "string") {
    return [];
  }

  const trimmedLength = text.trimEnd().length;
  if (trimmedLength === 0) {
    return [];
  }

  let tokenStart = trimmedLength;
  while (tokenStart > 0 && !/\s/.test(text[tokenStart - 1])) {
    tokenStart -= 1;
  }

  let markEnd = trimmedLength;
  while (markEnd > tokenStart && CLOSING_QUOTE.test(text[markEnd - 1])) {
    markEnd -= 1;
  }
  if (markEnd === tokenStart) {
    return [];
  }

  const body = text.slice(tokenStart, markEnd);
  if (/[.!?]$/.test(body)) {
    return [];
  }

  let coreEnd = body.length;
  while (coreEnd > 0 && !/[A-Za-z'’]/.test(body[coreEnd - 1])) {
    coreEnd -= 1;
  }
  const corrected = coreEnd > 0 ? `${body.slice(0, coreEnd)}.` : `${body}.`;
  const entry = catalogEntry(MISSING_END_CODE);
  return [{
    code: MISSING_END_CODE,
    type: entry.type,
    original: body,
    corrected,
    explanation: missingEndExplanation(body, corrected),
    start: tokenStart,
    end: markEnd
  }];
}

/**
 * First-person mistakes win when a sentence starts with i, i'm, i'll, i've, or i'd.
 * The final stop is separate and can share a word with another rule.
 * @param {string} text
 */
export function findServerMistakes(text) {
  const firstPerson = findFirstPersonMistakes(text);
  const sentenceStarts = findSentenceStartMistakes(text).filter((mistake) => {
    return !firstPerson.some((claimed) => rangesOverlap(claimed, mistake));
  });

  return [...firstPerson, ...sentenceStarts, ...findMissingEndPunctuation(text)]
    .sort((a, b) => a.start - b.start);
}

function indexAfterOpening(text) {
  const leading = text.match(/^\s*/);
  let index = leading ? leading[0].length : 0;
  while (index < text.length && /["“”'‘]/.test(text[index])) {
    index += 1;
  }
  return index;
}

function considerSentenceStart(text, index, mistakes, entry, seen) {
  if (index < 0 || index >= text.length || seen.has(index)) {
    return;
  }

  const word = text.slice(index).match(WORD_AT_START);
  if (!word) {
    return;
  }

  const original = word[0];
  const first = original[0];
  if (first === first.toUpperCase()) {
    return;
  }
  if (isInitial(text, index, original)) {
    return;
  }

  const corrected = first.toUpperCase() + original.slice(1);
  seen.add(index);
  mistakes.push({
    code: SENTENCE_START_CODE,
    type: entry.type,
    original,
    corrected,
    explanation: sentenceStartExplanation(original, corrected),
    start: index,
    end: index + original.length
  });
}

function isInitial(text, index, original) {
  if (!/^[A-Za-z]$/.test(original)) {
    return false;
  }
  return text[index + 1] === "." && /[A-Za-z]/.test(text[index + 2] || "");
}

function periodEndsSentence(text, punctIndex) {
  let cursor = punctIndex;
  while (cursor > 0 && text[cursor - 1] === ".") {
    cursor -= 1;
  }

  let start = cursor;
  while (start > 0 && /[A-Za-z'’]/.test(text[start - 1])) {
    start -= 1;
  }

  const word = text.slice(start, cursor);
  if (!word) {
    const before = cursor > 0 ? text[cursor - 1] : "";
    return !/\d/.test(before);
  }
  if (/^[A-Za-z]$/.test(word)) {
    return false;
  }
  return !TITLE_ABBREVIATIONS.has(word.toLowerCase().replace(/’/g, "'"));
}

function rangesOverlap(a, b) {
  return a.start < b.end && b.start < a.end;
}
