import { DatasetVariable } from "@/types/dataset-variable";
import { AnalysisChartType, StatsResponse } from "@/types/stats";
import { extractVariableStats, isSplitVariableStats } from "./analysis-bridge";

/**
 * Chart selection logic for ad hoc analysis
 * 
 * This module implements the business logic for determining:
 * 1. Which chart types are valid for a given variable
 * 2. Whether split variables can be used
 * 3. The priority order of chart types
 * 4. When to show unsupported chart placeholder
 */

export interface ChartSelectionCriteria {
  /** The dataset variable being analyzed */
  variable: DatasetVariable;
  /** The stats response data */
  stats: StatsResponse;
  /** Whether a split variable is currently selected */
  hasSplitVariable?: boolean;
}

export interface ChartSelectionResult {
  /** Available chart types for this variable/data combination */
  availableChartTypes: AnalysisChartType[];
  /** The recommended default chart type */
  defaultChartType: AnalysisChartType;
  /** Whether split variables can be selected for this variable */
  canUseSplitVariable: boolean;
  /** Whether to show unsupported chart placeholder */
  showUnsupportedPlaceholder: boolean;
  /** Reason why chart is unsupported (if applicable) */
  unsupportedReason?: string;
}

/**
 * Chart priority order as specified in requirements
 */
const CHART_PRIORITY_ORDER: AnalysisChartType[] = [
  "horizontalBar",
  "horizontalStackedBar", 
  "pie",
  "meanBar",
  "metrics",
  "bar"
];

/**
 * Maximum number of values that can be displayed for categorical charts
 */
const MAX_CATEGORICAL_VALUES = 6;

/**
 * Determines if a variable type is numeric (not string/unknown)
 */
function isNumericVariableType(type: string): boolean {
  return !["string", "unknown"].includes(type);
}

/**
 * Gets the number of distinct values from the frequency table
 */
function getDistinctValueCount(variable: DatasetVariable, stats: StatsResponse): number {
  const variableStats = extractVariableStats(variable, stats);
  return variableStats?.frequency_table?.length || 0;
}



/**
 * Determines valid chart types for a variable without split variable
 */
function getValidChartsWithoutSplit(variable: DatasetVariable, distinctValues: number): AnalysisChartType[] {
  const charts: AnalysisChartType[] = [];
  
  switch (variable.measure) {
    case "nominal":
    case "ordinal":
      // All nominal/ordinal charts are valid regardless of value count
      charts.push("horizontalBar");
      
      // Charts with max value limitations
      if (distinctValues <= MAX_CATEGORICAL_VALUES) {
        charts.push("horizontalStackedBar", "pie", "bar");
      }
      
      // Mean bar is valid for ordinal variables
      if (variable.measure === "ordinal") {
        charts.push("meanBar");
      }
      break;
      
    case "scale":
      // Scale measure variables
      charts.push("meanBar");
      
      // Metrics card is only for specific numeric types
      if (["double", "float", "int8", "int16", "int32"].includes(variable.type)) {
        charts.push("metrics");
      }
      break;
  }
  
  return charts;
}

/**
 * Determines valid chart types for a variable with split variable
 */
function getValidChartsWithSplit(variable: DatasetVariable, distinctValues: number): AnalysisChartType[] {
  const charts: AnalysisChartType[] = [];
  
  switch (variable.measure) {
    case "nominal":
    case "ordinal":
      // Only stacked horizontal bar chart supports split variables
      if (distinctValues <= MAX_CATEGORICAL_VALUES) {
        charts.push("horizontalStackedBar");
      }
      break;
      
    case "scale":
      // Scale variables don't support split variables currently
      break;
  }
  
  return charts;
}

/**
 * Sorts chart types by priority order
 */
