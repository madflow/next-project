import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { onError } from "@orpc/server";
import { DatabaseInstance } from "@repo/database/clients";
import { createORPCContext } from "./context";
import { appRouter } from "./router";

export const createApi = ({ db }: { db: DatabaseInstance }) => {
  const handler = new OpenAPIHandler(appRouter, {
    plugins: [],
    interceptors: [
      onError((error) => {
        console.error(error);
      }),
    ],
  });
  return async (request: Request) => {
    const context = await createORPCContext({ db, headers: request.headers });
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
