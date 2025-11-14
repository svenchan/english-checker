// app/page.js
"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useChecker } from "@/hooks/useChecker";
import { LoginForm } from "@/components/checker/LoginForm";
import { Header } from "@/components/checker/Header";
import { WritingInput } from "@/components/checker/WritingInput";
import { FeedbackDisplay } from "@/components/checker/FeedbackDisplay";
import { MistakeList } from "@/components/checker/MistakeList";
import { sanitizeForRegex } from "@/lib/utils";

export default function Page() {
  const { classCode, isAuthenticated, login, logout, error, isLoading } = useAuth();
  const checker = useChecker(classCode, logout);

  // moved highlight hook state into parent
  const [selectedMistake, setSelectedMistake] = useState(null);
  const mistakeRefs = useRef({});

  const highlightMistakes = () => {
    const studentText = checker.studentText || "";
    const mistakes = checker.feedback?.mistakes || [];
    if (!mistakes || mistakes.length === 0) return studentText;

    let highlightedText = studentText;
    // preserve original indices so data-mistake-id matches refs in MistakeList
    const indexed = mistakes.map((m, i) => ({ ...m, __originalIndex: i }));
    const sorted = [...indexed].sort(
      (a, b) => (b.original?.length || 0) - (a.original?.length || 0)
    );

    sorted.forEach((mistake) => {
      if (!mistake.original) return;
      const regex = new RegExp(sanitizeForRegex(mistake.original), "gi");
      highlightedText = highlightedText.replace(
        regex,
        `<span class="bg-red-200 cursor-pointer hover:bg-red-300 transition-colors rounded px-1" data-mistake-id="${mistake.__originalIndex}">${mistake.original}</span>`
      );
    });

    return highlightedText;
  };

  const handleTextClick = (e) => {
    const mistakeId = e.target?.getAttribute?.("data-mistake-id");
    if (mistakeId !== null && mistakeId !== undefined) {
      const id = parseInt(mistakeId, 10);
      setSelectedMistake(id);
      if (mistakeRefs.current[id]) {
        mistakeRefs.current[id].scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const mistakeHighlight = {
    selectedMistake,
    setSelectedMistake,
    mistakeRefs,
    highlightMistakes,
    handleTextClick
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} error={error} isLoading={isLoading} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col">
          <Header
            classCode={classCode}
            onLogout={logout}
            onReset={checker.reset}
            hasFeedback={!!checker.feedback}
          />

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <WritingInput
                text={checker.studentText}
                onChange={checker.setStudentText}
                onCheck={checker.checkWriting}
                isChecking={checker.isChecking}
                isDisabled={!!checker.feedback}
                classCode={classCode}
                feedback={checker.feedback}
              />

              {checker.feedback && (
                <>
                  <FeedbackDisplay
                    feedback={checker.feedback}
                    studentText={checker.studentText}
                    mistakeHighlight={mistakeHighlight}
                  />
                  <MistakeList
                    mistakes={checker.feedback.mistakes}
                    levelUp={checker.feedback.levelUp}
                    studentText={checker.studentText}
                    mistakeHighlight={mistakeHighlight}
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