import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export async function getMonthlyOverview(userId: string, month: string) {
  const [year, mon] = month.split("-").map(Number);
  const refDate = new Date(year, mon - 1, 1);
  const start = startOfMonth(refDate);
  const end = endOfMonth(refDate);

  const [incomeResult, expenseResult] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "INCOME", date: { gte: start, lte: end } },
      _sum: { amountCents: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "EXPENSE", date: { gte: start, lte: end } },
      _sum: { amountCents: true },
    }),
  ]);

  const totalIncome = incomeResult._sum.amountCents ?? 0;
  const totalExpenses = expenseResult._sum.amountCents ?? 0;
  const net = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  return { totalIncome, totalExpenses, net, savingsRate };
}

export async function getCashflow(userId: string, months: number) {
  const now = new Date();
  const result = [];

  for (let i = months - 1; i >= 0; i--) {
    const refDate = subMonths(now, i);
    const start = startOfMonth(refDate);
    const end = endOfMonth(refDate);

    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: "INCOME", date: { gte: start, lte: end } },
        _sum: { amountCents: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: "EXPENSE", date: { gte: start, lte: end } },
        _sum: { amountCents: true },
      }),
    ]);

    result.push({
      month: format(refDate, "MMM yyyy"),
      monthKey: format(refDate, "yyyy-MM"),
      income: incomeAgg._sum.amountCents ?? 0,
      expenses: expenseAgg._sum.amountCents ?? 0,
    });
  }

  return result;
}

export async function getByCategory(userId: string, month: string, type: "INCOME" | "EXPENSE") {
  const [year, mon] = month.split("-").map(Number);
  const refDate = new Date(year, mon - 1, 1);
  const start = startOfMonth(refDate);
  const end = endOfMonth(refDate);

  const transactions = await prisma.transaction.findMany({
    where: { userId, type, date: { gte: start, lte: end } },
    include: { category: true },
  });

  const categoryMap = new Map<string, { name: string; color: string; icon: string; total: number }>();

  for (const tx of transactions) {
    const key = tx.categoryId;
    const existing = categoryMap.get(key);
    if (existing) {
      existing.total += tx.amountCents;
    } else {
      categoryMap.set(key, {
        name: tx.category.name,
        color: tx.category.color,
        icon: tx.category.icon,
        total: tx.amountCents,
      });
    }
  }

  const totalAll = Array.from(categoryMap.values()).reduce((s, c) => s + c.total, 0);

  return Array.from(categoryMap.entries())
    .map(([id, data]) => ({
      categoryId: id,
      ...data,
      percentage: totalAll > 0 ? (data.total / totalAll) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export async function getCategoryTrend(userId: string, categoryId: string, months: number) {
  const now = new Date();
  const result = [];

  for (let i = months - 1; i >= 0; i--) {
    const refDate = subMonths(now, i);
    const start = startOfMonth(refDate);
    const end = endOfMonth(refDate);

    const agg = await prisma.transaction.aggregate({
      where: { userId, categoryId, date: { gte: start, lte: end } },
      _sum: { amountCents: true },
    });

    result.push({
      month: format(refDate, "MMM yyyy"),
      monthKey: format(refDate, "yyyy-MM"),
      total: agg._sum.amountCents ?? 0,
    });
  }

  return result;
}
