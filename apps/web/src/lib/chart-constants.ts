/**
 * Default decimal places for different chart types
 */
export const PERCENTAGE_CHART_DECIMALS = 0;
export const MEAN_BAR_DECIMALS = 1;
export const METRICS_CARD_DECIMALS = 1;

/**
 * Y-axis label configuration for horizontal bar charts
 */
export const YAXIS_LABEL_MAX_WIDTH = 150; // Max width in pixels
export const YAXIS_LABEL_FONT_SIZE = 10; // Font size in pixels
export const YAXIS_LABEL_MAX_LINES = 2; // Max lines before truncating
export const YAXIS_LABEL_LINE_HEIGHT = 1.2; // Line height multiplier
export const YAXIS_LABEL_CHAR_WIDTH = 7; // Conservative character width estimate for variable-width fonts
export const YAXIS_LABEL_TICK_MARGIN = 10; // Margin between tick and axis

/**
 * Format a chart value with the specified number of decimal places
 * @param value - The numeric value to format
 * @param decimals - The number of decimal places
 * @returns Formatted string representation of the value
 */
export function formatChartValue(value: number, decimals: number): string {
  return (Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals);
}
