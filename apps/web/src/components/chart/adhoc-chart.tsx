"use client";

import {
  BarChart3Icon,
  ChartBarBigIcon,
  ChartColumnBigIcon,
  ChartPieIcon,
  DownloadIcon,
  SheetIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { transformToRechartsBarData, transformToRechartsPieData } from "@/lib/analysis-bridge";
import { type DatasetVariable } from "@/types/dataset-variable";
import { AnalysisChartType, StatsResponse } from "@/types/stats";
import { Button } from "../ui/button";
import { Code } from "../ui/code";
import { MeanBarAdhoc } from "./mean-bar-adhoc";
import { MetricsCards } from "./metrics-cards";

type AdhocChartProps = {
  variable: DatasetVariable;
  stats: StatsResponse;
} & React.HTMLAttributes<HTMLDivElement>;

export function AdhocChart({ variable, stats, ...props }: AdhocChartProps) {
  const t = useTranslations("projectAdhocAnalysis");
  const tChart = useTranslations("chartMetricsCard");
  const { ref, exportPNG } = useChartExport();

  function getAvailableChartTypes(variable: DatasetVariable, stats: StatsResponse): AnalysisChartType[] {
    const availableCharts: AnalysisChartType[] = [];
    const frequencyTableLength = stats[0]?.stats?.frequency_table?.length || 0;

    if (variable.measure === "nominal") {
      availableCharts.push("horizontalBar");
      if (frequencyTableLength <= 5) {
        availableCharts.push("pie");
      }
      if (frequencyTableLength === 2) {
        availableCharts.push("bar");
      }
    } else if (variable.measure === "ordinal") {
      availableCharts.push("horizontalBar");
      if (frequencyTableLength <= 5) {
        availableCharts.push("pie");
      }
      if (frequencyTableLength === 2) {
        availableCharts.push("bar");
      }
    } else if (variable.measure === "scale") {
      availableCharts.push("meanBar");
      if (variable.type === "double") {
        availableCharts.push("metrics");
      }
    }

    return availableCharts;
  }

  const availableChartTypes = getAvailableChartTypes(variable, stats);
  const [selectedChartType, setSelectedChartType] = useState<AnalysisChartType>(() => {
    if (availableChartTypes.includes("horizontalBar")) return "horizontalBar";
    if (availableChartTypes.includes("meanBar")) return "meanBar";
    if (availableChartTypes.includes("metrics")) return "metrics";
    return availableChartTypes[0] || "horizontalBar";
  });

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
              <Bar dataKey="percentage" fill="var(--color-percentage)" radius={5} />
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
              <Bar dataKey="percentage" fill="var(--color-percentage)" radius={5} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            </BarChart>
          </ChartContainer>
        );

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
        return <MetricsCards variable={variable} stats={stats} />;

      case "meanBar":
        return <MeanBarAdhoc variable={variable} stats={stats} />;

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
                <div className="flex items-center justify-between">
                  <CardTitle>{variable.label ?? variable.name}</CardTitle>
                  {availableChartTypes.length > 1 && (
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
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedChartType === "metrics" ? (
                  <MetricsCards variable={variable} stats={stats} renderAsContent />
                ) : (
                  <MeanBarAdhoc variable={variable} stats={stats} renderAsContent />
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
              <div className="flex items-center justify-between">
                <CardTitle>{variable.label ?? variable.name}</CardTitle>
                {availableChartTypes.length > 1 && (
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
                )}
              </div>
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
