"use server";

import { eq } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import { datasetVariable as entity } from "@repo/database/schema";
import { assertUserIsAdmin } from "@/lib/dal";

export async function remove(id: string) {
  assertUserIsAdmin();
  await db.delete(entity).where(eq(entity.id, id));
}
