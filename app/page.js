// app/page.js
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useChecker } from "@/hooks/useChecker";
import { LoginForm } from "@/components/checker/LoginForm";
import { Header } from "@/components/checker/Header";
import { WritingInput } from "@/components/checker/WritingInput";
import { FeedbackDisplay } from "@/components/checker/FeedbackDisplay";
import { MistakeList } from "@/components/checker/MistakeList";

export default function Page() {
  const { classCode, isAuthenticated, login, logout } = useAuth();
  const checker = useChecker(classCode, logout);

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
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
              />

              {checker.feedback && (
                <>
                  <FeedbackDisplay
                    feedback={checker.feedback}
                    studentText={checker.studentText}
                  />
                  <MistakeList
                    mistakes={checker.feedback.mistakes}
                    studentText={checker.studentText}
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