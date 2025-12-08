import "server-only";
import { eq } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import { dataset, datasetVariable, datasetVariableset, datasetVariablesetItem } from "@repo/database/schema";
import type { DatasetVariablesetItemAttributes } from "@repo/database/schema";
import type {
  VariableItemExport,
  VariableSetExport,
  VariableSetExportFile,
  VariableSetImportOptions,
  VariableSetImportResult,
} from "@/types/dataset-variableset-export";

export async function exportVariableSets(datasetId: string): Promise<VariableSetExportFile> {
  // Get dataset info
  const datasetInfo = await db
    .select({
      id: dataset.id,
      name: dataset.name,
    })
    .from(dataset)
    .where(eq(dataset.id, datasetId))
    .then((rows) => rows[0]);

  if (!datasetInfo) {
    throw new Error("Dataset not found");
  }

  // Get all variable sets with their variables
  const variableSetsQuery = await db
    .select({
      setId: datasetVariableset.id,
      setName: datasetVariableset.name,
      setDescription: datasetVariableset.description,
      setParentId: datasetVariableset.parentId,
      setOrderIndex: datasetVariableset.orderIndex,
      variableName: datasetVariable.name,
      variableOrderIndex: datasetVariablesetItem.orderIndex,
      variableAttributes: datasetVariablesetItem.attributes,
    })
    .from(datasetVariableset)
    .leftJoin(datasetVariablesetItem, eq(datasetVariableset.id, datasetVariablesetItem.variablesetId))
    .leftJoin(datasetVariable, eq(datasetVariablesetItem.variableId, datasetVariable.id))
    .where(eq(datasetVariableset.datasetId, datasetId))
    .orderBy(datasetVariableset.orderIndex, datasetVariableset.name);

  // Create a map of parent IDs to parent names
  const parentMap = new Map<string, string>();
  const allSets = await db
    .select({
      id: datasetVariableset.id,
      name: datasetVariableset.name,
    })
    .from(datasetVariableset)
    .where(eq(datasetVariableset.datasetId, datasetId));

  allSets.forEach((set) => {
    parentMap.set(set.id, set.name);
  });

  // Group variables by variable set
  const variableSetMap = new Map<
    string,
    {
      name: string;
      description: string | null;
      parentId: string | null;
      orderIndex: number;
      variables: VariableItemExport[];
    }
  >();

  variableSetsQuery.forEach((row) => {
    if (!variableSetMap.has(row.setId)) {
      variableSetMap.set(row.setId, {
        name: row.setName,
        description: row.setDescription,
        parentId: row.setParentId,
        orderIndex: row.setOrderIndex,
        variables: [],
      });
    }

    if (row.variableName && row.variableOrderIndex !== null) {
      const variableItem: VariableItemExport = {
        name: row.variableName,
        orderIndex: row.variableOrderIndex,
      };
      // Only include attributes if they exist
      if (row.variableAttributes) {
        variableItem.attributes = row.variableAttributes as DatasetVariablesetItemAttributes;
      }
      variableSetMap.get(row.setId)!.variables.push(variableItem);
    }
  });

  // Convert to export format
  const variableSets: VariableSetExport[] = Array.from(variableSetMap.values()).map((set) => ({
    name: set.name,
    description: set.description,
    parentName: set.parentId ? parentMap.get(set.parentId) || null : null,
    orderIndex: set.orderIndex,
    variables: set.variables.sort((a, b) => a.orderIndex - b.orderIndex), // Sort variables by orderIndex
  }));

  return {
    metadata: {
      datasetId: datasetInfo.id,
      datasetName: datasetInfo.name,
      exportedAt: new Date().toISOString(),
      version: "2.0",
    },
    variableSets,
  };
}

