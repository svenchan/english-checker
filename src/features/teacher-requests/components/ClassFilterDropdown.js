"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icons } from "@/shared/components/ui/Icons";

export function ClassFilterDropdown({ options = [], selectedValues = [], onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedSet = useMemo(() => new Set(selectedValues || []), [selectedValues]);
  const selectedCount = selectedSet.size;

  const toggleOption = useCallback((value) => {
    const next = new Set(selectedSet);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    onChange?.(Array.from(next));
  }, [selectedSet, onChange]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      window.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("touchstart", handleClickOutside);
      return () => {
        window.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("touchstart", handleClickOutside);
      };
    }
  }, [isOpen]);

  const label = selectedCount === 0 ? "全クラス" : `${selectedCount} クラス`;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <Icons.Filter className="h-4 w-4 text-gray-500" />
        {label}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-lg z-20">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">クラスを選択</p>
            <button
              type="button"
              className="text-xs text-blue-600 hover:underline"
              onClick={() => onChange?.([])}
            >
              リセット
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto py-2">
            {options.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  checked={selectedSet.has(option.value)}
                  onChange={() => toggleOption(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
