import { z } from "zod";

const CATEGORY_TYPES = ["INCOME", "EXPENSE"] as const;

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  icon: z.string().max(50).default("tag"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6b7280"),
  type: z.enum(CATEGORY_TYPES),
  parentId: z.string().optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
