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
  onTestTimerStart,
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
  const [topicRevealActive, setTopicRevealActive] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const isTestMode = mode === CHECKER_MODES.TEST;
  const hasTestStarted = Boolean(testSession?.started);
  const wordCount = useMemo(() => countEffectiveWords(text), [text]);
  const formattedTimer = useMemo(() => formatTimer(remainingMs), [remainingMs]);
  const timerButtonDisabled = isChecking || isDisabled || hasTestStarted || !testSession;

  useEffect(() => {
    let interval;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  useEffect(() => {
    if (hasTestStarted) {
      const frame = requestAnimationFrame(() => setTopicRevealActive(true));
      return () => cancelAnimationFrame(frame);
    }
    setTopicRevealActive(false);
  }, [hasTestStarted]);

  const handlePrimaryClick = () => {
    if (feedback) {
      if (cooldown > 0) return;
      onReset?.();
      if (isTestMode) {
        onTestSessionRestart?.();
      }
      return;
    }

    if (!isTestMode) {
      setShowHint(false);
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

  const canSubmit = isTestMode ? Boolean(testSession?.started) : text.trim().length > 0;
  const submitDisabled = feedback
    ? isChecking || cooldown > 0
    : isChecking || !canSubmit || (isTestMode && (!testSession || !testSession.started));
  const textareaFocusClasses = isTestMode
    ? "focus:ring-red-500 focus:border-red-500"
    : "focus:ring-blue-500 focus:border-blue-500";
  const primaryButtonClasses = isTestMode
    ? "bg-red-600 hover:bg-red-700"
    : "bg-blue-600 hover:bg-blue-700";

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
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-red-700">お題</p>
              {hasTestStarted ? (
                <p
                  className={`mt-1 text-base font-semibold text-gray-900 whitespace-pre-wrap break-words transition-all duration-300 ease-out ${
                    topicRevealActive ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                  }`}
                >
                  {testSession?.topic || "トピックを読み込み中..."}
                </p>
              ) : (
                <p className="mt-1 text-base font-semibold text-gray-400 italic">
                  「開始」を押すとお題が表示されます
                </p>
              )}
            </div>
            <div className="self-center flex flex-col items-stretch justify-center gap-2 min-w-[110px] max-w-[110px]">
              <div
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                  testSession?.submitted
                    ? "bg-green-100 text-green-700"
                    : hasTestStarted
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                <Icons.Clock className="h-4 w-4" />
                <span>{formattedTimer}</span>
              </div>
              <button
                type="button"
                onClick={() => onTestTimerStart?.()}
                disabled={timerButtonDisabled}
                className={`inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                  timerButtonDisabled
                    ? "border-gray-200 text-gray-400 cursor-not-allowed bg-white"
                    : "border-red-200 text-red-700 hover:bg-red-100 bg-white"
                }`}
              >
                開始
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-red-700">
            {testSession?.submitted
              ? "提出済みです。「新しく書く」で次のテストに進めます。"
              : hasTestStarted
                ? "5分以内に仕上げてください。時間になると自動で提出されます。"
                : "「開始」を押すと5分カウントが始まり、お題が表示されます。"}
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
        className={`w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 ${textareaFocusClasses} resize-none`}
        disabled={isChecking || isDisabled}
      />
      {inputWarning && (
        <p className="mt-2 text-sm text-amber-600" role="alert">
          {inputWarning}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between">
        {!isTestMode && (
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setShowHint((prev) => !prev)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              aria-pressed={showHint}
              aria-label="英作文のヒントを表示"
            >
              <Icons.Info className="h-5 w-5" />
              <span className="sr-only">ヒントを見る</span>
            </button>
            {showHint && (
              <div className="absolute left-full top-full ml-3 mt-3 w-[320px] max-w-[min(320px,calc(100vw-4rem))] rounded-lg border border-blue-200 bg-white p-4 text-sm shadow-lg z-20">
                <p className="font-semibold text-gray-900">英作文のヒント：構成を意識しよう</p>
                <p className="mt-2 text-gray-800">
                  よい英作文は、文法が正しいだけでなく、文と文がつながっていることが大切です。文の流れを意識すると、読みやすくなります。
                </p>
                <p className="mt-2 text-gray-800">そのときに役立つのが PREP です。</p>
                <p className="mt-2 text-gray-800">
                  P（主張）：何について書くかをはっきり言う
                  <br />
                  R（理由）：なぜそう思うかを書く
                  <br />
                  E（具体例）：例や自分の経験を書く
                  <br />
                  P（まとめ）：もう一度主張をまとめる
                </p>
                <p className="mt-2 text-gray-800">
                  いつも使う必要はありませんが、考えを分かりやすく伝えたいときにとても便利です。
                </p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handlePrimaryClick}
          disabled={submitDisabled}
          className={`flex items-center space-x-2 px-6 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium ${primaryButtonClasses}`}
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
