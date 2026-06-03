import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear } from "date-fns";
import type { CreateBudgetInput, UpdateBudgetInput } from "@/lib/validators/budget";

function getPeriodRange(periodType: string, refDate = new Date()) {
  switch (periodType) {
    case "WEEKLY":
      return { start: startOfWeek(refDate, { weekStartsOn: 1 }), end: endOfWeek(refDate, { weekStartsOn: 1 }) };
    case "YEARLY":
      return { start: startOfYear(refDate), end: endOfYear(refDate) };
    default:
      return { start: startOfMonth(refDate), end: endOfMonth(refDate) };
  }
}

export async function listBudgets(userId: string) {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  const enriched = await Promise.all(
    budgets.map(async (budget) => {
      const { start, end } = getPeriodRange(budget.periodType);

      const aggregate = await prisma.transaction.aggregate({
        where: {
          userId,
          categoryId: budget.categoryId,
          type: "EXPENSE",
          date: { gte: start, lte: end },
        },
        _sum: { amountCents: true },
      });

      const spentCents = aggregate._sum.amountCents ?? 0;
      const percentage = budget.amountCents > 0 ? (spentCents / budget.amountCents) * 100 : 0;

      return { ...budget, spentCents, percentage };
    })
  );

  return enriched;
}

export async function createBudget(userId: string, data: CreateBudgetInput) {
  const { startDate, endDate, ...rest } = data;

  const existing = await prisma.budget.findFirst({
    where: { userId, categoryId: data.categoryId, periodType: data.periodType },
  });
  if (existing) return { error: "A budget for this category and period already exists" };

  return prisma.budget.create({
    data: {
      userId,
      ...rest,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
    },
    include: { category: true },
  });
}

export async function updateBudget(id: string, userId: string, data: UpdateBudgetInput) {
  const budget = await prisma.budget.findFirst({ where: { id, userId } });
  if (!budget) return null;

  const { startDate, endDate, ...rest } = data;

  return prisma.budget.update({
    where: { id },
    data: {
      ...rest,
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
    },
    include: { category: true },
  });
}

export async function deleteBudget(id: string, userId: string) {
  const budget = await prisma.budget.findFirst({ where: { id, userId } });
  if (!budget) return { error: "Budget not found" };

  await prisma.budget.delete({ where: { id } });
  return { success: true };
}
