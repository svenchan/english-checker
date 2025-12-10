// app/page.js
"use client";

import { useAuth } from "../features/auth/hooks/useAuth";
import { useSupabaseSession } from "../features/auth/hooks/useSupabaseSession";
import { useChecker } from "../features/writing-checker/hooks/useChecker";
import { LoginForm } from "../features/auth/components/LoginForm";
import { Header } from "../features/writing-checker/components/Header";
import { WritingInput } from "../features/writing-checker/components/WritingInput";
import { FeedbackDisplay } from "../features/writing-checker/components/FeedbackDisplay";
import { MistakeList } from "../features/writing-checker/components/MistakeList";
import { ChatHistorySidebar } from "../features/writing-checker/components/ChatHistorySidebar";
import { GuestSidebarPrompt } from "../features/writing-checker/components/GuestSidebarPrompt";
import { useMistakeHighlight } from "../features/writing-checker/hooks/useMistakeHighlight";

export default function Page() {
  const { classCode, isAuthenticated, login, logout, error, isLoading } = useAuth();
  const { user: supabaseUser, isLoading: isSupabaseLoading } = useSupabaseSession();
  const checker = useChecker(classCode, logout);

  const mistakeHighlight = useMistakeHighlight(
    checker.studentText,
    checker.feedback?.mistakes
  );

  const renderMainColumn = () => {
    if (!isAuthenticated) {
      return (
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="flex h-full items-center justify-center px-4 py-10">
            <LoginForm onLogin={login} error={error} isLoading={isLoading} />
          </div>
        </div>
      );
    }

    return (
      <>
        <Header
          classCode={classCode}
          onLogout={logout}
          onReset={checker.reset}
          hasFeedback={!!checker.feedback}
        />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-4xl space-y-6">
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
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="max-h-screen overflow-hidden border-b border-gray-200 bg-white md:border-b-0 md:border-r">
          {supabaseUser ? (
            <ChatHistorySidebar user={supabaseUser} />
          ) : (
            <GuestSidebarPrompt isSessionLoading={isSupabaseLoading} />
          )}
        </aside>

        <section className="flex max-h-screen flex-col overflow-hidden">
          {renderMainColumn()}
        </section>
      </div>
    </div>
  );
}