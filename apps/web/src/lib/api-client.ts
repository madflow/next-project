import { createAPIClient, createTanstackQueryAPIClient } from "@repo/api/client";
import { env } from "@/env";

const getServerUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
};

const apiClientOptions = {
  apiPath: "/api" as const,
  serverUrl: getServerUrl(),
};

export const apiClient = createAPIClient(apiClientOptions);
export const apiQuery = createTanstackQueryAPIClient(apiClientOptions);
