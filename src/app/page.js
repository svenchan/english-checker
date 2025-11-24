// app/page.js
"use client";

import { useState, useRef } from "react";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useChecker } from "../features/writing-checker/hooks/useChecker";
import { LoginForm } from "../features/auth/components/LoginForm";
import { Header } from "../features/writing-checker/components/Header";
import { WritingInput } from "../features/writing-checker/components/WritingInput";
import { FeedbackDisplay } from "../features/writing-checker/components/FeedbackDisplay";
import { MistakeList } from "../features/writing-checker/components/MistakeList";
import { sanitizeForRegex } from "@/lib/utils";

export default function Page() {
  const { classCode, isAuthenticated, login, logout, error, isLoading } = useAuth();
  const checker = useChecker(classCode, logout);

  // moved highlight hook state into parent
  const [selectedMistake, setSelectedMistake] = useState(null);
  const mistakeRefs = useRef({});

  const highlightMistakes = () => {
    const text = checker.studentText || "";
    const mistakes = checker.feedback?.mistakes || [];
    if (!mistakes || mistakes.length === 0) return text;

    // Escape HTML to avoid injection; we'll inject safe spans around text slices
    const escapeHtml = (s = "") =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    // Build all match ranges on the raw text first (avoid matching inside injected HTML)
    const indexed = mistakes.map((m, i) => ({ ...m, __originalIndex: i }));
    const ranges = [];

    const buildPattern = (orig = "") => {
      const trimmed = orig.trim();
      if (!trimmed) return null;
      // Single English word: enforce word boundaries to avoid matching inside other words
      if (/^[A-Za-z]+$/.test(trimmed)) {
        return new RegExp(`\\b${sanitizeForRegex(trimmed)}\\b`, "gi");
      }
      // Multi-word English phrase: collapse inner spaces and bound as a phrase
      if (/^[A-Za-z]+(?:\s+[A-Za-z]+)+$/.test(trimmed)) {
        const collapsed = trimmed
          .split(/\s+/)
          .map((w) => sanitizeForRegex(w))
          .join("\\s+");
        return new RegExp(`\\b${collapsed}\\b`, "gi");
      }
      // Fallback: plain escaped substring (for non-Latin chars, punctuation-including strings, etc.)
      return new RegExp(sanitizeForRegex(trimmed), "gi");
    };

    indexed.forEach((m) => {
      const original = m.original || "";
      const pattern = buildPattern(original);
      if (!pattern) return;
      const match = pattern.exec(text);
      if (match && match[0].length > 0) {
        // Only highlight the first occurrence per mistake
        ranges.push({ start: match.index, end: match.index + match[0].length, id: m.__originalIndex });
      }
    });

    if (ranges.length === 0) return escapeHtml(text);

    // Sort by start asc, and for identical start, by longer length desc
    ranges.sort((a, b) => (a.start - b.start) || (b.end - b.start) - (a.end - a.start));

    // Merge overlapping ranges by keeping the first (earliest/longest)
    const merged = [];
    for (const r of ranges) {
      const last = merged[merged.length - 1];
      if (!last || r.start >= last.end) {
        merged.push({ ...r });
      }
      // If overlapping, skip r (we keep last)
    }

    // Build HTML from escaped text and injected spans
    let html = "";
    let pos = 0;
    merged.forEach((r) => {
      if (pos < r.start) {
        html += escapeHtml(text.slice(pos, r.start));
      }
      const inner = escapeHtml(text.slice(r.start, r.end));
      html += `<span class="bg-red-200 cursor-pointer hover:bg-red-300 transition-colors rounded px-1" data-mistake-id="${r.id}">${inner}</span>`;
      pos = r.end;
    });
    if (pos < text.length) {
      html += escapeHtml(text.slice(pos));
    }
    return html;
  };

  const handleTextClick = (e) => {
    const mistakeId = e.target?.getAttribute?.("data-mistake-id");
    if (mistakeId !== null && mistakeId !== undefined) {
      const id = parseInt(mistakeId, 10);
      setSelectedMistake(id);
      if (mistakeRefs.current[id]) {
        mistakeRefs.current[id].scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const mistakeHighlight = {
    selectedMistake,
    setSelectedMistake,
    mistakeRefs,
    highlightMistakes,
    handleTextClick
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} error={error} isLoading={isLoading} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col">
          <Header
            classCode={classCode}
            onLogout={logout}
            onReset={checker.reset}
            hasFeedback={!!checker.feedback}
          />

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <WritingInput
                text={checker.studentText}
                onChange={checker.setStudentText}
                onCheck={checker.checkWriting}
                isChecking={checker.isChecking}
                isDisabled={!!checker.feedback}
                classCode={classCode}
                feedback={checker.feedback}
                onReset={checker.reset}
              />

              {checker.feedback && (
                <>
                  <FeedbackDisplay
                    feedback={checker.feedback}
                    studentText={checker.studentText}
                    mistakeHighlight={mistakeHighlight}
                  />
                  <MistakeList
                    mistakes={checker.feedback.mistakes}
                    studentText={checker.studentText}
                    mistakeHighlight={mistakeHighlight}
                    feedback={checker.feedback}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}