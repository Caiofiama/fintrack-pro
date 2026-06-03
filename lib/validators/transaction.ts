import { z } from "zod";

const TRANSACTION_TYPES = ["INCOME", "EXPENSE", "TRANSFER"] as const;

export const createTransactionSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().min(1, "Category is required"),
  amountCents: z.number().int().positive("Amount must be positive"),
  type: z.enum(TRANSACTION_TYPES),
  description: z.string().min(1, "Description is required").max(255),
  date: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  isRecurring: z.boolean().default(false),
  notes: z.string().max(1000).optional().nullable(),
  tagIds: z.array(z.string()).default([]),
  destinationAccountId: z.string().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial().extend({
  amountCents: z.number().int().positive().optional(),
  type: z.enum(TRANSACTION_TYPES).optional(),
});

export const transactionFiltersSchema = z.object({
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  type: z.enum(TRANSACTION_TYPES).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  tagIds: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;
