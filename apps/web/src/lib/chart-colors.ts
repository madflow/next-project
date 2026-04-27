const CHART_COLOR_KEYS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6"] as const;
const DICHOTOME_CHART_COLOR_KEYS = ["chart-dichotome-1", "chart-dichotome-2"] as const;

const DEFAULT_CHART_COLORS = {
  "chart-1": "#3b82f6",
  "chart-2": "#ef4444",
  "chart-3": "#10b981",
  "chart-4": "#f59e0b",
  "chart-5": "#8b5cf6",
  "chart-6": "#ec4899",
  "chart-dichotome-1": "#3b82f6",
  "chart-dichotome-2": "#ef4444",
} as const;

type ThemeChartColors = Record<string, string> | null | undefined;

export function getChartColorVariable(index: number, categoryCount: number) {
  if (categoryCount === 2) {
    return `var(--${DICHOTOME_CHART_COLOR_KEYS[index] ?? DICHOTOME_CHART_COLOR_KEYS[0]})`;
  }

  return `var(--${CHART_COLOR_KEYS[index % CHART_COLOR_KEYS.length]})`;
}

export function getChartColorValue(index: number, categoryCount: number, chartColors?: ThemeChartColors) {
  if (categoryCount === 2) {
    const dichotomeKey = DICHOTOME_CHART_COLOR_KEYS[index] ?? DICHOTOME_CHART_COLOR_KEYS[0];
    const fallbackChartKey = CHART_COLOR_KEYS[index] ?? CHART_COLOR_KEYS[0];
    return chartColors?.[dichotomeKey] ?? chartColors?.[fallbackChartKey] ?? DEFAULT_CHART_COLORS[dichotomeKey];
  }

  const chartKey = CHART_COLOR_KEYS[index % CHART_COLOR_KEYS.length] ?? CHART_COLOR_KEYS[0];
  return chartColors?.[chartKey] ?? DEFAULT_CHART_COLORS[chartKey];
}
