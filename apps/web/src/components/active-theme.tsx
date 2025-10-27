"use client";

import { ReactNode, createContext, useContext, useEffect, useState } from "react";

const DEFAULT_THEME = "default";

type ThemeContextType = {
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
  onThemeChangeAction?: (theme: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Export the chart theme context for use in chart components
export const ChartThemeContext = createContext<string>("default");

export function ActiveThemeProvider({
  children,
  initialTheme,
  onThemeChangeAction,
}: {
  children: ReactNode;
  initialTheme?: string;
  onThemeChangeAction?: (theme: string) => void;
}) {
  const [activeTheme, setActiveThemeState] = useState<string>(() => initialTheme || DEFAULT_THEME);

  const setActiveTheme = (theme: string) => {
    setActiveThemeState(theme);
    onThemeChangeAction?.(theme);
  };

  useEffect(() => {
    Array.from(document.body.classList)
      .filter((className) => className.startsWith("theme-"))
      .forEach((className) => {
        document.body.classList.remove(className);
      });
    document.body.classList.add(`theme-${activeTheme}`);
    if (activeTheme.endsWith("-scaled")) {
      document.body.classList.add("theme-scaled");
    }
  }, [activeTheme]);

  return (
    <ThemeContext.Provider value={{ activeTheme, setActiveTheme, onThemeChangeAction }}>
      <ChartThemeContext.Provider value={activeTheme}>{children}</ChartThemeContext.Provider>
    </ThemeContext.Provider>
  );
}

export function useThemeConfig() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemeConfig must be used within an ActiveThemeProvider");
  }
  return context;
}
