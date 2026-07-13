import { ORPCError } from "@orpc/server";
import { and, eq, getTableColumns, ilike, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  type DatasetVariable as DatasetVariableRecord,
  type DatasetVariablesetContentType,
  type VariablesetContentAttributes,
  datasetVariable as datasetVariableTable,
  datasetVariablesetContent,
  datasetVariableset as datasetVariablesetTable,
} from "@repo/database/schema";
import { getMatrixValueLabelsError } from "../../../shared/matrix-variableset";
import { type ProcedureContextInput, adminApi, authenticatedApi, call, toProcedureContext } from "../../base";
import { requireDatasetAccess } from "../dataset/access";

const adminVariablesetApi = adminApi.variableset;
const authenticatedVariablesetApi = authenticatedApi.variableset;
const subsetVariablesetTable = alias(datasetVariablesetTable, "subset_dataset_variableset");

type VariablesetVariableRow = DatasetVariableRecord & {
  attributes?: typeof datasetVariablesetContent.$inferSelect.attributes | null;
  orderIndex?: number;
};

type DatasetVariablesetContentRecord = typeof datasetVariablesetContent.$inferSelect;

type DatasetVariablesetVariablesInput = {
  id: string;
  limit?: number | string;
  offset?: number | string;
  search?: string;
  setId: string;
  unassigned?: string;
};

type CreateVariablesetContentInput = {
  body: {
    attributes?: VariablesetContentAttributes | null;
    contentType: DatasetVariablesetContentType;
    referenceId: string;
  };
  params: {
    id: string;
  };
};

type ReorderVariablesetContentsInput = {
  body: {
    contentIds: string[];
  };
  params: {
    id: string;
  };
};

type UpdateVariablesetVariableAttributesInput = {
  body: VariablesetContentAttributes | null;
  params: {
    id: string;
    variableId: string;
  };
};

function notFoundError(message: string) {
  return new ORPCError("NOT_FOUND", {
    message,
    status: 404,
  });
}

function normalizeSearch(search?: string) {
  const trimmedSearch = search?.trim();
  return trimmedSearch ? trimmedSearch : undefined;
}

function paginateRows<T>(rows: T[], limit: number, offset: number) {
  return {
    count: rows.length,
    limit,
    offset,
    rows: rows.slice(offset, offset + limit),
  };
}

async function getVariablesetRecord(context: ProcedureContextInput, id: string) {
  const [variableset] = await context.db
    .select({
      category: datasetVariablesetTable.category,
      datasetId: datasetVariablesetTable.datasetId,
      id: datasetVariablesetTable.id,
    })
    .from(datasetVariablesetTable)
    .where(eq(datasetVariablesetTable.id, id))
    .limit(1)
    .execute();

  if (variableset === undefined) {
    throw notFoundError("Variableset not found");
  }

  return variableset;
}

async function getVariablesInSet(
  context: ProcedureContextInput,
  variablesetId: string,
  options: {
    limit: number;
    offset: number;
    search?: string;
  }
) {
  const search = normalizeSearch(options.search);
  const whereConditions = [
    eq(datasetVariablesetContent.variablesetId, variablesetId),
    eq(datasetVariablesetContent.contentType, "variable"),
  ];

  if (search) {
    const searchCondition = or(
      ilike(datasetVariableTable.name, `%${search}%`),
      ilike(datasetVariableTable.label, `%${search}%`)
    );

    if (searchCondition) {
      whereConditions.push(searchCondition);
    }
  }

  const whereCondition = whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions);
  const rows = await context.db
    .select({
      ...getTableColumns(datasetVariableTable),
      attributes: datasetVariablesetContent.attributes,
      orderIndex: datasetVariablesetContent.position,
    })
    .from(datasetVariableTable)
    .innerJoin(
      datasetVariablesetContent,
      and(
        eq(datasetVariableTable.id, datasetVariablesetContent.variableId),
        eq(datasetVariablesetContent.contentType, "variable")
      )
    )
    .where(whereCondition)
    .orderBy(datasetVariablesetContent.position, datasetVariableTable.name)
    .execute();

  return paginateRows(rows as VariablesetVariableRow[], options.limit, options.offset);
}

