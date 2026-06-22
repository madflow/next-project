import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getVariableChanges, hashDatasetState } from "./dataset-file-update-helpers";

const dataset = {
  fileHash: "old-file-hash",
  storageKey: "uploads/old.sav",
};

const variable = {
  id: "0198b852-ecc2-7000-8000-000000000001",
  label: "Age",
  measure: "scale",
  missingRanges: null,
  missingValues: ["-999"],
  name: "age",
  type: "double",
  valueLabels: {},
  variableLabels: { default: "Age", de: "Alter" },
};

describe("dataset file update helpers", () => {
  test("changes the state hash when the active file or variable configuration changes", () => {
    const originalHash = hashDatasetState(dataset, [variable]);

    assert.notEqual(hashDatasetState({ ...dataset, storageKey: "uploads/replaced.sav" }, [variable]), originalHash);
    assert.notEqual(hashDatasetState(dataset, [{ ...variable, missingValues: ["-998"] }]), originalHash);
    assert.notEqual(hashDatasetState(dataset, [{ ...variable, name: "renamed_age" }]), originalHash);
  });

  test("keeps the state hash stable regardless of database row order", () => {
    const secondVariable = {
      ...variable,
      id: "0198b852-ecc2-7000-8000-000000000002",
      name: "gender",
    };

    assert.equal(
      hashDatasetState(dataset, [variable, secondVariable]),
      hashDatasetState(dataset, [secondVariable, variable])
    );
  });

  test("reports file-derived metadata that confirmation will overwrite", () => {
    const changes = getVariableChanges(variable, {
      datasetId: "0198b852-ecc2-7000-8000-000000000010",
      label: "Age in years",
      measure: "ordinal",
      name: "age",
      type: "int32",
      valueLabels: { "1": "One" },
      variableLabels: { default: "Age in years" },
    });

    assert.deepEqual(changes, ["label", "measure", "type", "valueLabels"]);
  });
});
