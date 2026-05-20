import { call, implement, onError } from "@orpc/server";
import { appContract } from "../shared/contract/app";
import type { Context } from "./context";
import { toIntegrityConstraintORPCError } from "./errors/integrity-constraint-error";

export const api = implement(appContract)
  .$context<Context>()
  .use(
    onError((error) => {
      throw toIntegrityConstraintORPCError(error) ?? error;
    })
  );

export function toProcedureContext(context: Pick<Context, "db"> & Partial<Pick<Context, "headers">>): Context {
  return {
    db: context.db,
    headers: context.headers ?? new Headers(),
  };
}

export { call };
