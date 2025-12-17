import { test } from "node:test";
import assert from "node:assert/strict";

const { buildCheckPrompt } = await import("../../src/config/prompts.js");

test("includes topic section when topic text is provided", () => {
  const prompt = buildCheckPrompt("Sample text.", "My hobby");
  assert.ok(prompt.includes('指定トピック: "My hobby"'), "topic label missing");
  assert.ok(prompt.includes("生徒の英文"), "student text missing");
});

test("omits topic section when topic is null", () => {
  const prompt = buildCheckPrompt("Sample text.", null);
  assert.equal(prompt.includes("指定トピック"), false);
});

test("describes topicFeedback output requirements", () => {
  const prompt = buildCheckPrompt("Sample text.", null);
  assert.ok(prompt.includes("topicFeedback"), "topicFeedback instructions missing");
  assert.ok(prompt.includes("prepChecklist"), "prepChecklist instructions missing");
  assert.ok(prompt.includes("PREP"), "PREP guidance missing");
});

test("omits PREP instructions when includePrepFeedback is false", () => {
  const prompt = buildCheckPrompt("Sample text.", "My hobby", { includePrepFeedback: false });
  assert.ok(prompt.includes("topicFeedback = null"), "Prompt should explicitly disable topicFeedback");
  assert.equal(prompt.includes("prepChecklist"), false, "Prompt should omit PREP checklist instructions");
});
