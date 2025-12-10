"use client";

import { useEffect, useMemo, useState } from "react";

const ROLE_OPTIONS = [
  { value: "student", label: "生徒" },
  { value: "teacher", label: "教師" }
];

export function OnboardingForm({
  defaultFirstName = "",
  defaultLastName = "",
  defaultRole = "student",
  onSubmit,
  isSubmitting = false,
  error = ""
}) {
  const [firstName, setFirstName] = useState(defaultFirstName);
  const [lastName, setLastName] = useState(defaultLastName);
  const [role, setRole] = useState(defaultRole);
  const [schoolCode, setSchoolCode] = useState("");
  const [localError, setLocalError] = useState("");
  const isTeacher = role === "teacher";
  const trimmedSchoolCode = schoolCode.trim();

  useEffect(() => {
    setFirstName(defaultFirstName || "");
  }, [defaultFirstName]);

  useEffect(() => {
    setLastName(defaultLastName || "");
  }, [defaultLastName]);

  useEffect(() => {
    setRole(defaultRole || "student");
  }, [defaultRole]);

  useEffect(() => {
    if (!isTeacher && schoolCode) {
      setSchoolCode("");
    }
  }, [isTeacher, schoolCode]);
  const isSubmitDisabled = useMemo(() => {
    if (!firstName.trim() || !lastName.trim()) return true;
    if (!role) return true;
    if (isTeacher && !trimmedSchoolCode) return true;
    return false;
  }, [firstName, lastName, role, isTeacher, trimmedSchoolCode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");

    if (isSubmitDisabled) {
      setLocalError("全ての必須項目を入力してください");
      return;
    }

    try {
  await onSubmit?.({ firstName, lastName, role, schoolCode: trimmedSchoolCode || undefined });
    } catch (submissionError) {
      setLocalError(submissionError.message || "送信に失敗しました");
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-lg border border-gray-100">
      <div className="space-y-2 text-center mb-6">
        <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest">プロフィール登録</p>
        <h2 className="text-2xl font-bold text-gray-900">最初にいくつか教えてください</h2>
        <p className="text-sm text-gray-600">
          1分で完了します。登録後、英作文の履歴を保存できるようになります。
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名</label>
            <input
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Taro"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓</label>
            <input
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Yamada"
              required
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">役割を選択</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {ROLE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 cursor-pointer transition ${
                  role === option.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                <div>
                  <p className="font-semibold">{option.label}</p>
                  <p className="text-xs text-gray-500">{option.value === "student" ? "授業で利用" : "提出ログの確認"}</p>
                </div>
                <input
                  type="radio"
                  className="h-4 w-4 text-blue-600"
                  name="role"
                  value={option.value}
                  checked={role === option.value}
                  onChange={() => setRole(option.value)}
                />
              </label>
            ))}
          </div>
        </div>

        {isTeacher && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">学校コード</label>
            <input
              type="text"
              value={schoolCode}
              onChange={(event) => setSchoolCode(event.target.value.toUpperCase())}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 uppercase tracking-widest"
              placeholder="例: ABC123"
              required
            />
            <p className="mt-1 text-xs text-gray-500">教師アカウントを確認するために必要です。</p>
          </div>
        )}

        {(localError || error) && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {localError || error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || isSubmitDisabled}
          className="w-full rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "登録中..." : "登録してはじめる"}
        </button>
      </form>
    </div>
  );
}
