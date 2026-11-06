import { test } from "node:test";
import assert from "node:assert/strict";

const { SYSTEM_MESSAGE, buildCheckPrompt } = await import("../../src/config/prompts.js");

const SENTENCE_START_LINE =
  "文の最初が小文字なら、綴りとして指摘する。Mr. Mrs. Ms. Dr. Prof. St. Jr. Sr. や、1文字の頭文字のピリオドのあとは、新しい文にしない。";
const MISSING_END_LINE =
  "文章のいちばん最後に . ? ! が無ければ、綴りとして指摘する。最後以外の文に終わりの記号が無くても指摘しない。";
const OTHER_PUNCT_LINE = ", や . の前の空白など、それ以外の句読点も綴りとして指摘する。";
const SPELLING_EXPLANATION_LINE =
  "つづりの explanation は、なぜそのつづりをなおすのかを1文書く。つづりミスという名前は書かない。";

test("includes topic section when topic text is provided", () => {
  const prompt = buildCheckPrompt("Sample text.", "My hobby");
  assert.ok(prompt.includes("<topic>My hobby</topic>"), "topic label missing");
  assert.ok(prompt.includes("<student_text>"), "student text wrapper missing");
  assert.ok(prompt.includes("Sample text."), "student text missing");
});

test("omits topic section when topic is null", () => {
  const prompt = buildCheckPrompt("Sample text.", null);
  assert.equal(prompt.includes("<topic>"), false);
});

test("describes topicFeedback output requirements", () => {
  const prompt = buildCheckPrompt("Sample text.", "My hobby");
  assert.ok(prompt.includes("topicFeedback"), "topicFeedback instructions missing");
  assert.ok(prompt.includes("prepChecklist"), "prepChecklist instructions missing");
  assert.ok(prompt.includes("PREP"), "PREP guidance missing");
});

test("omits PREP instructions when includePrepFeedback is false", () => {
  const prompt = buildCheckPrompt("Sample text.", "My hobby", { includePrepFeedback: false });
  assert.equal(prompt.includes("<topic>"), false);
  assert.equal(prompt.includes("prepChecklist"), false, "Prompt should omit PREP checklist instructions");
  assert.equal(prompt.includes("PREP"), false, "Prompt should omit PREP guidance");
});

test("asks the model to flag each surface rule on its own line", () => {
  assert.equal(SYSTEM_MESSAGE.includes("大文字や句読点は綴り"), false);
  assert.equal(SYSTEM_MESSAGE.includes("一語の i、i'm、i'll、i've、i'd は綴りとして指摘する。"), false);
  assert.ok(SYSTEM_MESSAGE.includes(SENTENCE_START_LINE));
  assert.ok(SYSTEM_MESSAGE.includes(MISSING_END_LINE));
  assert.ok(SYSTEM_MESSAGE.includes(OTHER_PUNCT_LINE));
  assert.ok(SYSTEM_MESSAGE.includes(SPELLING_EXPLANATION_LINE));
});
