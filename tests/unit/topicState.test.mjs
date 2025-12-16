import { test } from "node:test";
import assert from "node:assert/strict";

const topicStateModule = await import("../../src/features/writing-checker/lib/topicState.js");

const {
  createDefaultTopicState,
  clearTopicState,
  deriveTopicText,
  removeTopicState,
  setTopicEnabled,
  setTopicFromFreeText,
  setTopicFromPreset,
  TOPIC_SOURCES
} = topicStateModule;

test("createDefaultTopicState returns disabled state", () => {
  const state = createDefaultTopicState();
  assert.deepEqual(state, { enabled: false, source: null, value: "" });
});

test("setTopicFromFreeText toggles source based on value", () => {
  const active = setTopicFromFreeText(createDefaultTopicState(), "My topic");
  assert.equal(active.source, TOPIC_SOURCES.FREE);
  assert.equal(active.enabled, true);
  assert.equal(active.value, "My topic");

  const cleared = setTopicFromFreeText(active, "   ");
  assert.equal(cleared.source, null);
  assert.equal(cleared.value, "");
});

test("setTopicFromPreset disables free text when selection exists", () => {
  const preset = setTopicFromPreset(createDefaultTopicState(), "Self introduction");
  assert.equal(preset.source, TOPIC_SOURCES.PRESET);
  assert.equal(preset.value, "Self introduction");

  const cleared = setTopicFromPreset(preset, "");
  assert.equal(cleared.source, null);
  assert.equal(cleared.value, "");
});

test("clearTopicState keeps picker enabled but empty", () => {
  const state = setTopicFromFreeText(createDefaultTopicState(), "Hello");
  const cleared = clearTopicState(state);
  assert.deepEqual(cleared, { enabled: true, source: null, value: "" });
});

test("removeTopicState disables picker completely", () => {
  const state = setTopicEnabled(createDefaultTopicState(), true);
  const removed = removeTopicState(state);
  assert.deepEqual(removed, createDefaultTopicState());
});

test("deriveTopicText trims and omits empty values", () => {
  const disabled = createDefaultTopicState();
  assert.equal(deriveTopicText(disabled), null);

  const active = setTopicFromFreeText(disabled, "  Focus on recycling ");
  assert.equal(deriveTopicText(active), "Focus on recycling");
});
