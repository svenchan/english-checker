// hooks/useAuth.js
"use client";

import { useState, useEffect } from "react";

export function useAuth() {
  const [classCode, setClassCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const savedCode = sessionStorage.getItem("classCode");
    if (savedCode) {
      setClassCode(savedCode);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (code) => {
    const normalizedCode = code.trim().toUpperCase();
    sessionStorage.setItem("classCode", normalizedCode);
    setClassCode(normalizedCode);
    setIsAuthenticated(true);
  };

  const logout = () => {
    sessionStorage.removeItem("classCode");
    setClassCode("");
    setIsAuthenticated(false);
  };

  return { classCode, isAuthenticated, login, logout };
}