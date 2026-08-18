"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { type ThemePreference, loadThemePreference, saveThemePreference } from "@/state/persistence";

type ThemeContextValue = {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("system");

  useEffect(() => {
    // Deliberately deferred to after mount: localStorage isn't available during SSR,
    // and reading it during render would produce a client/server hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(loadThemePreference());
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: (next) => {
        setThemeState(next);
        saveThemePreference(next);
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
