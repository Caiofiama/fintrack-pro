import { NextRequest } from "next/server";
import { requireAuth, isAuthError, ok, err } from "@/lib/api-helpers";
import { getCashflow } from "@/services/analytics";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const months = parseInt(req.nextUrl.searchParams.get("months") ?? "6", 10);
  if (isNaN(months) || months < 1 || months > 24) return err("months must be between 1 and 24");

  try {
    const data = await getCashflow(auth.userId, months);
    return ok(data);
  } catch {
    return err("Internal server error", 500);
  }
}
