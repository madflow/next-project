"use client";

import {
  BanIcon,
  BarChart3Icon,
  ChartBarBigIcon,
  ChartBarDecreasingIcon,
  ChartBarStackedIcon,
  ChartColumnBigIcon,
  ChartPieIcon,
  DownloadIcon,
  SheetIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAppContext } from "@/context/app-context";
import { useChartExport } from "@/hooks/use-chart-export";
import { useQueryApi } from "@/hooks/use-query-api";
import { isSplitVariableStats, transformToRechartsBarData, transformToRechartsPieData } from "@/lib/analysis-bridge";
import { PERCENTAGE_CHART_DECIMALS, YAXIS_LABEL_MAX_WIDTH, formatChartValue } from "@/lib/chart-constants";
import { determineChartSelection } from "@/lib/chart-selection";
import { type DatasetVariableWithAttributes } from "@/types/dataset-variable";
import { AnalysisChartType, StatsResponse } from "@/types/stats";
import { SplitVariableSelector } from "../project/split-variable-selector";
import { Button } from "../ui/button";
import { Code } from "../ui/code";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../ui/empty";
import { HorizontalStackedBarAdhoc } from "./horizontal-stacked-bar-adhoc";
import { MeanBarAdhoc } from "./mean-bar-adhoc";
import { MetricsCards } from "./metrics-cards";
import { TruncatedYAxisTick } from "./truncated-yaxis-tick";
import { UnsupportedChartPlaceholder } from "./unsupported-chart-placeholder";

type AdhocChartProps = {
  variable: DatasetVariableWithAttributes;
  stats: StatsResponse;
  datasetId?: string;
  selectedSplitVariable?: string | null;
  onSplitVariableChangeAction?: (splitVariable: string | null) => void;
} & React.HTMLAttributes<HTMLDivElement>;

