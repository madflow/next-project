"use client";

import { FolderXIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useThemeConfig } from "@/components/active-theme";
import { DatasetSelect } from "@/components/form/dataset-select";
import { OrganizationThemeStyleInjector } from "@/context/organization-theme-context";
import { useAdhocPersistence } from "@/hooks/use-adhoc-persistence";
import { useDatasetStats } from "@/hooks/use-dataset-stats";
import { useDatasetVariablesets } from "@/hooks/use-dataset-variablesets";
import { useIsMobile } from "@/hooks/use-mobile";
import { useVariablePanel } from "@/hooks/use-variable-panel";
import {
  type ParsedAdhocUrlSelection,
  buildAdhocUrlSearchParams,
  findVariablesetTreeNode,
  matchesAdhocUrlSelection,
  parseAdhocUrlState,
} from "@/lib/adhoc-url-state";
import { type DatasetVariableWithAttributes } from "@/types/dataset-variable";
import { type Project } from "@/types/project";
import { StatsRequest, StatsResponse } from "@/types/stats";
import { BarSkeleton } from "../chart/bar-skeleton";
import { MultiVariableCharts } from "../chart/multi-variable-charts";
import { Button } from "../ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../ui/drawer";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../ui/empty";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { AdHocVariablesetSelector, SelectionItem } from "./adhoc-variableset-selector";

type AdHocAnalysisProps = {
  project: Project;
};

type VariablesResponse = {
  rows: DatasetVariableWithAttributes[];
};

/**
 * Content of the variable selector panel -- reused across desktop inline,
 * tablet Sheet, and mobile Drawer.
 */
function VariablePanelContent({
  selectedDataset,
  project,
  onDatasetChange,
  onDatasetLabelChange,
  onSelectionChange,
}: {
  selectedDataset: string | null;
  project: Project;
  onDatasetChange: (value: string | null) => void;
  onDatasetLabelChange: (label: string | null) => void;
  onSelectionChange: (selection: SelectionItem) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <DatasetSelect
        projectId={project.id}
        defaultValue={selectedDataset || undefined}
        onDatasetLabelChange={onDatasetLabelChange}
        onValueChange={(value) => onDatasetChange(value || null)}
      />
      {selectedDataset && (
        <AdHocVariablesetSelector datasetId={selectedDataset} onSelectionChangeAction={onSelectionChange} />
      )}
    </div>
  );
}

