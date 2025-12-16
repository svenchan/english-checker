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
