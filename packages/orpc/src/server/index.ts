import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { appRouter } from "./router/index.js";

export const createRPCHandler = () => {
  const handler = new RPCHandler(appRouter, {
    plugins: [],
    interceptors: [
      onError((error) => {
        console.error(error);
      }),
    ],
  });

  return async function handleRequest(request: Request) {
    const { response } = await handler.handle(request, {
      prefix: "/rpc",
      context: {}, // Provide initial context if needed
    });

    return response ?? new Response("Not found", { status: 404 });
  };
};