export async function importVariableSets(
  datasetId: string,
  importData: VariableSetExportFile,
  options: VariableSetImportOptions
): Promise<VariableSetImportResult> {
  const result: VariableSetImportResult = {
    success: true,
    summary: {
      totalSets: importData.variableSets.length,
      createdSets: 0,
      skippedSets: 0,
      updatedSets: 0,
      failedSets: 0,
    },
    errors: [],
    warnings: [],
    details: [],
  };

  try {
    // Get all existing variables for the dataset
    const existingVariables = await db
      .select({
        id: datasetVariable.id,
        name: datasetVariable.name,
      })
      .from(datasetVariable)
      .where(eq(datasetVariable.datasetId, datasetId));

    const variableNameToIdMap = new Map<string, string>();
    existingVariables.forEach((variable) => {
      variableNameToIdMap.set(variable.name, variable.id);
    });

    // Get existing variable sets
    const existingVariableSets = await db
      .select({
        id: datasetVariableset.id,
        name: datasetVariableset.name,
      })
      .from(datasetVariableset)
      .where(eq(datasetVariableset.datasetId, datasetId));

    const existingSetNames = new Set(existingVariableSets.map((set) => set.name));

    // Create a map to track created sets for parent relationships
    const createdSetsMap = new Map<string, string>(); // name -> id

    // First pass: create all variable sets (without parent relationships)
    for (const importSet of importData.variableSets) {
      try {
        // Check for conflicts
        const nameExists = existingSetNames.has(importSet.name);
        let finalName = importSet.name;

        if (nameExists) {
          if (options.conflictResolution === "skip") {
            result.summary.skippedSets++;
            result.details.push({
              setName: importSet.name,
              status: "skipped",
              message: "Variable set already exists",
            });
            continue;
          } else if (options.conflictResolution === "rename") {
            let counter = 1;
            while (existingSetNames.has(`${importSet.name}_${counter}`)) {
              counter++;
            }
            finalName = `${importSet.name}_${counter}`;
          }
        }

        // Validate variables
        const validVariables: { id: string; orderIndex: number; attributes?: DatasetVariablesetItemAttributes }[] = [];
        const unmatchedVariables: string[] = [];

        for (const variableItem of importSet.variables) {
          const variableId = variableNameToIdMap.get(variableItem.name);
          if (variableId) {
            validVariables.push({
              id: variableId,
              orderIndex: variableItem.orderIndex,
              attributes: variableItem.attributes,
            });
          } else {
            unmatchedVariables.push(variableItem.name);
          }
        }

        if (validVariables.length === 0 && importSet.variables.length > 0) {
          result.summary.failedSets++;
          result.details.push({
            setName: importSet.name,
            status: "failed",
            message: "No valid variables found",
            unmatchedVariables,
          });
          continue;
        }

        // Create the variable set
        const createdSetResult = await db
          .insert(datasetVariableset)
          .values({
            name: finalName,
            description: importSet.description,
            datasetId,
            orderIndex: importSet.orderIndex,
            // parentId will be set in second pass
          })
          .returning({ id: datasetVariableset.id });

        if (!createdSetResult.length) {
          throw new Error("Failed to create variable set");
        }

        const createdSetId = createdSetResult[0]!.id;
        createdSetsMap.set(importSet.name, createdSetId);

        // Create variable set items with attributes
        if (validVariables.length > 0) {
          await db.insert(datasetVariablesetItem).values(
            validVariables.map((variable) => ({
              variablesetId: createdSetId,
              variableId: variable.id,
              orderIndex: variable.orderIndex,
              ...(variable.attributes && { attributes: variable.attributes }),
            }))
          );
        }

        if (nameExists && options.conflictResolution === "overwrite") {
          result.summary.updatedSets++;
          result.details.push({
            setName: finalName,
            status: "updated",
            message:
              unmatchedVariables.length > 0 ? `${unmatchedVariables.length} variables could not be matched` : undefined,
            unmatchedVariables: unmatchedVariables.length > 0 ? unmatchedVariables : undefined,
          });
        } else {
          result.summary.createdSets++;
          result.details.push({
            setName: finalName,
            status: "created",
            message:
              unmatchedVariables.length > 0 ? `${unmatchedVariables.length} variables could not be matched` : undefined,
            unmatchedVariables: unmatchedVariables.length > 0 ? unmatchedVariables : undefined,
          });
        }

        if (unmatchedVariables.length > 0) {
          result.warnings.push(
            `Variable set "${finalName}": ${unmatchedVariables.length} variables could not be matched`
          );
        }
      } catch (error) {
        result.summary.failedSets++;
        result.details.push({
          setName: importSet.name,
          status: "failed",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Second pass: update parent relationships
    for (const importSet of importData.variableSets) {
      if (importSet.parentName && createdSetsMap.has(importSet.name)) {
        const setId = createdSetsMap.get(importSet.name)!;
        const parentId = createdSetsMap.get(importSet.parentName);

        if (parentId) {
          await db.update(datasetVariableset).set({ parentId }).where(eq(datasetVariableset.id, setId));
        } else {
          result.warnings.push(`Parent "${importSet.parentName}" not found for variable set "${importSet.name}"`);
        }
      }
    }
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : "Unknown error occurred during import");
  }

  return result;
}
