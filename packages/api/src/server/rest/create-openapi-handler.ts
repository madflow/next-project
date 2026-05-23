import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { ORPCError, ValidationError, onError } from "@orpc/server";
import { z } from "zod";
import type { AuthInstance } from "@repo/auth/server";
import { DatabaseInstance } from "@repo/database/clients";
import { createORPCContext } from "../context";
import { appRouter } from "../router";

function toZodValidationError(error: ValidationError) {
  return new z.ZodError(error.issues as z.core.$ZodIssue[]);
}

export const createOpenAPIHandler = ({ auth, db }: { auth: AuthInstance; db: DatabaseInstance }) => {
  const handler = new OpenAPIHandler(appRouter, {
    clientInterceptors: [
      onError((error) => {
        if (error instanceof ORPCError && error.code === "BAD_REQUEST" && error.cause instanceof ValidationError) {
          const zodError = toZodValidationError(error.cause);

          throw new ORPCError("INPUT_VALIDATION_FAILED", {
            cause: error.cause,
            data: z.flattenError(zodError),
            message: z.prettifyError(zodError),
            status: 422,
          });
        }
      }),
    ],
    plugins: [],
    interceptors: [
      onError((error) => {
        if (error instanceof ORPCError && error.status < 500) {
          return;
        }

        console.error(error);
      }),
    ],
  });
  return async (request: Request) => {
    const context = await createORPCContext({ auth, db, headers: request.headers });
    const { matched, response } = await handler.handle(request, {
      prefix: "/rpc",
      context,
    });
    if (matched) {
      return response;
    } else {
      return new Response("Not Found", { status: 404 });
    }
  };
};
