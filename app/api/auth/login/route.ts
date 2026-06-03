import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validators/auth";
import { ok, err } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return err(parsed.error.issues[0].message);
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return err("Invalid email or password", 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return err("Invalid email or password", 401);
    }

    const token = await signToken({ sub: user.id, email: user.email, name: user.name });
    await setSessionCookie(token);

    return ok({ id: user.id, name: user.name, email: user.email });
  } catch {
    return err("Internal server error", 500);
  }
}
