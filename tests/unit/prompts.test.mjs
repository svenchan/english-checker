import { test } from "node:test";
import assert from "node:assert/strict";

const {
  SYSTEM_MESSAGE,
  SYSTEM_MESSAGE_VARIANTS,
  buildCheckPrompt,
  GROQ_SETTINGS
} = await import("../../src/config/prompts.js");

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
  assert.ok(prompt.includes("point="), "PREP field guidance missing");
  assert.ok(prompt.includes("reason="), "reason guidance missing");
  assert.ok(prompt.includes("evidence="), "evidence guidance missing");
  assert.ok(prompt.includes("pointSummary="), "pointSummary guidance missing");
  assert.ok(prompt.includes("Japanese"), "student-facing values should stay Japanese");
});

test("omits PREP instructions when includePrepFeedback is false", () => {
  const prompt = buildCheckPrompt("Sample text.", "My hobby", { includePrepFeedback: false });
  assert.equal(prompt.includes("<topic>"), false);
  assert.equal(prompt.includes("prepChecklist"), false, "Prompt should omit PREP checklist instructions");
  assert.equal(prompt.includes("topicFeedback"), false, "Prompt should omit topicFeedback guidance");
});

test("system message is English rules with Japanese explanations and skips server-owned surface rules", () => {
  assert.ok(SYSTEM_MESSAGE.startsWith("You are an English writing teacher"), "rules should be English");
  assert.ok(SYSTEM_MESSAGE.includes("easy Japanese"), "explanations must stay Japanese");
  assert.ok(
    SYSTEM_MESSAGE.includes("Sentence-start capitals, capital \"I\""),
    "should tell the model to skip server-owned surface rules"
  );
  assert.ok(
    SYSTEM_MESSAGE.includes("spacing around , . ? !"),
    "should tell the model to skip punctuation spacing (server-owned)"
  );
  assert.ok(
    SYSTEM_MESSAGE.includes('spelling: set to "" (empty). The server writes it.'),
    "spelling explanations should be left empty for the server"
  );
  assert.ok(
    SYSTEM_MESSAGE.includes("not a real English spelling"),
    "spelling should cover real misspellings"
  );
  assert.equal(
    SYSTEM_MESSAGE.includes("space before , or ."),
    false,
    "active prompt should not ask the model to reason about punctuation spacing"
  );
  assert.equal(
    SYSTEM_MESSAGE.includes("missing/wrong mid-sentence"),
    false,
    "active prompt should not ask the model to flag mid-sentence punct"
  );
});

test("prompt variants expose baseline JA and intermediate English for measurement", () => {
  assert.ok(SYSTEM_MESSAGE_VARIANTS.baseline_ja.includes("あなたは日本の中学生向け"));
  assert.ok(SYSTEM_MESSAGE_VARIANTS.en_rules.includes("space before , or ."));
  assert.equal(SYSTEM_MESSAGE_VARIANTS.en_rules_no_punct, SYSTEM_MESSAGE);
});

test("GROQ_SETTINGS: low reasoning, temp 0.3, seed for iteration", () => {
  assert.equal(GROQ_SETTINGS.reasoning_effort, "low");
  assert.equal(GROQ_SETTINGS.model, "openai/gpt-oss-20b");
  assert.equal(GROQ_SETTINGS.temperature, 0.3);
  assert.equal(GROQ_SETTINGS.seed, 42);
});
