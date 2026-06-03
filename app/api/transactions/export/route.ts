import { requireAuth, isAuthError, err } from "@/lib/api-helpers";
import { exportTransactionsCsv } from "@/services/transactions";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const csv = await exportTransactionsCsv(auth.userId);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="transactions-${Date.now()}.csv"`,
      },
    });
  } catch {
    return err("Internal server error", 500);
  }
}
