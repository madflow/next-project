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
import { type AnalysisChartType } from "@/types/stats";

export function ChartTypeIcon({ chartType }: { chartType: AnalysisChartType }) {
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
