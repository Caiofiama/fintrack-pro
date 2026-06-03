import { z } from "zod";

export const createGoalSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  targetAmountCents: z.number().int().positive("Target amount must be positive"),
  currentAmountCents: z.number().int().min(0).default(0),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  icon: z.string().max(50).default("target"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#3b82f6"),
});

export const updateGoalSchema = createGoalSchema.partial().extend({
  isCompleted: z.boolean().optional(),
});

export const contributeGoalSchema = z.object({
  amountCents: z.number().int().positive("Amount must be positive"),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type ContributeGoalInput = z.infer<typeof contributeGoalSchema>;
