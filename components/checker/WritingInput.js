// components/checker/WritingInput.js
"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/ui/Icons";

export function WritingInput({ text, onChange, onCheck, isChecking, isDisabled, classCode }) {
  const [cooldown, setCooldown] = useState(0);
  const isTeacher = (classCode || "").toUpperCase() === "TEACHER";
  
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
    // Only start the 60s cooldown for non-teacher class codes
    if (!isTeacher) setCooldown(60);
  };

  const handleTextChange = (newText) => {
    if (newText.length <= 400) {
      onChange(newText);
    }
  };

  const countWords = (text) => {
    // Common Japanese loanwords to exclude
    const japaneseLoans = new Set([
      'sushi', 'sake', 'kimono', 'karate', 'tsunami', 'emoji', 'anime', 'manga', 'karaoke',
      'tofu', 'tempura', 'wasabi', 'origami', 'haiku', 'zen', 'karate', 'judo', 'sudoku',
      'kamikaze', 'samurai', 'geisha', 'futon', 'tatami', 'tsunami', 'typhoon'
    ]);
    
    // Split text into words, preserving original case
    const rawWords = text.split(/\s+/).filter(word => word.length > 0);
    
    const words = rawWords.filter((word, index) => {
      // Remove punctuation and check if it's a valid word
      const cleanWord = word.replace(/[.,!?;:'"()[\]{}—–-]/g, '');
      
      if (!cleanWord) return false;
      
      const lowerWord = cleanWord.toLowerCase();
      
      // Exclude Japanese loanwords
      if (japaneseLoans.has(lowerWord)) {
        return false;
      }
      
      // Only filter proper nouns if they're capitalized AND not at the start of a sentence
      // A word is at the start of a sentence if it's the first word or follows sentence-ending punctuation
      const isProbablyStartOfSentence = index === 0 || /[.!?]$/.test(rawWords[index - 1]);
      
      // Exception: always count "I"
      if (lowerWord === 'i') {
        return true;
      }
      
      if (!isProbablyStartOfSentence && cleanWord[0] === cleanWord[0].toUpperCase() && cleanWord[0] !== cleanWord[0].toLowerCase()) {
        return false;
      }
      
      return lowerWord.length > 0;
    });
    
    return words.length;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <label className="text-lg font-semibold text-gray-800">
          英文を書いてください
        </label>
        <span className="text-sm text-gray-500">{text.length}/400 · {countWords(text)} 語</span>
      </div>
      
      <textarea
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
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