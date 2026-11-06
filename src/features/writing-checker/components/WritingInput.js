// components/checker/WritingInput.js
"use client";

import { useState, useEffect, useMemo } from "react";
import { sanitizeClientInput } from "@/lib/clientSanitize";
import { Icons } from "@/shared/components/ui/Icons";
import { Tooltip } from "@/shared/components/ui/Tooltip";
import { CHECKER_MODES, TEST_MODE } from "@/config/testMode";
import { countEffectiveWords } from "@/lib/wordCount";
import { COOLDOWN_SECONDS, MAX_CHAR_COUNT } from "../constants";
import { TopicPicker } from "./TopicPicker";
import { deriveTopicText, removeTopicState, setTopicEnabled } from "../lib/topicState";
import { HighlightedText } from "./HighlightedText";

export function WritingInput({
  mode = CHECKER_MODES.PRACTICE,
  testSession = null,
  remainingMs = TEST_MODE.durationMs,
  onTestSessionRestart,
  onTestTimerStart,
  onExitTimeAttack,
  text,
  onChange,
  onCheck,
  isChecking,
  isDisabled,
  feedback,
  onReset,
  topic,
  onTopicChange,
  readOnly = false,
  displayTopicText = null,
  layout = "card",
  mistakeHighlight = null,
  surfaceRef = null
}) {
  const [cooldown, setCooldown] = useState(0);
  const [inputWarning, setInputWarning] = useState("");
  const [topicRevealActive, setTopicRevealActive] = useState(false);
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
  const resolvedTopicText =
    displayTopicText?.trim() ||
    testSession?.topic?.trim() ||
    "";
  const textareaFocusClasses = isTestMode
    ? "focus:ring-red-500 focus:border-red-500"
    : "focus:ring-blue-500 focus:border-blue-500";
  const primaryButtonClasses = isTestMode
    ? "bg-red-600 hover:bg-red-700"
    : "bg-blue-600 hover:bg-blue-700";

  if (readOnly) {
    const topicBorder = isTestMode ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50";
    const topicLabel = isTestMode ? "text-red-700" : "text-blue-700";
    const topicHeading = isTestMode ? "お題" : "テーマ";

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-3 flex items-center justify-between">
          <label className="text-lg font-semibold text-gray-800">英文を書いてください</label>
          <span className="text-sm text-gray-500">
            {text.length}/400 · {wordCount} 語
          </span>
        </div>

        {resolvedTopicText && (
          <div className={`mb-4 rounded-lg border p-4 ${topicBorder}`}>
            <p className={`text-xs uppercase tracking-wider ${topicLabel}`}>{topicHeading}</p>
            <p className="mt-1 text-base font-semibold text-gray-900 whitespace-pre-wrap break-words">
              {resolvedTopicText}
            </p>
          </div>
        )}

        <textarea
          value={text}
          readOnly
          className={`w-full h-48 p-4 border border-gray-300 rounded-lg resize-none bg-gray-50 cursor-default focus:outline-none ${textareaFocusClasses}`}
        />
      </div>
    );
  }

  if (layout === "split") {
    const showReviewedText = Boolean(feedback);
    const reviewTokens = mistakeHighlight?.tokens;
    const countChipClass = isTestMode
      ? "border-red-200 text-red-800"
      : "border-sky-200 text-sky-800";
    const practiceTopicText = !isTestMode ? deriveTopicText(topic) : null;

    return (
      <div className="flex min-h-0 flex-1 flex-col bg-white">
        {!isTestMode && typeof onTopicChange === "function" && !practiceTopicText && (
          <div className="shrink-0 px-6 pt-4 md:max-h-[40%] md:overflow-y-auto">
            {!topic?.enabled && (
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => onTopicChange((prev) => setTopicEnabled(prev, true))}
                  disabled={isChecking || isDisabled}
                  className="inline-flex items-center rounded-md border border-sky-200 px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  テーマを追加
                </button>
              </div>
            )}
            <TopicPicker value={topic} onChange={onTopicChange} />
          </div>
        )}

        {(isTestMode ? hasTestStarted : Boolean(practiceTopicText)) && (
          <div className="shrink-0 px-8 pt-6 md:max-h-[40%] md:overflow-y-auto">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">お題</p>
            <div
              className={`mt-1 flex items-start justify-between gap-3 transition-all duration-300 ease-out ${
                isTestMode && !topicRevealActive ? "-translate-y-2 opacity-0" : "translate-y-0 opacity-100"
              }`}
            >
              <p className="whitespace-pre-wrap break-words text-base font-semibold text-slate-900">
                {isTestMode ? testSession?.topic || "トピックを読み込み中..." : practiceTopicText}
              </p>
              {!isTestMode && typeof onTopicChange === "function" && (
                <TopicDeleteButton
                  disabled={isChecking || isDisabled}
                  onClick={() => onTopicChange(removeTopicState())}
                />
              )}
            </div>
          </div>
        )}

        <div ref={surfaceRef} className="min-h-[6rem] min-w-0 flex-1 overflow-hidden">
          {isTestMode && !hasTestStarted && !showReviewedText ? (
            <div className="flex h-full flex-col items-center justify-center gap-8 px-8">
              <h1 className="text-center text-4xl font-bold tracking-wide text-red-600 md:text-5xl">
                タイムアタック！
              </h1>
              <button
                type="button"
                onClick={() => onTestTimerStart?.()}
                disabled={timerButtonDisabled}
                className={`inline-flex items-center justify-center rounded-lg px-8 py-3 text-base font-semibold text-white transition-colors ${
                  timerButtonDisabled
                    ? "cursor-not-allowed bg-red-300"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                開始
              </button>
            </div>
          ) : showReviewedText ? (
            <div className="h-full overflow-y-auto whitespace-pre-wrap break-words px-8 py-8 text-lg leading-8 text-slate-900">
              {reviewTokens && reviewTokens.length > 0 ? (
                <HighlightedText
                  tokens={reviewTokens}
                  activeMistakeId={mistakeHighlight?.selectedMistakeId}
                  onMistakeClick={mistakeHighlight?.handleHighlightClick}
                  appearance="underline"
                  activeTone={isTestMode ? "red" : "blue"}
                />
              ) : (
                <span>{text}</span>
              )}
            </div>
          ) : (
            <textarea
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="例: This is my friend... ここに英文を入力してください..."
              className="h-full w-full resize-none overflow-y-auto border-0 bg-transparent px-8 py-8 text-lg leading-8 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:opacity-60"
              disabled={isChecking || isDisabled}
            />
          )}
        </div>

        {inputWarning && (
          <p className="shrink-0 px-6 pb-2 text-sm text-amber-600" role="alert">
            {inputWarning}
          </p>
        )}

        <div className="relative flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-white bg-white px-4 py-3">
          <span className={`rounded-full border bg-white px-3 py-1.5 text-sm font-medium shadow-sm ${countChipClass}`}>
            {wordCount}語 · {text.length}/400
          </span>

          <div className="flex items-center gap-2">
            {isTestMode && hasTestStarted && !testSession?.submitted && (
              <Tooltip content="最初の画面に戻る" position="top-right">
                <button
                  type="button"
                  onClick={() => onExitTimeAttack?.()}
                  disabled={isChecking}
                  aria-label="最初の画面に戻る"
                  className="inline-flex h-12 w-12 items-center justify-center border-0 bg-transparent p-0 text-slate-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icons.LogOut className="h-5 w-5" />
                </button>
              </Tooltip>
            )}
            <button
              onClick={handlePrimaryClick}
              disabled={submitDisabled}
              className={`flex items-center space-x-2 rounded-lg px-6 py-3 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${primaryButtonClasses}`}
            >
              {isChecking ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                  <span>チェック中...</span>
                </>
              ) : feedback ? (
                cooldown > 0 ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
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
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <label className="text-lg font-semibold text-gray-800">英文を書いてください</label>
          <span className="text-sm text-gray-500">
            {text.length}/400 · {wordCount} 語
          </span>
        </div>
        {!readOnly && !isTestMode && !topic?.enabled && typeof onTopicChange === "function" && (
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

      {!isTestMode && deriveTopicText(topic) && (
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">お題</p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <p className="whitespace-pre-wrap break-words text-base font-semibold text-slate-900">
              {deriveTopicText(topic)}
            </p>
            {typeof onTopicChange === "function" && (
              <TopicDeleteButton
                disabled={isChecking || isDisabled}
                onClick={() => onTopicChange(removeTopicState())}
              />
            )}
          </div>
        </div>
      )}

      {!isTestMode && !deriveTopicText(topic) && typeof onTopicChange === "function" && (
        <TopicPicker value={topic} onChange={onTopicChange} />
      )}

      <textarea
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="例: This is my friend... ここに英文を入力してください..."
        className={`w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 ${textareaFocusClasses} resize-none`}
        disabled={isChecking || isDisabled}
      />
      {inputWarning && (
        <p className="mt-2 text-sm text-amber-600" role="alert">
          {inputWarning}
        </p>
      )}

      <div className="mt-4 flex items-center justify-end">
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

function TopicDeleteButton({ onClick, disabled }) {
  return (
    <Tooltip content="テーマを削除" position="top-right">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label="テーマを削除"
        className="mt-0.5 shrink-0 border-0 bg-transparent p-0 text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:text-gray-300"
      >
        <Icons.Trash className="h-4 w-4" />
      </button>
    </Tooltip>
  );
}

function formatTimer(ms = 0) {
  const safeMs = Math.max(0, ms);
  const minutes = Math.floor(safeMs / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
