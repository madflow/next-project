import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "adhoc-variable-panel-open";

function getInitialIsOpen(defaultOpen: boolean) {
  if (typeof window === "undefined") {
    return defaultOpen;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? defaultOpen : stored === "true";
  } catch {
    return defaultOpen;
  }
}

export function useVariablePanel(defaultOpen = true) {
  const hydrated = useRef(false);
  const [isOpen, setIsOpen] = useState<boolean>(() => getInitialIsOpen(defaultOpen));

  useEffect(() => {
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(isOpen));
    } catch {
      // Ignore storage errors
    }
  }, [isOpen]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle, setIsOpen };
}
