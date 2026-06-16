import "server-only";
import { headers } from "next/headers";
import { createServerAPIClient } from "@repo/api/server/client";
import { defaultClient as db } from "@repo/database/clients";
import { auth } from "@/lib/auth/server";

export async function getServerAPIClient() {
  return createServerAPIClient({
    auth,
    db,
    headers: await headers(),
  });
}
