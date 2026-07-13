import { eq } from "drizzle-orm";
import type { DatabaseInstance } from "@repo/database/clients";
import {
  type VariablesetContentAttributes,
  dataset,
  datasetVariable,
  datasetVariableset,
  datasetVariablesetContent,
} from "@repo/database/schema";
import type {
  ContentItemExport,
  VariableItemExport,
  VariableSetExport,
  VariableSetExportFile,
  VariableSetImportOptions,
  VariableSetImportResult,
} from "../../../shared/exchange/dataset-variableset-transfer";
import { getMatrixValueLabelsError } from "../../../shared/matrix-variableset";

export async function exportVariableSets(db: DatabaseInstance, datasetId: string): Promise<VariableSetExportFile> {
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

  const setNameMap = new Map<string, string>();
  allSets.forEach((set) => {
    setNameMap.set(set.id, set.name);
  });

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

  const contentsBySet = new Map<string, typeof allContents>();
  allContents.forEach((content) => {
    if (!contentsBySet.has(content.variablesetId)) {
      contentsBySet.set(content.variablesetId, []);
    }
    contentsBySet.get(content.variablesetId)?.push(content);
  });

  const variableSets: VariableSetExport[] = allSets.map((set) => {
    const setContents = contentsBySet.get(set.id) ?? [];

    const variables: VariableItemExport[] = setContents
      .filter((content) => content.contentType === "variable" && content.variableName)
      .map((content) => {
        const item: VariableItemExport = {
          name: content.variableName!,
          orderIndex: content.position,
        };

        if (content.attributes) {
          item.attributes = content.attributes as VariablesetContentAttributes;
        }

        return item;
      });

    const contents: ContentItemExport[] = setContents
      .map((content): ContentItemExport | null => {
        if (content.contentType === "variable" && content.variableName) {
          return {
            position: content.position,
            contentType: "variable",
            variableName: content.variableName,
            ...(content.attributes ? { variableAttributes: content.attributes as VariablesetContentAttributes } : {}),
          };
        }

        if (content.contentType === "subset" && content.subsetId) {
          const subsetName = setNameMap.get(content.subsetId);

          if (subsetName) {
            return {
              position: content.position,
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
      parentName: set.parentId ? (setNameMap.get(set.parentId) ?? null) : null,
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
  db: DatabaseInstance,
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
    const existingVariables = await db
      .select({
        id: datasetVariable.id,
        name: datasetVariable.name,
        valueLabels: datasetVariable.valueLabels,
      })
      .from(datasetVariable)
      .where(eq(datasetVariable.datasetId, datasetId));

    const existingVariablesByName = new Map(existingVariables.map((variable) => [variable.name, variable]));

    const existingVariableSets = await db
      .select({
        id: datasetVariableset.id,
        name: datasetVariableset.name,
      })
      .from(datasetVariableset)
      .where(eq(datasetVariableset.datasetId, datasetId));

    const existingSetNames = new Set(existingVariableSets.map((set) => set.name));
    const createdSetsMap = new Map<string, string>();

    for (const importSet of importData.variableSets) {
      try {
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
          }

          if (options.conflictResolution === "rename") {
            let counter = 1;
            while (existingSetNames.has(`${importSet.name}_${counter}`)) {
              counter++;
            }
            finalName = `${importSet.name}_${counter}`;
          }
        }

        const validVariables: {
          attributes?: VariablesetContentAttributes;
          id: string;
          position: number;
          valueLabels: unknown;
        }[] = [];
        const unmatchedVariables: string[] = [];
        const hasContents = importSet.contents !== undefined && importSet.contents.length > 0;

        if (hasContents) {
          for (const contentItem of importSet.contents ?? []) {
            if (contentItem.contentType === "variable") {
              const variable = existingVariablesByName.get(contentItem.variableName);
              if (variable) {
                validVariables.push({
                  id: variable.id,
                  position: contentItem.position,
                  attributes: contentItem.variableAttributes,
                  valueLabels: variable.valueLabels,
                });
              } else {
                unmatchedVariables.push(contentItem.variableName);
              }
            }
          }
        } else {
          for (const variableItem of importSet.variables) {
            const variable = existingVariablesByName.get(variableItem.name);
            if (variable) {
              validVariables.push({
                id: variable.id,
                position: variableItem.orderIndex * 100,
                attributes: variableItem.attributes,
                valueLabels: variable.valueLabels,
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

        if (importSet.category === "matrix") {
          if (importSet.contents?.some((content) => content.contentType === "subset")) {
            throw new Error("A matrix variableset cannot contain child subsets");
          }

          const valueLabelsError = getMatrixValueLabelsError(
            validVariables.sort((left, right) => left.position - right.position).map((variable) => variable.valueLabels)
          );

          if (valueLabelsError) {
            throw new Error(valueLabelsError);
          }
        }

        const createdSetResult = await db
          .insert(datasetVariableset)
          .values({
            name: finalName,
            description: importSet.description,
            datasetId,
            orderIndex: importSet.orderIndex,
            category: importSet.category ?? "general",
            attributes: importSet.attributes ?? null,
          })
          .returning({ id: datasetVariableset.id });

        if (createdSetResult.length === 0) {
          throw new Error("Failed to create variable set");
        }

        const createdSetId = createdSetResult[0]?.id;

        if (!createdSetId) {
          throw new Error("Failed to create variable set");
        }

        createdSetsMap.set(importSet.name, createdSetId);
        existingSetNames.add(finalName);

        if (validVariables.length > 0) {
          await db.insert(datasetVariablesetContent).values(
            validVariables.map((variable) => ({
              variablesetId: createdSetId,
              variableId: variable.id,
              position: variable.position,
              contentType: "variable" as const,
              attributes: variable.attributes ?? null,
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

    for (const importSet of importData.variableSets) {
      if (!importSet.parentName || !createdSetsMap.has(importSet.name)) {
        continue;
      }

      const setId = createdSetsMap.get(importSet.name);
      const parentId = createdSetsMap.get(importSet.parentName);
      const parentSet = importData.variableSets.find((set) => set.name === importSet.parentName);

      if (!setId) {
        continue;
      }

      if (!parentId) {
        result.warnings.push(`Parent "${importSet.parentName}" not found for variable set "${importSet.name}"`);
        continue;
      }

      if (parentSet?.category === "matrix") {
        result.warnings.push(`Matrix variable set "${importSet.parentName}" cannot contain child subsets`);
        continue;
      }

      await db.update(datasetVariableset).set({ parentId }).where(eq(datasetVariableset.id, setId));

      const parentContents = importData.variableSets.find((set) => set.name === importSet.parentName)?.contents;
      const subsetInContents = parentContents?.some(
        (content) => content.contentType === "subset" && content.subsetName === importSet.name
      );

      if (!subsetInContents) {
        const existingContents = await db
          .select({ position: datasetVariablesetContent.position })
          .from(datasetVariablesetContent)
          .where(eq(datasetVariablesetContent.variablesetId, parentId))
          .orderBy(datasetVariablesetContent.position);

        const maxPosition =
          existingContents.length > 0 ? (existingContents[existingContents.length - 1]?.position ?? -100) : -100;

        await db.insert(datasetVariablesetContent).values({
          variablesetId: parentId,
          position: maxPosition + 100,
          contentType: "subset",
          subsetId: setId,
        });
        continue;
      }

      const subsetEntry = parentContents?.find(
        (content) => content.contentType === "subset" && content.subsetName === importSet.name
      );

      if (subsetEntry) {
        await db.insert(datasetVariablesetContent).values({
          variablesetId: parentId,
          position: subsetEntry.position,
          contentType: "subset",
          subsetId: setId,
        });
      }
    }
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : "Unknown error occurred during import");
  }

  return result;
}
