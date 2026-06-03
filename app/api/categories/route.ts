import { NextRequest } from "next/server";
import { requireAuth, isAuthError, ok, err } from "@/lib/api-helpers";
import { createCategorySchema } from "@/lib/validators/category";
import { listCategories, createCategory } from "@/services/categories";

export async function GET() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const categories = await listCategories(auth.userId);
    return ok(categories);
  } catch {
    return err("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const category = await createCategory(auth.userId, parsed.data);
    return ok(category);
  } catch {
    return err("Internal server error", 500);
  }
}
