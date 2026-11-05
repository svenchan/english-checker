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

test("scoreFromMistakes treats unknown types as grammar/vocab penalties", () => {
  assert.equal(scoreFromMistakes([{ type: "punctuation" }]), 90);
  assert.equal(scoreFromMistakes([{}]), 90);
});

test("scoreFromMistakes never goes below 0", () => {
  const mistakes = Array.from({ length: 12 }, () => ({ type: "grammar" }));
  assert.equal(scoreFromMistakes(mistakes), 0);
});
