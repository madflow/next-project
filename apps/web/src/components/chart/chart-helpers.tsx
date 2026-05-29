import {
  BarChart3Icon,
  ChartBarBigIcon,
  ChartBarDecreasingIcon,
  ChartBarStackedIcon,
  ChartColumnBigIcon,
  ChartPieIcon,
  SheetIcon,
  TextIcon,
} from "lucide-react";
import { type ChartConfig } from "@/components/ui/chart";
import { type AnalysisChartType } from "@/types/stats";

type PercentageChartConfigTranslations = {
  percentLabel: string;
};

export function createPercentageChartConfig({ percentLabel }: PercentageChartConfigTranslations) {
  return {
    percentage: {
      label: percentLabel,
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;
}

export function getChartIcon(chartType: AnalysisChartType) {
  switch (chartType) {
    case "bar":
      return <ChartColumnBigIcon className="size-4" />;
    case "horizontalBar":
      return <ChartBarDecreasingIcon className="size-4" />;
    case "horizontalStackedBar":
      return <ChartBarStackedIcon className="size-4" />;
    case "pie":
      return <ChartPieIcon className="size-4" />;
    case "metrics":
      return <SheetIcon className="size-4" />;
    case "meanBar":
      return <ChartBarBigIcon className="size-4" />;
    case "textExplorer":
      return <TextIcon className="size-4" />;
    default:
      return <BarChart3Icon className="size-4" />;
  }
}
