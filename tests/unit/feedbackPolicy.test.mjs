import test from "node:test";
import assert from "node:assert/strict";
import { findFirstPersonMistakes, findServerMistakes } from "../../src/lib/surfaceRules.js";
import { applyFeedbackPolicy } from "../../src/lib/applyFeedbackPolicy.js";

test("findFirstPersonMistakes flags i and its contractions", () => {
  const text = "i think i'm ready and i'll go if i've time or i'd rather stay";
  const mistakes = findFirstPersonMistakes(text);
  assert.deepEqual(
    mistakes.map((mistake) => [mistake.original, mistake.corrected]),
    [
      ["i", "I"],
      ["i'm", "I'm"],
      ["i'll", "I'll"],
      ["i've", "I've"],
      ["i'd", "I'd"]
    ]
  );
  assert.equal(mistakes[0].code, "first_person_i");
  assert.equal(mistakes[0].type, "spelling");
  assert.equal(mistakes[1].explanation, "つづりが間違っています。i'm → I'm");
});

test("findFirstPersonMistakes accepts a curly apostrophe and a mixed-case tail", () => {
  const mistakes = findFirstPersonMistakes("i’m here and i'LL go");
  assert.deepEqual(
    mistakes.map((mistake) => mistake.corrected),
    ["I'm", "I'll"]
  );
  assert.equal(mistakes[0].explanation, "つづりが間違っています。i’m → I'm");
});

test("findFirstPersonMistakes ignores correct I and lookalike words", () => {
  const mistakes = findFirstPersonMistakes("I think it is inside and isn't i.e. fine. I'll go.");
  assert.deepEqual(mistakes, []);
});

test("applyFeedbackPolicy explains a lone i'll from the server", () => {
  const text = "My friend and i'll go.";
  const feedback = applyFeedbackPolicy(text, { mistakes: [], overallScore: 100 });
  assert.equal(feedback.mistakes.length, 1);
  assert.equal(feedback.mistakes[0].original, "i'll");
  assert.equal(feedback.mistakes[0].corrected, "I'll");
  assert.equal(feedback.mistakes[0].explanation, "つづりが間違っています。i'll → I'll");
  assert.equal(feedback.overallScore, 95);
  assert.equal(text.slice(feedback.mistakes[0].start, feedback.mistakes[0].end), "i'll");
});

test("applyFeedbackPolicy drops a model mistake that only fixes first person", () => {
  const feedback = applyFeedbackPolicy("My friend and i'll go.", {
    mistakes: [
      {
        original: "i'll",
        corrected: "I'll",
        explanation: "モデルの説明",
        type: "spelling"
      }
    ]
  });
  assert.equal(feedback.mistakes.length, 1);
  assert.equal(feedback.mistakes[0].explanation, "つづりが間違っています。i'll → I'll");
  assert.equal(feedback.overallScore, 95);
});

test("findServerMistakes capitalizes real sentence starts and skips titles", () => {
  const text = "my friend is kind. she is nice. I met Mr. tanaka.";
  const mistakes = findServerMistakes(text);
  assert.deepEqual(
    mistakes.map((mistake) => [mistake.original, mistake.corrected, mistake.code]),
    [
      ["my", "My", "sentence_start_cap"],
      ["she", "She", "sentence_start_cap"]
    ]
  );
  assert.equal(mistakes[1].type, "capitalization");
  assert.equal(mistakes[1].explanation, "文のはじめは大文字にします。she → She");
  assert.equal(findServerMistakes("I met Mr. tanaka yesterday").length, 0);
  assert.equal(findServerMistakes("I like the U.S. army and i.e. this.").length, 0);
  assert.equal(findServerMistakes("3. she has a cat").length, 0);
});

test("findServerMistakes keeps a leading i as spelling only", () => {
  const mistakes = findServerMistakes("i like cats. she is kind");
  assert.deepEqual(
    mistakes.map((mistake) => [mistake.original, mistake.code]),
    [
      ["i", "first_person_i"],
      ["she", "sentence_start_cap"]
    ]
  );
});

test("applyFeedbackPolicy explains sentence starts from the server", () => {
  const feedback = applyFeedbackPolicy("my friend is kind. she is nice. I met Mr. tanaka.", {
    mistakes: []
  });
  assert.deepEqual(
    feedback.mistakes.map((mistake) => mistake.explanation),
    [
      "文のはじめは大文字にします。my → My",
      "文のはじめは大文字にします。she → She"
    ]
  );
  assert.equal(feedback.overallScore, 90);
});

test("applyFeedbackPolicy drops a model mistake that only capitalizes a sentence start", () => {
  const feedback = applyFeedbackPolicy("I like cats. she is kind", {
    mistakes: [
      {
        original: "she",
        corrected: "She",
        explanation: "モデルの説明",
        type: "spelling"
      }
    ]
  });
  assert.equal(feedback.mistakes.length, 1);
  assert.equal(feedback.mistakes[0].explanation, "文のはじめは大文字にします。she → She");
  assert.equal(feedback.overallScore, 95);
});

test("applyFeedbackPolicy keeps a wider rewrite that also capitalizes", () => {
  const feedback = applyFeedbackPolicy("my friend is kind", {
    mistakes: [
      {
        original: "my friend is kind",
        corrected: "My friends are kind",
        explanation: "友達は複数だよ。",
        type: "grammar"
      }
    ]
  });
  assert.equal(feedback.mistakes.length, 1);
  assert.equal(feedback.mistakes[0].explanation, "友達は複数だよ。");
  assert.equal(feedback.overallScore, 90);
});

test("applyFeedbackPolicy keeps a wider model rewrite and skips the server hit", () => {
  const feedback = applyFeedbackPolicy("i like cat", {
    mistakes: [
      {
        original: "i like cat",
        corrected: "I like cats",
        explanation: "猫は複数だよ。",
        type: "grammar"
      }
    ]
  });
  assert.equal(feedback.mistakes.length, 1);
  assert.equal(feedback.mistakes[0].explanation, "猫は複数だよ。");
  assert.equal(feedback.mistakes[0].code, undefined);
  assert.equal(feedback.overallScore, 90);
});
