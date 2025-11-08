// hooks/useChecker.js
"use client";

import { useState } from "react";

export function useChecker(classCode, onAuthError) {
  const [studentText, setStudentText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const checkWriting = async () => {
    if (!studentText.trim() || isChecking) return;

    setIsChecking(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: studentText, classCode })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData.error || "サーバーエラーが発生しました";
        throw new Error(msg);
      }

      const parsed = await res.json();
      setFeedback(parsed);
    } catch (err) {
      console.error("Error checking writing:", err);
      if (err.message?.includes("無効なクラスコード")) {
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