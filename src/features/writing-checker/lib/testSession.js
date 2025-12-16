import { TEST_MODE } from "../../../config/testMode.js";
import { flattenTopicPresets } from "../../../config/topicPresets.js";

const PRESET_TOPICS = flattenTopicPresets().map((topic) => topic.label);

function randomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function pickRandomTestTopic() {
  if (!PRESET_TOPICS.length) {
    return "Write about your favorite memory.";
  }
  const index = Math.floor(Math.random() * PRESET_TOPICS.length);
  return PRESET_TOPICS[index];
}

export function createTestSession(overrides = {}) {
  const startedAt = overrides.startedAt ?? Date.now();
  const topic = (overrides.topic && overrides.topic.trim()) || pickRandomTestTopic();
  const endsAt = overrides.endsAt ?? startedAt + TEST_MODE.durationMs;
  return {
    id: overrides.id || randomId(),
    topic,
    startedAt,
    endsAt,
    submitted: overrides.submitted ?? false
  };
}

export function isValidTestSession(candidate) {
  if (!candidate || typeof candidate !== "object") return false;
  if (typeof candidate.topic !== "string" || !candidate.topic.trim()) return false;
  if (!Number.isFinite(candidate.startedAt) || !Number.isFinite(candidate.endsAt)) return false;
  if (candidate.startedAt > candidate.endsAt) return false;
  if (typeof candidate.submitted !== "boolean") return false;
  return typeof candidate.id === "string" && Boolean(candidate.id.trim());
}
