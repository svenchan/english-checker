"use client";

import { CHECKER_MODES } from "@/config/testMode";
import { Icons } from "@/shared/components/ui/Icons";
import { Tooltip } from "@/shared/components/ui/Tooltip";

const MODE_CONFIG = [
  {
    id: CHECKER_MODES.PRACTICE,
    label: "練習モード",
    description: "自由にテーマを選んで練習",
    icon: Icons.Pen
  },
  {
    id: CHECKER_MODES.TEST,
    label: "テストモード",
    description: "5分の本番シミュレーション",
    icon: Icons.Clock
  }
];

const MODE_STYLES = {
  [CHECKER_MODES.PRACTICE]: {
    active: "border-blue-600 bg-blue-100 text-blue-700",
    inactive: "border-gray-200 bg-white text-gray-500 hover:border-blue-300 hover:text-blue-600"
  },
  [CHECKER_MODES.TEST]: {
    active: "border-red-600 bg-red-100 text-red-700",
    inactive: "border-gray-200 bg-white text-gray-500 hover:border-red-300 hover:text-red-600"
  }
};

export function ModeSidebar({ activeMode, onModeChange }) {
  return (
    <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-6 space-y-4">
      {MODE_CONFIG.map((mode) => {
        const Icon = mode.icon;
        const isActive = activeMode === mode.id;
        return (
          <Tooltip
            key={mode.id}
            content={`${mode.label} — ${mode.description}`}
            position="right"
          >
            <button
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                if (typeof onModeChange === "function") {
                  onModeChange(mode.id);
                }
              }}
              className={`h-12 w-12 rounded-xl border-2 flex items-center justify-center transition-colors ${
                isActive ? MODE_STYLES[mode.id].active : MODE_STYLES[mode.id].inactive
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="sr-only">{mode.label}</span>
            </button>
          </Tooltip>
        );
      })}
    </aside>
  );
}
