"use server";

import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { defaultClient as db } from "@repo/database/clients";
import {
  type CreateOrganizationData as CreateData,
  type UpdateOrganizationData as UpdateData,
  organization as entity,
  member,
} from "@repo/database/schema";
import { auth } from "@/lib/auth";
import { assertUserIsAdmin } from "@/lib/dal";

// Types for organization settings
type ThemeItem = {
  name: string;
  chartColors?: Record<string, string>;
};

type OrganizationSettings = {
  themes?: ThemeItem[];
};

// Local validation schema for organization settings
const themeItemSchema = z.object({
  name: z.string(),
  chartColors: z.record(z.string(), z.string()).optional(),
});

const organizationSettingsSchema = z.object({
  themes: z.array(themeItemSchema).optional(),
}).optional();

export async function create(data: CreateData) {
  assertUserIsAdmin();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const cte = db.$with("createdOrg").as(db.insert(entity).values(data).returning());
  await db
    .with(cte)
    .insert(member)
    .values({
      organizationId: sql`(select "id" from ${cte})`,
      userId,
      role: "owner",
      createdAt: new Date(),
    });
}

export async function update(id: string, data: UpdateData) {
  assertUserIsAdmin();
  await db.update(entity).set(data).where(eq(entity.id, id));
}

export async function updateSettings(id: string, settings: OrganizationSettings) {
  assertUserIsAdmin();
  
  // Validate settings
  const validatedSettings = organizationSettingsSchema.parse(settings);
  
  // Update settings directly using SQL-like syntax since the typed interface might not include settings
  await db.execute(sql`UPDATE organizations SET settings = ${JSON.stringify(validatedSettings)} WHERE id = ${id}`);
}

export async function remove(id: string) {
  assertUserIsAdmin();
  await db.delete(entity).where(eq(entity.id, id));
}
