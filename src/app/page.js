// app/page.js
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useChecker } from "../features/writing-checker/hooks/useChecker";
import { Header } from "../features/writing-checker/components/Header";
import { WritingInput } from "../features/writing-checker/components/WritingInput";
import { CorrectionsPanel } from "../features/writing-checker/components/CorrectionsPanel";
import { useMistakeHighlight } from "../features/writing-checker/hooks/useMistakeHighlight";
import {
  createDefaultTopicState,
  deriveTopicText
} from "../features/writing-checker/lib/topicState";
import { useTestSession } from "../features/writing-checker/hooks/useTestSession";
import { CHECKER_MODES, TEST_MODE } from "@/config/testMode";

export default function Page() {
  const {
    studentText,
    setStudentText,
    isChecking,
    feedback,
    checkWriting,
    reset
  } = useChecker();
  const [topic, setTopic] = useState(() => createDefaultTopicState());
  const [mode, setMode] = useState(CHECKER_MODES.PRACTICE);
  const {
    session: testSession,
    remainingMs,
    startNewSession,
    startTimer,
    markSubmitted
  } = useTestSession(mode);
  const surfaceRef = useRef(null);

  const mistakeHighlight = useMistakeHighlight(studentText, feedback?.mistakes);
  const focusMistakeInWriting = useCallback((mistakeId) => {
    const root = surfaceRef.current;
    if (!root || !mistakeId) return;
    const escaped = typeof CSS !== "undefined" && typeof CSS.escape === "function"
      ? CSS.escape(mistakeId)
      : String(mistakeId).replace(/"/g, '\\"');
    const target = root.querySelector(`[data-mistake-id="${escaped}"]`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const previousModeRef = useRef(mode);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedMode = window.sessionStorage.getItem(TEST_MODE.uiModeStorageKey);
    if (storedMode === CHECKER_MODES.TEST) {
      setMode(CHECKER_MODES.TEST);
      previousModeRef.current = CHECKER_MODES.TEST;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(TEST_MODE.uiModeStorageKey, mode);
  }, [mode]);

  useEffect(() => {
    if (previousModeRef.current !== mode) {
      const enteredTimeAttack =
        mode === CHECKER_MODES.TEST &&
        previousModeRef.current === CHECKER_MODES.PRACTICE;
      const returnedToPractice =
        mode === CHECKER_MODES.PRACTICE &&
        previousModeRef.current === CHECKER_MODES.TEST;
      if (enteredTimeAttack || returnedToPractice) {
        reset();
      }
      previousModeRef.current = mode;
    }
  }, [mode, reset]);

  const handleModeChange = (nextMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
  };

  const handleReset = () => {
    reset();
  };

  const handlePracticeSubmit = async () => {
    const topicText = deriveTopicText(topic);
    await checkWriting({ topicText, mode: CHECKER_MODES.PRACTICE });
  };

  const handleTestSubmit = useCallback(
    async (trigger = "manual") => {
      if (
        mode !== CHECKER_MODES.TEST ||
        !testSession ||
        !testSession.started ||
        testSession.submitted
      ) {
        return;
      }

      try {
        await checkWriting({
          topicText: testSession.topic,
          mode: CHECKER_MODES.TEST,
          metadata: {
            trigger,
            testSessionId: testSession.id
          }
        });
        markSubmitted();
      } catch (error) {
        console.error("テストモードの提出に失敗しました", error);
      }
    },
    [checkWriting, markSubmitted, mode, testSession]
  );

  useEffect(() => {
    if (!testSession || testSession.submitted) {
      return;
    }
    const remaining = Math.max(0, testSession.endsAt - Date.now());
    if (remaining <= 0) {
      handleTestSubmit("auto");
      return;
    }
    const timeout = setTimeout(() => handleTestSubmit("auto"), remaining);
    return () => clearTimeout(timeout);
  }, [handleTestSubmit, testSession]);

  const handleCheck = async () => {
    if (mode === CHECKER_MODES.TEST) {
      await handleTestSubmit("manual");
    } else {
      await handlePracticeSubmit();
    }
  };

  const handleTestSessionRestart = () => {
    if (mode === CHECKER_MODES.TEST) {
      startNewSession();
    }
  };

  const handleExitTimeAttack = () => {
    reset();
    startNewSession();
  };

  return (
    <div className="h-screen bg-white">
      <div className="flex h-full min-h-0 flex-col md:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
          <Header
            mode={mode}
            showBrand={false}
            onModeChange={handleModeChange}
            testTimer={
              mode === CHECKER_MODES.TEST
                ? {
                    remainingMs,
                    started: Boolean(testSession?.started),
                    submitted: Boolean(testSession?.submitted)
                  }
                : null
            }
          />
            <WritingInput
              layout="split"
              surfaceRef={surfaceRef}
              mistakeHighlight={mistakeHighlight}
              mode={mode}
              testSession={mode === CHECKER_MODES.TEST ? testSession : null}
              remainingMs={mode === CHECKER_MODES.TEST ? remainingMs : TEST_MODE.durationMs}
              onTestSessionRestart={handleTestSessionRestart}
              onTestTimerStart={startTimer}
              onExitTimeAttack={handleExitTimeAttack}
              text={studentText}
              onChange={setStudentText}
              onCheck={handleCheck}
              isChecking={isChecking}
              isDisabled={!!feedback}
              feedback={feedback}
              onReset={handleReset}
              topic={topic}
              onTopicChange={mode === CHECKER_MODES.PRACTICE ? setTopic : undefined}
            />
        </div>
        <CorrectionsPanel
          feedback={feedback}
          studentText={studentText}
          mistakeHighlight={mistakeHighlight}
          mode={mode}
          isChecking={isChecking}
          onSelectMistake={focusMistakeInWriting}
        />
      </div>
    </div>
  );
}
