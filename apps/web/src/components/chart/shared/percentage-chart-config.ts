import { type ChartConfig } from "@/components/ui/chart";

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
