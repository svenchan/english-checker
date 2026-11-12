import { TEST_MODE } from "../../../config/testMode.js";

const DEFAULT_INTRO = Object.freeze({
  calloutDismissed: false,
  tried: false
});

export function normalizeTimeAttackIntro(value) {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_INTRO };
  }
  return {
    calloutDismissed: value.calloutDismissed === true,
    tried: value.tried === true
  };
}

export function readTimeAttackIntro(storage) {
  try {
    const raw = storage?.getItem(TEST_MODE.introStorageKey);
    if (!raw) return { ...DEFAULT_INTRO };
    return normalizeTimeAttackIntro(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_INTRO };
  }
}

export function writeTimeAttackIntro(storage, state) {
  const next = normalizeTimeAttackIntro(state);
  storage.setItem(TEST_MODE.introStorageKey, JSON.stringify(next));
  return next;
}
