"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("nepalora-theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      aria-pressed={isDark}
      className="
        relative h-8 w-14 rounded-pill border border-hairline
        bg-bg-elevated transition-colors duration-200
      "
    >
      <span
        className="
          absolute top-1 left-1 h-6 w-6 rounded-full bg-ink
          transition-transform duration-300 ease-out
          flex items-center justify-center text-[11px]
        "
        style={{ transform: isDark ? "translateX(24px)" : "translateX(0)" }}
      >
        <span style={{ color: "var(--bg-elevated)" }}>{isDark ? "🌙" : "☀"}</span>
      </span>
    </button>
  );
}
