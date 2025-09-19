"use client";

import { ReactNode, createContext, useContext, useMemo } from "react";
import { useAppContext } from "@/context/app-context";
import { type Organization, type ThemeItem } from "@/types/organization";

// Default themes that are always available
const DEFAULT_THEMES: ThemeItem[] = [
  {
    name: "Default",
    chartColors: {
      "chart-1": "#3b82f6",
      "chart-2": "#ef4444",
      "chart-3": "#10b981",
      "chart-4": "#f59e0b",
      "chart-5": "#8b5cf6",
      "chart-6": "#ec4899",
    },
  },
  {
    name: "Scaled",
    chartColors: {
      "chart-1": "#2563eb",
      "chart-2": "#dc2626",
      "chart-3": "#059669",
      "chart-4": "#d97706",
      "chart-5": "#7c3aed",
      "chart-6": "#db2777",
    },
  },
  {
    name: "Mono",
    chartColors: {
      "chart-1": "#374151",
      "chart-2": "#6b7280",
      "chart-3": "#9ca3af",
      "chart-4": "#d1d5db",
      "chart-5": "#e5e7eb",
      "chart-6": "#f3f4f6",
    },
  },
];

// Color themes mapped to their primary colors
const COLOR_THEME_MAPPINGS: Record<string, ThemeItem> = {
  blue: {
    name: "Blue",
    chartColors: {
      "chart-1": "#3b82f6",
      "chart-2": "#1d4ed8",
      "chart-3": "#60a5fa",
      "chart-4": "#93c5fd",
      "chart-5": "#dbeafe",
      "chart-6": "#eff6ff",
    },
  },
  green: {
    name: "Green",
    chartColors: {
      "chart-1": "#10b981",
      "chart-2": "#059669",
      "chart-3": "#34d399",
      "chart-4": "#6ee7b7",
      "chart-5": "#a7f3d0",
      "chart-6": "#d1fae5",
    },
  },
  amber: {
    name: "Amber",
    chartColors: {
      "chart-1": "#f59e0b",
      "chart-2": "#d97706",
      "chart-3": "#fbbf24",
      "chart-4": "#fcd34d",
      "chart-5": "#fde68a",
      "chart-6": "#fef3c7",
    },
  },
  rose: {
    name: "Rose",
    chartColors: {
      "chart-1": "#f43f5e",
      "chart-2": "#e11d48",
      "chart-3": "#fb7185",
      "chart-4": "#fda4af",
      "chart-5": "#fecdd3",
      "chart-6": "#fef2f2",
    },
  },
  purple: {
    name: "Purple",
    chartColors: {
      "chart-1": "#8b5cf6",
      "chart-2": "#7c3aed",
      "chart-3": "#a78bfa",
      "chart-4": "#c4b5fd",
      "chart-5": "#ddd6fe",
      "chart-6": "#f3f4f6",
    },
  },
  orange: {
    name: "Orange",
    chartColors: {
      "chart-1": "#f97316",
      "chart-2": "#ea580c",
      "chart-3": "#fb923c",
      "chart-4": "#fdba74",
      "chart-5": "#fed7aa",
      "chart-6": "#fff7ed",
    },
  },
  teal: {
    name: "Teal",
    chartColors: {
      "chart-1": "#14b8a6",
      "chart-2": "#0d9488",
      "chart-3": "#2dd4bf",
      "chart-4": "#5eead4",
      "chart-5": "#99f6e4",
      "chart-6": "#ccfbf1",
    },
  },
};

type OrganizationThemeContextType = {
  availableThemes: ThemeItem[];
  getThemeByName: (name: string) => ThemeItem | null;
  getDefaultThemes: () => ThemeItem[];
  getColorThemes: () => Record<string, ThemeItem>;
  resolveTheme: (activeThemeName: string) => { theme: ThemeItem; isOrganizationTheme: boolean };
};

const OrganizationThemeContext = createContext<OrganizationThemeContextType | undefined>(undefined);

export function OrganizationThemeProvider({ children }: { children: ReactNode }) {
  const { activeOrganization } = useAppContext();

  // Cast the organization to our custom type since better-auth doesn't include settings
  const organizationWithSettings = activeOrganization as unknown as Organization | null;

  const availableThemes = useMemo(() => {
    const organizationThemes = organizationWithSettings?.settings?.themes || [];
    const sanitizedOrganizationThemes = organizationThemes.map((theme: ThemeItem) => ({
      ...theme,
      name: theme.name
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/[^A-Za-z0-9\-_]/g, ""), // Remove any characters that aren't A-Za-z0-9, -, or _
    }));
    return [...DEFAULT_THEMES, ...sanitizedOrganizationThemes];
  }, [organizationWithSettings?.settings?.themes]);

  const getThemeByName = (name: string): ThemeItem | null => {
    const foundTheme = availableThemes.find((theme) => theme.name.toLowerCase() === name.toLowerCase());
    if (foundTheme) return foundTheme;

    const colorTheme = COLOR_THEME_MAPPINGS[name];
    return colorTheme !== undefined ? colorTheme : null;
  };

  const getDefaultThemes = () => DEFAULT_THEMES;

  const getColorThemes = () => COLOR_THEME_MAPPINGS;

  const resolveTheme = (activeThemeName: string) => {
    const sanitizedActiveThemeName = activeThemeName
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/[^A-Za-z0-9\-_]/g, ""); // Remove any characters that aren't A-Za-z0-9, -, or _

    // First check if it's an organization theme (try both original and sanitized names)
    const orgTheme = organizationWithSettings?.settings?.themes?.find((theme: ThemeItem) => {
      const themeName = theme.name.replace(/\s+/g, "-").replace(/[^A-Za-z0-9\-_]/g, "");
      return themeName === sanitizedActiveThemeName || theme.name.toLowerCase() === activeThemeName.toLowerCase();
    });

    if (orgTheme) {
      return {
        theme: {
          ...orgTheme,
          name: orgTheme.name.replace(/\s+/g, "-").replace(/[^A-Za-z0-9\-_]/g, ""),
        },
        isOrganizationTheme: true,
      };
    }

    // Check default themes
    const defaultTheme = DEFAULT_THEMES.find(
      (theme) => theme.name.toLowerCase() === sanitizedActiveThemeName.toLowerCase()
    );

    if (defaultTheme) {
      return { theme: defaultTheme, isOrganizationTheme: false };
    }

    // Check color theme mappings
    const colorTheme = COLOR_THEME_MAPPINGS[sanitizedActiveThemeName.toLowerCase()];
    if (colorTheme) {
      return { theme: colorTheme, isOrganizationTheme: false };
    }

    // Fallback to default theme
    return {
      theme: DEFAULT_THEMES[0]!,
      isOrganizationTheme: false,
    };
  };

  return (
    <OrganizationThemeContext.Provider
      value={{
        availableThemes,
        getThemeByName,
        getDefaultThemes,
        getColorThemes,
        resolveTheme,
      }}>
      {children}
    </OrganizationThemeContext.Provider>
  );
}

export function useOrganizationTheme() {
  const context = useContext(OrganizationThemeContext);
  if (context === undefined) {
    throw new Error("useOrganizationTheme must be used within an OrganizationThemeProvider");
  }
  return context;
}
