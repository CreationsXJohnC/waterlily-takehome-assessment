import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import { setAuthCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const prisma = getPrisma();
    const { email, password, name } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash, name } });
    await setAuthCookie({ userId: user.id });
    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (e) {
    const err: any = e;
    console.error("Signup error:", err);
    if (err?.code === "MISSING_DATABASE_URL") {
      return NextResponse.json({ error: "Missing DATABASE_URL for production. Set it in Vercel." }, { status: 503 });
    }
    // Surface specific causes to aid debugging without leaking sensitive info.
    if (err?.code === "P1001") {
      return NextResponse.json({ error: "Database unreachable (P1001). Check DB URL/permissions." }, { status: 503 });
    }
    if (err?.code === "P2021" || /Table .* does not exist/.test(String(err?.message || ""))) {
      return NextResponse.json({ error: "Database schema missing tables. Ensure `prisma db push` ran against production DB." }, { status: 500 });
    }
    if (err?.code === "P2002") {
      // Unique constraint; can happen due to race.
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }
    if (typeof err?.message === "string" && err.message.includes("generated/prisma/client")) {
      return NextResponse.json({ error: "Prisma client missing. Ensure 'prisma generate' ran at install." }, { status: 500 });
    }
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}