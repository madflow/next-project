import { createORPCClient } from "@orpc/client";
import type { ContractRouterClient, InferContractRouterOutputs } from "@orpc/contract";
import { ResponseValidationPlugin } from "@orpc/contract/plugins";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { appContract } from "../contract/index.js";
import { joinUrl } from "../utils.js";

export { isDefinedError, safe } from "@orpc/client";

export interface APIClientOptions {
  serverUrl: string;
  apiPath: `/${string}`;
}

export type RouterOutput = InferContractRouterOutputs<typeof appContract>;

export const createAPIClient = ({ serverUrl, apiPath }: APIClientOptions) => {
  const link = new OpenAPILink(appContract, {
    url: joinUrl(serverUrl, apiPath),
    plugins: [new ResponseValidationPlugin(appContract)],
    fetch: (request, init) => {
      return globalThis.fetch(request, {
        ...init,
        credentials: "include",
      });
    },
  });
  const client: ContractRouterClient<typeof appContract> = createORPCClient(link);

  return client;
};

export const createTanstackQueryAPIClient = (opts: APIClientOptions) => {
  const apiClient = createAPIClient(opts);
  return createTanstackQueryUtils(apiClient);
};
