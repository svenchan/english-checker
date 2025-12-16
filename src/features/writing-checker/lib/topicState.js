const TOPIC_SOURCE_FREE = "free";
const TOPIC_SOURCE_PRESET = "preset";

export const TOPIC_SOURCES = Object.freeze({
  FREE: TOPIC_SOURCE_FREE,
  PRESET: TOPIC_SOURCE_PRESET
});

export function createDefaultTopicState() {
  return {
    enabled: false,
    source: null,
    value: ""
  };
}

export function setTopicEnabled(currentState, enabled) {
  if (!enabled) {
    return createDefaultTopicState();
  }
  return {
    enabled: true,
    source: currentState?.source ?? null,
    value: currentState?.value ?? ""
  };
}

export function setTopicFromFreeText(currentState, nextValue) {
  const text = typeof nextValue === "string" ? nextValue : "";
  if (!text.trim()) {
    return {
      enabled: true,
      source: null,
      value: ""
    };
  }

  return {
    enabled: true,
    source: TOPIC_SOURCE_FREE,
    value: text
  };
}

export function setTopicFromPreset(currentState, presetLabel) {
  const label = typeof presetLabel === "string" ? presetLabel : "";
  if (!label) {
    return {
      enabled: true,
      source: null,
      value: ""
    };
  }

  return {
    enabled: true,
    source: TOPIC_SOURCE_PRESET,
    value: label
  };
}

export function clearTopicState() {
  return {
    enabled: true,
    source: null,
    value: ""
  };
}

export function removeTopicState() {
  return createDefaultTopicState();
}

export function deriveTopicText(topicState) {
  if (!topicState?.enabled) {
    return null;
  }

  const text = (topicState.value || "").trim();
  return text.length ? text : null;
}
