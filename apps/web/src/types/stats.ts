type StatsVariable = {
  variable: string;
  split_variable?: string;
};

export type StatsRequest = {
  variables: StatsVariable[];
  // Keep global split_variable for backward compatibility
  split_variable?: string;
  // Number of decimal places for numeric statistics (mean, std, percentages, etc.)
  decimal_places?: number;
};

type FrequencyItem = {
  value: string | number;
  counts: number;
  percentages: number;
};

export type VariableStats = {
  count: number;
  mode: number[];
  mean: number;
  std: number;
  min: number;
  max: number;
  median: number;
  range: number;
  frequency_table: FrequencyItem[];
};

type SplitVariableStats = {
  split_variable: string;
  categories: Record<string, VariableStats>;
  split_variable_labels?: Record<string, string>;
};

type StatsResponseItem = {
  variable: string;
  stats: VariableStats | SplitVariableStats;
};

export type StatsResponse = StatsResponseItem[];

export type AnalysisChartType =
  | "bar"
  | "horizontalBar"
  | "horizontalStackedBar"
  | "pie"
  | "metrics"
  | "meanBar"
  | "textExplorer";
