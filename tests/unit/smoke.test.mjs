import test from "node:test";
import assert from "node:assert/strict";
import { buildCheckPrompt } from "../../src/config/prompts.js";
import { validateAndFixResponse } from "../../src/lib/validators.js";
import { sanitizeInput } from "../../src/lib/sanitize.js";

function generateSampleText(length = 600) {
  return Array.from({ length }, (_, idx) => String.fromCharCode(65 + (idx % 26))).join("");
}

test("buildCheckPrompt truncates input to 500 characters", () => {
  const input = generateSampleText(600);
  const prompt = buildCheckPrompt(input);
  const truncated = input.slice(0, 500);

  const match = prompt.match(/生徒の英文: "([^"]+)/);
  assert.ok(match, "Prompt should contain the student text line");
  assert.equal(
    match[1],
    truncated,
    "Prompt should embed only the first 500 characters"
  );
});

test("validateAndFixResponse normalizes mistakes and scores", () => {
  const raw = {
    mistakes: [
      {
        original: "I go to school yesterday.",
        corrected: "I went to school yesterday.",
      }
    ],
    overallScore: 100
  };

  const normalized = validateAndFixResponse(raw);

  assert.equal(normalized.mistakes.length, 1, "Mistake should be preserved");
  assert.equal(
    normalized.mistakes[0].explanation,
    "説明がありません",
    "Missing explanations should default"
  );
  assert.match(
    normalized.mistakes[0].type,
    /grammar|vocabulary|spelling/,
    "Mistake type should fall back to grammar"
  );
  assert.ok(
    normalized.overallScore < 100,
    "Score should be reduced when mistakes are present"
  );

  const perfect = validateAndFixResponse({ mistakes: [], overallScore: 70 });
  assert.equal(perfect.overallScore, 100, "Perfect submissions should normalize to full score");
});

test("sanitizeInput strips HTML tags and scripts", () => {
  const unsafe = '<script>alert("x")</script><div>Hello <b>world</b>!</div>';
  const sanitized = sanitizeInput(unsafe);
  assert.equal(sanitized, "Hello world!");
});
