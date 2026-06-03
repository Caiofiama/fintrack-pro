import { NextRequest } from "next/server";
import { requireAuth, isAuthError, ok, err } from "@/lib/api-helpers";
import { updateBudgetSchema } from "@/lib/validators/budget";
import { updateBudget, deleteBudget } from "@/services/budgets";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateBudgetSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const budget = await updateBudget(id, auth.userId, parsed.data);
    if (!budget) return err("Budget not found", 404);

    return ok(budget);
  } catch {
    return err("Internal server error", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const result = await deleteBudget(id, auth.userId);

    if ("error" in result) return err(result.error ?? "Operation failed", 404);
    return ok({ success: true });
  } catch {
    return err("Internal server error", 500);
  }
}
