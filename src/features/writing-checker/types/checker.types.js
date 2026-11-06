// src/features/writing-checker/types/checker.types.js

/**
 * @typedef {Object} Mistake
 * @property {string} original - The text span flagged as incorrect.
 * @property {string} corrected - The corrected version of the text span.
 * @property {string} explanation - Explanation of the correction.
 * @property {number} [index] - Optional unique identifier from the model.
 */

/**
 * @typedef {Object} FeedbackResponse
 * @property {number} overallScore - Score out of 100. A known mistake code uses its catalog weight; otherwise spelling costs 5 and every other type costs 10.
 * @property {Mistake[]} mistakes - List of detected mistakes.
 * @property {"ok"|"too_short"|"error"} [status] - Submission status coming from the server.
 * @property {string|null} [topicText] - Topic text (if provided).
 * @property {string[]} [pointsForImprovement] - General advice bullet list.
 * @property {string} [summary] - Summary of the student's writing quality.
 * @property {string} [improvementSummary] - Additional message shown when the submission is invalid.
 */

export {}; // This file provides shared JSDoc types.
