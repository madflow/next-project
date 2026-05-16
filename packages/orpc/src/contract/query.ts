import { z } from "zod";

export const listInputSchema = z.object({
  limit: z.number().int().min(0).optional().default(10),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().optional(),
  order: z.string().optional(),
});
