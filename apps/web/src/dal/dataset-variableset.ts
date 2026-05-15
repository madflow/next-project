import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import {
  CreateDatasetVariablesetData,
  DatasetVariablesetContentType,
  UpdateDatasetVariablesetData,
  VariablesetContentAttributes,
  datasetVariablesetContent,
  datasetVariableset as entity,
  insertDatasetVariablesetSchema,
  updateDatasetVariablesetSchema,
} from "@repo/database/schema";
import { withAdminCheck } from "@/dal/dal";
import { DalException } from "@/lib/exception";

async function createFn(data: CreateDatasetVariablesetData) {
  const insertData = insertDatasetVariablesetSchema.parse(data);
  const [created] = await db.insert(entity).values(insertData).returning();

  if (!created) {
    throw new DalException("Failed to create dataset variableset");
  }

  // If this set has a parent, add it as a subset content entry in the parent
  if (created.parentId) {
    const maxPosition = await db
      .select({ maxPos: sql<number>`COALESCE(MAX(${datasetVariablesetContent.position}), -100)` })
      .from(datasetVariablesetContent)
      .where(eq(datasetVariablesetContent.variablesetId, created.parentId));

    await db.insert(datasetVariablesetContent).values({
      variablesetId: created.parentId,
      position: (maxPosition[0]?.maxPos ?? -100) + 100,
      contentType: "subset",
      subsetId: created.id,
    });
  }

  return created;
}

async function updateFn(id: string, data: UpdateDatasetVariablesetData) {
  const updateData = updateDatasetVariablesetSchema.parse(data);
  const [updated] = await db.update(entity).set(updateData).where(eq(entity.id, id)).returning();

  if (!updated) {
    throw new DalException("Failed to update dataset variableset");
  }

  return updated;
}

async function removeFn(id: string) {
  await db.delete(entity).where(eq(entity.id, id));
}

async function updateContentAttributesFn(
  variablesetId: string,
  variableId: string,
  attributes: VariablesetContentAttributes | null
) {
  const [updated] = await db
    .update(datasetVariablesetContent)
    .set({ attributes, updatedAt: new Date() })
    .where(
      and(
        eq(datasetVariablesetContent.variablesetId, variablesetId),
        eq(datasetVariablesetContent.variableId, variableId),
        eq(datasetVariablesetContent.contentType, "variable")
      )
    )
    .returning();

  if (!updated) {
    throw new DalException("Failed to update variableset item attributes");
  }

  return updated;
}

async function reorderVariablesetsFn(datasetId: string, parentId: string | null, reorderedIds: string[]) {
  // Verify all IDs belong to the dataset and have the same parent
  const variablesets = await db
    .select()
    .from(entity)
    .where(and(eq(entity.datasetId, datasetId), parentId ? eq(entity.parentId, parentId) : isNull(entity.parentId)));

  const existingIds = new Set(variablesets.map((v) => v.id));
  const invalidIds = reorderedIds.filter((id) => !existingIds.has(id));

  if (invalidIds.length > 0) {
    throw new DalException("Some variablesets do not belong to the specified parent");
  }

  // Update order indexes in a transaction
  await db.transaction(async (tx) => {
    for (let i = 0; i < reorderedIds.length; i++) {
      const id = reorderedIds[i];
      if (!id) continue;
      await tx
        .update(entity)
        .set({
          orderIndex: i,
          updatedAt: new Date(),
        })
        .where(eq(entity.id, id));
    }
  });

  return { success: true };
}

async function addContentToVariablesetFn(
  variablesetId: string,
  contentType: DatasetVariablesetContentType,
  referenceId: string,
  attributes?: VariablesetContentAttributes | null
) {
  // Get max position to append at end
  const maxPosition = await db
    .select({ maxPos: sql<number>`COALESCE(MAX(${datasetVariablesetContent.position}), -100)` })
    .from(datasetVariablesetContent)
    .where(eq(datasetVariablesetContent.variablesetId, variablesetId));

  const position = (maxPosition[0]?.maxPos ?? -100) + 100;

  const values = {
    variablesetId,
    position,
    contentType,
    variableId: contentType === "variable" ? referenceId : null,
    subsetId: contentType === "subset" ? referenceId : null,
    attributes:
      contentType === "variable" ? (attributes ?? { allowedStatistics: { distribution: true, mean: false } }) : null,
  };

  if (contentType === "subset") {
    // Insert the content row and update the subset's parentId atomically
    let created: (typeof values & { id: string }) | undefined;
    await db.transaction(async (tx) => {
      const [inserted] = await tx.insert(datasetVariablesetContent).values(values).returning();
      created = inserted;
      await tx.update(entity).set({ parentId: variablesetId, updatedAt: new Date() }).where(eq(entity.id, referenceId));
    });

    if (!created) {
      throw new DalException("Failed to add content to variableset");
    }

    return created;
  }

  const [created] = await db.insert(datasetVariablesetContent).values(values).returning();

  if (!created) {
    throw new DalException("Failed to add content to variableset");
  }

  return created;
}

async function removeContentFromVariablesetFn(variablesetId: string, contentId: string) {
  await db
    .delete(datasetVariablesetContent)
    .where(
      and(eq(datasetVariablesetContent.id, contentId), eq(datasetVariablesetContent.variablesetId, variablesetId))
    );
}

async function detachSubsetFn(subsetId: string) {
  // Remove the content entry from the parent's contents table and clear parentId
  await db.transaction(async (tx) => {
    // Remove the subset content entry from the parent variableset
    await tx
      .delete(datasetVariablesetContent)
      .where(
        and(eq(datasetVariablesetContent.subsetId, subsetId), eq(datasetVariablesetContent.contentType, "subset"))
      );
    // Detach the subset from its parent (make it a root variableset)
    await tx.update(entity).set({ parentId: null, updatedAt: new Date() }).where(eq(entity.id, subsetId));
  });
}

async function reorderContentsFn(variablesetId: string, reorderedContentIds: string[]) {
  // Verify all content IDs belong to this variableset
  const items = await db
    .select()
    .from(datasetVariablesetContent)
    .where(eq(datasetVariablesetContent.variablesetId, variablesetId));

  const existingIds = new Set(items.map((item) => item.id));

  if (
    reorderedContentIds.length !== items.length ||
    new Set(reorderedContentIds).size !== reorderedContentIds.length ||
    reorderedContentIds.some((id) => !existingIds.has(id))
  ) {
    throw new DalException("Reorder payload must contain each content id exactly once");
  }

  // Update positions in a transaction using gap-based positioning
  await db.transaction(async (tx) => {
    for (let i = 0; i < reorderedContentIds.length; i++) {
      const contentId = reorderedContentIds[i];
      if (!contentId) continue;
      await tx
        .update(datasetVariablesetContent)
        .set({ position: i * 100, updatedAt: new Date() })
        .where(eq(datasetVariablesetContent.id, contentId));
    }
  });

  return { success: true };
}

export const create = withAdminCheck(createFn);
export const update = withAdminCheck(updateFn);
export const remove = withAdminCheck(removeFn);
export const updateContentAttributes = withAdminCheck(updateContentAttributesFn);
export const reorderVariablesets = withAdminCheck(reorderVariablesetsFn);
export const addContentToVariableset = withAdminCheck(addContentToVariablesetFn);
export const removeContentFromVariableset = withAdminCheck(removeContentFromVariablesetFn);
export const reorderContents = withAdminCheck(reorderContentsFn);
export const detachSubset = withAdminCheck(detachSubsetFn);
