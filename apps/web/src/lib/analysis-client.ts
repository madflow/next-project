import "server-only";
import { env } from "@/env";

export function createAnalysisClient() {
  const apiKey = env.ANALYSIS_API_KEY;
  const baseUrl = env.ANALYSIS_API_URL;
  const defaultHeaders = {
    "Content-Type": "application/json",
    "X-API-KEY": apiKey,
  };
  const analysisFetch = async (input: RequestInfo, init?: RequestInit) => {
    const fullEndpoint = `${baseUrl}${input}`;
    console.log(fullEndpoint);
    const response = await fetch(baseUrl + input, {
      ...init,
      headers: {
        ...defaultHeaders,
        ...(init?.headers ?? {}),
      },
    });
    return response;
  };
  const client = {
    fetch: analysisFetch,
  };
  return client;
}
