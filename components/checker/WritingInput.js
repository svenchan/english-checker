// components/checker/WritingInput.js
"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/ui/Icons";

export function WritingInput({ text, onChange, onCheck, isChecking, isDisabled }) {
  const [cooldown, setCooldown] = useState(0);
  
  useEffect(() => {
    let interval;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleCheckClick = () => {
    onCheck();
    setCooldown(60);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <label className="text-lg font-semibold text-gray-800">
          英文を書いてください
        </label>
        <span className="text-sm text-gray-500">{text.length} 文字</span>
      </div>
      
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`例: I go to school yesterday. ここに英文を入力してください...`}
        className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        disabled={isChecking || isDisabled}
      />
      
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleCheckClick}
          disabled={isChecking || !text.trim() || isDisabled || cooldown > 0}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isChecking ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>チェック中...</span>
            </>
          ) : cooldown > 0 ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>再チェックまで {cooldown}s</span>
            </>
          ) : (
            <>
              <Icons.Send className="h-5 w-5" />
              <span>チェックする</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}