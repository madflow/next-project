import type { DatasetVariable } from "@/types/dataset-variable";

/**
 * Get the display label for a dataset variable.
 * Prioritizes variableLabels.default, falls back to label field, then variable name.
 *
 * @param variable - The dataset variable
 * @returns The display label string
 */
export function getVariableLabel(variable: DatasetVariable): string {
  // Try variableLabels.default first
  if (variable.variableLabels && typeof variable.variableLabels === "object" && "default" in variable.variableLabels) {
    const defaultLabel = (variable.variableLabels as { default?: string }).default;
    if (defaultLabel && typeof defaultLabel === "string" && defaultLabel.trim().length > 0) {
      return defaultLabel;
    }
  }

  // Fall back to legacy label field
  if (variable.label) {
    return variable.label;
  }

  // Final fallback to variable name
  return variable.name;
}
