import { NextRequest } from "next/server";
import { requireAuth, isAuthError, ok, err } from "@/lib/api-helpers";
import { getCategoryTrend } from "@/services/analytics";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const categoryId = req.nextUrl.searchParams.get("categoryId");
  const months = parseInt(req.nextUrl.searchParams.get("months") ?? "6", 10);

  if (!categoryId) return err("categoryId param required");
  if (isNaN(months) || months < 1 || months > 24) return err("months must be between 1 and 24");

  try {
    const data = await getCategoryTrend(auth.userId, categoryId, months);
    return ok(data);
  } catch {
    return err("Internal server error", 500);
  }
}
