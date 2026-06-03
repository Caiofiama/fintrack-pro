export type AccountType = "CHECKING" | "SAVINGS" | "CREDIT" | "INVESTMENT";
export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type CategoryType = "INCOME" | "EXPENSE";
export type BudgetPeriod = "WEEKLY" | "MONTHLY" | "YEARLY";

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  meta?: Record<string, unknown>;
}

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}
