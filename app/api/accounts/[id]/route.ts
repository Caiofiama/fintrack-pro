import { NextRequest } from "next/server";
import { requireAuth, isAuthError, ok, err } from "@/lib/api-helpers";
import { updateAccountSchema } from "@/lib/validators/account";
import { updateAccount, deleteAccount } from "@/services/accounts";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateAccountSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const account = await updateAccount(id, auth.userId, parsed.data);
    if (!account) return err("Account not found", 404);

    return ok(account);
  } catch {
    return err("Internal server error", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const result = await deleteAccount(id, auth.userId);

    if ("error" in result) return err(result.error ?? "Operation failed", 400);
    return ok({ success: true });
  } catch {
    return err("Internal server error", 500);
  }
}
