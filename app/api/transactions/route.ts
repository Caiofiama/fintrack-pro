import { NextRequest } from "next/server";
import { requireAuth, isAuthError, ok, err } from "@/lib/api-helpers";
import { createTransactionSchema, transactionFiltersSchema } from "@/lib/validators/transaction";
import { listTransactions, createTransaction } from "@/services/transactions";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = transactionFiltersSchema.safeParse(searchParams);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const { transactions, total } = await listTransactions(auth.userId, parsed.data);
    return ok(transactions, {
      total,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
      hasMore: parsed.data.offset + parsed.data.limit < total,
    });
  } catch {
    return err("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = createTransactionSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const transaction = await createTransaction(auth.userId, parsed.data);
    return ok(transaction);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return err(message, 500);
  }
}
