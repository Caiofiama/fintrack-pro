import { prisma } from "@/lib/prisma";
import type { CreateAccountInput, UpdateAccountInput } from "@/lib/validators/account";

export async function listAccounts(userId: string) {
  return prisma.account.findMany({
    where: { userId, isArchived: false },
    orderBy: { createdAt: "asc" },
  });
}

export async function getAccount(id: string, userId: string) {
  return prisma.account.findFirst({ where: { id, userId } });
}

export async function createAccount(userId: string, data: CreateAccountInput) {
  return prisma.account.create({
    data: { userId, ...data },
  });
}

export async function updateAccount(id: string, userId: string, data: UpdateAccountInput) {
  const account = await prisma.account.findFirst({ where: { id, userId } });
  if (!account) return null;

  return prisma.account.update({ where: { id }, data });
}

export async function deleteAccount(id: string, userId: string) {
  const account = await prisma.account.findFirst({ where: { id, userId } });
  if (!account) return { error: "Account not found" };

  const txCount = await prisma.transaction.count({ where: { accountId: id } });
  if (txCount > 0) return { error: "Cannot delete account with existing transactions" };

  await prisma.account.update({ where: { id }, data: { isArchived: true } });
  return { success: true };
}
