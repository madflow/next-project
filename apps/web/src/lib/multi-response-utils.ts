import type { DatasetVariablesetAttributes } from "@repo/database/schema";

/**
 * Parse counted value from variableset attributes
 * @param attributes - Variableset attributes containing multiResponse configuration
 * @returns The counted value to use for multi-response analysis (defaults to 1)
 */
export function parseCountedValue(attributes?: DatasetVariablesetAttributes | null): number {
  return attributes?.multiResponse?.countedValue ? parseFloat(attributes.multiResponse.countedValue) : 1;
}

/**
 * Parse a numeric value that might be string or number
 * @param value - Value to parse (can be number or string)
 * @returns Numeric value
 */
export function parseNumericValue(value: number | string): number {
  return typeof value === "number" ? value : parseFloat(value.toString());
}

/**
 * Check if a value matches the counted value
 * @param value - Value to check (can be number or string)
 * @param countedValue - The counted value to match against
 * @returns True if values match
 */
export function matchesCountedValue(value: number | string, countedValue: number): boolean {
  const numValue = parseNumericValue(value);
  return !isNaN(numValue) && numValue === countedValue;
}
