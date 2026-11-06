/**
 * Fixed type and weight for every mistake code.
 * Scoring reads the code when one is present. Checks that predate codes
 * fall back to the mistake type in score.js.
 */
export const MISTAKE_CATALOG = {
  sentence_start_cap: { type: "capitalization", weight: 5 },
  first_person_i: { type: "spelling", weight: 5 },
  missing_end_punct: { type: "punctuation", weight: 5 },
  spelling: { type: "spelling", weight: 5 },
  grammar: { type: "grammar", weight: 10 },
  vocabulary: { type: "vocabulary", weight: 10 }
};

export function catalogEntry(code) {
  if (typeof code !== "string" || !code) {
    return null;
  }
  return MISTAKE_CATALOG[code] ?? null;
}
