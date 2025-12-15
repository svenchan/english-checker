// hooks/useChecker.js
"use client";

import { useState } from "react";
import { submitWritingCheck } from "../services/checkingService";

export function useChecker() {
  const [studentText, setStudentText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const checkWriting = async () => {
    if (!studentText.trim() || isChecking) return;

    setIsChecking(true);
    setFeedback(null);

    try {
      const parsed = await submitWritingCheck({ text: studentText });
      const feedbackPayload = parsed?.feedback ?? parsed;
      setFeedback(feedbackPayload);
    } catch (err) {
      console.error("Error checking writing:", err);
      alert(`エラーが発生しました: ${err.message}`);
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