function sortChartsByPriority(chartTypes: AnalysisChartType[]): AnalysisChartType[] {
  return chartTypes.sort((a, b) => {
    const indexA = CHART_PRIORITY_ORDER.indexOf(a);
    const indexB = CHART_PRIORITY_ORDER.indexOf(b);
    
    // If both are in priority order, sort by their position
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    
    // If only one is in priority order, prioritize it
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    // If neither is in priority order, maintain original order
    return 0;
  });
}

/**
 * Main function to determine chart selection for a variable
 */
export function determineChartSelection(criteria: ChartSelectionCriteria): ChartSelectionResult {
  const { variable, stats, hasSplitVariable = false } = criteria;
  
  // Check if variable type is supported (numeric types only)
  if (!isNumericVariableType(variable.type)) {
    return {
      availableChartTypes: [],
      defaultChartType: "horizontalBar", // fallback
      canUseSplitVariable: false,
      showUnsupportedPlaceholder: true,
      unsupportedReason: `Variable type '${variable.type}' is not supported. Only numeric variable types are supported.`
    };
  }
  
  // Check if measure is supported
  if (!["nominal", "ordinal", "scale"].includes(variable.measure)) {
    return {
      availableChartTypes: [],
      defaultChartType: "horizontalBar", // fallback
      canUseSplitVariable: false,
      showUnsupportedPlaceholder: true,
      unsupportedReason: `Measurement scale '${variable.measure}' is not supported.`
    };
  }
  
  const distinctValues = getDistinctValueCount(variable, stats);
  
  // Determine if split variable is actually present in the data
  const targetVariable = stats.find((item) => item.variable === variable.name);
  const actuallyHasSplitVariable = Boolean(targetVariable && isSplitVariableStats(targetVariable.stats));
  
  // Get available chart types based on whether split variable is present
  let availableChartTypes: AnalysisChartType[];
  if (actuallyHasSplitVariable) {
    availableChartTypes = getValidChartsWithSplit(variable, distinctValues);
  } else {
    availableChartTypes = getValidChartsWithoutSplit(variable, distinctValues);
  }
  
  // Sort by priority
  availableChartTypes = sortChartsByPriority(availableChartTypes);
  
  // Determine if split variables can be used (only for nominal/ordinal with <= 6 values)
  const canUseSplitVariable = (variable.measure === "nominal" || variable.measure === "ordinal") && 
                              distinctValues <= MAX_CATEGORICAL_VALUES;
  
  // Check if we should show unsupported placeholder
  const showUnsupportedPlaceholder = hasSplitVariable && 
                                   (!canUseSplitVariable || availableChartTypes.length === 0);
  
  let unsupportedReason: string | undefined;
  if (showUnsupportedPlaceholder) {
    if (!canUseSplitVariable) {
      if (variable.measure === "scale") {
        unsupportedReason = "Split variables are not supported for scale measurement variables.";
      } else if (distinctValues > MAX_CATEGORICAL_VALUES) {
        unsupportedReason = `Split variables are not supported when there are more than ${MAX_CATEGORICAL_VALUES} distinct values (found ${distinctValues}).`;
      } else {
        unsupportedReason = "Split variables are not supported for this variable.";
      }
    } else {
      unsupportedReason = "No chart types are available for this variable with split variables.";
    }
  }
  
  // Determine default chart type
  const defaultChartType: AnalysisChartType = availableChartTypes.length > 0 ? availableChartTypes[0]! : "horizontalBar";
  
  return {
    availableChartTypes,
    defaultChartType,
    canUseSplitVariable,
    showUnsupportedPlaceholder,
    unsupportedReason
  };
}

/**
 * Helper function to check if a specific chart type is valid for the given criteria
 */
export function isChartTypeValid(criteria: ChartSelectionCriteria, chartType: AnalysisChartType): boolean {
  const result = determineChartSelection(criteria);
  return result.availableChartTypes.includes(chartType);
}

/**
 * Helper function to get the default chart type for given criteria
 */
export function getDefaultChartType(criteria: ChartSelectionCriteria): AnalysisChartType {
  const result = determineChartSelection(criteria);
  return result.defaultChartType;
}