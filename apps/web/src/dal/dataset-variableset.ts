import "server-only";
import { and, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { defaultClient as db } from "@repo/database/clients";
import {
  CreateDatasetVariablesetData,
  DatasetVariablesetContentType,
  UpdateDatasetVariablesetData,
  VariablesetContentAttributes,
  datasetVariable,
  datasetVariablesetContent,
  datasetVariableset as entity,
  insertDatasetVariablesetSchema,
  selectDatasetVariablesetSchema,
  updateDatasetVariablesetSchema,
} from "@repo/database/schema";
import { ListOptions, createList, withAdminCheck, withSessionCheck } from "@/dal/dal";
import { assertAccess } from "@/dal/dataset";
import { DalException, DalNotFoundException } from "@/lib/exception";
import type { VariablesetTreeNode } from "@/types/dataset-variableset";

const baseList = createList(entity, selectDatasetVariablesetSchema);

async function listByDatasetFn(datasetId: string, options: ListOptions = {}) {
  const listOptions: ListOptions = {
    ...options,
    filters: [...(options.filters || []), { column: "datasetId", operator: "eq", value: datasetId }],
    orderBy: [
      { column: "orderIndex", direction: "asc" },
      { column: "name", direction: "asc" },
    ],
  };
  return baseList(listOptions);
}

async function getHierarchyFn(datasetId: string): Promise<VariablesetTreeNode[]> {
  // Get all variablesets for the dataset with variable counts from contents table
  const variablesets = await db
    .select({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      parentId: entity.parentId,
      orderIndex: entity.orderIndex,
      category: entity.category,
      attributes: entity.attributes,
      variableCount: sql<number>`COALESCE(COUNT(${datasetVariablesetContent.variableId}), 0)`,
    })
    .from(entity)
    .leftJoin(
      datasetVariablesetContent,
      and(eq(entity.id, datasetVariablesetContent.variablesetId), eq(datasetVariablesetContent.contentType, "variable"))
    )
    .where(eq(entity.datasetId, datasetId))
    .groupBy(
      entity.id,
      entity.name,
      entity.description,
      entity.parentId,
      entity.orderIndex,
      entity.category,
      entity.attributes
    )
    .orderBy(entity.orderIndex, entity.id);

  // Build hierarchy tree
  const nodeMap = new Map<string, VariablesetTreeNode>();
  const rootNodes: VariablesetTreeNode[] = [];

  // First pass: create all nodes
  for (const set of variablesets) {
    const node: VariablesetTreeNode = {
      category: set.category,
      children: [],
      description: set.description,
      id: set.id,
      level: 0,
      name: set.name,
      orderIndex: set.orderIndex,
      parentId: set.parentId,
      variableCount: set.variableCount,
      attributes: set.attributes,
    };
    nodeMap.set(set.id, node);
  }

  // Second pass: build hierarchy and calculate levels
  for (const node of nodeMap.values()) {
    if (node.parentId) {
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        node.level = parent.level + 1;
        parent.children.push(node);
      } else {
        // Parent not found, treat as root
        rootNodes.push(node);
      }
    } else {
      rootNodes.push(node);
    }
  }

  return rootNodes;
}

async function findFn(id: string) {
  const [result] = await db.select().from(entity).where(eq(entity.id, id)).limit(1);
  return result;
}

async function assertVariablesetAccessFn(variablesetId: string, expectedDatasetId?: string) {
  const variableset = await findFn(variablesetId);

  if (!variableset) {
    throw new DalNotFoundException("Variableset not found");
  }

  if (expectedDatasetId && variableset.datasetId !== expectedDatasetId) {
    throw new DalNotFoundException("Variableset not found in dataset");
  }

  await assertAccess(variableset.datasetId);

  return variableset;
}

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

async function getVariablesInSetFn(variablesetId: string, options: ListOptions = {}) {
  const { search } = options;

  // Build where conditions using the contents table
  const whereConditions = [
    eq(datasetVariablesetContent.variablesetId, variablesetId),
    eq(datasetVariablesetContent.contentType, "variable"),
  ];

  // Add search if provided
  if (search) {
    const searchConditions = [ilike(datasetVariable.name, `%${search}%`), ilike(datasetVariable.label, `%${search}%`)];
    const searchOr = or(...searchConditions);
    if (searchOr) {
      whereConditions.push(searchOr);
    }
  }

  const whereCondition = whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions);

  const query = db
    .select({
      id: datasetVariable.id,
      name: datasetVariable.name,
      label: datasetVariable.label,
      type: datasetVariable.type,
      measure: datasetVariable.measure,
      datasetId: datasetVariable.datasetId,
      createdAt: datasetVariable.createdAt,
      variableLabels: datasetVariable.variableLabels,
      valueLabels: datasetVariable.valueLabels,
      missingValues: datasetVariable.missingValues,
      missingRanges: datasetVariable.missingRanges,
      orderIndex: datasetVariablesetContent.position,
      attributes: datasetVariablesetContent.attributes,
    })
    .from(datasetVariable)
    .innerJoin(
      datasetVariablesetContent,
      and(
        eq(datasetVariable.id, datasetVariablesetContent.variableId),
        eq(datasetVariablesetContent.contentType, "variable")
      )
    )
    .where(whereCondition)
    .orderBy(datasetVariablesetContent.position, datasetVariable.name);

  const results = await query;
  return {
    rows: results,
    count: results.length,
    limit: options.limit || results.length,
    offset: options.offset || 0,
  };
}

