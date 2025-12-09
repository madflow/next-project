import { matchesCountedValue } from "@/lib/multi-response-utils";
import { DatasetVariable } from "@/types/dataset-variable";
import { StatsResponse, VariableStats } from "@/types/stats";

// Helper function to check if stats data is split variable format
export function isSplitVariableStats(stats: unknown): stats is {
  split_variable: string;
  categories: Record<string, VariableStats>;
  split_variable_labels?: Record<string, string>;
} {
  return Boolean(stats && typeof stats === "object" && "split_variable" in stats && "categories" in stats);
}

// Helper function to get stats for single variable (handles both normal and split variable formats)
export function extractVariableStats(variableConfig: DatasetVariable, statsData: StatsResponse): VariableStats | null {
  const targetVariable = statsData.find((item) => item.variable === variableConfig.name);
  if (!targetVariable) return null;

  // If it's split variable data, return the first category for now (could be enhanced later)
  if (isSplitVariableStats(targetVariable.stats)) {
    const categories = Object.keys(targetVariable.stats.categories);
    if (categories.length > 0) {
      const firstCategory = categories[0];
      if (firstCategory && targetVariable.stats.categories[firstCategory]) {
        return targetVariable.stats.categories[firstCategory];
      }
    }
    return null;
  }

  return targetVariable.stats as VariableStats;
}

export function getSortedFrequencyTable(variableConfig: DatasetVariable, statsData: StatsResponse) {
  const stats = extractVariableStats(variableConfig, statsData);
  if (!stats || !stats.frequency_table) return [];
  const copiedFrequencyTable = [...stats.frequency_table];
  return copiedFrequencyTable.sort((a, b) => parseFloat(a.value.toString()) - parseFloat(b.value.toString()));
}

export function getVariableStats(variableConfig: DatasetVariable, statsData: StatsResponse) {
  return extractVariableStats(variableConfig, statsData);
}

export function transformToRechartsBarData(variableConfig: DatasetVariable, statsData: StatsResponse) {
  const valueLabels = variableConfig.valueLabels ?? {};

  const sortedFrequencyTable = getSortedFrequencyTable(variableConfig, statsData);

  const rechartsData = sortedFrequencyTable.map((item) => {
    const valueKey = item.value.toString() as keyof typeof valueLabels; // Convert to string to match valueLabels keys
    const label = valueLabels[valueKey] || item.value; // Fallback if label not found

    return {
      label: label,
      value: item.value,
      count: item.counts,
      percentage: item.percentages,
    };
  });

  return rechartsData;
}

export function transformToRechartsPieData(variableConfig: DatasetVariable, statsData: StatsResponse) {
  const valueLabels = variableConfig.valueLabels ?? {};

  const sortedFrequencyTable = getSortedFrequencyTable(variableConfig, statsData);
  const rechartsData = sortedFrequencyTable.map((item, index) => {
    const valueKey = item.value.toString() as keyof typeof valueLabels; // Convert to string to match valueLabels keys
    const label = valueLabels[valueKey] || item.value; // Fallback if label not found

    return {
      label: label,
      value: item.value,
      count: item.counts,
      percentage: item.percentages,
      fill: `hsl(var(--chart-${(index % 6) + 1}))`,
    };
  });

  return rechartsData;
}

export function transformToRechartsStackedBarData(variableConfig: DatasetVariable, statsData: StatsResponse) {
  const valueLabels = variableConfig.valueLabels ?? {};
  const sortedFrequencyTable = getSortedFrequencyTable(variableConfig, statsData);

  // For stacked bar, we create one entry per category with percentage as the stack
  const rechartsData = sortedFrequencyTable.map((item, index) => {
    const valueKey = item.value.toString() as keyof typeof valueLabels;
    const label = valueLabels[valueKey] || item.value;

    return {
      label: label,
      value: item.value,
      count: item.counts,
      percentage: Math.round(item.percentages * 100) / 100, // Round to 2 decimal places
      // Add individual percentage for stacking
      stackValue: Math.round(item.percentages * 100) / 100, // Round to 2 decimal places
      fill: `hsl(var(--chart-${(index % 6) + 1}))`,
    };
  });

  return rechartsData;
}

// New function for split variable stacked bar data
export function transformToSplitVariableStackedBarData(variableConfig: DatasetVariable, statsData: StatsResponse) {
  const targetVariable = statsData.find((item) => item.variable === variableConfig.name);
  if (!targetVariable || !isSplitVariableStats(targetVariable.stats)) {
    return []; // Return empty if not split variable data
  }

  const valueLabels = variableConfig.valueLabels ?? {};
  const splitStats = targetVariable.stats;
  const splitVariableLabels = splitStats.split_variable_labels || {};

  // Get categories and sort them in ascending order
  const categories = Object.keys(splitStats.categories);
  const sortedCategories = categories.sort((a, b) => {
    try {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB; // Numeric sort
      }
    } catch {
      // Fall back to string sort
    }
    return a.localeCompare(b); // String sort
  });

  // Create a separate bar for each split category
  const rechartsData = sortedCategories
    .map((category, categoryIndex) => {
      const categoryStats = splitStats.categories[category];
      if (!categoryStats?.frequency_table) return null;

      const categoryData = categoryStats.frequency_table.map((item, itemIndex) => {
        const valueKey = item.value.toString() as keyof typeof valueLabels;
        const label = valueLabels[valueKey] || item.value;

        return {
          segment: `segment${itemIndex}`,
          value: Math.round(item.percentages * 100) / 100, // Round to 2 decimal places
          label: label,
          count: item.counts,
          color: `hsl(var(--chart-${(itemIndex % 6) + 1}))`,
        };
      });

      // Use split variable label if available, otherwise use category key
      const categoryLabel = splitVariableLabels[category] || category;

      return {
        category: categoryLabel,
        categoryKey: category,
        categoryIndex: categoryIndex,
        segments: categoryData,
      };
    })
    .filter(Boolean);

  return rechartsData;
}

