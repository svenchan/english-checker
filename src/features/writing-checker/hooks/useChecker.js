// hooks/useChecker.js
"use client";

import { useState } from "react";
import { CHECKER_MODES } from "@/config/testMode";
import { submitWritingCheck } from "../services/checkingService";

export function useChecker() {
  const [studentText, setStudentText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const checkWriting = async (options = {}) => {
    const {
      topicText = null,
      mode = CHECKER_MODES.PRACTICE,
      metadata = {}
    } = options;

    if (isChecking) return null;
    if (mode === CHECKER_MODES.PRACTICE && !studentText.trim()) return null;

    setIsChecking(true);
    setFeedback(null);

    try {
      const payload = {
        text: studentText,
        topicText: topicText ?? null,
        mode,
        ...metadata
      };
      const parsed = await submitWritingCheck(payload);
      const feedbackPayload = parsed?.feedback ?? parsed;
      setFeedback(feedbackPayload);
      return feedbackPayload;
    } catch (err) {
      console.error("Error checking writing:", err);
      alert(`エラーが発生しました: ${err.message}`);
      throw err;
    } finally {
      setIsChecking(false);
    }
  };

  const reset = () => {
    setStudentText("");
    setFeedback(null);
  };

  return {
    studentText,
    setStudentText,
    isChecking,
    feedback,
    checkWriting,
    reset
  };
}
