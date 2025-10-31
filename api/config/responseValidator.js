/**
 * Validate and fix AI responses
 */

export function validateAndFixResponse(parsedFeedback) {
  // Ensure required fields exist
  if (!parsedFeedback.mistakes) {
    parsedFeedback.mistakes = [];
  }
  
  if (!parsedFeedback.goodPoints) {
    parsedFeedback.goodPoints = [];
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
