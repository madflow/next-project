import { type CreateOpenAPIHandlerOptions, createOpenAPIHandler } from "./create-openapi-handler";
import { createCustomRouteHandler } from "./custom-routes";

export const createApiHandler = (options: CreateOpenAPIHandlerOptions) => {
  const openAPIHandler = createOpenAPIHandler(options);
  const customRouteHandler = createCustomRouteHandler(options);

  return async (request: Request) => {
    const customResponse = await customRouteHandler(request);

    if (customResponse !== null) {
      return customResponse;
    }

    return openAPIHandler(request);
  };
};
