import { NextRequest } from "next/server";
import { requireAuth, isAuthError, ok, err } from "@/lib/api-helpers";
import { createAccountSchema } from "@/lib/validators/account";
import { listAccounts, createAccount } from "@/services/accounts";

export async function GET() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const accounts = await listAccounts(auth.userId);
    return ok(accounts);
  } catch {
    return err("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = createAccountSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const account = await createAccount(auth.userId, parsed.data);
    return ok(account);
  } catch {
    return err("Internal server error", 500);
  }
}
