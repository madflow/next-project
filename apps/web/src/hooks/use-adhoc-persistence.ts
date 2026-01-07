import { useCallback } from "react";
import { SelectionItem } from "@/components/project/adhoc-variableset-selector";
import { AdhocSelectionState, useProjectStorage } from "@/hooks/use-project-storage";

export function useAdhocPersistence(projectId: string) {
  const { getState, setState } = useProjectStorage(projectId);

  const restoreState = useCallback((): AdhocSelectionState | null => {
    return getState();
  }, [getState]);

  const saveTheme = useCallback(
    (theme: string) => {
      setState({ selectedTheme: theme });
    },
    [setState]
  );

  const saveDataset = useCallback(
    (datasetId: string | null) => {
      setState({ selectedDataset: datasetId });
    },
    [setState]
  );

  const saveCurrentSelection = useCallback(
    (selection: SelectionItem | null) => {
      setState({ currentSelection: selection });
    },
    [setState]
  );

  const saveState = useCallback(
    (state: Partial<AdhocSelectionState>) => {
      setState(state);
    },
    [setState]
  );

  return {
    restoreState,
    saveTheme,
    saveDataset,
    saveCurrentSelection,
    saveState,
  };
}
