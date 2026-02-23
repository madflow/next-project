"use client";

import { FolderXIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useThemeConfig } from "@/components/active-theme";
import { DatasetSelect } from "@/components/form/dataset-select";
import { OrganizationThemeStyleInjector } from "@/context/organization-theme-context";
import { useAdhocPersistence } from "@/hooks/use-adhoc-persistence";
import { useDatasetStats } from "@/hooks/use-dataset-stats";
import { useIsMobile } from "@/hooks/use-mobile";
import { useVariablePanel } from "@/hooks/use-variable-panel";
import { type Project } from "@/types/project";
import { StatsRequest, StatsResponse } from "@/types/stats";
import BarSkeleton from "../chart/bar-skeleton";
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

/**
 * Content of the variable selector panel -- reused across desktop inline,
 * tablet Sheet, and mobile Drawer.
 */
function VariablePanelContent({
  selectedDataset,
  project,
  onDatasetChange,
  onSelectionChange,
}: {
  selectedDataset: string | null;
  project: Project;
  onDatasetChange: (value: string | null) => void;
  onSelectionChange: (selection: SelectionItem) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <DatasetSelect
        projectId={project.id}
        defaultValue={selectedDataset || undefined}
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
  const isMobile = useIsMobile();
  const variablePanel = useVariablePanel(true);

  // Separate overlay state for tablet/mobile (Sheet/Drawer)
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  // Initialize state from localStorage
  const restoredState = restoreState();
  const [selectedDataset, setSelectedDataset] = useState<string | null>(restoredState?.selectedDataset || null);
  const [currentSelection, setCurrentSelection] = useState<SelectionItem | null>(null);
  const [baseStatsData, setBaseStatsData] = useState<Record<string, StatsResponse>>({});
  const [splitStatsData, setSplitStatsData] = useState<Record<string, StatsResponse>>({});

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
    if (currentSelection) {
      const variables =
        currentSelection.type === "variable" && currentSelection.variable
          ? [currentSelection.variable]
          : currentSelection.variables || [];

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
  }, [currentSelection, mutate]);

  const handleDatasetChange = useCallback(
    (value: string | null) => {
      setSelectedDataset(value);
      setCurrentSelection(null);
      setBaseStatsData({});
      setSplitStatsData({});
      saveDataset(value);

      if (!value) {
        saveCurrentSelection(null);
      }
    },
    [saveDataset, saveCurrentSelection]
  );

  const handleSelectionChange = useCallback(
    (selection: SelectionItem) => {
      setCurrentSelection(selection);
      setBaseStatsData({});
      setSplitStatsData({});
      saveCurrentSelection(selection);

      // Auto-close the overlay on tablet/mobile after making a selection
      setIsOverlayOpen(false);
    },
    [saveCurrentSelection]
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
    currentSelection?.type === "variable" && currentSelection.variable
      ? [currentSelection.variable]
      : currentSelection?.variables || [];

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
        {selectedDataset && currentSelection && selectedVariables.length > 0 && (
          <Suspense fallback={<BarSkeleton />}>
            <MultiVariableCharts
              variables={selectedVariables}
              baseStatsData={baseStatsData}
              splitStatsData={splitStatsData}
              variableset={
                currentSelection?.type === "set" ? currentSelection.variableset : currentSelection?.parentVariableset
              }
              datasetId={selectedDataset}
              onStatsRequestAction={handleStatsRequest}
            />
          </Suspense>
        )}
        {selectedDataset && !currentSelection && (
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
