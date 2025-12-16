/**
 * Validate and fix AI responses
 */

export function validateAndFixResponse(parsedFeedback, options = {}) {
  const expectTopicFeedback = Boolean(options.expectTopicFeedback);
  // Ensure required fields exist
  if (!parsedFeedback.mistakes) {
    parsedFeedback.mistakes = [];
  }
  
  if (!parsedFeedback.goodPoints) {
    parsedFeedback.goodPoints = [];
  }

  const defaultPrepChecklist = {
    point: { met: false, note: "" },
    reason: { met: false, note: "" },
    evidence: { met: false, note: "" },
    pointSummary: { met: false, note: "" }
  };

  if (!expectTopicFeedback) {
    parsedFeedback.topicFeedback = null;
  } else if (!parsedFeedback.topicFeedback || typeof parsedFeedback.topicFeedback !== "object") {
    parsedFeedback.topicFeedback = {
      onTopicSummary: "",
      prepChecklist: { ...defaultPrepChecklist },
      improvementTips: ""
    };
  } else {
    parsedFeedback.topicFeedback.onTopicSummary = parsedFeedback.topicFeedback.onTopicSummary || "";
    const checklist = parsedFeedback.topicFeedback.prepChecklist || {};
    const normalizedChecklist = {};
    for (const key of Object.keys(defaultPrepChecklist)) {
      const entry = checklist[key] || {};
      normalizedChecklist[key] = {
        met: Boolean(entry.met),
        note: entry.note || ""
      };
    }
    parsedFeedback.topicFeedback.prepChecklist = normalizedChecklist;
    parsedFeedback.topicFeedback.improvementTips = parsedFeedback.topicFeedback.improvementTips || "";
  }
  
  // Ensure all mistakes have required fields
  parsedFeedback.mistakes = parsedFeedback.mistakes.map(mistake => ({
    original: mistake.original || "",
    corrected: mistake.corrected || "",
    explanation: mistake.explanation || "説明がありません",
    tip: mistake.tip || "もう一度確認してみましょう",
    type: mistake.type || "grammar"
  }));
  
  // Fix scoring logic: if there are mistakes but score is 100, recalculate
  if (parsedFeedback.mistakes.length > 0 && parsedFeedback.overallScore >= 100) {
    parsedFeedback.overallScore = Math.max(0, 100 - (parsedFeedback.mistakes.length * 15));
  }
  
  // If no mistakes but score is low, set to 100
  if (parsedFeedback.mistakes.length === 0 && parsedFeedback.overallScore < 80) {
    parsedFeedback.overallScore = 100;
  }
  
  return parsedFeedback;
}
