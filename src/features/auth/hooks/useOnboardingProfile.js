"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/config/supabaseBrowserClient";

const INITIAL_STATE = {
  profile: null,
  studentId: null,
  teacherId: null,
  role: null,
  needsOnboarding: false,
  isLoading: false,
  isSubmitting: false,
  error: ""
};

export function useOnboardingProfile(user) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [state, setState] = useState(INITIAL_STATE);

  const resetState = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const getAccessToken = useCallback(async () => {
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw error;
    }
    const token = data?.session?.access_token;
    if (!token) {
      throw new Error("Not authenticated. Please sign in again.");
    }
    return token;
  }, [supabase]);

  const loadProfile = useCallback(async () => {
    if (!user) {
      resetState();
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: "" }));

    try {
      const token = await getAccessToken();
      const response = await fetch("/api/auth/onboard", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load onboarding status.");
      }

      const profile = payload?.profile || null;
      const needsOnboarding = payload?.needsOnboarding ?? !profile?.onboarded;

      setState({
        profile,
        studentId: profile?.studentId ?? null,
        teacherId: profile?.teacherId ?? null,
        role: profile?.role ?? null,
        needsOnboarding,
        isLoading: false,
        isSubmitting: false,
        error: ""
      });
    } catch (error) {
      console.error("Failed to load onboarding profile", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to load onboarding status."
      }));
    }
  }, [user, getAccessToken, resetState]);

  const completeOnboarding = useCallback(
    async ({ firstName, lastName, role, schoolCode }) => {
      if (!user) {
        throw new Error("認証情報がありません");
      }

      setState((prev) => ({ ...prev, isSubmitting: true, error: "" }));

      try {
        const token = await getAccessToken();
        const response = await fetch("/api/auth/onboard", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ firstName, lastName, role, schoolCode, email: user.email })
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message = payload?.error || "Onboarding failed";
          throw new Error(message);
        }

        const profile = payload?.profile || {
          onboarded: true,
          role: role || payload?.role || null,
          studentId: payload?.studentId ?? null,
          teacherId: payload?.teacherId ?? null
        };
        const needsOnboarding = payload?.needsOnboarding ?? !profile?.onboarded;

        setState({
          profile,
          studentId: profile?.studentId ?? payload?.studentId ?? null,
          teacherId: profile?.teacherId ?? payload?.teacherId ?? null,
          role: profile?.role ?? role ?? null,
          needsOnboarding,
          isLoading: false,
          isSubmitting: false,
          error: ""
        });
      } catch (error) {
        console.error("Onboarding submission failed", error);
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          error: error.message || "Onboarding failed"
        }));
        throw error;
      }
    },
    [user, getAccessToken]
  );

  useEffect(() => {
    if (!user) {
      resetState();
      return;
    }

    loadProfile();
  }, [user, loadProfile, resetState]);

  return {
    profile: state.profile,
    studentId: state.studentId,
    teacherId: state.teacherId,
    role: state.role,
    needsOnboarding: state.needsOnboarding,
    isLoading: state.isLoading,
    isSubmitting: state.isSubmitting,
    error: state.error,
    refresh: loadProfile,
    completeOnboarding
  };
}
