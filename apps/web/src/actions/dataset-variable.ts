"use server";

import { eq } from "drizzle-orm";
import { defaultClient as db } from "@repo/database/clients";
import { UpdateDatasetData, datasetVariable as entity } from "@repo/database/schema";
import { update as dalUpdate } from "@/dal/dataset-variable";
import { assertUserIsAdmin } from "@/lib/dal";
import { ServerActionFailureException } from "@/lib/exception";

export async function update(id: string, data: UpdateDatasetData) {
  const updatedVariable = await dalUpdate(id, data);

  if (!updatedVariable) {
    throw new ServerActionFailureException("Failed to update dataset variable");
  }

  return updatedVariable;
}

export async function remove(id: string) {
  assertUserIsAdmin();
  await db.delete(entity).where(eq(entity.id, id));
}
