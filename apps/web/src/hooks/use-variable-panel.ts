import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "adhoc-variable-panel-open";

export function useVariablePanel(defaultOpen = true) {
  const hydrated = useRef(false);
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    // Read persisted value once on first client render
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null && stored !== String(defaultOpen)) {
        setIsOpen(stored === "true");
      }
    } catch {
      // Ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once on mount

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
