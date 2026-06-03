import { NextRequest } from "next/server";
import { requireAuth, isAuthError, ok, err } from "@/lib/api-helpers";
import { updateTransactionSchema } from "@/lib/validators/transaction";
import { updateTransaction, deleteTransaction } from "@/services/transactions";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateTransactionSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const transaction = await updateTransaction(id, auth.userId, parsed.data);
    if (!transaction) return err("Transaction not found", 404);

    return ok(transaction);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return err(message, 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const result = await deleteTransaction(id, auth.userId);

    if ("error" in result) return err(result.error ?? "Operation failed", 404);
    return ok({ success: true });
  } catch {
    return err("Internal server error", 500);
  }
}
