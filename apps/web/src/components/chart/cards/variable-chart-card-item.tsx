import type { ComponentProps } from "react";
import { VariableChartCard } from "./variable-chart-card";

type VariableChartCardItemProps = Omit<ComponentProps<typeof VariableChartCard>, "className">;

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
