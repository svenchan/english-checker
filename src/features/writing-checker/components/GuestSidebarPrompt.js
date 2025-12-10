"use client";

import { useState } from "react";
import { useSupabaseAuthActions } from "@/features/auth/hooks/useSupabaseAuthActions";

export function GuestSidebarPrompt({ isSessionLoading = false }) {
  const [localError, setLocalError] = useState("");
  const { signInWithGoogle, isSigningIn, error } = useSupabaseAuthActions();

  const handleSignIn = async () => {
    setLocalError("");
    try {
      await signInWithGoogle();
    } catch (err) {
      setLocalError(err.message || "ログインに失敗しました。");
    }
  };

  const displayError = localError || error;

  return (
    <div className="flex h-full max-h-screen flex-col bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Chat History</p>
        <h2 className="text-lg font-semibold text-gray-900">Save your progress</h2>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-gray-600">
          Sign in to save your work and see past checks.
        </p>
        <button
          type="button"
          onClick={handleSignIn}
          disabled={isSigningIn || isSessionLoading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSigningIn || isSessionLoading ? "Preparing Google sign-in..." : "Sign in with Google"}
        </button>
        {displayError && <p className="text-xs text-red-600">{displayError}</p>}
      </div>
    </div>
  );
}
