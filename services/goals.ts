import { prisma } from "@/lib/prisma";
import type { CreateGoalInput, UpdateGoalInput } from "@/lib/validators/goal";

export async function listGoals(userId: string) {
  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return goals.map((goal) => ({
    ...goal,
    percentage: goal.targetAmountCents > 0
      ? Math.min(goal.currentAmountCents / goal.targetAmountCents, 1)
      : 0,
  }));
}

export async function createGoal(userId: string, data: CreateGoalInput) {
  const { deadline, ...rest } = data;
  return prisma.goal.create({
    data: {
      userId,
      ...rest,
      deadline: deadline ? new Date(deadline) : null,
    },
  });
}

export async function updateGoal(id: string, userId: string, data: UpdateGoalInput) {
  const goal = await prisma.goal.findFirst({ where: { id, userId } });
  if (!goal) return null;

  const { deadline, ...rest } = data;

  return prisma.goal.update({
    where: { id },
    data: {
      ...rest,
      ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
    },
  });
}

export async function deleteGoal(id: string, userId: string) {
  const goal = await prisma.goal.findFirst({ where: { id, userId } });
  if (!goal) return { error: "Goal not found" };

  await prisma.goal.delete({ where: { id } });
  return { success: true };
}
