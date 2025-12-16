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
 * @property {number} score - Overall grammar score (0-100).
 * @property {string} summary - Summary of the student's writing quality.
 * @property {Mistake[]} mistakes - List of detected mistakes.
 */

export {}; // This file provides shared JSDoc types.
