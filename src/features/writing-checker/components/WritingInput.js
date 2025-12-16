// components/checker/WritingInput.js
"use client";

import { useState, useEffect, useMemo } from "react";
import { sanitizeClientInput } from "@/lib/clientSanitize";
import { Icons } from "@/shared/components/ui/Icons";
import { CHECKER_MODES, TEST_MODE } from "@/config/testMode";
import { countEffectiveWords } from "@/lib/wordCount";
import { COOLDOWN_SECONDS, MAX_CHAR_COUNT } from "../constants";
import { TopicPicker } from "./TopicPicker";
import { setTopicEnabled } from "../lib/topicState";

export function WritingInput({
  mode = CHECKER_MODES.PRACTICE,
  testSession = null,
  remainingMs = TEST_MODE.durationMs,
  onTestSessionRestart,
  text,
  onChange,
  onCheck,
  isChecking,
  isDisabled,
  feedback,
  onReset,
  topic,
  onTopicChange
}) {
  const [cooldown, setCooldown] = useState(0);
  const [inputWarning, setInputWarning] = useState("");
  const isTestMode = mode === CHECKER_MODES.TEST;
  const wordCount = useMemo(() => countEffectiveWords(text), [text]);
  const formattedTimer = useMemo(() => formatTimer(remainingMs), [remainingMs]);

  useEffect(() => {
    let interval;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const handlePrimaryClick = () => {
    if (feedback) {
      if (cooldown > 0) return;
      onReset?.();
      if (isTestMode) {
        onTestSessionRestart?.();
      }
      return;
    }

    onCheck();
    setCooldown(COOLDOWN_SECONDS);
  };

  const handleTextChange = (newText) => {
    const sanitizedText = sanitizeClientInput(newText);
    let warningMessage = "";

    if (sanitizedText !== newText) {
      warningMessage = "HTMLタグや特殊文字は自動的に削除されます。";
    }

    let finalText = sanitizedText;
    if (sanitizedText.length > MAX_CHAR_COUNT) {
      finalText = sanitizedText.slice(0, MAX_CHAR_COUNT);
      warningMessage = "400文字以内にしてください。";
    }

    setInputWarning(warningMessage);
    onChange(finalText);
  };

  const canSubmit = isTestMode || text.trim().length > 0;
  const submitDisabled = feedback
    ? isChecking || cooldown > 0
    : isChecking || !canSubmit || (isTestMode && !testSession);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <label className="text-lg font-semibold text-gray-800">英文を書いてください</label>
          <span className="text-sm text-gray-500">
            {text.length}/400 · {wordCount} 語
          </span>
        </div>
        {!isTestMode && !topic?.enabled && typeof onTopicChange === "function" && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => onTopicChange((prev) => setTopicEnabled(prev, true))}
              disabled={isChecking || isDisabled}
              className="inline-flex items-center rounded-md border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              テーマを追加
            </button>
          </div>
        )}
      </div>

      {isTestMode && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-blue-700">お題</p>
              <p className="mt-1 text-base font-semibold text-gray-900 whitespace-pre-wrap break-words">
                {testSession?.topic || "トピックを読み込み中..."}
              </p>
            </div>
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                testSession?.submitted ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
              }`}
            >
              <Icons.Clock className="h-4 w-4" />
              <span>{formattedTimer}</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-blue-700">
            {testSession?.submitted
              ? "提出済みです。「新しく書く」で次のテストに進めます。"
              : "5分以内に仕上げてください。時間になると自動で提出されます。"}
          </p>
        </div>
      )}

      {!isTestMode && typeof onTopicChange === "function" && (
        <TopicPicker value={topic} onChange={onTopicChange} />
      )}

      <textarea
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="例: I go to school yesterday. ここに英文を入力してください..."
        className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        disabled={isChecking || isDisabled}
      />
      {inputWarning && (
        <p className="mt-2 text-sm text-amber-600" role="alert">
          {inputWarning}
        </p>
      )}

      <div className="mt-4 flex justify-end space-x-3">
        <button
          onClick={handlePrimaryClick}
          disabled={submitDisabled}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isChecking ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>チェック中...</span>
            </>
          ) : feedback ? (
            cooldown > 0 ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>新しく書くまで {cooldown}s</span>
              </>
            ) : (
              <>
                <Icons.RefreshCw className="h-5 w-5" />
                <span>新しく書く</span>
              </>
            )
          ) : (
            <>
              <Icons.Send className="h-5 w-5" />
              <span>{isTestMode ? "提出する" : "チェックする"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function formatTimer(ms = 0) {
  const safeMs = Math.max(0, ms);
  const minutes = Math.floor(safeMs / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
