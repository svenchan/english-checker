// hooks/useChecker.js
"use client";

import { useState } from "react";
import { submitWritingCheck } from "../services/checkingService";
import { useGuestSession } from "./useGuestSession";
import { CHECK_COMPLETED_EVENT } from "../constants";

export function useChecker({ studentId, teacherId, allowGuestFallback = true } = {}) {
  const [studentText, setStudentText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const guestSessionId = useGuestSession();
  const hasProfileIdentifier = Boolean(studentId || teacherId);
  const canUseGuest = allowGuestFallback && !hasProfileIdentifier && Boolean(guestSessionId);
  const isSessionReady = hasProfileIdentifier || canUseGuest;

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
      } else if (teacherId) {
        payload.teacherId = teacherId;
      } else if (canUseGuest) {
        payload.guestSessionId = guestSessionId;
      } else {
        throw new Error("Session identifiers not ready yet.");
      }

      console.log("Submitting writing check", {
        hasStudentId: Boolean(payload.studentId),
        studentId: payload.studentId || null,
        hasTeacherId: Boolean(payload.teacherId),
        teacherId: payload.teacherId || null,
        hasGuestSessionId: Boolean(payload.guestSessionId),
        guestSessionId: payload.guestSessionId || null
      });

      const parsed = await submitWritingCheck(payload);
      setFeedback(parsed);

      if (studentId && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(CHECK_COMPLETED_EVENT, {
            detail: {
              studentId,
              createdAt: Date.now()
            }
          })
        );
      }

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
