import { NextRequest } from "next/server";
import { requireAuth, isAuthError, ok, err } from "@/lib/api-helpers";
import { createBudgetSchema } from "@/lib/validators/budget";
import { listBudgets, createBudget } from "@/services/budgets";

export async function GET() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const budgets = await listBudgets(auth.userId);
    return ok(budgets);
  } catch {
    return err("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = createBudgetSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const result = await createBudget(auth.userId, parsed.data);
    if ("error" in result) return err(result.error, 409);

    return ok(result);
  } catch {
    return err("Internal server error", 500);
  }
}
