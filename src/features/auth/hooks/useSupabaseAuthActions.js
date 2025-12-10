"use client";

import { useCallback, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/config/supabaseBrowserClient";

export function useSupabaseAuthActions() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [status, setStatus] = useState({ isSigningIn: false, isSigningOut: false, error: "" });

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      const error = new Error("Supabase is not configured.");
      setStatus((prev) => ({ ...prev, error: error.message }));
      throw error;
    }

    setStatus((prev) => ({ ...prev, isSigningIn: true, error: "" }));

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? window.location.href : undefined
        }
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Google sign-in failed", error);
      setStatus((prev) => ({ ...prev, error: error.message || "ログインに失敗しました" }));
      throw error;
    } finally {
      setStatus((prev) => ({ ...prev, isSigningIn: false }));
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) {
      const error = new Error("Supabase is not configured.");
      setStatus((prev) => ({ ...prev, error: error.message }));
      throw error;
    }

    setStatus((prev) => ({ ...prev, isSigningOut: true, error: "" }));

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Sign-out failed", error);
      setStatus((prev) => ({ ...prev, error: error.message || "サインアウトに失敗しました" }));
      throw error;
    } finally {
      setStatus((prev) => ({ ...prev, isSigningOut: false }));
    }
  }, [supabase]);

  const clearError = useCallback(() => {
    setStatus((prev) => ({ ...prev, error: "" }));
  }, []);

  return {
    signInWithGoogle,
    signOut,
    isSigningIn: status.isSigningIn,
    isSigningOut: status.isSigningOut,
    error: status.error,
    clearError
  };
}
