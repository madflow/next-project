import { createHash } from "node:crypto";
import type { CreateDatasetVariableData } from "@repo/database/schema";

export type DatasetFileUpdateVariableChange = "label" | "measure" | "type" | "valueLabels";

type DatasetStateSnapshot = {
  fileHash: string;
  storageKey: string;
};

type DatasetVariableStateSnapshot = {
  id: string;
  label: string | null;
  measure: string;
  missingRanges: unknown;
  missingValues: unknown;
  name: string;
  type: string;
  valueLabels: unknown;
  variableLabels: unknown;
};

export function hashDatasetState(
  currentDataset: DatasetStateSnapshot,
  currentVariables: DatasetVariableStateSnapshot[]
) {
  const variables = [...currentVariables]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((variable) => ({
      id: variable.id,
      label: variable.label,
      measure: variable.measure,
      missingRanges: variable.missingRanges,
      missingValues: variable.missingValues,
      name: variable.name,
      type: variable.type,
      valueLabels: variable.valueLabels,
      variableLabels: variable.variableLabels,
    }));

  return createHash("sha256")
    .update(
      JSON.stringify({
        fileHash: currentDataset.fileHash,
        storageKey: currentDataset.storageKey,
        variables,
      })
    )
    .digest("hex");
}

export function getVariableChanges(
  currentVariable: DatasetVariableStateSnapshot,
  importedVariable: CreateDatasetVariableData
): DatasetFileUpdateVariableChange[] {
  const changes: DatasetFileUpdateVariableChange[] = [];

  if (currentVariable.label !== importedVariable.label) changes.push("label");
  if (currentVariable.measure !== importedVariable.measure) changes.push("measure");
  if (currentVariable.type !== importedVariable.type) changes.push("type");
  if (JSON.stringify(currentVariable.valueLabels ?? {}) !== JSON.stringify(importedVariable.valueLabels ?? {})) {
    changes.push("valueLabels");
  }

  return changes;
}
