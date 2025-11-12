// hooks/useAuth.js
"use client";

import { useState, useEffect } from "react";

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
      
      // Make a simple request to validate the class code
      const response = await fetch("/api/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: "test",
          classCode: normalizedCode,
        }),
      });

      if (!response.ok && response.status === 401) {
        setError("クラスコードが見つかりません。もう一度お試しください。");
        setIsLoading(false);
        return false;
      }

      // Valid class code
      sessionStorage.setItem("classCode", normalizedCode);
      setClassCode(normalizedCode);
      setIsAuthenticated(true);
      setError("");
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("Validation error:", err);
      setError("エラーが発生しました。もう一度お試しください。");
      setIsLoading(false);
      return false;
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