import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import { setAuthCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const prisma = getPrisma();
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    await setAuthCookie({ userId: user.id });
    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (e) {
    const err: any = e;
    console.error("Login error:", err);
    if (err?.code === "MISSING_DATABASE_URL") {
      return NextResponse.json({ error: "Missing DATABASE_URL for production. Set it in Vercel." }, { status: 503 });
    }
    if (err?.code === "P1001") {
      return NextResponse.json({ error: "Database unreachable (P1001). Check DB URL/permissions." }, { status: 503 });
    }
    if (typeof err?.message === "string" && err.message.includes("generated/prisma/client")) {
      return NextResponse.json({ error: "Prisma client missing. Ensure 'prisma generate' ran at install." }, { status: 500 });
    }
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}