"use client";

import { WritingInput } from "@/features/writing-checker/components/WritingInput";
import { FeedbackDisplay } from "@/features/writing-checker/components/FeedbackDisplay";
import { MistakeList } from "@/features/writing-checker/components/MistakeList";
import { useMistakeHighlight } from "@/features/writing-checker/hooks/useMistakeHighlight";
import { CHECKER_MODES } from "@/config/testMode";

export function CheckerReplay({ check }) {
  const mode =
    check?.mode === CHECKER_MODES.TEST ? CHECKER_MODES.TEST : CHECKER_MODES.PRACTICE;
  const studentText = check?.studentText ?? "";
  const feedback = check?.feedback ?? null;
  const mistakeHighlight = useMistakeHighlight(studentText, feedback?.mistakes);

  if (!check) {
    return (
      <p className="text-sm text-gray-500 py-12 text-center">
        左の一覧から提出を選んでください。
      </p>
    );
  }
  const shouldShowMistakeList = (feedback?.mistakes?.length || 0) > 0;
  const topicText = check.topicText || feedback?.topicText || null;

  const testSession =
    mode === CHECKER_MODES.TEST
      ? {
          started: true,
          submitted: true,
          topic: topicText || ""
        }
      : null;

  return (
    <div className="space-y-6">
      <WritingInput
        mode={mode}
        testSession={testSession}
        text={studentText}
        onChange={() => {}}
        readOnly
        displayTopicText={mode === CHECKER_MODES.PRACTICE ? topicText : null}
        feedback={feedback}
      />

      {feedback && (
        <>
          <FeedbackDisplay
            feedback={feedback}
            studentText={studentText}
            mistakeHighlight={mistakeHighlight}
            mode={mode}
            showCopyButton={!shouldShowMistakeList}
          />
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
  );
}
