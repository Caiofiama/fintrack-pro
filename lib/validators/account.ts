import { z } from "zod";

const ACCOUNT_TYPES = ["CHECKING", "SAVINGS", "CREDIT", "INVESTMENT"] as const;

export const createAccountSchema = z.object({
  name: z.string().min(1, "Account name is required").max(100),
  type: z.enum(ACCOUNT_TYPES, { error: "Invalid account type" }),
  balanceCents: z.number().int("Balance must be a whole number in cents"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color").default("#3b82f6"),
  icon: z.string().max(50).default("wallet"),
});

export const updateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  icon: z.string().max(50).optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
