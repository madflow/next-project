import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import {
  CreateDatasetVariablesetData,
  CreateDatasetVariablesetItemData,
  UpdateDatasetVariablesetData,
  datasetVariable,
  datasetVariablesetItem,
  datasetVariableset as entity,
  insertDatasetVariablesetSchema,
  selectDatasetVariablesetSchema,
  updateDatasetVariablesetSchema,
} from "@repo/database/schema";
import { ListOptions, createList, withAdminCheck, withSessionCheck } from "@/lib/dal";
import { DalException } from "@/lib/exception";
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
  console.log(`[DEBUG] getHierarchy called for dataset: ${datasetId}`);

  // Get all variablesets for the dataset with variable counts
  const variablesets = await db
    .select({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      parentId: entity.parentId,
      orderIndex: entity.orderIndex,
      variableCount: sql<number>`COALESCE(COUNT(${datasetVariablesetItem.variableId}), 0)`,
    })
    .from(entity)
    .leftJoin(datasetVariablesetItem, eq(entity.id, datasetVariablesetItem.variablesetId))
    .where(eq(entity.datasetId, datasetId))
    .groupBy(entity.id, entity.name, entity.description, entity.parentId, entity.orderIndex)
    .orderBy(entity.orderIndex, entity.name);

  console.log(`[DEBUG] Raw variablesets from DB:`, JSON.stringify(variablesets, null, 2));

  // Build hierarchy tree
  const nodeMap = new Map<string, VariablesetTreeNode>();
  const rootNodes: VariablesetTreeNode[] = [];

  // First pass: create all nodes
  for (const set of variablesets) {
    const node: VariablesetTreeNode = {
      id: set.id,
      name: set.name,
      description: set.description,
      parentId: set.parentId,
      variableCount: set.variableCount,
      children: [],
      level: 0,
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

  console.log(`[DEBUG] Final rootNodes:`, JSON.stringify(rootNodes, null, 2));
  return rootNodes;
}

async function findFn(id: string) {
  const [result] = await db.select().from(entity).where(eq(entity.id, id)).limit(1);
  return result;
}

async function createFn(data: CreateDatasetVariablesetData) {
  const insertData = insertDatasetVariablesetSchema.parse(data);
  const [created] = await db.insert(entity).values(insertData).returning();

  if (!created) {
    throw new DalException("Failed to create dataset variableset");
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
      orderIndex: datasetVariablesetItem.orderIndex,
    })
    .from(datasetVariable)
    .innerJoin(datasetVariablesetItem, eq(datasetVariable.id, datasetVariablesetItem.variableId))
    .where(eq(datasetVariablesetItem.variablesetId, variablesetId))
    .orderBy(datasetVariablesetItem.orderIndex, datasetVariable.name);

  const results = await query;
  return {
    rows: results,
    count: results.length,
    limit: options.limit || results.length,
    offset: options.offset || 0,
  };
}

async function getUnassignedVariablesFn(datasetId: string, options: ListOptions = {}) {
  // Get variables that are not assigned to any variableset
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
    })
    .from(datasetVariable)
    .leftJoin(datasetVariablesetItem, eq(datasetVariable.id, datasetVariablesetItem.variableId))
    .where(and(eq(datasetVariable.datasetId, datasetId), isNull(datasetVariablesetItem.variableId)))
    .orderBy(datasetVariable.name);

  const results = await query;

  return {
    rows: results,
    count: results.length,
    limit: options.limit || results.length,
    offset: options.offset || 0,
  };
}

async function addVariableToSetFn(variablesetId: string, variableId: string, orderIndex?: number) {
  // Check if variable is already in the set
  const existing = await db
    .select()
    .from(datasetVariablesetItem)
    .where(
      and(eq(datasetVariablesetItem.variablesetId, variablesetId), eq(datasetVariablesetItem.variableId, variableId))
    )
    .limit(1);

  if (existing.length > 0) {
    throw new DalException("Variable is already assigned to this set");
  }

  // If no order index provided, append to end
  if (orderIndex === undefined) {
    const maxOrder = await db
      .select({ maxOrder: sql<number>`COALESCE(MAX(${datasetVariablesetItem.orderIndex}), -1)` })
      .from(datasetVariablesetItem)
      .where(eq(datasetVariablesetItem.variablesetId, variablesetId));

    orderIndex = (maxOrder[0]?.maxOrder ?? -1) + 1;
  }

  const insertData: CreateDatasetVariablesetItemData = {
    variablesetId,
    variableId,
    orderIndex,
  };

  await db.insert(datasetVariablesetItem).values(insertData);
}

async function removeVariableFromSetFn(variablesetId: string, variableId: string) {
  await db
    .delete(datasetVariablesetItem)
    .where(
      and(eq(datasetVariablesetItem.variablesetId, variablesetId), eq(datasetVariablesetItem.variableId, variableId))
    );
}

// Exported functions with appropriate auth checks
export const listByDataset = withSessionCheck(listByDatasetFn);
export const getHierarchy = withSessionCheck(getHierarchyFn);
export const find = withSessionCheck(findFn);
export const create = withAdminCheck(createFn);
export const update = withAdminCheck(updateFn);
export const remove = withAdminCheck(removeFn);
export const getVariablesInSet = withSessionCheck(getVariablesInSetFn);
export const getUnassignedVariables = withSessionCheck(getUnassignedVariablesFn);
export const addVariableToSet = withAdminCheck(addVariableToSetFn);
export const removeVariableFromSet = withAdminCheck(removeVariableFromSetFn);
