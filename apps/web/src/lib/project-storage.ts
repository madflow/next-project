import { SelectionItem } from "@/components/project/adhoc-variableset-selector";

export interface AdhocSelectionState {
  selectedDataset: string | null;
  selectedTheme: string;
  currentSelection: SelectionItem | null;
}

export function useProjectStorage(projectId: string) {
  const key = `adhoc-selection-${projectId}`;

  const getState = (): AdhocSelectionState | null => {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn("Failed to parse stored adhoc selection state:", error);
      return null;
    }
  };

  const setState = (state: Partial<AdhocSelectionState>) => {
    if (typeof window === "undefined") return;

    try {
      const currentState = getState() || {
        selectedDataset: null,
        selectedTheme: "default",
        currentSelection: null,
      };

      const newState = { ...currentState, ...state };

      // Only save if there's actual data to preserve
      if (newState.selectedDataset || newState.selectedTheme !== "default" || newState.currentSelection) {
        localStorage.setItem(key, JSON.stringify(newState));
      }
    } catch (error) {
      console.warn("Failed to save adhoc selection state:", error);
    }
  };

  const clearState = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  };

  return { getState, setState, clearState };
}
