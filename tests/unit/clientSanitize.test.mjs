import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true
});

const { sanitizeClientInput } = await import("../../src/lib/clientSanitize.js");

test("removes script tags while preserving safe text", () => {
  const unsafe = "Hello <script>alert('xss')</script> world";
  const sanitized = sanitizeClientInput(unsafe);

  assert.equal(sanitized.includes("<script"), false);
  assert.equal(sanitized, "Hello  world");
});

test("normalizes whitespace without trimming by default", () => {
  const input = "  Line one\r\nLine two  ";
  const sanitized = sanitizeClientInput(input);

  assert.equal(sanitized, "  Line one\nLine two  ");
});

test("allows optional trimming", () => {
  const input = "  keep me tidy  \n";
  const sanitized = sanitizeClientInput(input, { trim: true });

  assert.equal(sanitized, "keep me tidy");
});
