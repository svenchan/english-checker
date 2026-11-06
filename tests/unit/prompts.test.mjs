import { test } from "node:test";
import assert from "node:assert/strict";

const { SYSTEM_MESSAGE, buildCheckPrompt } = await import("../../src/config/prompts.js");

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
  assert.equal(
    SYSTEM_MESSAGE.includes("文の最初が小文字なら、綴りとして指摘する。"),
    false
  );
  assert.equal(
    SYSTEM_MESSAGE.includes("文章のいちばん最後に . ? ! が無ければ、綴りとして指摘する。"),
    false
  );
  assert.ok(SYSTEM_MESSAGE.includes(OTHER_PUNCT_LINE));
  assert.ok(SYSTEM_MESSAGE.includes(SPELLING_EXPLANATION_LINE));
});