async function getUnassignedVariablesFn(datasetId: string, options: ListOptions = {}) {
  const { search } = options;

  const whereConditions = [eq(datasetVariable.datasetId, datasetId), isNull(datasetVariablesetContent.variableId)];

  if (search) {
    const searchConditions = [ilike(datasetVariable.name, `%${search}%`), ilike(datasetVariable.label, `%${search}%`)];
    const searchOr = or(...searchConditions);
    if (searchOr) {
      whereConditions.push(searchOr);
    }
  }

  const whereCondition = whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions);

  const query = db
    .select()
    .from(datasetVariable)
    .leftJoin(
      datasetVariablesetContent,
      and(
        eq(datasetVariable.id, datasetVariablesetContent.variableId),
        eq(datasetVariablesetContent.contentType, "variable")
      )
    )
    .where(whereCondition)
    .orderBy(datasetVariable.name);

  const results = await query;

  return {
    rows: results,
    count: results.length,
    limit: options.limit || results.length,
    offset: options.offset || 0,
  };
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

// --- New unified contents functions ---

type ContentEntry = {
  id: string;
  position: number;
  contentType: DatasetVariablesetContentType;
  variableId: string | null;
  subsetId: string | null;
  attributes: VariablesetContentAttributes | null;
  // Variable fields (populated when contentType = 'variable')
  variableName: string | null;
  variableLabel: string | null;
  variableType: string | null;
  variableMeasure: string | null;
  // Subset fields (populated when contentType = 'subset')
  subsetName: string | null;
  subsetDescription: string | null;
  subsetCategory: string | null;
};

async function getContentsFn(variablesetId: string): Promise<ContentEntry[]> {
  // Get all contents for a variableset, joining variable and subset details
  // Use alias to avoid self-join collision since entity (datasetVariableset) is both
  // the table being filtered and the table being joined for subset name resolution
  const subsetVariableset = alias(entity, "subset_variableset");
  const results = await db
    .select({
      id: datasetVariablesetContent.id,
      position: datasetVariablesetContent.position,
      contentType: datasetVariablesetContent.contentType,
      variableId: datasetVariablesetContent.variableId,
      subsetId: datasetVariablesetContent.subsetId,
      attributes: datasetVariablesetContent.attributes,
      variableName: datasetVariable.name,
      variableLabel: datasetVariable.label,
      variableType: datasetVariable.type,
      variableMeasure: datasetVariable.measure,
      subsetName: subsetVariableset.name,
      subsetDescription: subsetVariableset.description,
      subsetCategory: subsetVariableset.category,
    })
    .from(datasetVariablesetContent)
    .leftJoin(datasetVariable, eq(datasetVariablesetContent.variableId, datasetVariable.id))
    .leftJoin(subsetVariableset, eq(datasetVariablesetContent.subsetId, subsetVariableset.id))
    .where(eq(datasetVariablesetContent.variablesetId, variablesetId))
    .orderBy(datasetVariablesetContent.position);

  return results;
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

// Exported functions with appropriate auth checks
export const listByDataset = withSessionCheck(listByDatasetFn);
export const getHierarchy = withSessionCheck(getHierarchyFn);
export const assertVariablesetAccess = withSessionCheck(assertVariablesetAccessFn);
export const create = withAdminCheck(createFn);
export const update = withAdminCheck(updateFn);
export const remove = withAdminCheck(removeFn);
export const getVariablesInSet = withSessionCheck(getVariablesInSetFn);
export const getUnassignedVariables = withSessionCheck(getUnassignedVariablesFn);
export const updateContentAttributes = withAdminCheck(updateContentAttributesFn);
export const reorderVariablesets = withAdminCheck(reorderVariablesetsFn);
// New unified contents exports
export const getContents = withSessionCheck(getContentsFn);
export const addContentToVariableset = withAdminCheck(addContentToVariablesetFn);
export const removeContentFromVariableset = withAdminCheck(removeContentFromVariablesetFn);
export const reorderContents = withAdminCheck(reorderContentsFn);
export const detachSubset = withAdminCheck(detachSubsetFn);
