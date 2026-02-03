"use client";

import { ChevronRightIcon, FolderXIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useState } from "react";
import { useThemeConfig } from "@/components/active-theme";
import { DatasetSelect } from "@/components/form/dataset-select";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { OrganizationThemeStyleInjector } from "@/context/organization-theme-context";
import { useAdhocPersistence } from "@/hooks/use-adhoc-persistence";
import { useDatasetStats } from "@/hooks/use-dataset-stats";
import { type Project } from "@/types/project";
import { StatsRequest, StatsResponse } from "@/types/stats";
import BarSkeleton from "../chart/bar-skeleton";
import { MultiVariableCharts } from "../chart/multi-variable-charts";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../ui/empty";
import { AdHocVariablesetSelector, SelectionItem } from "./adhoc-variableset-selector";

type AdHocAnalysisProps = {
  project: Project;
};

export function AdHocAnalysis({ project }: AdHocAnalysisProps) {
  const t = useTranslations("projectAdhocAnalysis");
  const { activeTheme, setActiveTheme } = useThemeConfig();
  const { restoreState, saveDataset, saveCurrentSelection } = useAdhocPersistence(project.id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Initialize state from localStorage
  const restoredState = restoreState();
  const [selectedDataset, setSelectedDataset] = useState<string | null>(restoredState?.selectedDataset || null);
  const [currentSelection, setCurrentSelection] = useState<SelectionItem | null>(null);
  const [baseStatsData, setBaseStatsData] = useState<Record<string, StatsResponse>>({});
  const [splitStatsData, setSplitStatsData] = useState<Record<string, StatsResponse>>({});

  // Check for large screens (>= 1024px) where we can show sidebar + charts comfortably
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

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
        // Initialize stats data for all variables without split variables
        // Individual split variable requests will be handled by MultiVariableCharts
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
            setSplitStatsData({}); // Reset split stats when new variables are selected
          },
        });
      }
    }
  }, [currentSelection, mutate]);

  const handleSelectionChange = (selection: SelectionItem) => {
    setCurrentSelection(selection);
    setBaseStatsData({});
    setSplitStatsData({});
    saveCurrentSelection(selection);
    // Close drawer after selection on mobile/tablet
    setSidebarOpen(false);
  };

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
              // Split variable applied - update splitStatsData
              setSplitStatsData((prev) => ({
                ...prev,
                [variableName]: [responseItem],
              }));
            } else {
              // Split variable removed - remove from splitStatsData
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

  // Sidebar content component
  const sidebarContent = (
    <div className="flex flex-col gap-4">
      <DatasetSelect
        projectId={project.id}
        defaultValue={selectedDataset || undefined}
        onValueChange={(value) => {
          setSelectedDataset(value || null);
          setCurrentSelection(null);
          setBaseStatsData({});
          setSplitStatsData({});
          saveDataset(value || null);

          // If value is empty (dataset was deleted), also clear the stored selection
          if (!value) {
            saveCurrentSelection(null);
          }
        }}
      />
      {selectedDataset && (
        <AdHocVariablesetSelector datasetId={selectedDataset} onSelectionChangeAction={handleSelectionChange} />
      )}
    </div>
  );

  return (
    <div className="theme-container">
      <OrganizationThemeStyleInjector activeTheme={activeTheme} />
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Mobile & Tablet (< 1024px): Compact button + Sheet drawer */}
        {!isLargeScreen && (
          <div className="mb-4">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>{t("sidebarTitle")}</span>
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>{t("sidebarTitle")}</SheetTitle>
                  <SheetDescription>{t("sidebarDescription")}</SheetDescription>
                </SheetHeader>
                <div className="mt-4 px-2">{sidebarContent}</div>
              </SheetContent>
            </Sheet>
          </div>
        )}

        {/* Desktop (>= 1024px): Fixed sidebar */}
        {isLargeScreen && <div className="w-64 shrink-0">{sidebarContent}</div>}

        {/* Main content area */}
        <div className="min-w-0 flex-1">
          {selectedDataset && currentSelection && selectedVariables.length > 0 && (
            <Suspense fallback={<BarSkeleton />}>
              <MultiVariableCharts
                key={`${selectedDataset}-${currentSelection.type === "variable" ? currentSelection.variable?.id : currentSelection.variableset?.id}-${sidebarOpen ? "open" : "closed"}`}
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
            <Empty className="w-full max-w-lg">
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
    </div>
  );
}
