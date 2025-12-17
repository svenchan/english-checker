// app/page.js
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useChecker } from "../features/writing-checker/hooks/useChecker";
import { Header } from "../features/writing-checker/components/Header";
import { WritingInput } from "../features/writing-checker/components/WritingInput";
import { FeedbackDisplay } from "../features/writing-checker/components/FeedbackDisplay";
import { MistakeList } from "../features/writing-checker/components/MistakeList";
import { useMistakeHighlight } from "../features/writing-checker/hooks/useMistakeHighlight";
import {
  createDefaultTopicState,
  deriveTopicText
} from "../features/writing-checker/lib/topicState";
import { ModeSidebar } from "../features/writing-checker/components/ModeSidebar";
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
  const feedbackSectionRef = useRef(null);

  const mistakeHighlight = useMistakeHighlight(studentText, feedback?.mistakes);
  const isTestLocked = mode === CHECKER_MODES.TEST && testSession && !testSession.submitted;
  const shouldShowMistakeList = (feedback?.mistakes?.length || 0) > 0;

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
      if (
        mode === CHECKER_MODES.TEST &&
        previousModeRef.current === CHECKER_MODES.PRACTICE
      ) {
        reset();
      }
      previousModeRef.current = mode;
    }
  }, [mode, reset]);

  useEffect(() => {
    if (feedback && feedbackSectionRef.current) {
      feedbackSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }, [feedback]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col h-screen">
        <Header mode={mode} />
        <div className="flex flex-1">
          <ModeSidebar activeMode={mode} onModeChange={handleModeChange} />
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <WritingInput
                mode={mode}
                testSession={mode === CHECKER_MODES.TEST ? testSession : null}
                remainingMs={mode === CHECKER_MODES.TEST ? remainingMs : TEST_MODE.durationMs}
                onTestSessionRestart={handleTestSessionRestart}
                onTestTimerStart={startTimer}
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

              {feedback && (
                <>
                  <div ref={feedbackSectionRef}>
                    <FeedbackDisplay
                      feedback={feedback}
                      studentText={studentText}
                      mistakeHighlight={mistakeHighlight}
                      mode={mode}
                      showCopyButton={!shouldShowMistakeList}
                    />
                  </div>
                  {shouldShowMistakeList && (
                    <MistakeList
                      mistakes={feedback.mistakes}
                      studentText={studentText}
                      mistakeHighlight={mistakeHighlight}
                      feedback={feedback}
                      mode={mode}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
