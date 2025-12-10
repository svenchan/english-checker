// hooks/useChecker.js
"use client";

import { useState } from "react";
import { submitWritingCheck } from "../services/checkingService";
import { useGuestSession } from "./useGuestSession";

export function useChecker({ studentId } = {}) {
  const [studentText, setStudentText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const guestSessionId = useGuestSession();
  const isSessionReady = Boolean(studentId || guestSessionId);

  const checkWriting = async () => {
    if (!studentText.trim() || isChecking || !isSessionReady) return;

    setIsChecking(true);
    setFeedback(null);

    try {
      const payload = {
        text: studentText
      };

      // Prefer authenticated identifiers; fall back to a guest session UUID for anonymous users.
      if (studentId) {
        payload.studentId = studentId;
      } else if (guestSessionId) {
        payload.guestSessionId = guestSessionId;
      }

      const parsed = await submitWritingCheck(payload);
      setFeedback(parsed);
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
    reset,
    isSessionReady
  };
}