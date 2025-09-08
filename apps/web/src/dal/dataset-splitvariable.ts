import "server-only";
import { and, eq, ilike, or, notInArray } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import {
  CreateDatasetSplitVariableData,
  datasetVariable,
  datasetSplitVariable as entity,
} from "@repo/database/schema";
import { ListOptions, withAdminCheck, withSessionCheck } from "@/lib/dal";
import { DalException } from "@/lib/exception";

async function listByDatasetFn(datasetId: string, options: ListOptions = {}) {
  const { search } = options;
  
  // Build where conditions
  const whereConditions = [eq(entity.datasetId, datasetId)];
  
  // Add search if provided
  if (search) {
    const searchConditions = [
      ilike(datasetVariable.name, `%${search}%`),
      ilike(datasetVariable.label, `%${search}%`)
    ];
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
    })
    .from(datasetVariable)
    .innerJoin(entity, eq(datasetVariable.id, entity.variableId))
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

async function getAvailableVariablesFn(datasetId: string, options: ListOptions = {}) {
  const { search } = options;
  
  // Get variables that are NOT already split variables
  const existingSplitVariables = await db
    .select({ variableId: entity.variableId })
    .from(entity)
    .where(eq(entity.datasetId, datasetId));
  
  const existingVariableIds = existingSplitVariables.map(item => item.variableId);
  
  // Build where conditions
  const whereConditions = [eq(datasetVariable.datasetId, datasetId)];
  
  // Exclude variables that are already split variables
  if (existingVariableIds.length > 0) {
    whereConditions.push(notInArray(datasetVariable.id, existingVariableIds));
  }
  
  // Add search if provided
  if (search) {
    const searchConditions = [
      ilike(datasetVariable.name, `%${search}%`),
      ilike(datasetVariable.label, `%${search}%`)
    ];
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
    })
    .from(datasetVariable)
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

async function addSplitVariableFn(datasetId: string, variableId: string) {
  // Check if variable is already a split variable
  const existing = await db
    .select()
    .from(entity)
    .where(
      and(eq(entity.datasetId, datasetId), eq(entity.variableId, variableId))
    )
    .limit(1);

  if (existing.length > 0) {
    throw new DalException("Variable is already a split variable");
  }

  const insertData: CreateDatasetSplitVariableData = {
    datasetId,
    variableId,
  };

  const [created] = await db.insert(entity).values(insertData).returning();

  if (!created) {
    throw new DalException("Failed to add split variable");
  }

  return created;
}

async function removeSplitVariableFn(datasetId: string, variableId: string) {
  await db
    .delete(entity)
    .where(
      and(eq(entity.datasetId, datasetId), eq(entity.variableId, variableId))
    );
}

// Exported functions with appropriate auth checks
export const listByDataset = withSessionCheck(listByDatasetFn);
export const getAvailableVariables = withSessionCheck(getAvailableVariablesFn);
export const addSplitVariable = withAdminCheck(addSplitVariableFn);
export const removeSplitVariable = withAdminCheck(removeSplitVariableFn);