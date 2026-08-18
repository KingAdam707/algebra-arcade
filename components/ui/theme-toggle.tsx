"use client";

import { useTheme } from "./theme-provider";
import type { ThemePreference } from "@/state/persistence";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
  { value: "dark", label: "Dark" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="inline-flex items-center gap-0.5 rounded-pill border border-border bg-surface-sunken p-0.5"
    >
      {OPTIONS.map((option) => {
        const selected = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => setTheme(option.value)}
            className={`min-h-8 rounded-pill px-3 text-sm font-medium transition-colors duration-150 ${
              selected ? "bg-accent text-accent-contrast" : "text-ink-muted hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
