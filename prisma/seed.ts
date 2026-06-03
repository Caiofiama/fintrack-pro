import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma";
import bcrypt from "bcryptjs";
import { subMonths, addDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  // Clean slate
  await prisma.tagsOnTransactions.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.account.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Demo@123", 12);

  const user = await prisma.user.create({
    data: {
      name: "Alex Demo",
      email: "demo@fintrack.dev",
      passwordHash,
    },
  });

  // Categories
  const cats = await prisma.category.createManyAndReturn({
    data: [
      { userId: user.id, name: "Food & Dining", icon: "utensils", color: "#f59e0b", type: "EXPENSE", isDefault: true },
      { userId: user.id, name: "Transport", icon: "car", color: "#3b82f6", type: "EXPENSE", isDefault: true },
      { userId: user.id, name: "Housing", icon: "home", color: "#8b5cf6", type: "EXPENSE", isDefault: true },
      { userId: user.id, name: "Health", icon: "heart", color: "#ef4444", type: "EXPENSE", isDefault: true },
      { userId: user.id, name: "Entertainment", icon: "tv", color: "#ec4899", type: "EXPENSE", isDefault: true },
      { userId: user.id, name: "Shopping", icon: "shopping-bag", color: "#f97316", type: "EXPENSE", isDefault: true },
      { userId: user.id, name: "Education", icon: "book", color: "#06b6d4", type: "EXPENSE", isDefault: true },
      { userId: user.id, name: "Other", icon: "more-horizontal", color: "#6b7280", type: "EXPENSE", isDefault: true },
      { userId: user.id, name: "Salary", icon: "briefcase", color: "#10b981", type: "INCOME", isDefault: true },
      { userId: user.id, name: "Freelance", icon: "laptop", color: "#14b8a6", type: "INCOME", isDefault: true },
    ],
  });

  const byName = Object.fromEntries(cats.map((c: { id: string; name: string }) => [c.name, c]));

  // Accounts
  const checking = await prisma.account.create({
    data: { userId: user.id, name: "Main Checking", type: "CHECKING", balanceCents: 420000, color: "#3b82f6", icon: "wallet" },
  });
  const savings = await prisma.account.create({
    data: { userId: user.id, name: "Savings", type: "SAVINGS", balanceCents: 1250000, color: "#10b981", icon: "piggy-bank" },
  });
  const credit = await prisma.account.create({
    data: { userId: user.id, name: "Credit Card", type: "CREDIT", balanceCents: -85000, color: "#ef4444", icon: "credit-card" },
  });

  // Budgets
  await prisma.budget.createMany({
    data: [
      { userId: user.id, categoryId: byName["Food & Dining"].id, amountCents: 60000, periodType: "MONTHLY", startDate: new Date("2025-01-01"), alertThreshold: 0.8 },
      { userId: user.id, categoryId: byName["Transport"].id, amountCents: 25000, periodType: "MONTHLY", startDate: new Date("2025-01-01"), alertThreshold: 0.8 },
      { userId: user.id, categoryId: byName["Entertainment"].id, amountCents: 20000, periodType: "MONTHLY", startDate: new Date("2025-01-01"), alertThreshold: 0.7 },
      { userId: user.id, categoryId: byName["Shopping"].id, amountCents: 40000, periodType: "MONTHLY", startDate: new Date("2025-01-01"), alertThreshold: 0.85 },
      { userId: user.id, categoryId: byName["Health"].id, amountCents: 15000, periodType: "MONTHLY", startDate: new Date("2025-01-01"), alertThreshold: 0.8 },
    ],
  });

  // Goals
  await prisma.goal.createMany({
    data: [
      { userId: user.id, name: "Emergency Fund", targetAmountCents: 1000000, currentAmountCents: 600000, deadline: new Date("2025-12-31"), icon: "shield", color: "#10b981" },
      { userId: user.id, name: "Vacation Fund", targetAmountCents: 500000, currentAmountCents: 150000, deadline: new Date("2025-08-01"), icon: "plane", color: "#3b82f6" },
      { userId: user.id, name: "New Laptop", targetAmountCents: 200000, currentAmountCents: 180000, deadline: new Date("2025-06-01"), icon: "laptop", color: "#8b5cf6" },
    ],
  });

  // Transactions — 6 months of realistic data
  const now = new Date();

  type TxInput = {
    accountId: string;
    categoryId: string;
    amountCents: number;
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    description: string;
    date: Date;
    notes?: string;
  };

  const transactions: TxInput[] = [];

  for (let m = 5; m >= 0; m--) {
    const base = subMonths(now, m);
    const yr = base.getFullYear();
    const mo = base.getMonth();

    const d = (day: number) => new Date(yr, mo, day);

    // Income — salary on 1st, freelance mid-month some months
    transactions.push({ accountId: checking.id, categoryId: byName["Salary"].id, amountCents: 550000, type: "INCOME", description: "Monthly Salary", date: d(1) });
    if (m % 2 === 0) {
      transactions.push({ accountId: checking.id, categoryId: byName["Freelance"].id, amountCents: Math.floor(Math.random() * 80000) + 40000, type: "INCOME", description: "Freelance Project", date: d(15) });
    }

    // Housing — rent on 5th
    transactions.push({ accountId: checking.id, categoryId: byName["Housing"].id, amountCents: 150000, type: "EXPENSE", description: "Rent", date: d(5) });
    transactions.push({ accountId: checking.id, categoryId: byName["Housing"].id, amountCents: 9500, type: "EXPENSE", description: "Electricity Bill", date: d(8) });
    transactions.push({ accountId: checking.id, categoryId: byName["Housing"].id, amountCents: 5000, type: "EXPENSE", description: "Internet Bill", date: d(10) });

    // Food — multiple per month
    const foodItems = [
      ["Grocery Store", 8500], ["Restaurant Dinner", 4200], ["Lunch", 1800], ["Coffee Shop", 850],
      ["Supermarket", 12000], ["Fast Food", 2200], ["Bakery", 1200], ["Grocery Store", 9800],
    ] as const;
    foodItems.forEach(([desc, amt], i) => {
      transactions.push({ accountId: credit.id, categoryId: byName["Food & Dining"].id, amountCents: amt + Math.floor(Math.random() * 500), type: "EXPENSE", description: desc, date: addDays(d(2), i * 3) });
    });

    // Transport
    transactions.push({ accountId: checking.id, categoryId: byName["Transport"].id, amountCents: 8000, type: "EXPENSE", description: "Monthly Bus Pass", date: d(2) });
    transactions.push({ accountId: credit.id, categoryId: byName["Transport"].id, amountCents: 3500, type: "EXPENSE", description: "Uber", date: d(12) });
    transactions.push({ accountId: credit.id, categoryId: byName["Transport"].id, amountCents: 5200, type: "EXPENSE", description: "Gas", date: d(20) });

    // Entertainment
    transactions.push({ accountId: credit.id, categoryId: byName["Entertainment"].id, amountCents: 1599, type: "EXPENSE", description: "Netflix", date: d(3) });
    transactions.push({ accountId: credit.id, categoryId: byName["Entertainment"].id, amountCents: 1099, type: "EXPENSE", description: "Spotify", date: d(3) });
    if (m < 4) {
      transactions.push({ accountId: credit.id, categoryId: byName["Entertainment"].id, amountCents: Math.floor(Math.random() * 6000) + 3000, type: "EXPENSE", description: "Cinema / Event", date: d(18) });
    }

    // Shopping — some months heavier
    if (m % 3 === 0) {
      transactions.push({ accountId: credit.id, categoryId: byName["Shopping"].id, amountCents: 25000, type: "EXPENSE", description: "Clothing", date: d(22) });
    }
    transactions.push({ accountId: credit.id, categoryId: byName["Shopping"].id, amountCents: 8900, type: "EXPENSE", description: "Amazon Order", date: d(14) });

    // Health
    if (m % 2 === 1) {
      transactions.push({ accountId: checking.id, categoryId: byName["Health"].id, amountCents: 12000, type: "EXPENSE", description: "Doctor Visit", date: d(16) });
    }
    transactions.push({ accountId: credit.id, categoryId: byName["Health"].id, amountCents: 3500, type: "EXPENSE", description: "Pharmacy", date: d(9) });

    // Education
    if (m === 4 || m === 1) {
      transactions.push({ accountId: checking.id, categoryId: byName["Education"].id, amountCents: 9900, type: "EXPENSE", description: "Online Course", date: d(7) });
    }

    // Savings transfer on 1st
    transactions.push({ accountId: checking.id, categoryId: byName["Other"].id, amountCents: 50000, type: "EXPENSE", description: "Transfer to Savings", date: d(1), notes: "Monthly savings" });
  }

  // Insert all transactions (no atomic balance update in seed — balance already set)
  for (const tx of transactions) {
    await prisma.transaction.create({ data: { userId: user.id, ...tx } });
  }

  console.log(`✅ Seed complete: ${transactions.length} transactions created`);
  console.log("   Login: demo@fintrack.dev / Demo@123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
