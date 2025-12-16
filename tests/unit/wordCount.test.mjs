import test from "node:test";
import assert from "node:assert/strict";
import { countEffectiveWords } from "../../src/lib/wordCount.js";

test("countEffectiveWords counts simple sentences", () => {
  const text = "I went to school yesterday with my friend.";
  assert.equal(countEffectiveWords(text), 8);
});

test("countEffectiveWords filters Japanese loan words", () => {
  const text = "I ate sushi and tofu today with my friends.";
  assert.equal(countEffectiveWords(text), 7);
});

test("countEffectiveWords filters mid-sentence proper nouns", () => {
  const text = "Ken plays soccer with Ken every day.";
  assert.equal(countEffectiveWords(text), 6);
});

test("countEffectiveWords handles empty and punctuation-heavy input", () => {
  assert.equal(countEffectiveWords(""), 0);
  assert.equal(countEffectiveWords("!!!"), 0);
});
