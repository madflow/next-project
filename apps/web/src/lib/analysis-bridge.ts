import { DatasetVariable } from "@/types/dataset-variable";
import { StatsResponse } from "@/types/stats";

export function getSortedFrequencyTable(variableConfig: DatasetVariable, statsData: StatsResponse) {
  const targetVariable = statsData.find((item) => item.variable === variableConfig.name);
  if (!targetVariable) return [];
  const frequencyTable = targetVariable.stats.frequency_table;
  if (!frequencyTable) return [];
  const copiedFrequencyTable = [...frequencyTable];
  return copiedFrequencyTable.sort((a, b) => a.value - b.value);
}

export function getVariableStats(variableConfig: DatasetVariable, statsData: StatsResponse) {
  const targetVariable = statsData.find((item) => item.variable === variableConfig.name);
  if (!targetVariable) return null;
  return targetVariable.stats;
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
      percentage: item.percentages,
      // Add individual percentage for stacking
      stackValue: item.percentages,
      fill: `hsl(var(--chart-${(index % 6) + 1}))`,
    };
  });

  return rechartsData;
}
