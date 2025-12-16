// app/page.js
"use client";

import { useEffect, useRef, useState } from "react";
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

export default function Page() {
  const checker = useChecker();
  const [topic, setTopic] = useState(() => createDefaultTopicState());
  const feedbackSectionRef = useRef(null);

  const mistakeHighlight = useMistakeHighlight(
    checker.studentText,
    checker.feedback?.mistakes
  );

  useEffect(() => {
    if (checker.feedback && feedbackSectionRef.current) {
      feedbackSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }, [checker.feedback]);

  const handleReset = () => {
    checker.reset();
  };

  const handleCheck = () => {
    const topicText = deriveTopicText(topic);
    checker.checkWriting(topicText);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col">
          <Header />

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <WritingInput
                text={checker.studentText}
                onChange={checker.setStudentText}
                onCheck={handleCheck}
                isChecking={checker.isChecking}
                isDisabled={!!checker.feedback}
                feedback={checker.feedback}
                onReset={handleReset}
                topic={topic}
                onTopicChange={setTopic}
              />

              {checker.feedback && (
                <>
                  <div ref={feedbackSectionRef}>
                    <FeedbackDisplay
                      feedback={checker.feedback}
                      studentText={checker.studentText}
                      mistakeHighlight={mistakeHighlight}
                    />
                  </div>
                  <MistakeList
                    mistakes={checker.feedback.mistakes}
                    studentText={checker.studentText}
                    mistakeHighlight={mistakeHighlight}
                    feedback={checker.feedback}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
