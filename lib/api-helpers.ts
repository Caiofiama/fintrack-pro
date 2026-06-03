import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import type { ApiResponse } from "@/lib/types";

export function ok<T>(data: T, meta?: Record<string, unknown>): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data, error: null, meta });
}

export function err(message: string, status = 400): NextResponse<ApiResponse<null>> {
  return NextResponse.json({ data: null, error: message }, { status });
}

export async function requireAuth(): Promise<
  { userId: string; email: string; name: string } | NextResponse<ApiResponse<null>>
> {
  const session = await getSession();
  if (!session) {
    return err("Unauthorized", 401);
  }
  return { userId: session.sub, email: session.email, name: session.name };
}

export function isAuthError(
  result: { userId: string; email: string; name: string } | NextResponse<ApiResponse<null>>
): result is NextResponse<ApiResponse<null>> {
  return result instanceof NextResponse;
}