export function AdHocAnalysis({ project }: AdHocAnalysisProps) {
  const t = useTranslations("projectAdhocAnalysis");
  const { activeTheme, setActiveTheme } = useThemeConfig();
  const { restoreState, saveDataset, saveCurrentSelection } = useAdhocPersistence(project.id);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const variablePanel = useVariablePanel(true);

  // Separate overlay state for tablet/mobile (Sheet/Drawer)
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const restoredState = useMemo(() => restoreState(), [restoreState]);
  const parsedUrlState = useMemo(
    () => parseAdhocUrlState(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );
  const isSearchParamsReady = useMemo(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return searchParams.toString() === window.location.search.replace(/^\?/, "");
  }, [searchParams]);
  const initialSelectedDataset = parsedUrlState.hasKnownState
    ? parsedUrlState.selectedDataset
    : restoredState?.selectedDataset || null;
  const [localSelectedDataset, setLocalSelectedDataset] = useState<string | null>(initialSelectedDataset);
  const [selectedDatasetNameState, setSelectedDatasetNameState] = useState<{
    datasetId: string | null;
    name: string | null;
  }>({ datasetId: initialSelectedDataset, name: null });
  const [currentSelection, setCurrentSelection] = useState<SelectionItem | null>(null);
  const [baseStatsData, setBaseStatsData] = useState<Record<string, StatsResponse>>({});
  const [splitStatsData, setSplitStatsData] = useState<Record<string, StatsResponse>>({});
  const syncedStoredDatasetRef = useRef(false);
  const pendingUrlQueryRef = useRef<string | null>(null);
  const clearedUrlSelectionRef = useRef<string | null>(null);
  const selectedDataset = parsedUrlState.hasKnownState ? parsedUrlState.selectedDataset : localSelectedDataset;
  const selectedDatasetName = selectedDatasetNameState.datasetId === selectedDataset ? selectedDatasetNameState.name : null;
  const effectiveCurrentSelection = useMemo(() => {
    if (!parsedUrlState.hasKnownState || parsedUrlState.selectedDataset !== selectedDataset) {
      return currentSelection;
    }

    if (!parsedUrlState.selection) {
      return null;
    }

    return matchesAdhocUrlSelection(currentSelection, parsedUrlState.selection) ? currentSelection : null;
  }, [
    currentSelection,
    parsedUrlState.hasKnownState,
    parsedUrlState.selectedDataset,
    parsedUrlState.selection,
    selectedDataset,
  ]);
  const { data: variablesets = [], isLoading: isVariablesetsLoading } = useDatasetVariablesets(selectedDataset);

  const clearStatsData = useCallback(() => {
    setBaseStatsData({});
    setSplitStatsData({});
  }, []);

  const syncUrlState = useCallback(
    (datasetId: string | null, selection: SelectionItem | null) => {
      const currentSearchParams = new URLSearchParams(window.location.search);
      const nextSearchParams = buildAdhocUrlSearchParams(currentSearchParams, {
        selectedDataset: datasetId,
        selection,
      });
      const nextQueryString = nextSearchParams.toString();
      const currentQueryString = currentSearchParams.toString();

      if (nextQueryString === currentQueryString) {
        pendingUrlQueryRef.current = null;
        return;
      }

      const nextUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;
      pendingUrlQueryRef.current = nextQueryString;
      window.history.replaceState(null, "", nextUrl);
    },
    [pathname]
  );

  const restoreSelectionFromUrl = useCallback(
    async (datasetId: string, selection: ParsedAdhocUrlSelection) => {
      if (selection.type === "set") {
        const variableset = findVariablesetTreeNode(variablesets, selection.variablesetId);

        if (!variableset) {
          return null;
        }

        const response = await fetch(`/api/variablesets/${selection.variablesetId}/variables`);
        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as VariablesResponse;
        return {
          type: "set" as const,
          variableset,
          variables: data.rows,
        };
      }

      const parentVariableset = selection.parentVariablesetId
        ? findVariablesetTreeNode(variablesets, selection.parentVariablesetId)
        : null;

      if (selection.parentVariablesetId) {
        const response = await fetch(`/api/variablesets/${selection.parentVariablesetId}/variables`);
        if (response.ok) {
          const data = (await response.json()) as VariablesResponse;
          const variable = data.rows.find((item) => item.name === selection.variableName);

          if (variable) {
            return {
              type: "variable" as const,
              variable,
              parentVariableset: parentVariableset || undefined,
            };
          }
        }
      }

      const params = new URLSearchParams({ name: selection.variableName, limit: "1" });
      const response = await fetch(`/api/datasets/${datasetId}/variables?${params.toString()}`);
      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as VariablesResponse;
      const variable = data.rows.find((item) => item.name === selection.variableName);

      if (!variable) {
        return null;
      }

      return {
        type: "variable" as const,
        variable,
        parentVariableset: parentVariableset || undefined,
      };
    },
    [variablesets]
  );

  // Set theme on mount if needed
  useEffect(() => {
    if (restoredState?.selectedTheme && restoredState.selectedTheme !== "default") {
      setActiveTheme(restoredState.selectedTheme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const { mutate } = useDatasetStats(selectedDataset || "", {
    onError: (error) => {
      console.error(t("errors.fetchStats"), error);
    },
  });

  useEffect(() => {
    if (pendingUrlQueryRef.current !== null && searchParams.toString() === pendingUrlQueryRef.current) {
      pendingUrlQueryRef.current = null;
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isSearchParamsReady) {
      return;
    }

    if (pendingUrlQueryRef.current !== null) {
      return;
    }

    if (syncedStoredDatasetRef.current) {
      return;
    }

    syncedStoredDatasetRef.current = true;

    if (!parsedUrlState.hasKnownState && restoredState?.selectedDataset) {
      syncUrlState(restoredState.selectedDataset, null);
    }
  }, [isSearchParamsReady, parsedUrlState.hasKnownState, restoredState?.selectedDataset, syncUrlState]);

  useEffect(() => {
    if (!isSearchParamsReady) {
      return;
    }

    if (pendingUrlQueryRef.current !== null) {
      return;
    }

    if (!parsedUrlState.hasKnownState) {
      return;
    }

    saveDataset(parsedUrlState.selectedDataset);
  }, [
    isSearchParamsReady,
    parsedUrlState.hasKnownState,
    parsedUrlState.selectedDataset,
    saveDataset,
  ]);

  useEffect(() => {
    if (!isSearchParamsReady) {
      return;
    }

    if (pendingUrlQueryRef.current !== null) {
      return;
    }

    if (!parsedUrlState.hasKnownState || parsedUrlState.selectedDataset !== selectedDataset) {
      clearedUrlSelectionRef.current = null;
      return;
    }

    if (!parsedUrlState.selection) {
      if (parsedUrlState.hasSelectionParams) {
        syncUrlState(selectedDataset, null);
      }

      if (!currentSelection) {
        clearedUrlSelectionRef.current = null;
        return;
      }

      if (clearedUrlSelectionRef.current === selectedDataset) {
        return;
      }

      clearedUrlSelectionRef.current = selectedDataset;
      clearStatsData();
      saveCurrentSelection(null);
      return;
    }

    clearedUrlSelectionRef.current = null;

    if (matchesAdhocUrlSelection(currentSelection, parsedUrlState.selection)) {
      return;
    }

    if (isVariablesetsLoading) {
      return;
    }

    let cancelled = false;
    const datasetId = selectedDataset;

    if (!datasetId) {
      syncUrlState(null, null);
      return;
    }

    const restoreSelection = async () => {
      try {
        const selectionToRestore = parsedUrlState.selection;
        if (!selectionToRestore) {
          return;
        }

        const restoredSelection = await restoreSelectionFromUrl(datasetId, selectionToRestore);
        if (cancelled) {
          return;
        }

        setCurrentSelection(restoredSelection);
        clearStatsData();
        saveCurrentSelection(restoredSelection);

        if (!restoredSelection) {
          syncUrlState(datasetId, null);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Failed to restore adhoc selection from URL", error);
        setCurrentSelection(null);
        clearStatsData();
        saveCurrentSelection(null);
        syncUrlState(datasetId, null);
      }
    };

    restoreSelection();

    return () => {
      cancelled = true;
    };
  }, [
    clearStatsData,
    currentSelection,
    isSearchParamsReady,
    isVariablesetsLoading,
    parsedUrlState.hasKnownState,
    parsedUrlState.hasSelectionParams,
    parsedUrlState.selectedDataset,
    parsedUrlState.selection,
    restoreSelectionFromUrl,
    saveCurrentSelection,
    selectedDataset,
    syncUrlState,
    t,
  ]);

  useEffect(() => {
    if (effectiveCurrentSelection) {
      const variables =
        effectiveCurrentSelection.type === "variable" && effectiveCurrentSelection.variable
          ? [effectiveCurrentSelection.variable]
          : effectiveCurrentSelection.variables || [];

      if (variables.length > 0) {
        const request: StatsRequest = {
          variables: variables.map((v) => ({ variable: v.name })),
          decimal_places: 2,
        };

        mutate(request, {
          onSuccess: (data) => {
            const newStatsData: Record<string, StatsResponse> = {};
            variables.forEach((variable, index) => {
              if (data[index]) {
                newStatsData[variable.name] = [data[index]];
              }
            });
            setBaseStatsData(newStatsData);
            setSplitStatsData({});
          },
        });
      }
    }
  }, [effectiveCurrentSelection, mutate]);

  const handleDatasetChange = useCallback(
    (value: string | null) => {
      setLocalSelectedDataset(value);
      setSelectedDatasetNameState({ datasetId: value, name: null });
      setCurrentSelection(null);
      clearStatsData();
      saveDataset(value);
      saveCurrentSelection(null);
      syncUrlState(value, null);
    },
    [clearStatsData, saveDataset, saveCurrentSelection, syncUrlState]
  );

  const handleSelectionChange = useCallback(
    (selection: SelectionItem) => {
      setCurrentSelection(selection);
      clearStatsData();
      saveCurrentSelection(selection);
      syncUrlState(selectedDataset, selection);

      // Auto-close the overlay on tablet/mobile after making a selection
      setIsOverlayOpen(false);
    },
    [clearStatsData, saveCurrentSelection, selectedDataset, syncUrlState]
  );

  const handleDatasetLabelChange = useCallback(
    (label: string | null) => {
      setSelectedDatasetNameState({ datasetId: selectedDataset, name: label });
    },
    [selectedDataset]
  );

  const handleStatsRequest = (variableName: string, splitVariable?: string) => {
    if (currentSelection) {
      const request: StatsRequest = {
        variables: [{ variable: variableName, split_variable: splitVariable }],
        decimal_places: 2,
      };

      mutate(request, {
        onSuccess: (data) => {
          const responseItem = data[0];
          if (responseItem) {
            if (splitVariable) {
              setSplitStatsData((prev) => ({
                ...prev,
                [variableName]: [responseItem],
              }));
            } else {
              setSplitStatsData((prev) => {
                const updated = { ...prev };
                delete updated[variableName];
                return updated;
              });
            }
          }
        },
      });
    }
  };

  const selectedVariables =
    effectiveCurrentSelection?.type === "variable" && effectiveCurrentSelection.variable
      ? [effectiveCurrentSelection.variable]
      : effectiveCurrentSelection?.variables || [];

  return (
    <div className="theme-container flex flex-col gap-4 lg:flex-row">
      <OrganizationThemeStyleInjector activeTheme={activeTheme} />

      {/* ============================================================
          DESKTOP (lg+): Inline collapsible variable panel
          ============================================================ */}
      <div
        className="hidden lg:flex"
        style={{
          width: variablePanel.isOpen ? "16rem" : "0px",
          minWidth: variablePanel.isOpen ? "16rem" : "0px",
          transition: "width 200ms ease-in-out, min-width 200ms ease-in-out",
          overflow: "hidden",
        }}>
        <div className="flex w-64 min-w-64 flex-col gap-4">
          <VariablePanelContent
            selectedDataset={selectedDataset}
            project={project}
            onDatasetChange={handleDatasetChange}
            onDatasetLabelChange={handleDatasetLabelChange}
            onSelectionChange={handleSelectionChange}
          />
        </div>
      </div>

      {/* Desktop panel toggle button -- only visible on lg+ */}
      <div className="hidden lg:flex lg:items-start">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={variablePanel.toggle}
              data-testid="variable-panel-toggle"
              aria-label={variablePanel.isOpen ? t("variablePanel.hidePanel") : t("variablePanel.showPanel")}>
              {variablePanel.isOpen ? (
                <PanelLeftCloseIcon className="h-4 w-4" />
              ) : (
                <PanelLeftOpenIcon className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {variablePanel.isOpen ? t("variablePanel.hidePanel") : t("variablePanel.showPanel")}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* ============================================================
          TABLET (md to lg): Sheet overlay from the left
          ============================================================ */}
      <Sheet open={isOverlayOpen && !isMobile} onOpenChange={setIsOverlayOpen}>
        <SheetContent side="left" className="w-80 sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>{t("variablePanel.title")}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <VariablePanelContent
              selectedDataset={selectedDataset}
              project={project}
              onDatasetChange={handleDatasetChange}
              onDatasetLabelChange={handleDatasetLabelChange}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* ============================================================
          MOBILE (<md): Drawer from the bottom
          ============================================================ */}
      <Drawer open={isOverlayOpen && isMobile} onOpenChange={setIsOverlayOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("variablePanel.title")}</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <VariablePanelContent
              selectedDataset={selectedDataset}
              project={project}
              onDatasetChange={handleDatasetChange}
              onDatasetLabelChange={handleDatasetLabelChange}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* ============================================================
          MOBILE/TABLET (<lg): Trigger button to open the overlay
          ============================================================ */}
      <div className="flex lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOverlayOpen(true)}
          data-testid="variable-panel-trigger-mobile">
          <PanelLeftOpenIcon className="mr-2 h-4 w-4" />
          {t("variablePanel.showPanel")}
        </Button>
      </div>

      {/* ============================================================
          WORKSPACE: Charts area -- takes all remaining space
          ============================================================ */}
      <div className="min-w-0 flex-1">
        {selectedDataset && effectiveCurrentSelection && selectedVariables.length > 0 && (
          <Suspense fallback={<BarSkeleton />}>
            <MultiVariableCharts
              variables={selectedVariables}
              baseStatsData={baseStatsData}
              splitStatsData={splitStatsData}
              variableset={
                effectiveCurrentSelection?.type === "set"
                  ? effectiveCurrentSelection.variableset
                  : effectiveCurrentSelection?.parentVariableset
              }
              datasetId={selectedDataset}
              datasetName={selectedDatasetName ?? ""}
              onStatsRequestAction={handleStatsRequest}
            />
          </Suspense>
        )}
        {selectedDataset && !effectiveCurrentSelection && (
          <Empty className="flex max-w-lg flex-col gap-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderXIcon />
              </EmptyMedia>
              <EmptyTitle>{t("empty.title")}</EmptyTitle>
              <EmptyDescription>{t("empty.description")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent></EmptyContent>
          </Empty>
        )}
      </div>
    </div>
  );
}
