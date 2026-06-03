import { prisma } from "@/lib/prisma";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/lib/validators/category";

export async function listCategories(userId: string) {
  const categories = await prisma.category.findMany({
    where: { userId },
    include: { children: true },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return {
    income: categories.filter((c) => c.type === "INCOME" && !c.parentId),
    expense: categories.filter((c) => c.type === "EXPENSE" && !c.parentId),
  };
}

export async function createCategory(userId: string, data: CreateCategoryInput) {
  return prisma.category.create({ data: { userId, ...data } });
}

export async function updateCategory(id: string, userId: string, data: UpdateCategoryInput) {
  const cat = await prisma.category.findFirst({ where: { id, userId } });
  if (!cat) return null;

  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(id: string, userId: string) {
  const cat = await prisma.category.findFirst({ where: { id, userId } });
  if (!cat) return { error: "Category not found" };
  if (cat.isDefault) return { error: "Cannot delete default categories" };

  const txCount = await prisma.transaction.count({ where: { categoryId: id } });
  if (txCount > 0) return { error: "Cannot delete category with existing transactions" };

  await prisma.category.delete({ where: { id } });
  return { success: true };
}
