// app/page.js
"use client";

import { useAuth } from "../features/auth/hooks/useAuth";
import { useChecker } from "../features/writing-checker/hooks/useChecker";
import { LoginForm } from "../features/auth/components/LoginForm";
import { Header } from "../features/writing-checker/components/Header";
import { WritingInput } from "../features/writing-checker/components/WritingInput";
import { FeedbackDisplay } from "../features/writing-checker/components/FeedbackDisplay";
import { MistakeList } from "../features/writing-checker/components/MistakeList";
import { useMistakeHighlight } from "../features/writing-checker/hooks/useMistakeHighlight";

export default function Page() {
  const { classCode, isAuthenticated, login, logout, error, isLoading } = useAuth();
  const checker = useChecker(classCode, logout);

  const mistakeHighlight = useMistakeHighlight(
    checker.studentText,
    checker.feedback?.mistakes
  );

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
                onReset={checker.reset}
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