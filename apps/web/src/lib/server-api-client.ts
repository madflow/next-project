import "server-only";
import { headers } from "next/headers";
import { createServerAPIClient } from "@repo/api/server/client";
import { auth } from "@repo/auth/nextjs/server";
import { defaultClient as db } from "@repo/database/clients";

export async function getServerAPIClient() {
  return createServerAPIClient({
    auth,
    db,
    headers: await headers(),
  });
}
