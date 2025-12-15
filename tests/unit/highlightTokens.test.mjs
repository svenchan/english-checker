import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { normalizeText } from "../../src/lib/normalizeText.ts";
import { tokenizeHighlight } from "../../src/features/writing-checker/lib/tokenizeHighlight.ts";

test("normalizeText normalizes carriage returns and non-breaking spaces", () => {
  const input = "Line one\r\nLine two\rLine\u00A0three";
  const normalized = normalizeText(input);

  assert.equal(normalized, "Line one\nLine two\nLine three");
});

test("tokenizeHighlight emits text and mistake tokens in order", () => {
  const tokens = tokenizeHighlight("Hello brave new world", [
    { id: "alpha", start: 6, end: 11 },
    { id: "beta", start: 16, end: 21 }
  ]);

  assert.equal(tokens.length, 4);
  assert.deepEqual(tokens[0], { kind: "text", value: "Hello " });
  assert.deepEqual(tokens[1], { kind: "mistake", value: "brave", mistakeId: "alpha", category: undefined });
  assert.deepEqual(tokens[2], { kind: "text", value: " new " });
  assert.deepEqual(tokens[3], { kind: "mistake", value: "world", mistakeId: "beta", category: undefined });
});

test("tokenizeHighlight clamps spans and skips overlaps deterministically", () => {
  const tokens = tokenizeHighlight("abcde", [
    { id: "one", start: -5, end: 2 },
    { id: "two", start: 1, end: 4 },
    { id: "three", start: 3, end: 99 }
  ]);

  assert.equal(tokens.length, 3);
  assert.deepEqual(tokens[0], { kind: "mistake", value: "ab", mistakeId: "one", category: undefined });
  assert.deepEqual(tokens[1], { kind: "text", value: "c" });
  assert.deepEqual(tokens[2], { kind: "mistake", value: "de", mistakeId: "three", category: undefined });
});

test("rendered tokens escape malicious HTML payloads", () => {
  const payload = "<img src=x onerror=alert(1)>";
  const tokens = tokenizeHighlight(payload, [{ id: "attack", start: 0, end: payload.length }]);

  const html = renderToStaticMarkup(
    React.createElement(
      React.Fragment,
      null,
      tokens.map((token, index) => {
        if (token.kind === "mistake") {
          return React.createElement(
            "button",
            { key: `mistake-${index}`, type: "button", "data-mistake-id": token.mistakeId },
            token.value
          );
        }
        return React.createElement("span", { key: `text-${index}` }, token.value);
      })
    )
  );

  assert(html.includes("&lt;img src=x onerror=alert(1)&gt;"));
  assert.equal(html.includes("<img src=x onerror=alert(1)>"), false);
});
