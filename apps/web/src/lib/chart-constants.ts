/**
 * Default decimal places for different chart types
 */
export const PERCENTAGE_CHART_DECIMALS = 0;
export const MEAN_BAR_DECIMALS = 1;
export const METRICS_CARD_DECIMALS = 1;

/**
 * Format a chart value with the specified number of decimal places
 * @param value - The numeric value to format
 * @param decimals - The number of decimal places
 * @returns Formatted string representation of the value
 */
export function formatChartValue(value: number, decimals: number): string {
  return (Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals);
}
