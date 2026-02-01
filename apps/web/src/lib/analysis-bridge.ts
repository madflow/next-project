import { matchesCountedValue } from "@/lib/multi-response-utils";
import { getVariableLabel } from "@/lib/variable-helpers";
import { DatasetVariable } from "@/types/dataset-variable";
import { StatsResponse, VariableStats } from "@/types/stats";

function sortCategoriesAscending(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b);
  });
}

export function isSplitVariableStats(stats: unknown): stats is {
  split_variable: string;
  categories: Record<string, VariableStats>;
  split_variable_labels?: Record<string, string>;
} {
  return Boolean(stats && typeof stats === "object" && "split_variable" in stats && "categories" in stats);
}

export function extractVariableStats(variableConfig: DatasetVariable, statsData: StatsResponse): VariableStats | null {
  const targetVariable = statsData.find((item) => item.variable === variableConfig.name);
  if (!targetVariable) return null;

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
    const valueKey = item.value.toString() as keyof typeof valueLabels;
    const label = valueLabels[valueKey] || item.value;

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
    const valueKey = item.value.toString() as keyof typeof valueLabels;
    const label = valueLabels[valueKey] || item.value;

    return {
      label: label,
      value: item.value,
      count: item.counts,
      percentage: item.percentages,
      fill: `var(--chart-${(index % 6) + 1})`,
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
      percentage: Math.round(item.percentages * 100) / 100,
      stackValue: Math.round(item.percentages * 100) / 100,
      fill: `var(--chart-${(index % 6) + 1})`,
    };
  });

  return rechartsData;
}

export function transformToSplitVariableStackedBarData(variableConfig: DatasetVariable, statsData: StatsResponse) {
  const targetVariable = statsData.find((item) => item.variable === variableConfig.name);
  if (!targetVariable || !isSplitVariableStats(targetVariable.stats)) {
    return [];
  }

  const valueLabels = variableConfig.valueLabels ?? {};
  const splitStats = targetVariable.stats;
  const splitVariableLabels = splitStats.split_variable_labels || {};

  const categories = Object.keys(splitStats.categories);
  const sortedCategories = sortCategoriesAscending(categories);

  const rechartsData = sortedCategories
    .map((category, categoryIndex) => {
      const categoryStats = splitStats.categories[category];
      if (!categoryStats?.frequency_table) return null;

      const categoryData = categoryStats.frequency_table.map((item, itemIndex) => {
        const valueKey = item.value.toString() as keyof typeof valueLabels;
        const label = valueLabels[valueKey] || item.value;

        return {
          segment: `segment${itemIndex}`,
          value: Math.round(item.percentages * 100) / 100,
          label: label,
          count: item.counts,
          color: `var(--chart-${(itemIndex % 6) + 1})`,
        };
      });

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

      if (isSplitVariableStats(targetVariable.stats)) {
        throw new Error(
          `transformToMultiResponseData received split stats for variable ${variable.name}. ` +
            `Aggregate charts must not receive split variable stats. This is a bug in the data flow.`
        );
      }

      const variableStats = targetVariable.stats as VariableStats;
      if (!variableStats.frequency_table) {
        return null;
      }

      const valueItem = variableStats.frequency_table.find((item) => matchesCountedValue(item.value, countedValue));

      const percentage = valueItem ? valueItem.percentages : 0;
      const count = valueItem ? valueItem.counts : 0;

      return {
        label: getVariableLabel(variable),
        variableName: variable.name,
        percentage: Math.round(percentage * 100) / 100,
        count: count,
        orderIndex: variable.orderIndex ?? 0,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
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

export function transformToMultiResponseIndividualBarData(
  variableConfig: DatasetVariable,
  statsData: StatsResponse,
  countedValue: number = 1
) {
  const valueItem = findCountedValueInFrequencyTable(variableConfig, statsData, countedValue);

  return [
    {
      label: "",
      value: countedValue,
      count: valueItem ? valueItem.counts : 0,
      percentage: valueItem ? valueItem.percentages : 0,
    },
  ];
}

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

  const categories = Object.keys(splitStats.categories);
  const sortedCategories = sortCategoriesAscending(categories);

  const rechartsData = sortedCategories
    .map((category, categoryIndex) => {
      const categoryStats = splitStats.categories[category];
      if (!categoryStats?.frequency_table) return null;

      const valueItem = categoryStats.frequency_table.find((item) => matchesCountedValue(item.value, countedValue));

      const categoryLabel = splitVariableLabels[category] || category;

      return {
        category: categoryLabel,
        categoryKey: category,
        categoryIndex: categoryIndex,
        segments: [
          {
            segment: "counted",
            value: valueItem ? valueItem.percentages : 0,
            label: "\u200B",
            count: valueItem ? valueItem.counts : 0,
            color: `var(--chart-1)`,
          },
        ],
      };
    })
    .filter(Boolean);

  return rechartsData;
}
