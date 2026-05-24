import { call, implement, onError } from "@orpc/server";
import { appContract } from "../shared/contract/app";
import { requireAdmin, requireAuthenticated } from "./auth/guard";
import { anonymousPrincipal } from "./auth/principal";
import type { Context } from "./context";
import { toIntegrityConstraintORPCError } from "./errors/integrity-constraint-error";

const baseApi = implement(appContract).$context<Context>();

const authenticatedMiddleware = baseApi.middleware(async ({ context, next }) => {
  requireAuthenticated(context);
  return next();
});

const adminMiddleware = baseApi.middleware(async ({ context, next }) => {
  requireAdmin(context);
  return next();
});

const api: typeof baseApi = baseApi.use(
  onError((error) => {
    throw toIntegrityConstraintORPCError(error) ?? error;
  })
) as unknown as typeof baseApi;

export const authenticatedApi: typeof baseApi = api.use(authenticatedMiddleware) as unknown as typeof baseApi;
export const adminApi: typeof baseApi = authenticatedApi.use(adminMiddleware) as unknown as typeof baseApi;

export type ProcedureContextInput = Pick<Context, "db"> & Partial<Omit<Context, "db">>;

export function toProcedureContext(context: ProcedureContextInput): Context {
  return {
    db: context.db,
    headers: context.headers ?? new Headers(),
    principal: context.principal ?? anonymousPrincipal,
  };
}

export { call };
