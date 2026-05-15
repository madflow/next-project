import { z } from "zod";

const orderDirections = ["asc", "desc"] as const;

export const orderDirectionSchema = z.enum(orderDirections);

export const collectionInputSchema = z
  .object({
    embed: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    offset: z.coerce.number().int().min(0).default(0),
    order: z.string().trim().min(1).optional(),
    search: z
      .string()
      .optional()
      .transform((value) => value?.trim() || undefined),
  })
  .catchall(z.union([z.string(), z.array(z.string())]));

const orderByItemSchema = z.object({
  field: z.string(),
  direction: orderDirectionSchema,
  relationship: z.string().optional(),
});

export function createCollectionResultSchema<T extends z.ZodTypeAny>(rowSchema: T) {
  return z.object({
    count: z.number(),
    limit: z.number(),
    offset: z.number(),
    orderBy: z.array(orderByItemSchema).optional(),
    rows: z.array(rowSchema),
  });
}
