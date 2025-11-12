// components/checker/LoginForm.js
"use client";

import { useState } from "react";
import { Icons } from "@/components/ui/Icons";

export function LoginForm({ onLogin, error, isLoading }) {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (!input.trim()) {
      // Let parent handle error display
      return;
    }
    onLogin(input);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Icons.BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">英作文チェッカー</h1>
          <p className="text-gray-600">あなたの英語をチェックします</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              クラスコードを入力してください
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="例: CLASS00"
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-center uppercase ${
                error ? "border-red-500" : "border-gray-300"
              }`}
              autoFocus
              disabled={isLoading}
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
          >
            {isLoading ? "確認中..." : "開始する"}
          </button>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>注意:</strong> クラスコードは先生から教えてもらってください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}