import { NextRequest } from "next/server";
import { requireAuth, isAuthError, ok, err } from "@/lib/api-helpers";
import { getByCategory } from "@/services/analytics";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const month = req.nextUrl.searchParams.get("month");
  const type = req.nextUrl.searchParams.get("type") as "INCOME" | "EXPENSE" | null;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) return err("month param required (YYYY-MM)");
  if (!type || !["INCOME", "EXPENSE"].includes(type)) return err("type must be INCOME or EXPENSE");

  try {
    const raw = await getByCategory(auth.userId, month, type);
    const data = raw.map((item) => ({
      categoryId: item.categoryId,
      name: item.name,
      color: item.color,
      amountCents: item.total,
      percentage: item.percentage,
    }));
    return ok(data);
  } catch {
    return err("Internal server error", 500);
  }
}
