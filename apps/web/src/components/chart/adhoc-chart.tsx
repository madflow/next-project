"use client";

import {
  BarChart3Icon,
  ChartBarBigIcon,
  ChartBarStackedIcon,
  ChartColumnBigIcon,
  ChartPieIcon,
  DownloadIcon,
  SheetIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis } from "recharts";
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
import { useChartExport } from "@/hooks/use-chart-export";
import { useQueryApi } from "@/hooks/use-query-api";
import {
  extractVariableStats,
  isSplitVariableStats,
  transformToRechartsBarData,
  transformToRechartsPieData,
} from "@/lib/analysis-bridge";
import { type DatasetVariable } from "@/types/dataset-variable";
import { AnalysisChartType, StatsResponse } from "@/types/stats";
import { Button } from "../ui/button";
import { Code } from "../ui/code";
import { HorizontalStackedBarAdhoc } from "./horizontal-stacked-bar-adhoc";
import { MeanBarAdhoc } from "./mean-bar-adhoc";
import { MetricsCards } from "./metrics-cards";

type AdhocChartProps = {
  variable: DatasetVariable;
  stats: StatsResponse;
  datasetId?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export function AdhocChart({ variable, stats, datasetId, ...props }: AdhocChartProps) {
  const t = useTranslations("projectAdhocAnalysis");
  const tChart = useTranslations("chartMetricsCard");
  const { ref, exportPNG } = useChartExport();

  // Fetch split variables when datasetId is provided
  const { data: splitVariablesResponse } = useQueryApi<{ rows: DatasetVariable[] }>({
    endpoint: `/api/datasets/${datasetId}/splitvariables`,
    pagination: { pageIndex: 0, pageSize: 100 },
    sorting: [],
    search: "",
    queryKey: ["dataset-split-variables", datasetId],
    enabled: !!datasetId,
  });

  const allVariables = splitVariablesResponse?.rows || [];

  // Helper function to get split variable description
  function getSplitVariableDescription(variable: DatasetVariable, stats: StatsResponse): string | null {
    // Find the stats for this variable
    const targetVariable = stats.find((item) => item.variable === variable.name);
    if (!targetVariable || !isSplitVariableStats(targetVariable.stats)) {
      return null;
    }

    const splitVariableName = targetVariable.stats.split_variable;

    // Try to find the split variable in allVariables to get its label
    if (allVariables.length > 0) {
      const splitVariable = allVariables.find((v: DatasetVariable) => v.name === splitVariableName);
      if (splitVariable) {
        const splitVariableLabel = splitVariable.label ?? splitVariable.name;
        return `Split by ${splitVariableLabel}`;
      }
    }

    // Fallback to variable name if no label found
    return `Split by ${splitVariableName}`;
  }

  function getAvailableChartTypes(variable: DatasetVariable, stats: StatsResponse): AnalysisChartType[] {
    const availableCharts: AnalysisChartType[] = [];
    const variableStats = extractVariableStats(variable, stats);
    const frequencyTableLength = variableStats?.frequency_table?.length || 0;

    // Check if this variable has split variable stats
    const targetVariable = stats.find((item) => item.variable === variable.name);
    const hasSplitVariable = targetVariable && isSplitVariableStats(targetVariable.stats);

    if (variable.measure === "nominal") {
      if (hasSplitVariable) {
        // For split variables: ONLY horizontal stacked bar chart
        if (frequencyTableLength <= 5) {
          availableCharts.push("horizontalStackedBar");
        }
      } else {
        // EXACT CURRENT LOGIC for non-split variables (untouched)
        availableCharts.push("horizontalBar");
        if (frequencyTableLength <= 5) {
          availableCharts.push("pie");
          availableCharts.push("horizontalStackedBar");
        }
        if (frequencyTableLength === 2) {
          availableCharts.push("bar");
        }
      }
    } else if (variable.measure === "ordinal") {
      if (hasSplitVariable) {
        // For split variables: ONLY horizontal stacked bar chart
        if (frequencyTableLength <= 5) {
          availableCharts.push("horizontalStackedBar");
        }
      } else {
        // EXACT CURRENT LOGIC for non-split variables (untouched)
        availableCharts.push("horizontalBar");
        if (frequencyTableLength <= 5) {
          availableCharts.push("pie");
          availableCharts.push("horizontalStackedBar");
        }
        if (frequencyTableLength === 2) {
          availableCharts.push("bar");
        }
      }
    } else if (variable.measure === "scale") {
      // EXACT CURRENT LOGIC for scale variables (completely untouched)
      availableCharts.push("meanBar");
      if (variable.type === "double") {
        availableCharts.push("metrics");
      }
    }

    return availableCharts;
  }

  function getDefaultChartType(
    variable: DatasetVariable,
    stats: StatsResponse,
    availableChartTypes: AnalysisChartType[]
  ): AnalysisChartType {
    // Check if this variable has split variable stats
    const targetVariable = stats.find((item) => item.variable === variable.name);
    const hasSplitVariable = targetVariable && isSplitVariableStats(targetVariable.stats);

    if (hasSplitVariable) {
      // For split variables: default to horizontalStackedBar (which should be the only option)
      if (availableChartTypes.includes("horizontalStackedBar")) return "horizontalStackedBar";
    } else {
      // For non-split variables: prefer horizontalBar first, then others
      if (availableChartTypes.includes("horizontalBar")) return "horizontalBar";
      if (availableChartTypes.includes("meanBar")) return "meanBar";
      if (availableChartTypes.includes("metrics")) return "metrics";
      if (availableChartTypes.includes("pie")) return "pie";
      if (availableChartTypes.includes("bar")) return "bar";
      if (availableChartTypes.includes("horizontalStackedBar")) return "horizontalStackedBar";
    }

    return availableChartTypes[0] || "horizontalBar";
  }

  const availableChartTypes = useMemo(() => getAvailableChartTypes(variable, stats), [variable, stats]);
  const [selectedChartType, setSelectedChartType] = useState<AnalysisChartType>(() => {
    return getDefaultChartType(variable, stats, availableChartTypes);
  });

  const prevVariableIdRef = useRef(variable.id);
  const prevHasSplitVariableRef = useRef<boolean>(false);

  useEffect(() => {
    // Check if this variable has split variable stats
    const targetVariable = stats.find((item) => item.variable === variable.name);
    const hasSplitVariable = Boolean(targetVariable && isSplitVariableStats(targetVariable.stats));

    // Reset chart type when:
    // 1. Variable changes, OR
    // 2. Split variable status changes (from split to non-split or vice versa)
    const variableChanged = prevVariableIdRef.current !== variable.id;
    const splitVariableStatusChanged = prevHasSplitVariableRef.current !== hasSplitVariable;

    if (variableChanged || splitVariableStatusChanged) {
      const newAvailableChartTypes = getAvailableChartTypes(variable, stats);
      const defaultChartType = getDefaultChartType(variable, stats, newAvailableChartTypes);

      // Always reset to default when split variable status changes or current selection not available
      if (splitVariableStatusChanged || !newAvailableChartTypes.includes(selectedChartType)) {
        setSelectedChartType(defaultChartType);
      }

      prevVariableIdRef.current = variable.id;
      prevHasSplitVariableRef.current = hasSplitVariable;
    }
  }, [variable.id, variable, stats, selectedChartType]);

  const chartConfig = {
    percentage: {
      label: tChart("percent"),
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  function renderChart() {
    switch (selectedChartType) {
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
                tickFormatter={(value) => `${value}%`}
              />
              <Bar dataKey="percentage" fill="var(--color-percentage)" />
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
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis
                dataKey="label"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                fontSize={10}
                width={200}
              />
              <Bar dataKey="percentage" fill="var(--color-percentage)" />
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
              <Pie data={pieData} dataKey="percentage" nameKey="label" startAngle={90} endAngle={-270} />
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
        return <MeanBarAdhoc variable={variable} stats={stats} datasetId={datasetId} />;

      default:
        return null;
    }
  }

  const getChartIcon = (chartType: AnalysisChartType) => {
    switch (chartType) {
      case "bar":
        return <ChartColumnBigIcon className="h-4 w-4" />;
      case "horizontalBar":
        return <ChartBarBigIcon className="h-4 w-4" />;
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

  if (selectedChartType === "metrics" || selectedChartType === "meanBar") {
    return (
      <div {...props}>
        <Tabs defaultValue="chart" className="w-full">
          <TabsList>
            <TabsTrigger value="chart">{t("tabs.chart")}</TabsTrigger>
            <TabsTrigger value="variable">{t("tabs.variable")}</TabsTrigger>
            <TabsTrigger value="stats">{t("tabs.stats")}</TabsTrigger>
          </TabsList>
          <TabsContent value="chart">
            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle>{variable.label ?? variable.name}</CardTitle>
                {getSplitVariableDescription(variable, stats) && (
                  <CardDescription>{getSplitVariableDescription(variable, stats)}</CardDescription>
                )}
                {availableChartTypes.length > 1 && (
                  <CardAction>
                    <ToggleGroup
                      type="single"
                      value={selectedChartType}
                      onValueChange={(value) => value && setSelectedChartType(value as AnalysisChartType)}
                      size="sm">
                      {availableChartTypes.map((chartType) => (
                        <ToggleGroupItem key={chartType} value={chartType}>
                          {getChartIcon(chartType)}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </CardAction>
                )}
              </CardHeader>
              <CardContent>
                {selectedChartType === "metrics" ? (
                  <MetricsCards variable={variable} stats={stats} datasetId={datasetId} renderAsContent />
                ) : (
                  <MeanBarAdhoc variable={variable} stats={stats} datasetId={datasetId} renderAsContent />
                )}
              </CardContent>
              {selectedChartType === "meanBar" && (
                <CardFooter>
                  <Button className="cursor-pointer" variant="outline" onClick={exportPNG}>
                    <DownloadIcon className="h-4 w-4" />
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
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
        </Tabs>
      </div>
    );
  }

  return (
    <div {...props}>
      <Tabs defaultValue="chart" className="w-full">
        <TabsList>
          <TabsTrigger value="chart">{t("tabs.chart")}</TabsTrigger>
          <TabsTrigger value="variable">{t("tabs.variable")}</TabsTrigger>
          <TabsTrigger value="stats">{t("tabs.stats")}</TabsTrigger>
        </TabsList>
        <TabsContent value="chart">
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle>{variable.label ?? variable.name}</CardTitle>
              {getSplitVariableDescription(variable, stats) && (
                <CardDescription>{getSplitVariableDescription(variable, stats)}</CardDescription>
              )}
              {availableChartTypes.length > 1 && (
                <CardAction>
                  <ToggleGroup
                    type="single"
                    value={selectedChartType}
                    onValueChange={(value) => value && setSelectedChartType(value as AnalysisChartType)}
                    size="sm">
                    {availableChartTypes.map((chartType) => (
                      <ToggleGroupItem key={chartType} value={chartType}>
                        {getChartIcon(chartType)}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </CardAction>
              )}
            </CardHeader>
            <CardContent>{renderChart()}</CardContent>
            <CardFooter>
              <Button className="cursor-pointer" variant="outline" onClick={exportPNG}>
                <DownloadIcon className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
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
      </Tabs>
    </div>
  );
}