export function AdhocChart({
  variable,
  stats,
  datasetId,
  selectedSplitVariable,
  onSplitVariableChangeAction,
  ...props
}: AdhocChartProps) {
  const t = useTranslations("projectAdhocAnalysis");
  const tChart = useTranslations("chartMetricsCard");
  const { ref, exportPNG } = useChartExport();
  const { debugMode } = useAppContext();

  // Fetch split variables when datasetId is provided
  const { data: splitVariablesResponse } = useQueryApi<{ rows: DatasetVariableWithAttributes[] }>({
    endpoint: `/api/datasets/${datasetId}/splitvariables`,
    pagination: { pageIndex: 0, pageSize: 100 },
    sorting: [],
    search: "",
    queryKey: ["dataset-split-variables", datasetId],
    enabled: !!datasetId,
  });

  const allVariables = splitVariablesResponse?.rows || [];

  // Helper function to get split variable description
  function getSplitVariableDescription(variable: DatasetVariableWithAttributes, stats: StatsResponse): string | null {
    // Find the stats for this variable
    const targetVariable = stats.find((item) => item.variable === variable.name);
    if (!targetVariable || !isSplitVariableStats(targetVariable.stats)) {
      return null;
    }

    const splitVariableName = targetVariable.stats.split_variable;

    // Try to find the split variable in allVariables to get its label
    if (allVariables.length > 0) {
      const splitVariable = allVariables.find((v: DatasetVariableWithAttributes) => v.name === splitVariableName);
      if (splitVariable) {
        const splitVariableLabel = splitVariable.label ?? splitVariable.name;
        return t("splitBy", { variable: splitVariableLabel });
      }
    }

    // Fallback to variable name if no label found
    return t("splitBy", { variable: splitVariableName });
  }

  // Use new chart selection logic
  const chartSelection = useMemo(() => {
    // Check if split variable is present in the data
    const targetVariable = stats.find((item) => item.variable === variable.name);
    const hasSplitVariable = Boolean(targetVariable && isSplitVariableStats(targetVariable.stats));

    return determineChartSelection({
      variable,
      stats,
      hasSplitVariable,
      attributes: variable.attributes,
    });
  }, [variable, stats]);

  // Derive the selected chart type based on chart selection
  const selectedChartType = useMemo(() => {
    const targetVariable = stats.find((item) => item.variable === variable.name);
    const hasSplitVariable = Boolean(targetVariable && isSplitVariableStats(targetVariable.stats));

    const newChartSelection = determineChartSelection({
      variable,
      stats,
      hasSplitVariable,
      attributes: variable.attributes,
    });

    return newChartSelection.defaultChartType;
  }, [variable, stats]);

  // Detect when variable or split status changes for reset key
  const targetVariable = useMemo(() => stats.find((item) => item.variable === variable.name), [stats, variable.name]);
  const hasSplitVariable = useMemo(
    () => Boolean(targetVariable && isSplitVariableStats(targetVariable.stats)),
    [targetVariable]
  );

  // Create a reset key that changes when we want to reset user selection
  const resetKey = `${variable.id}-${hasSplitVariable}`;

  const [userSelectedChartType, setUserSelectedChartType] = useState<AnalysisChartType | null>(null);
  const [currentResetKey, setCurrentResetKey] = useState(resetKey);

  // Reset user selection when reset key changes (derived from variable id and split status)
  if (currentResetKey !== resetKey) {
    setUserSelectedChartType(null);
    setCurrentResetKey(resetKey);
  }

  // Get the actual selected chart type
  const actualSelectedChartType = userSelectedChartType || selectedChartType;

  const chartConfig = {
    percentage: {
      label: tChart("percent"),
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  // Show unsupported chart placeholder if needed
  if (chartSelection.showUnsupportedPlaceholder) {
    return (
      <UnsupportedChartPlaceholder
        variableName={variable.name}
        variableLabel={variable.label ?? undefined}
        reason={chartSelection.unsupportedReason}
        data-testid="unsupported-chart-placeholder"
        {...props}
      />
    );
  }

  // Show empty state when no charts are allowed
  if (chartSelection.availableChartTypes.length === 0) {
    return (
      <div {...props}>
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle>{variable.label ?? variable.name}</CardTitle>
            {getSplitVariableDescription(variable, stats) && (
              <CardDescription>{getSplitVariableDescription(variable, stats)}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <Empty className="border-none p-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BanIcon />
                </EmptyMedia>
                <EmptyTitle>{t("noChartsAllowed.title")}</EmptyTitle>
                <EmptyDescription>{t("noChartsAllowed.description")}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent></EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderChart() {
    switch (actualSelectedChartType) {
      case "bar":
        return (
          <ChartContainer config={chartConfig} ref={ref} data-export-filename={variable.name}>
            <BarChart accessibilityLayer data={transformToRechartsBarData(variable, stats)}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} tickMargin={10} axisLine={false} fontSize={10} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <YAxis
                domain={[0, 100]}
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                fontSize={10}
                ticks={[0, 20, 40, 60, 80, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Bar dataKey="percentage" fill="var(--color-percentage)">
                <LabelList
                  dataKey="percentage"
                  position="top"
                  fontSize={10}
                  formatter={(value: number) => `${formatChartValue(value, PERCENTAGE_CHART_DECIMALS)}%`}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        );

      case "horizontalBar":
        return (
          <ChartContainer config={chartConfig} ref={ref} data-export-filename={variable.name}>
            <BarChart
              layout="vertical"
              margin={{ left: 0 }}
              barCategoryGap={1}
              accessibilityLayer
              data={transformToRechartsBarData(variable, stats)}>
              <CartesianGrid vertical={true} horizontal={false} />
              <XAxis
                domain={[0, 100]}
                dataKey="percentage"
                type="number"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                fontSize={10}
                ticks={[0, 20, 40, 60, 80, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis
                dataKey="label"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                width={YAXIS_LABEL_MAX_WIDTH}
                tick={<TruncatedYAxisTick />}
              />
              <Bar dataKey="percentage" fill="var(--color-percentage)">
                <LabelList
                  dataKey="percentage"
                  position="right"
                  fontSize={10}
                  formatter={(value: number) => `${formatChartValue(value, PERCENTAGE_CHART_DECIMALS)}%`}
                />
              </Bar>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            </BarChart>
          </ChartContainer>
        );

      case "horizontalStackedBar":
        return <HorizontalStackedBarAdhoc variable={variable} stats={stats} ref={ref} />;

      case "pie": {
        const pieData = transformToRechartsPieData(variable, stats);
        const pieChartConfig: ChartConfig = {};

        pieData.forEach((item, index) => {
          const key: string = item.label;
          const colorIndex = (index % 6) + 1;
          pieChartConfig[key] = {
            label: item.label,
            color: `hsl(var(--chart-${colorIndex}))`,
          };
        });

        return (
          <ChartContainer config={pieChartConfig} ref={ref} data-export-filename={variable.name}>
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="label" />} />
              <Pie data={pieData} dataKey="percentage" nameKey="label" startAngle={90} endAngle={-270}>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList
                  dataKey="percentage"
                  position="inside"
                  fontSize={10}
                  fill="white"
                  formatter={(value: number) => `${formatChartValue(value, PERCENTAGE_CHART_DECIMALS)}%`}
                />
              </Pie>
              <ChartLegend
                fontSize={10}
                content={<ChartLegendContent nameKey="label" />}
                className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
              />
            </PieChart>
          </ChartContainer>
        );
      }

      case "metrics":
        return <MetricsCards variable={variable} stats={stats} datasetId={datasetId} />;

      case "meanBar":
        return <MeanBarAdhoc variable={variable} stats={stats} datasetId={datasetId} ref={ref} />;

      default:
        return null;
    }
  }

  const getChartIcon = (chartType: AnalysisChartType) => {
    switch (chartType) {
      case "bar":
        return <ChartColumnBigIcon className="h-4 w-4" />;
      case "horizontalBar":
        return <ChartBarDecreasingIcon className="h-4 w-4" />;
      case "horizontalStackedBar":
        return <ChartBarStackedIcon className="h-4 w-4" />;
      case "pie":
        return <ChartPieIcon className="h-4 w-4" />;
      case "metrics":
        return <SheetIcon className="h-4 w-4" />;
      case "meanBar":
        return <ChartBarBigIcon className="h-4 w-4" />;
      default:
        return <BarChart3Icon className="h-4 w-4" />;
    }
  };

  if (actualSelectedChartType === "metrics" || actualSelectedChartType === "meanBar") {
    return (
      <div {...props}>
        <Tabs defaultValue="chart" className="w-full">
          {debugMode && (
            <TabsList>
              <TabsTrigger value="chart">{t("tabs.chart")}</TabsTrigger>
              <TabsTrigger value="variable">{t("tabs.variable")}</TabsTrigger>
              <TabsTrigger value="stats">{t("tabs.stats")}</TabsTrigger>
            </TabsList>
          )}
          <TabsContent value="chart">
            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle>{variable.label ?? variable.name}</CardTitle>
                {getSplitVariableDescription(variable, stats) && (
                  <CardDescription>{getSplitVariableDescription(variable, stats)}</CardDescription>
                )}
                {chartSelection.availableChartTypes.length > 1 && (
                  <CardAction>
                    <ToggleGroup
                      type="single"
                      value={actualSelectedChartType}
                      onValueChange={(value) => value && setUserSelectedChartType(value as AnalysisChartType)}
                      size="sm"
                      data-testid="chart-type-selector">
                      {chartSelection.availableChartTypes.map((chartType: AnalysisChartType) => (
                        <ToggleGroupItem key={chartType} value={chartType} data-testid={`chart-type-${chartType}`}>
                          {getChartIcon(chartType)}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </CardAction>
                )}
              </CardHeader>
              <CardContent data-testid={`chart-content-${actualSelectedChartType}`}>
                {actualSelectedChartType === "metrics" ? (
                  <MetricsCards variable={variable} stats={stats} datasetId={datasetId} renderAsContent />
                ) : (
                  <MeanBarAdhoc variable={variable} stats={stats} datasetId={datasetId} renderAsContent ref={ref} />
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between border-t">
                <div>
                  {datasetId && onSplitVariableChangeAction && chartSelection.canUseSplitVariable && (
                    <SplitVariableSelector
                      datasetId={datasetId}
                      selectedSplitVariable={selectedSplitVariable || null}
                      onSplitVariableChangeAction={onSplitVariableChangeAction}
                      compact
                    />
                  )}
                </div>
                <Button className="cursor-pointer" variant="outline" onClick={exportPNG}>
                  <DownloadIcon className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          {debugMode && (
            <TabsContent value="variable">
              <Card className="shadow-xs">
                <CardHeader>
                  <CardTitle>{variable.label ?? variable.name}</CardTitle>
                  {getSplitVariableDescription(variable, stats) && (
                    <CardDescription>{getSplitVariableDescription(variable, stats)}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Code>{JSON.stringify(variable, null, 2)}</Code>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          {debugMode && (
            <TabsContent value="stats">
              <Card className="shadow-xs">
                <CardHeader>
                  <CardTitle>{variable.label ?? variable.name}</CardTitle>
                  {getSplitVariableDescription(variable, stats) && (
                    <CardDescription>{getSplitVariableDescription(variable, stats)}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Code>{JSON.stringify(stats, null, 2)}</Code>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    );
  }

  return (
    <div {...props}>
      <Tabs defaultValue="chart" className="w-full">
        {debugMode && (
          <TabsList>
            <TabsTrigger value="chart">{t("tabs.chart")}</TabsTrigger>
            <TabsTrigger value="variable">{t("tabs.variable")}</TabsTrigger>
            <TabsTrigger value="stats">{t("tabs.stats")}</TabsTrigger>
          </TabsList>
        )}
        <TabsContent value="chart">
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle>{variable.label ?? variable.name}</CardTitle>
              {getSplitVariableDescription(variable, stats) && (
                <CardDescription>{getSplitVariableDescription(variable, stats)}</CardDescription>
              )}
              {chartSelection.availableChartTypes.length > 1 && (
                <CardAction>
                  <ToggleGroup
                    type="single"
                    value={actualSelectedChartType}
                    onValueChange={(value) => value && setUserSelectedChartType(value as AnalysisChartType)}
                    size="sm"
                    data-testid="chart-type-selector">
                    {chartSelection.availableChartTypes.map((chartType: AnalysisChartType) => (
                      <ToggleGroupItem key={chartType} value={chartType} data-testid={`chart-type-${chartType}`}>
                        {getChartIcon(chartType)}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </CardAction>
              )}
            </CardHeader>
            <CardContent data-testid={`chart-content-${actualSelectedChartType}`}>{renderChart()}</CardContent>
            <CardFooter className="flex items-center justify-between border-t">
              <div>
                {datasetId && onSplitVariableChangeAction && chartSelection.canUseSplitVariable && (
                  <SplitVariableSelector
                    datasetId={datasetId}
                    selectedSplitVariable={selectedSplitVariable || null}
                    onSplitVariableChangeAction={onSplitVariableChangeAction}
                    compact
                  />
                )}
              </div>
              <Button className="cursor-pointer" variant="outline" onClick={exportPNG}>
                <DownloadIcon className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        {debugMode && (
          <TabsContent value="variable">
            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle>{variable.label ?? variable.name}</CardTitle>
                {getSplitVariableDescription(variable, stats) && (
                  <CardDescription>{getSplitVariableDescription(variable, stats)}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Code>{JSON.stringify(variable, null, 2)}</Code>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        {debugMode && (
          <TabsContent value="stats">
            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle>{variable.label ?? variable.name}</CardTitle>
                {getSplitVariableDescription(variable, stats) && (
                  <CardDescription>{getSplitVariableDescription(variable, stats)}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Code>{JSON.stringify(stats, null, 2)}</Code>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
