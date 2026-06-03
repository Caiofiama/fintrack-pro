import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { requireAuth, isAuthError, ok, err } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { clearSessionCookie } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    if (!user) return err("User not found", 404);
    return ok(user);
  } catch {
    return err("Internal server error", 500);
  }
}

const updateProfileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  currentPassword: z.string().min(1),
});

export async function PUT(req: NextRequest) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const { name, email, currentPassword } = parsed.data;
    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) return err("User not found", 404);

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return err("Incorrect password", 401);

    const emailTaken = await prisma.user.findFirst({ where: { email, NOT: { id: auth.userId } } });
    if (emailTaken) return err("Email already in use", 409);

    const updated = await prisma.user.update({
      where: { id: auth.userId },
      data: { name, email: email.toLowerCase().trim() },
      select: { id: true, name: true, email: true },
    });
    return ok(updated);
  } catch {
    return err("Internal server error", 500);
  }
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const { currentPassword, newPassword } = parsed.data;
    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) return err("User not found", 404);

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return err("Incorrect current password", 401);

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: auth.userId }, data: { passwordHash } });
    return ok({ success: true });
  } catch {
    return err("Internal server error", 500);
  }
}

export async function DELETE() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    await prisma.user.delete({ where: { id: auth.userId } });
    await clearSessionCookie();
    return ok({ success: true });
  } catch {
    return err("Internal server error", 500);
  }
}
