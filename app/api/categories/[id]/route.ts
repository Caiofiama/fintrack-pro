import { NextRequest } from "next/server";
import { requireAuth, isAuthError, ok, err } from "@/lib/api-helpers";
import { updateCategorySchema } from "@/lib/validators/category";
import { updateCategory, deleteCategory } from "@/services/categories";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const category = await updateCategory(id, auth.userId, parsed.data);
    if (!category) return err("Category not found", 404);

    return ok(category);
  } catch {
    return err("Internal server error", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const result = await deleteCategory(id, auth.userId);

    if ("error" in result) return err(result.error ?? "Operation failed", 400);
    return ok({ success: true });
  } catch {
    return err("Internal server error", 500);
  }
}
