import test from "node:test";
import assert from "node:assert/strict";
import { scoreFromMistakes } from "../../src/lib/score.js";

test("scoreFromMistakes returns 100 when there are no mistakes", () => {
  assert.equal(scoreFromMistakes([]), 100);
  assert.equal(scoreFromMistakes(), 100);
});

test("scoreFromMistakes subtracts 5 for spelling and 10 for grammar or vocabulary", () => {
  const score = scoreFromMistakes([
    { type: "spelling" },
    { type: "grammar" },
    { type: "vocabulary" }
  ]);
  assert.equal(score, 75);
});

test("scoreFromMistakes scores one spelling mistake and one grammar mistake as 85", () => {
  assert.equal(
    scoreFromMistakes([{ type: "spelling" }, { type: "grammar" }]),
    85
  );
});

test("scoreFromMistakes uses the catalog weight when a code is present", () => {
  assert.equal(scoreFromMistakes([{ code: "spelling", type: "grammar" }]), 95);
  assert.equal(scoreFromMistakes([{ code: "grammar", type: "spelling" }]), 90);
  assert.equal(scoreFromMistakes([{ code: "vocabulary" }]), 90);
  assert.equal(scoreFromMistakes([{ code: "first_person_i" }]), 95);
  assert.equal(scoreFromMistakes([{ code: "sentence_start_cap" }]), 95);
  assert.equal(scoreFromMistakes([{ code: "missing_end_punct", type: "punctuation" }]), 95);
  assert.equal(scoreFromMistakes([{ code: "space_before_comma" }]), 95);
  assert.equal(scoreFromMistakes([{ code: "space_after_terminal" }]), 95);
  assert.equal(scoreFromMistakes([{ code: "comma_space_both" }]), 95);
});

test("scoreFromMistakes treats unknown types as grammar/vocab penalties", () => {
  assert.equal(scoreFromMistakes([{ type: "punctuation" }]), 90);
  assert.equal(scoreFromMistakes([{}]), 90);
});

test("scoreFromMistakes never goes below 0", () => {
  const mistakes = Array.from({ length: 12 }, () => ({ type: "grammar" }));
  assert.equal(scoreFromMistakes(mistakes), 0);
});
