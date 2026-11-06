"use client";

import { useState } from "react";
import { TOPIC_PRESET_GROUPS } from "@/config/topicPresets";
import { Icons } from "@/shared/components/ui/Icons";
import { Tooltip } from "@/shared/components/ui/Tooltip";
import {
  createDefaultTopicState,
  removeTopicState,
  setTopicFromFreeText,
  setTopicFromPreset,
  TOPIC_SOURCES
} from "../lib/topicState";

export function TopicPicker({ value, onChange, presetGroups = TOPIC_PRESET_GROUPS }) {
  const topic = value ?? createDefaultTopicState();
  const [draft, setDraft] = useState(topic.source === TOPIC_SOURCES.FREE ? topic.value : "");

  if (!topic.enabled) {
    return null;
  }
  const presetValue = topic.source === TOPIC_SOURCES.PRESET ? topic.value : "";
  const isFreeDisabled = topic.source === TOPIC_SOURCES.PRESET;
  const isPresetDisabled = draft.trim().length > 0;
  const canSubmit = draft.trim().length > 0 && !isFreeDisabled;

  const emitChange = (nextState) => {
    if (typeof onChange === "function") {
      onChange(nextState);
    }
  };

  const submitDraft = () => {
    if (!canSubmit) return;
    emitChange(setTopicFromFreeText(topic, draft.trim()));
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-800">テーマ</label>
        <Tooltip content="入力済みのテーマを削除します" position="top-right">
          <button
            type="button"
            onClick={() => emitChange(removeTopicState())}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-red-100 text-red-600 hover:bg-red-200"
            aria-label="テーマを削除"
          >
            <Icons.Trash className="h-4 w-4" />
            <span className="sr-only">テーマを削除</span>
          </button>
        </Tooltip>
      </div>
      <div className="grid gap-4 md:grid-cols-2 items-start">
        <div className="relative h-full">
          <input
            id="topic-free-input"
            type="text"
            value={draft}
            disabled={isFreeDisabled}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitDraft();
              }
            }}
            placeholder="例: Recycling in my town"
            aria-label="自由入力"
            className="w-full rounded-md border border-gray-300 py-3 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
          <button
            type="button"
            onClick={submitDraft}
            disabled={!canSubmit}
            aria-label="テーマを決定"
            className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center border-0 bg-transparent p-0 text-sky-600 hover:text-sky-800 disabled:cursor-not-allowed disabled:text-gray-300"
          >
            <Icons.Check className="h-4 w-4" />
          </button>
        </div>

        <div className="h-full">
          <select
            id="topic-preset-select"
            value={presetValue}
            disabled={isPresetDisabled}
            onChange={(event) =>
              emitChange(setTopicFromPreset(topic, event.target.value))
            }
            aria-label="定型テーマ"
            className="w-full rounded-md border border-gray-300 px-3 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value="">テーマを選択</option>
            {presetGroups.map((group) => (
              <optgroup key={group.id} label={group.label}>
                {group.topics.map((preset) => (
                  <option key={preset.id} value={preset.label}>
                    {preset.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

    </div>
  );
}