async function getUnassignedVariables(
  context: ProcedureContextInput,
  datasetId: string,
  options: {
    limit: number;
    offset: number;
    search?: string;
  }
) {
  const search = normalizeSearch(options.search);
  const whereConditions = [eq(datasetVariableTable.datasetId, datasetId), isNull(datasetVariablesetContent.variableId)];

  if (search) {
    const searchCondition = or(
      ilike(datasetVariableTable.name, `%${search}%`),
      ilike(datasetVariableTable.label, `%${search}%`)
    );

    if (searchCondition) {
      whereConditions.push(searchCondition);
    }
  }

  const whereCondition = whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions);
  const rows = await context.db
    .select({
      ...getTableColumns(datasetVariableTable),
    })
    .from(datasetVariableTable)
    .leftJoin(
      datasetVariablesetContent,
      and(
        eq(datasetVariableTable.id, datasetVariablesetContent.variableId),
        eq(datasetVariablesetContent.contentType, "variable")
      )
    )
    .where(whereCondition)
    .orderBy(datasetVariableTable.name)
    .execute();

  return paginateRows(rows as VariablesetVariableRow[], options.limit, options.offset);
}

export async function listVariablesetVariables(context: ProcedureContextInput, input: { id: string }) {
  return call(variablesList, input, { context: toProcedureContext(context) });
}

export async function getVariablesetContents(context: ProcedureContextInput, input: { id: string }) {
  return call(contentsGet, input, { context: toProcedureContext(context) });
}

export async function listDatasetVariablesetVariables(
  context: ProcedureContextInput,
  input: DatasetVariablesetVariablesInput
) {
  return call(datasetVariablesList, input, { context: toProcedureContext(context) });
}

export async function createVariablesetContent(context: ProcedureContextInput, input: CreateVariablesetContentInput) {
  return call(contentsCreate, input, { context: toProcedureContext(context) });
}

export async function deleteVariablesetContent(
  context: ProcedureContextInput,
  input: {
    contentId: string;
    id: string;
  }
) {
  return call(contentsDelete, input, { context: toProcedureContext(context) });
}

export async function reorderVariablesetContents(
  context: ProcedureContextInput,
  input: ReorderVariablesetContentsInput
) {
  return call(contentsReorder, input, { context: toProcedureContext(context) });
}

export async function updateVariablesetVariableAttributes(
  context: ProcedureContextInput,
  input: UpdateVariablesetVariableAttributesInput
) {
  return call(contentsUpdateAttributes, input, { context: toProcedureContext(context) });
}

