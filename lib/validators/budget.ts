import { z } from "zod";

const BUDGET_PERIODS = ["WEEKLY", "MONTHLY", "YEARLY"] as const;

export const createBudgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  amountCents: z.number().int().positive("Amount must be positive"),
  periodType: z.enum(BUDGET_PERIODS),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  alertThreshold: z.number().min(0).max(1).default(0.8),
});

export const updateBudgetSchema = createBudgetSchema.partial();

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
