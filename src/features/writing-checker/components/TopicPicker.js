"use client";

import { TOPIC_PRESET_GROUPS } from "@/config/topicPresets";
import { Icons } from "@/shared/components/ui/Icons";
import {
  clearTopicState,
  createDefaultTopicState,
  removeTopicState,
  setTopicFromFreeText,
  setTopicFromPreset,
  TOPIC_SOURCES
} from "../lib/topicState";

export function TopicPicker({ value, onChange, presetGroups = TOPIC_PRESET_GROUPS }) {
  const topic = value ?? createDefaultTopicState();
  if (!topic.enabled) {
    return null;
  }

  const freeTextValue = topic.source === TOPIC_SOURCES.FREE ? topic.value : "";
  const presetValue = topic.source === TOPIC_SOURCES.PRESET ? topic.value : "";
  const isFreeDisabled = topic.source === TOPIC_SOURCES.PRESET;
  const isPresetDisabled = topic.source === TOPIC_SOURCES.FREE;

  const emitChange = (nextState) => {
    if (typeof onChange === "function") {
      onChange(nextState);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-800">テーマ</label>
        <button
          type="button"
          onClick={() => emitChange(removeTopicState())}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-red-100 text-red-600 hover:bg-red-200"
          aria-label="テーマを削除"
        >
          <Icons.Trash className="h-4 w-4" />
          <span className="sr-only">テーマを削除</span>
        </button>
      </div>
      <p className="text-xs text-gray-500">
        自由入力かリストからの選択、どちらか一方を使ってください。
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm text-gray-700" htmlFor="topic-free-input">
            自由入力
          </label>
          <input
            id="topic-free-input"
            type="text"
            value={freeTextValue}
            disabled={isFreeDisabled}
            onChange={(event) =>
              emitChange(setTopicFromFreeText(topic, event.target.value))
            }
            placeholder="例: Recycling in my town"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-700" htmlFor="topic-preset-select">
            定型テーマ
          </label>
          <select
            id="topic-preset-select"
            value={presetValue}
            disabled={isPresetDisabled}
            onChange={(event) =>
              emitChange(setTopicFromPreset(topic, event.target.value))
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
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

      {(topic.source === TOPIC_SOURCES.PRESET || topic.source === TOPIC_SOURCES.FREE) && (
        <button
          type="button"
          className="text-xs text-blue-600 hover:text-blue-700"
          onClick={() => emitChange(clearTopicState())}
        >
          入力をクリア
        </button>
      )}
    </div>
  );
}
