// filepath: [page.js](http://_vscodecontentref_/0)
// ...existing code...
"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Migrated UI from [index.html](http://_vscodecontentref_/1) into Next.js App Router page.
 * Calls /api/check POST with { text, classCode }.
 */

function sanitizeForRegex(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const Icon = {
  BookOpen: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
  ),
  Send: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  ),
  RefreshCw: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M23 4v6h-6"></path>
      <path d="M1 20v-6h6"></path>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
  ),
  AlertCircle: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  )
};

export default function Page() {
  const [studentText, setStudentText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [selectedMistake, setSelectedMistake] = useState(null);
  const [classCode, setClassCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [classCodeInput, setClassCodeInput] = useState("");
  const textareaRef = useRef(null);
  const mistakeRefs = useRef({});

  useEffect(() => {
    const savedCode = sessionStorage.getItem("classCode");
    if (savedCode) {
      setClassCode(savedCode);
      setIsAuthenticated(true);
    }
  }, []);

  const handleClassCodeSubmit = () => {
    if (!classCodeInput.trim()) {
      alert("クラスコードを入力してください");
      return;
    }
    const code = classCodeInput.trim().toUpperCase();
    sessionStorage.setItem("classCode", code);
    setClassCode(code);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("classCode");
    setClassCode("");
    setIsAuthenticated(false);
    setClassCodeInput("");
    setStudentText("");
    setFeedback(null);
  };

  const checkWriting = async () => {
    if (!studentText.trim() || isChecking) return;

    setIsChecking(true);
    setFeedback(null);
    setSelectedMistake(null);

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: studentText, classCode })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData.error || "サーバーエラーが発生しました";
        throw new Error(msg);
      }

      const parsed = await res.json();
      setFeedback(parsed);
    } catch (err) {
      console.error("Error checking writing:", err);
      if (err.message && err.message.includes("無効なクラスコード")) {
        alert("クラスコードが正しくありません。もう一度ログインしてください。");
        handleLogout();
      } else {
        alert(`エラーが発生しました: ${err.message}`);
      }
    } finally {
      setIsChecking(false);
    }
  };

  const resetChecker = () => {
    setStudentText("");
    setFeedback(null);
    setSelectedMistake(null);
  };

  const getScoreColor = (score = 0) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getMistakeTypeLabel = (type) => {
    const labels = { grammar: "文法", vocabulary: "単語", spelling: "スペル" };
    return labels[type] || "文法";
  };

  const getMistakeTypeColor = (type) => {
    const colors = {
      grammar: "bg-blue-100 text-blue-700",
      vocabulary: "bg-purple-100 text-purple-700",
      spelling: "bg-orange-100 text-orange-700"
    };
    return colors[type] || "bg-blue-100 text-blue-700";
  };

  const highlightMistakes = () => {
    if (!feedback || !feedback.mistakes || !feedback.mistakes.length) return studentText || "";

    let highlightedText = studentText;
    const mistakes = [...feedback.mistakes].sort((a, b) => b.original.length - a.original.length);
    mistakes.forEach((mistake, idx) => {
      if (!mistake.original) return;
      const regex = new RegExp(sanitizeForRegex(mistake.original), "gi");
      highlightedText = highlightedText.replace(
        regex,
        `<span class="bg-red-200 cursor-pointer hover:bg-red-300 transition-colors rounded px-1" data-mistake-id="${idx}">${mistake.original}</span>`
      );
    });

    return highlightedText;
  };

  const handleTextClick = (e) => {
    const mistakeId = e.target.getAttribute("data-mistake-id");
    if (mistakeId !== null) {
      const id = parseInt(mistakeId, 10);
      setSelectedMistake(id);
      if (mistakeRefs.current[id]) {
        mistakeRefs.current[id].scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!isAuthenticated ? (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                <Icon.BookOpen className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">英作文チェッカー</h1>
              <p className="text-gray-600">あなたの英語をチェックします</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">クラスコードを入力してください</label>
                <input
                  type="text"
                  value={classCodeInput}
                  onChange={(e) => setClassCodeInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleClassCodeSubmit()}
                  placeholder="例: CLASS1A"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-center uppercase"
                  autoFocus
                />
              </div>

              <button
                onClick={handleClassCodeSubmit}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
              >
                開始する
              </button>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800"><strong>注意:</strong> クラスコードは先生から教えてもらってください。</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-screen">
          <div className="flex-1 flex flex-col">
            <div className="bg-blue-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Icon.BookOpen className="h-8 w-8" />
                  <div>
                    <h1 className="text-2xl font-bold">英作文チェッカー</h1>
                    <p className="text-blue-100 text-sm">クラス: {classCode}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {feedback && (
                    <button onClick={resetChecker} className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors">
                      <Icon.RefreshCw className="h-4 w-4" />
                      <span>新しく書く</span>
                    </button>
                  )}
                  <button onClick={handleLogout} className="flex items-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="ログアウト">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span>ログアウト</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-lg font-semibold text-gray-800">英文を書いてください</label>
                    <span className="text-sm text-gray-500">{studentText.length} 文字</span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={studentText}
                    onChange={(e) => setStudentText(e.target.value)}
                    placeholder={"例: I go to school yesterday.\n\nここに英文を入力してください..."}
                    className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    disabled={isChecking || feedback !== null}
                  />
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={checkWriting}
                      disabled={isChecking || !studentText.trim() || feedback !== null}
                      className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {isChecking ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>チェック中...</span>
                        </>
                      ) : (
                        <>
                          <Icon.Send className="h-5 w-5" />
                          <span>チェックする</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {feedback && (
                  <>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className={`px-6 py-3 rounded-lg text-2xl font-bold ${getScoreColor(feedback.overallScore)}`}>
                          {feedback.overallScore}点
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            {feedback.mistakes.length === 0 ? "完璧です!間違いはありません。" : `${feedback.mistakes.length}個の改善点が見つかりました。`}
                          </p>
                        </div>
                      </div>

                      {feedback.mistakes.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-3">間違いをチェック(赤い部分をクリック)</h3>
                          <div
                            className="p-4 bg-gray-50 rounded-lg text-lg leading-relaxed border border-gray-200"
                            dangerouslySetInnerHTML={{ __html: highlightMistakes() }}
                            onClick={handleTextClick}
                          />
                        </div>
                      )}
                    </div>

                    {feedback.mistakes.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <Icon.AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                          改善点リスト
                        </h3>
                        <div className="space-y-4">
                          {feedback.mistakes.map((mistake, idx) => (
                            <div
                              key={idx}
                              ref={(el) => (mistakeRefs.current[idx] = el)}
                              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${selectedMistake === idx ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}
                              onClick={() => setSelectedMistake(idx)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMistakeTypeColor(mistake.type)}`}>
                                  {getMistakeTypeLabel(mistake.type)}
                                </span>
                                <span className="text-sm font-semibold text-gray-600">#{idx + 1}</span>
                              </div>

                              <div className="space-y-2 mt-3">
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">✕ 間違い</p>
                                  <p className="text-base font-medium text-red-600 bg-red-50 px-3 py-2 rounded">{mistake.original}</p>
                                </div>

                                <div>
                                  <p className="text-xs text-gray-600 mb-1">✓ 正しい英語</p>
                                  <p className="text-base font-medium text-green-600 bg-green-50 px-3 py-2 rounded">{mistake.corrected}</p>
                                </div>

                                <div className="pt-2 border-t border-gray-200">
                                  <p className="text-sm text-gray-800"><strong>説明:</strong> {mistake.explanation}</p>
                                  <p className="text-sm text-gray-600 mt-2"><strong>ヒント:</strong> {mistake.tip}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ...existing code...