import type { DatasetVariableWithAttributes } from "@/types/dataset-variable";
import type { StatsResponse } from "@/types/stats";
import { VariableChartCard } from "./variable-chart-card";

type VariableChartCardItemProps = {
  variable: DatasetVariableWithAttributes;
  stats: StatsResponse;
  datasetId: string;
  datasetName: string;
  selectedSplitVariable: string | null;
  onSplitVariableChangeAction: (splitVariable: string | null) => void;
  isMultiResponseIndividual: boolean;
  countedValue: number;
};

export function VariableChartCardItem({
  variable,
  stats,
  datasetId,
  datasetName,
  selectedSplitVariable,
  onSplitVariableChangeAction,
  isMultiResponseIndividual,
  countedValue,
}: VariableChartCardItemProps) {
  return (
    <VariableChartCard
      variable={variable}
      stats={stats}
      datasetId={datasetId}
      datasetName={datasetName}
      className="w-full max-w-4xl"
      selectedSplitVariable={selectedSplitVariable}
      onSplitVariableChangeAction={onSplitVariableChangeAction}
      isMultiResponseIndividual={isMultiResponseIndividual}
      countedValue={countedValue}
    />
  );
}
