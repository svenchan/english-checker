// hooks/useChecker.js
"use client";

import { useState } from "react";
import { submitWritingCheck } from "../services/checkingService";

export function useChecker(classCode, onAuthError) {
  const [studentText, setStudentText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const checkWriting = async () => {
    if (!studentText.trim() || isChecking) return;

    setIsChecking(true);
    setFeedback(null);

    try {
      const parsed = await submitWritingCheck({ text: studentText, classCode });
      setFeedback(parsed);
    } catch (err) {
      console.error("Error checking writing:", err);
      if (err.status === 401 || err.message?.includes("無効なクラスコード")) {
        alert("クラスコードが正しくありません。もう一度ログインしてください。");
        onAuthError?.();
      } else {
        alert(`エラーが発生しました: ${err.message}`);
      }
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