async function addContentToVariableset(
  context: ProcedureContextInput,
  variablesetId: string,
  contentType: DatasetVariablesetContentType,
  referenceId: string,
  attributes?: VariablesetContentAttributes | null
): Promise<DatasetVariablesetContentRecord> {
  const variableset = await getVariablesetRecord(context, variablesetId);

  if (variableset.category === "matrix" && contentType === "subset") {
    throw new ORPCError("BAD_REQUEST", {
      message: "A matrix variableset cannot contain child subsets",
      status: 400,
    });
  }

  if (contentType === "subset" && referenceId === variablesetId) {
    throw new ORPCError("BAD_REQUEST", {
      message: "A variableset cannot include itself as a subset",
      status: 400,
    });
  }

  if (variableset.category === "matrix") {
    const existingVariables = await context.db
      .select({ valueLabels: datasetVariableTable.valueLabels })
      .from(datasetVariablesetContent)
      .innerJoin(datasetVariableTable, eq(datasetVariablesetContent.variableId, datasetVariableTable.id))
      .where(
        and(
          eq(datasetVariablesetContent.variablesetId, variablesetId),
          eq(datasetVariablesetContent.contentType, "variable")
        )
      )
      .orderBy(datasetVariablesetContent.position)
      .execute();
    const [assignedVariable] = await context.db
      .select({ valueLabels: datasetVariableTable.valueLabels })
      .from(datasetVariableTable)
      .where(and(eq(datasetVariableTable.id, referenceId), eq(datasetVariableTable.datasetId, variableset.datasetId)))
      .limit(1)
      .execute();

    if (!assignedVariable) {
      throw notFoundError("Dataset variable not found");
    }

    const valueLabelsError = getMatrixValueLabelsError([
      ...existingVariables.map((variable) => variable.valueLabels),
      assignedVariable.valueLabels,
    ]);

    if (valueLabelsError) {
      throw new ORPCError("BAD_REQUEST", { message: valueLabelsError, status: 400 });
    }
  }

  const maxPosition = await context.db
    .select({ maxPos: sql<number>`COALESCE(MAX(${datasetVariablesetContent.position}), -100)` })
    .from(datasetVariablesetContent)
    .where(eq(datasetVariablesetContent.variablesetId, variablesetId));

  const values = {
    attributes:
      contentType === "variable" ? (attributes ?? { allowedStatistics: { distribution: true, mean: false } }) : null,
    contentType,
    position: (maxPosition[0]?.maxPos ?? -100) + 100,
    subsetId: contentType === "subset" ? referenceId : null,
    variableId: contentType === "variable" ? referenceId : null,
    variablesetId,
  };

  if (contentType === "subset") {
    let created: DatasetVariablesetContentRecord | undefined;

    await context.db.transaction(async (tx) => {
      const [inserted] = await tx.insert(datasetVariablesetContent).values(values).returning();
      created = inserted;

      await tx
        .update(datasetVariablesetTable)
        .set({ parentId: variablesetId, updatedAt: new Date() })
        .where(eq(datasetVariablesetTable.id, referenceId));
    });

    if (!created) {
      throw new Error("Failed to add content to variableset");
    }

    return created;
  }

  const [created] = await context.db.insert(datasetVariablesetContent).values(values).returning();

  if (!created) {
    throw new Error("Failed to add content to variableset");
  }

  return created;
}

const variablesList = authenticatedVariablesetApi.variables.list.handler(async ({ context, input }) => {
  const variableset = await getVariablesetRecord(context, input.id);

  await requireDatasetAccess(context, variableset.datasetId);

  return getVariablesInSet(context, input.id, {
    limit: 1000,
    offset: 0,
  });
});

const contentsGet = authenticatedVariablesetApi.contents.get.handler(async ({ context, input }) => {
  const variableset = await getVariablesetRecord(context, input.id);

  await requireDatasetAccess(context, variableset.datasetId);

  const contents = await context.db
    .select({
      attributes: datasetVariablesetContent.attributes,
      contentType: datasetVariablesetContent.contentType,
      createdAt: datasetVariablesetContent.createdAt,
      id: datasetVariablesetContent.id,
      position: datasetVariablesetContent.position,
      subsetCategory: subsetVariablesetTable.category,
      subsetDescription: subsetVariablesetTable.description,
      subsetId: datasetVariablesetContent.subsetId,
      subsetName: subsetVariablesetTable.name,
      updatedAt: datasetVariablesetContent.updatedAt,
      variableId: datasetVariablesetContent.variableId,
      variableLabel: datasetVariableTable.label,
      variableMeasure: datasetVariableTable.measure,
      variableName: datasetVariableTable.name,
      variableType: datasetVariableTable.type,
      variablesetId: datasetVariablesetContent.variablesetId,
    })
    .from(datasetVariablesetContent)
    .leftJoin(datasetVariableTable, eq(datasetVariablesetContent.variableId, datasetVariableTable.id))
    .leftJoin(subsetVariablesetTable, eq(datasetVariablesetContent.subsetId, subsetVariablesetTable.id))
    .where(eq(datasetVariablesetContent.variablesetId, input.id))
    .orderBy(datasetVariablesetContent.position)
    .execute();

  return { contents };
});

