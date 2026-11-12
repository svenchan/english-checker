import test from "node:test";
import assert from "node:assert/strict";
import { TEST_MODE } from "../../src/config/testMode.js";
import {
  normalizeTimeAttackIntro,
  readTimeAttackIntro,
  writeTimeAttackIntro
} from "../../src/features/writing-checker/lib/timeAttackIntro.js";

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    }
  };
}

test("normalizeTimeAttackIntro treats missing and invalid values as not dismissed", () => {
  assert.deepEqual(normalizeTimeAttackIntro(null), {
    calloutDismissed: false,
    tried: false
  });
  assert.deepEqual(normalizeTimeAttackIntro({ calloutDismissed: "yes", tried: 1 }), {
    calloutDismissed: false,
    tried: false
  });
});

test("readTimeAttackIntro returns stored flags and ignores corrupt JSON", () => {
  const storage = memoryStorage({
    [TEST_MODE.introStorageKey]: JSON.stringify({ calloutDismissed: true, tried: false })
  });
  assert.deepEqual(readTimeAttackIntro(storage), {
    calloutDismissed: true,
    tried: false
  });

  storage.setItem(TEST_MODE.introStorageKey, "{");
  assert.deepEqual(readTimeAttackIntro(storage), {
    calloutDismissed: false,
    tried: false
  });
  assert.deepEqual(readTimeAttackIntro(null), {
    calloutDismissed: false,
    tried: false
  });
});

test("writeTimeAttackIntro persists both dismissal flags", () => {
  const storage = memoryStorage();
  const saved = writeTimeAttackIntro(storage, { calloutDismissed: true, tried: true });
  assert.deepEqual(saved, { calloutDismissed: true, tried: true });
  assert.deepEqual(readTimeAttackIntro(storage), saved);
});
