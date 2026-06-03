import { NextRequest } from "next/server";
import { requireAuth, isAuthError, ok, err } from "@/lib/api-helpers";
import { createGoalSchema } from "@/lib/validators/goal";
import { listGoals, createGoal } from "@/services/goals";

export async function GET() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const goals = await listGoals(auth.userId);
    return ok(goals);
  } catch {
    return err("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = createGoalSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const goal = await createGoal(auth.userId, parsed.data);
    return ok(goal);
  } catch {
    return err("Internal server error", 500);
  }
}
