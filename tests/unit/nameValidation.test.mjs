import { test } from "node:test";
import assert from "node:assert/strict";

const { isNameValid, normalizeNameInput, MAX_NAME_LENGTH } = await import("../../src/lib/nameValidation.js");

const repeat = (value, count) => Array.from({ length: count }).fill(value).join("");

test("normalizeNameInput trims surrounding whitespace", () => {
  assert.equal(normalizeNameInput("  Alice  "), "Alice");
  assert.equal(normalizeNameInput("\nBob\t"), "Bob");
  assert.equal(normalizeNameInput(undefined), "");
});

test("isNameValid accepts letters, spaces, hyphens, and apostrophes", () => {
  const validNames = [
    "Alice",
    "Jean-Luc",
    "O'Connor",
    "Mary Ann",
    "I",
    "Anne-Marie O'Neill"
  ];

  validNames.forEach((name) => {
    assert.equal(isNameValid(name), true, `${name} should be valid`);
  });
});

test("isNameValid rejects invalid characters or empty input", () => {
  const invalidNames = ["", "1234", "John!", "Mary@", "Anna#", " "];
  invalidNames.forEach((name) => {
    assert.equal(isNameValid(name), false, `${JSON.stringify(name)} should be invalid`);
  });
});

test("isNameValid rejects names over the max length", () => {
  const longName = repeat("a", MAX_NAME_LENGTH + 1);
  assert.equal(isNameValid(longName), false);
});
