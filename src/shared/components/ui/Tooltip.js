// components/ui/Tooltip.js
"use client";

import React, { useRef, useState, useEffect } from "react";

// A lightweight tooltip with consistent styling and fast appearance
// Props:
// - content: string | ReactNode
// - showDelay: ms before showing (default 100)
// - hideDelay: ms before hiding (default 100)
// - position: 'top' | 'top-right' | 'bottom' | 'bottom-right' (default 'top')
export function Tooltip({
  content,
  children,
  showDelay = 100,
  hideDelay = 100,
  position = "top",
}) {
  const [visible, setVisible] = useState(false);
  const showTimer = useRef(null);
  const hideTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (showTimer.current) clearTimeout(showTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const onEnter = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    showTimer.current = setTimeout(() => setVisible(true), showDelay);
  };

  const onLeave = () => {
    if (showTimer.current) clearTimeout(showTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), hideDelay);
  };

  const positionClasses = (() => {
    switch (position) {
      case "top-right":
        return "bottom-full right-0 mb-2";
      case "bottom":
        return "top-full left-1/2 -translate-x-1/2 mt-2";
      case "bottom-right":
        return "top-full right-0 mt-2";
      case "top":
      default:
        return "bottom-full left-1/2 -translate-x-1/2 mb-2";
    }
  })();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
    >
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-gray-800/95 px-2 py-1 text-xs text-white shadow-sm transition-opacity duration-100 ${
          visible ? "opacity-100" : "opacity-0"
        } ${positionClasses}`}
      >
        {content}
      </span>
    </span>
  );
}