// Transform multiple variables into multi-response chart data
// Extracts only value={countedValue} percentages from each variable
// For split variable stats, aggregates across all categories to get overall percentage
export function transformToMultiResponseData(
  variables: Array<DatasetVariable & { orderIndex?: number | null }>,
  statsData: Record<string, StatsResponse>,
  countedValue: number = 1
) {
  const rechartsData = variables
    .map((variable) => {
      const stats = statsData[variable.name];
      if (!stats || stats.length === 0) {
        return null;
      }

      const targetVariable = stats[0];
      if (!targetVariable) {
        return null;
      }

      // Handle split variable stats - aggregate across all split categories
      if (isSplitVariableStats(targetVariable.stats)) {
        const splitStats = targetVariable.stats;
        let totalCount = 0;
        let totalCountedValueCount = 0;

        // Iterate through all split categories and aggregate
        Object.values(splitStats.categories).forEach((categoryStats) => {
          if (categoryStats.frequency_table) {
            // Find the counted value in this category
            const valueItem = categoryStats.frequency_table.find((item) =>
              matchesCountedValue(item.value, countedValue)
            );

            if (valueItem) {
              totalCountedValueCount += valueItem.counts;
            }

            // Sum all counts in this category to get total
            categoryStats.frequency_table.forEach((item) => {
              totalCount += item.counts;
            });
          }
        });

        // Calculate overall percentage
        const percentage = totalCount > 0 ? (totalCountedValueCount / totalCount) * 100 : 0;

        return {
          label: variable.label || variable.name,
          variableName: variable.name,
          percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
          count: totalCountedValueCount,
          orderIndex: variable.orderIndex ?? 0,
        };
      }

      const variableStats = targetVariable.stats as VariableStats;
      if (!variableStats.frequency_table) {
        return null;
      }

      // Find the frequency item where value equals the configured counted value
      // Handle both integer and float formats (e.g., 1 matches both "1" and "1.0")
      const valueItem = variableStats.frequency_table.find((item) => matchesCountedValue(item.value, countedValue));

      const percentage = valueItem ? valueItem.percentages : 0;
      const count = valueItem ? valueItem.counts : 0;

      return {
        label: variable.label || variable.name,
        variableName: variable.name,
        percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
        count: count,
        orderIndex: variable.orderIndex ?? 0,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    // Sort by orderIndex ascending (lowest first)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  return rechartsData;
}

// Helper function to find counted value in frequency table
function findCountedValueInFrequencyTable(
  variableConfig: DatasetVariable,
  statsData: StatsResponse,
  countedValue: number
) {
  const stats = extractVariableStats(variableConfig, statsData);
  if (!stats || !stats.frequency_table) {
    return null;
  }

  return stats.frequency_table.find((item) => matchesCountedValue(item.value, countedValue));
}

// Transform single multi-response variable to show only countedValue
export function transformToMultiResponseIndividualBarData(
  variableConfig: DatasetVariable,
  statsData: StatsResponse,
  countedValue: number = 1
) {
  const valueItem = findCountedValueInFrequencyTable(variableConfig, statsData, countedValue);

  // Return 0% bar if value not found
  return [
    {
      label: "", // Empty label - we don't show the value label
      value: countedValue,
      count: valueItem ? valueItem.counts : 0,
      percentage: valueItem ? valueItem.percentages : 0,
    },
  ];
}

// Transform multi-response variable with split variable (stacked bars)
export function transformToMultiResponseIndividualStackedBarData(
  variableConfig: DatasetVariable,
  statsData: StatsResponse,
  countedValue: number = 1
) {
  const targetVariable = statsData.find((item) => item.variable === variableConfig.name);
  if (!targetVariable || !isSplitVariableStats(targetVariable.stats)) {
    return [];
  }

  const splitStats = targetVariable.stats;
  const splitVariableLabels = splitStats.split_variable_labels || {};

  // Get categories and sort them in ascending order
  const categories = Object.keys(splitStats.categories);
  const sortedCategories = categories.sort((a, b) => {
    try {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB; // Numeric sort
      }
    } catch {
      // Fall back to string sort
    }
    return a.localeCompare(b); // String sort
  });

  // For each split category, extract only the countedValue
  const rechartsData = sortedCategories
    .map((category, categoryIndex) => {
      const categoryStats = splitStats.categories[category];
      if (!categoryStats?.frequency_table) return null;

      // Find the counted value in this category's frequency table
      const valueItem = categoryStats.frequency_table.find((item) => {
        const itemNum = typeof item.value === "number" ? item.value : parseFloat(item.value.toString());
        return !isNaN(itemNum) && itemNum === countedValue;
      });

      const categoryLabel = splitVariableLabels[category] || category;

      return {
        category: categoryLabel,
        categoryKey: category,
        categoryIndex: categoryIndex,
        segments: [
          {
            segment: "counted",
            value: valueItem ? valueItem.percentages : 0,
            label: "\u200B", // Zero-width space - don't show value label but avoid fallback to dataKey
            count: valueItem ? valueItem.counts : 0,
            color: `hsl(var(--chart-1))`, // Single color
          },
        ],
      };
    })
    .filter(Boolean);

  return rechartsData;
}
