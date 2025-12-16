export const CHECKER_MODES = Object.freeze({
  PRACTICE: "practice",
  TEST: "test"
});

export const TEST_MODE = Object.freeze({
  durationMs: 5 * 60 * 1000,
  minWords: 15,
  storageKey: "test_session_v1",
  uiModeStorageKey: "checker_ui_mode",
  promptVersion: "test_v1",
  tooShortMessage:
    "時間になりましたが、15語以上書けていません。次のトピックでもう一度挑戦しましょう。"
});

export function buildTooShortFeedback(topicText = null, mode = CHECKER_MODES.TEST) {
  return {
    status: "too_short",
    mode,
    overallScore: 0,
    mistakes: [],
    goodPoints: [],
    topicText: topicText || null,
    summary: "文章量が不足しています。",
    improvementSummary: TEST_MODE.tooShortMessage,
    topicFeedback: null,
    pointsForImprovement: [TEST_MODE.tooShortMessage]
  };
}
