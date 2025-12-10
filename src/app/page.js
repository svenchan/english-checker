// app/page.js
"use client";

import { useSupabaseSession } from "../features/auth/hooks/useSupabaseSession";
import { useChecker } from "../features/writing-checker/hooks/useChecker";
import { Header } from "../features/writing-checker/components/Header";
import { WritingInput } from "../features/writing-checker/components/WritingInput";
import { FeedbackDisplay } from "../features/writing-checker/components/FeedbackDisplay";
import { MistakeList } from "../features/writing-checker/components/MistakeList";
import { ChatHistorySidebar } from "../features/writing-checker/components/ChatHistorySidebar";
import { GuestSidebarPrompt } from "../features/writing-checker/components/GuestSidebarPrompt";
import { useMistakeHighlight } from "../features/writing-checker/hooks/useMistakeHighlight";
import { useOnboardingProfile } from "@/features/auth/hooks/useOnboardingProfile";
import { OnboardingForm } from "@/features/auth/components/OnboardingForm";
import { useSupabaseAuthActions } from "@/features/auth/hooks/useSupabaseAuthActions";

export default function Page() {
  const { user: supabaseUser, isLoading: isSupabaseLoading } = useSupabaseSession();
  const authActions = useSupabaseAuthActions();
  const onboarding = useOnboardingProfile(supabaseUser);
  const checker = useChecker({ studentId: onboarding.studentId });

  const mistakeHighlight = useMistakeHighlight(
    checker.studentText,
    checker.feedback?.mistakes
  );

  const authBusy = isSupabaseLoading || authActions.isSigningIn || authActions.isSigningOut;
  const isOnboardingVisible = Boolean(supabaseUser && onboarding.needsOnboarding);
  const isProfileLoading = Boolean(supabaseUser && onboarding.isLoading);

  const renderMainContent = () => {
    if (isProfileLoading) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-gray-500">プロフィールを読み込み中...</p>
        </div>
      );
    }

    if (isOnboardingVisible) {
      return (
        <div className="flex-1 flex items-center justify-center py-10">
          <OnboardingForm
            defaultFirstName={onboarding.profile?.firstName}
            defaultLastName={onboarding.profile?.lastName}
            defaultRole={onboarding.profile?.role || "student"}
            onSubmit={onboarding.completeOnboarding}
            isSubmitting={onboarding.isSubmitting}
            error={onboarding.error}
          />
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <WritingInput
            text={checker.studentText}
            onChange={checker.setStudentText}
            onCheck={checker.checkWriting}
            isChecking={checker.isChecking}
            isDisabled={!!checker.feedback}
            feedback={checker.feedback}
            onReset={checker.reset}
            isSessionReady={checker.isSessionReady}
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
          <Header
            userEmail={supabaseUser?.email ?? ""}
            onReset={checker.reset}
            hasFeedback={!!checker.feedback}
            onSignIn={authActions.signInWithGoogle}
            onSignOut={authActions.signOut}
            isAuthLoading={authBusy}
            isLoggedIn={Boolean(supabaseUser)}
          />

          {renderMainContent()}
        </section>
      </div>
    </div>
  );
}