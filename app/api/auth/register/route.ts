import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, setSessionCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validators/auth";
import { ok, err } from "@/lib/api-helpers";

const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", icon: "utensils", color: "#f59e0b", type: "EXPENSE" },
  { name: "Transport", icon: "car", color: "#3b82f6", type: "EXPENSE" },
  { name: "Housing", icon: "home", color: "#8b5cf6", type: "EXPENSE" },
  { name: "Health", icon: "heart", color: "#ef4444", type: "EXPENSE" },
  { name: "Entertainment", icon: "tv", color: "#ec4899", type: "EXPENSE" },
  { name: "Shopping", icon: "shopping-bag", color: "#f97316", type: "EXPENSE" },
  { name: "Education", icon: "book", color: "#06b6d4", type: "EXPENSE" },
  { name: "Other", icon: "more-horizontal", color: "#6b7280", type: "EXPENSE" },
  { name: "Salary", icon: "briefcase", color: "#10b981", type: "INCOME" },
  { name: "Freelance", icon: "laptop", color: "#14b8a6", type: "INCOME" },
] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return err(parsed.error.issues[0].message);
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return err("Email already in use", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        categories: {
          create: DEFAULT_CATEGORIES.map((cat) => ({
            ...cat,
            isDefault: true,
          })),
        },
      },
    });

    const token = await signToken({ sub: user.id, email: user.email, name: user.name });
    await setSessionCookie(token);

    return ok({ id: user.id, name: user.name, email: user.email }, undefined);
  } catch {
    return err("Internal server error", 500);
  }
}
