import { z } from "zod";

export const listInputSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  cursor: z.number().int().min(0).default(0),
});
