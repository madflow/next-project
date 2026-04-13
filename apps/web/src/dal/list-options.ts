import { z } from "zod";

export const orderByDirectionSchema = z.enum(["asc", "desc"]);

export const orderBySchema = z.object({
  column: z.string(),
  direction: orderByDirectionSchema,
});

export const filterSchema = z.object({
  column: z.string(),
  operator: z.string(),
  value: z.string(),
});

export const listOptionsSchema = z.object({
  limit: z.number().optional(),
  offset: z.number().optional(),
  orderBy: z.array(orderBySchema).optional(),
  search: z.string().optional(),
  searchColumns: z.array(z.string()).optional(),
  filters: z.array(filterSchema).optional(),
});

export type ListOptions = z.infer<typeof listOptionsSchema>;