const contentsCreate = adminVariablesetApi.contents.create.handler(async ({ context, input }) => {
  return addContentToVariableset(
    context,
    input.params.id,
    input.body.contentType,
    input.body.referenceId,
    input.body.attributes
  );
});

const contentsDelete = adminVariablesetApi.contents.delete.handler(async ({ context, input }) => {
  await context.db.transaction(async (tx) => {
    const [deletedContent] = await tx
      .delete(datasetVariablesetContent)
      .where(
        and(eq(datasetVariablesetContent.id, input.contentId), eq(datasetVariablesetContent.variablesetId, input.id))
      )
      .returning({
        contentType: datasetVariablesetContent.contentType,
        subsetId: datasetVariablesetContent.subsetId,
      });

    if (deletedContent?.contentType === "subset" && deletedContent.subsetId) {
      await tx
        .update(datasetVariablesetTable)
        .set({ parentId: null, updatedAt: new Date() })
        .where(
          and(eq(datasetVariablesetTable.id, deletedContent.subsetId), eq(datasetVariablesetTable.parentId, input.id))
        );
    }
  });

  return { success: true };
});

const contentsReorder = adminVariablesetApi.contents.reorder.handler(async ({ context, input }) => {
  const items = await context.db
    .select({ id: datasetVariablesetContent.id })
    .from(datasetVariablesetContent)
    .where(eq(datasetVariablesetContent.variablesetId, input.params.id));

  const existingIds = new Set(items.map((item) => item.id));

  if (
    input.body.contentIds.length !== items.length ||
    new Set(input.body.contentIds).size !== input.body.contentIds.length ||
    input.body.contentIds.some((contentId) => !existingIds.has(contentId))
  ) {
    throw new ORPCError("BAD_REQUEST", {
      message: "contentIds must exactly match the existing content IDs for this variable set",
      status: 400,
    });
  }

  await context.db.transaction(async (tx) => {
    for (let index = 0; index < input.body.contentIds.length; index++) {
      const contentId = input.body.contentIds[index];

      if (!contentId) {
        continue;
      }

      await tx
        .update(datasetVariablesetContent)
        .set({ position: index * 100, updatedAt: new Date() })
        .where(eq(datasetVariablesetContent.id, contentId));
    }
  });

  return { success: true };
});

const contentsUpdateAttributes = adminVariablesetApi.contents.updateAttributes.handler(async ({ context, input }) => {
  const [updated] = await context.db
    .update(datasetVariablesetContent)
    .set({ attributes: input.body, updatedAt: new Date() })
    .where(
      and(
        eq(datasetVariablesetContent.variablesetId, input.params.id),
        eq(datasetVariablesetContent.variableId, input.params.variableId),
        eq(datasetVariablesetContent.contentType, "variable")
      )
    )
    .returning();

  if (!updated) {
    throw notFoundError("Variableset variable content not found");
  }

  return updated;
});

const datasetVariablesList = authenticatedVariablesetApi.datasetVariables.list.handler(async ({ context, input }) => {
  await requireDatasetAccess(context, input.id);

  if (input.unassigned === "true") {
    return getUnassignedVariables(context, input.id, {
      limit: input.limit,
      offset: input.offset,
      search: input.search,
    });
  }

  const variableset = await getVariablesetRecord(context, input.setId);

  if (variableset.datasetId !== input.id) {
    throw notFoundError("Variableset not found in dataset");
  }

  return getVariablesInSet(context, input.setId, {
    limit: input.limit,
    offset: input.offset,
    search: input.search,
  });
});

export const variableset = {
  contents: {
    create: contentsCreate,
    delete: contentsDelete,
    get: contentsGet,
    reorder: contentsReorder,
    updateAttributes: contentsUpdateAttributes,
  },
  datasetVariables: {
    list: datasetVariablesList,
  },
  variables: {
    list: variablesList,
  },
};
