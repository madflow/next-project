import type { DatabaseInstance } from "@repo/database/clients";

type MockListState = {
  countSelection?: unknown;
  countWhere?: unknown;
  joinCount: number;
  offset?: number;
  orderBy: unknown[];
  rowSelection?: unknown;
  rowWhere?: unknown;
};

type MockInsertState = {
  table?: unknown;
  values?: unknown;
};

type MockDeleteState = {
  table?: unknown;
  where?: unknown;
};

type MockUpdateState = {
  set?: unknown;
  table?: unknown;
  where?: unknown;
};

function toDatabaseInstance<T extends object>(db: T): DatabaseInstance {
  return db as unknown as DatabaseInstance;
}

function createReturningResult(row: Record<string, unknown> | undefined) {
  return {
    async returning() {
      return row ? [row] : [];
    },
  };
}

export function createMockListDb(rows: Array<Record<string, unknown>>, totalCount: number) {
  const state: MockListState = {
    joinCount: 0,
    orderBy: [],
  };

  const rowBuilder = {
    $dynamic() {
      return this;
    },
    async execute() {
      return rows;
    },
    from() {
      return this;
    },
    innerJoin() {
      state.joinCount += 1;
      return this;
    },
    limit() {
      return this;
    },
    offset(offset: number) {
      state.offset = offset;
      return this;
    },
    orderBy(...orderBy: unknown[]) {
      state.orderBy = orderBy;
      return this;
    },
    where(where: unknown) {
      state.rowWhere = where;
      return this;
    },
  };

  const countBuilder = {
    $dynamic() {
      return this;
    },
    async execute() {
      return [{ count: totalCount }];
    },
    from() {
      return this;
    },
    innerJoin() {
      state.joinCount += 1;
      return this;
    },
    where(where: unknown) {
      state.countWhere = where;
      return this;
    },
  };

  const db = {
    select(selection?: unknown) {
      if (selection && typeof selection === "object" && "count" in selection) {
        state.countSelection = selection;
        return countBuilder;
      }

      state.rowSelection = selection;
      return rowBuilder;
    },
  };

  return { db: toDatabaseInstance(db), state };
}

export function createMockInsertDb(row: Record<string, unknown>) {
  const state: MockInsertState = {};

  const db = {
    insert(table: unknown) {
      state.table = table;

      return {
        values(values: unknown) {
          state.values = values;

          return {
            async returning() {
              return [row];
            },
          };
        },
      };
    },
  };

  return { db: toDatabaseInstance(db), state };
}

export function createMockInsertDbError(error: unknown) {
  const state: MockInsertState = {};

  const db = {
    insert(table: unknown) {
      state.table = table;

      return {
        values(values: unknown) {
          state.values = values;

          return {
            async returning() {
              throw error;
            },
          };
        },
      };
    },
  };

  return { db: toDatabaseInstance(db), state };
}

export function createMockDeleteDb(row: Record<string, unknown> | undefined) {
  const state: MockDeleteState = {};

  const db = {
    delete(table: unknown) {
      state.table = table;

      return {
        where(where: unknown) {
          state.where = where;

          return createReturningResult(row);
        },
      };
    },
  };

  return { db: toDatabaseInstance(db), state };
}

export function createMockUpdateDb(row: Record<string, unknown> | undefined) {
  const state: MockUpdateState = {};

  const db = {
    update(table: unknown) {
      state.table = table;

      return {
        set(set: unknown) {
          state.set = set;

          return {
            where(where: unknown) {
              state.where = where;

              return createReturningResult(row);
            },
          };
        },
      };
    },
  };

  return { db: toDatabaseInstance(db), state };
}

export function createMockUpdateDbError(error: unknown) {
  const state: MockUpdateState = {};

  const db = {
    update(table: unknown) {
      state.table = table;

      return {
        set(set: unknown) {
          state.set = set;

          return {
            where(where: unknown) {
              state.where = where;

              return {
                async returning() {
                  throw error;
                },
              };
            },
          };
        },
      };
    },
  };

  return { db: toDatabaseInstance(db), state };
}
