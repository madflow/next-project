import { DatasetVariable } from "@/types/dataset-variable";
import { StatsResponse } from "@/types/stats";

export function transformToRechartsData(variableConfig: DatasetVariable, statsData: StatsResponse) {
  // Extract the valueLabels and frequency table
  const valueLabels = variableConfig.valueLabels;
  const firstVariable = statsData[0];
  if (!firstVariable) return [];
  const frequencyTable = firstVariable.stats.frequency_table;
  if (!frequencyTable) return [];

  // Transform the data by matching frequency table values to their labels
  const rechartsData = frequencyTable.map((item) => {
    const valueKey = item.value.toString(); // Convert to string to match valueLabels keys
    const label = valueLabels[valueKey] || `Value ${item.value}`; // Fallback if label not found

    return {
      label: label,
      value: item.value,
      count: item.counts,
      percentage: item.percentages,
    };
  });

  return rechartsData.sort((a, b) => b.value - a.value);
}
