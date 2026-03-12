import "server-only";
import { eq } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import { dataset, datasetVariable, datasetVariableset, datasetVariablesetContent } from "@repo/database/schema";
import type { DatasetVariablesetItemAttributes } from "@repo/database/schema";
import type {
  ContentItemExport,
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

  // Get all variable sets
  const allSets = await db
    .select({
      id: datasetVariableset.id,
      name: datasetVariableset.name,
      description: datasetVariableset.description,
      parentId: datasetVariableset.parentId,
      orderIndex: datasetVariableset.orderIndex,
      category: datasetVariableset.category,
      attributes: datasetVariableset.attributes,
    })
    .from(datasetVariableset)
    .where(eq(datasetVariableset.datasetId, datasetId))
    .orderBy(datasetVariableset.orderIndex, datasetVariableset.name);

  // Build name map for parent lookups
  const setNameMap = new Map<string, string>();
  allSets.forEach((set) => {
    setNameMap.set(set.id, set.name);
  });

  // Get all contents for all sets in this dataset, joined with variable info
  const allContents = await db
    .select({
      variablesetId: datasetVariablesetContent.variablesetId,
      position: datasetVariablesetContent.position,
      contentType: datasetVariablesetContent.contentType,
      variableId: datasetVariablesetContent.variableId,
      subsetId: datasetVariablesetContent.subsetId,
      attributes: datasetVariablesetContent.attributes,
      variableName: datasetVariable.name,
    })
    .from(datasetVariablesetContent)
    .leftJoin(datasetVariable, eq(datasetVariablesetContent.variableId, datasetVariable.id))
    .innerJoin(datasetVariableset, eq(datasetVariablesetContent.variablesetId, datasetVariableset.id))
    .where(eq(datasetVariableset.datasetId, datasetId))
    .orderBy(datasetVariablesetContent.variablesetId, datasetVariablesetContent.position);

  // Group contents by variableset ID
  const contentsBySet = new Map<string, typeof allContents>();
  allContents.forEach((content) => {
    if (!contentsBySet.has(content.variablesetId)) {
      contentsBySet.set(content.variablesetId, []);
    }
    contentsBySet.get(content.variablesetId)!.push(content);
  });

  // Convert to export format
  const variableSets: VariableSetExport[] = allSets.map((set) => {
    const setContents = contentsBySet.get(set.id) || [];

    // Build variables array (backward compatible)
    const variables: VariableItemExport[] = setContents
      .filter((c) => c.contentType === "variable" && c.variableName)
      .map((c) => {
        const item: VariableItemExport = {
          name: c.variableName!,
          orderIndex: c.position,
        };
        if (c.attributes) {
          item.attributes = c.attributes as DatasetVariablesetItemAttributes;
        }
        return item;
      });

    // Build unified contents array
    const contents: ContentItemExport[] = setContents
      .map((c): ContentItemExport | null => {
        if (c.contentType === "variable" && c.variableName) {
          return {
            position: c.position,
            contentType: "variable",
            variableName: c.variableName,
            ...(c.attributes ? { variableAttributes: c.attributes as DatasetVariablesetItemAttributes } : {}),
          };
        }
        if (c.contentType === "subset" && c.subsetId) {
          const subsetName = setNameMap.get(c.subsetId);
          if (subsetName) {
            return {
              position: c.position,
              contentType: "subset",
              subsetName,
            };
          }
        }
        return null;
      })
      .filter((entry): entry is ContentItemExport => entry !== null);

    return {
      name: set.name,
      description: set.description,
      parentName: set.parentId ? setNameMap.get(set.parentId) || null : null,
      orderIndex: set.orderIndex,
      category: set.category,
      attributes: set.attributes,
      variables: variables.sort((a, b) => a.orderIndex - b.orderIndex),
      contents,
    };
  });

  return {
    metadata: {
      datasetId: datasetInfo.id,
      datasetName: datasetInfo.name,
      exportedAt: new Date().toISOString(),
      version: "3.0",
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

        // Validate variables from either contents (v3.0) or variables (v2.0) array
        const validVariables: { id: string; position: number; attributes?: DatasetVariablesetItemAttributes }[] = [];
        const unmatchedVariables: string[] = [];

        // Prefer contents array (v3.0 format) if available
        const hasContents = importSet.contents && importSet.contents.length > 0;

        if (hasContents) {
          // v3.0 format: use contents array for variable entries
          for (const contentItem of importSet.contents!) {
            if (contentItem.contentType === "variable" && contentItem.variableName) {
              const variableId = variableNameToIdMap.get(contentItem.variableName);
              if (variableId) {
                validVariables.push({
                  id: variableId,
                  position: contentItem.position,
                  attributes: contentItem.variableAttributes,
                });
              } else {
                unmatchedVariables.push(contentItem.variableName);
              }
            }
          }
        } else {
          // v2.0 format: use variables array
          for (const variableItem of importSet.variables) {
            const variableId = variableNameToIdMap.get(variableItem.name);
            if (variableId) {
              validVariables.push({
                id: variableId,
                position: variableItem.orderIndex * 100, // Convert to position granularity
                attributes: variableItem.attributes,
              });
            } else {
              unmatchedVariables.push(variableItem.name);
            }
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
            category: importSet.category || "general",
            attributes: importSet.attributes || null,
            // parentId will be set in second pass
          })
          .returning({ id: datasetVariableset.id });

        if (!createdSetResult.length) {
          throw new Error("Failed to create variable set");
        }

        const createdSetId = createdSetResult[0]!.id;
        createdSetsMap.set(importSet.name, createdSetId);

        // Create contents entries for variables
        if (validVariables.length > 0) {
          await db.insert(datasetVariablesetContent).values(
            validVariables.map((variable) => ({
              variablesetId: createdSetId,
              variableId: variable.id,
              position: variable.position,
              contentType: "variable" as const,
              attributes: variable.attributes || null,
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

    // Second pass: update parent relationships and create subset content entries
    for (const importSet of importData.variableSets) {
      if (importSet.parentName && createdSetsMap.has(importSet.name)) {
        const setId = createdSetsMap.get(importSet.name)!;
        const parentId = createdSetsMap.get(importSet.parentName);

        if (parentId) {
          await db.update(datasetVariableset).set({ parentId }).where(eq(datasetVariableset.id, setId));

          // Check if this subset is already in the parent's contents (from v3.0 import)
          const hasContents = importData.variableSets.find((s) => s.name === importSet.parentName)?.contents;
          const subsetInContents = hasContents?.some(
            (c) => c.contentType === "subset" && c.subsetName === importSet.name
          );

          if (!subsetInContents) {
            // Add subset content entry to parent (for v2.0 imports or missing entries)
            // Get max position in parent's contents
            const existingContents = await db
              .select({ position: datasetVariablesetContent.position })
              .from(datasetVariablesetContent)
              .where(eq(datasetVariablesetContent.variablesetId, parentId))
              .orderBy(datasetVariablesetContent.position);

            const maxPosition =
              existingContents.length > 0 ? existingContents[existingContents.length - 1]!.position : -100;

            await db.insert(datasetVariablesetContent).values({
              variablesetId: parentId,
              position: maxPosition + 100,
              contentType: "subset",
              subsetId: setId,
            });
          } else {
            // v3.0: find the subset entry and use its position
            const subsetEntry = hasContents!.find((c) => c.contentType === "subset" && c.subsetName === importSet.name);
            if (subsetEntry) {
              await db.insert(datasetVariablesetContent).values({
                variablesetId: parentId,
                position: subsetEntry.position,
                contentType: "subset",
                subsetId: setId,
              });
            }
          }
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
