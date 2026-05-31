/**
 * Default decimal places for different chart types
 */
export const PERCENTAGE_CHART_DECIMALS = 0;
export const MEAN_BAR_DECIMALS = 1;
export const METRICS_CARD_DECIMALS = 1;

/**
 * Chart layout constants
 */
export const CHART_Y_AXIS_WIDTH = 200;
export const HORIZONTAL_BAR_MAX_SIZE = 80;

const HORIZONTAL_CHART_MIN_HEIGHT = 240;
const HORIZONTAL_CHART_BASE_HEIGHT = 60;
const HORIZONTAL_CHART_ROW_HEIGHT = 60;
const HORIZONTAL_CHART_LEGEND_HEIGHT = 72;

export function getHorizontalChartHeight(rowCount: number, hasLegend = false): number {
  const safeRowCount = Math.max(1, rowCount);
  const legendHeight = hasLegend ? HORIZONTAL_CHART_LEGEND_HEIGHT : 0;

  return Math.max(
    HORIZONTAL_CHART_MIN_HEIGHT + legendHeight,
    HORIZONTAL_CHART_BASE_HEIGHT + safeRowCount * HORIZONTAL_CHART_ROW_HEIGHT + legendHeight
  );
}

/**
 * Format a chart value with the specified number of decimal places
 * @param value - The numeric value to format
 * @param decimals - The number of decimal places
 * @returns Formatted string representation of the value
 */
export function formatChartValue(value: number, decimals: number): string {
  return (Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals);
}
