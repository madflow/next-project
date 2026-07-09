import { type ChartConfig } from "@repo/ui/components/chart";

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
