// hooks/useAuth.js
"use client";

import { useState, useEffect } from "react";
import { validateClassCodeRequest } from "../services/authService";

export function useAuth() {
  const [classCode, setClassCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedCode = sessionStorage.getItem("classCode");
    if (savedCode) {
      setClassCode(savedCode);
      setIsAuthenticated(true);
    }
  }, []);

  const validateClassCode = async (code) => {
    const normalizedCode = code.trim().toUpperCase();

    try {
      setIsLoading(true);
      setError("");
      await validateClassCodeRequest(normalizedCode);

      sessionStorage.setItem("classCode", normalizedCode);
      setClassCode(normalizedCode);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error("Validation error:", err);
      if (err.status === 401) {
        setError("クラスコードが見つかりません。もう一度お試しください。");
      } else {
        setError(err.message || "エラーが発生しました。もう一度お試しください。");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("classCode");
    setClassCode("");
    setIsAuthenticated(false);
    setError("");
  };

  return { classCode, isAuthenticated, login: validateClassCode, logout, error, isLoading };
}