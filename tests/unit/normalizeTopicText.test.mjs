import { test } from "node:test";
import assert from "node:assert/strict";

const { normalizeTopicText } = await import("../../src/lib/normalizeTopicText.js");

test("returns null for non-string inputs", () => {
  assert.equal(normalizeTopicText(null), null);
  assert.equal(normalizeTopicText(undefined), null);
  assert.equal(normalizeTopicText(123), null);
});

test("trims, collapses whitespace, and strips control characters", () => {
  const input = "  Hello \t world\u0007 \nnext  ";
  const normalized = normalizeTopicText(input);
  assert.equal(normalized, "Hello world next");
});

test("caps topic length to 120 characters", () => {
  const longInput = "A".repeat(200);
  const normalized = normalizeTopicText(longInput);
  assert.equal(normalized.length, 120);
});

test("returns null when text becomes empty after normalization", () => {
  assert.equal(normalizeTopicText("   \t  "), null);
  assert.equal(normalizeTopicText("\u0000\u0007"), null);
});
