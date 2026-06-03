import { prisma } from "@/lib/prisma";
import type { CreateTransactionInput, UpdateTransactionInput, TransactionFilters } from "@/lib/validators/transaction";

type TxWhere = {
  userId?: string;
  accountId?: string;
  categoryId?: string;
  type?: string;
  description?: { contains: string };
  date?: { gte?: Date; lte?: Date };
};

export async function listTransactions(userId: string, filters: TransactionFilters) {
  const where: TxWhere = { userId };

  if (filters.accountId) where.accountId = filters.accountId;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.type) where.type = filters.type;
  if (filters.search) where.description = { contains: filters.search };

  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      where.date.lte = to;
    }
  }

  const [total, transactions] = await prisma.$transaction([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      include: {
        category: true,
        account: true,
        tags: { include: { tag: true } },
      },
      orderBy: { date: "desc" },
      take: filters.limit,
      skip: filters.offset,
    }),
  ]);

  return { transactions, total };
}

export async function getTransaction(id: string, userId: string) {
  return prisma.transaction.findFirst({
    where: { id, userId },
    include: { category: true, account: true, tags: { include: { tag: true } } },
  });
}

export async function createTransaction(userId: string, data: CreateTransactionInput) {
  const { tagIds, destinationAccountId, date, ...rest } = data;

  const transactionDate = new Date(date);

  if (rest.type === "TRANSFER") {
    if (!destinationAccountId) throw new Error("Destination account is required for transfers");

    return prisma.$transaction(async (tx) => {
      const source = await tx.account.findFirst({ where: { id: rest.accountId, userId } });
      const dest = await tx.account.findFirst({ where: { id: destinationAccountId, userId } });
      if (!source || !dest) throw new Error("Account not found");

      const expense = await tx.transaction.create({
        data: {
          userId,
          accountId: rest.accountId,
          categoryId: rest.categoryId,
          amountCents: rest.amountCents,
          type: "EXPENSE",
          description: rest.description,
          date: transactionDate,
          isRecurring: rest.isRecurring,
          notes: rest.notes,
        },
        include: { category: true, account: true, tags: { include: { tag: true } } },
      });

      await tx.transaction.create({
        data: {
          userId,
          accountId: destinationAccountId,
          categoryId: rest.categoryId,
          amountCents: rest.amountCents,
          type: "INCOME",
          description: rest.description,
          date: transactionDate,
          isRecurring: rest.isRecurring,
          notes: rest.notes,
          recurringId: expense.id,
        },
      });

      await tx.account.update({
        where: { id: rest.accountId },
        data: { balanceCents: { decrement: rest.amountCents } },
      });
      await tx.account.update({
        where: { id: destinationAccountId },
        data: { balanceCents: { increment: rest.amountCents } },
      });

      return expense;
    });
  }

  return prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        userId,
        accountId: rest.accountId,
        categoryId: rest.categoryId,
        amountCents: rest.amountCents,
        type: rest.type,
        description: rest.description,
        date: transactionDate,
        isRecurring: rest.isRecurring,
        notes: rest.notes,
        ...(tagIds.length > 0 && {
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
        }),
      },
      include: { category: true, account: true, tags: { include: { tag: true } } },
    });

    const delta = rest.type === "INCOME" ? rest.amountCents : -rest.amountCents;
    await tx.account.update({
      where: { id: rest.accountId },
      data: { balanceCents: { increment: delta } },
    });

    return transaction;
  });
}

export async function updateTransaction(id: string, userId: string, data: UpdateTransactionInput) {
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const { tagIds, destinationAccountId: _dest, date, ...rest } = data;

  return prisma.$transaction(async (tx) => {
    const oldDelta = existing.type === "INCOME" ? existing.amountCents : -existing.amountCents;
    await tx.account.update({
      where: { id: existing.accountId },
      data: { balanceCents: { decrement: oldDelta } },
    });

    const newType = rest.type ?? existing.type;
    const newAmount = rest.amountCents ?? existing.amountCents;
    const newAccountId = rest.accountId ?? existing.accountId;
    const newDelta = newType === "INCOME" ? newAmount : -newAmount;

    await tx.account.update({
      where: { id: newAccountId },
      data: { balanceCents: { increment: newDelta } },
    });

    if (tagIds !== undefined) {
      await tx.tagsOnTransactions.deleteMany({ where: { transactionId: id } });
    }

    return tx.transaction.update({
      where: { id },
      data: {
        ...rest,
        ...(date && { date: new Date(date) }),
        ...(tagIds !== undefined && tagIds.length > 0 && {
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
        }),
      },
      include: { category: true, account: true, tags: { include: { tag: true } } },
    });
  });
}

export async function deleteTransaction(id: string, userId: string) {
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) return { error: "Transaction not found" };

  await prisma.$transaction(async (tx) => {
    const delta = existing.type === "INCOME" ? existing.amountCents : -existing.amountCents;
    await tx.account.update({
      where: { id: existing.accountId },
      data: { balanceCents: { decrement: delta } },
    });
    await tx.transaction.delete({ where: { id } });
  });

  return { success: true };
}

export async function exportTransactionsCsv(userId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    include: { category: true, account: true },
    orderBy: { date: "desc" },
  });

  const header = "Date,Description,Category,Account,Type,Amount\n";
  const rows = transactions
    .map((t) => {
      const amount = (t.amountCents / 100).toFixed(2);
      const date = t.date.toISOString().slice(0, 10);
      return `${date},"${t.description}","${t.category.name}","${t.account.name}",${t.type},${amount}`;
    })
    .join("\n");

  return header + rows;
}
