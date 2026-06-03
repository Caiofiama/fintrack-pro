import { NextRequest } from "next/server";
import { requireAuth, isAuthError, ok, err } from "@/lib/api-helpers";
import { getMonthlyOverview } from "@/services/analytics";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const month = req.nextUrl.searchParams.get("month");
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return err("month param required (YYYY-MM)");

  try {
    const data = await getMonthlyOverview(auth.userId, month);
    return ok({
      totalIncome: data.totalIncome,
      totalExpenses: data.totalExpenses,
      netBalance: data.net,
      savingsRate: data.savingsRate,
    });
  } catch {
    return err("Internal server error", 500);
  }
}
