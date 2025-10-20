"use client";

import { useCallback, useState } from "react";

const DEBUG_MODE_STORAGE_KEY = "adhoc-debug-mode";

export function useDebugMode() {
  const [debugMode, setDebugModeState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(DEBUG_MODE_STORAGE_KEY);
      return stored === "true";
    } catch (error) {
      console.warn("Failed to load debug mode from localStorage:", error);
      return false;
    }
  });

  // Set debug mode and persist to localStorage
  const setDebugMode = useCallback((enabled: boolean) => {
    setDebugModeState(enabled);
    try {
      localStorage.setItem(DEBUG_MODE_STORAGE_KEY, enabled.toString());
    } catch (error) {
      console.warn("Failed to save debug mode to localStorage:", error);
    }
  }, []);

  return {
    debugMode,
    setDebugMode,
  };
}