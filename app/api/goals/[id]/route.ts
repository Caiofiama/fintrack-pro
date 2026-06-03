import { NextRequest } from "next/server";
import { requireAuth, isAuthError, ok, err } from "@/lib/api-helpers";
import { updateGoalSchema } from "@/lib/validators/goal";
import { updateGoal, deleteGoal } from "@/services/goals";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateGoalSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const goal = await updateGoal(id, auth.userId, parsed.data);
    if (!goal) return err("Goal not found", 404);

    return ok(goal);
  } catch {
    return err("Internal server error", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const result = await deleteGoal(id, auth.userId);

    if ("error" in result) return err(result.error ?? "Operation failed", 404);
    return ok({ success: true });
  } catch {
    return err("Internal server error", 500);
  }
}
