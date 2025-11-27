import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { ensureSchema } from "@/lib/ensureSchema";
import { getAuthPayload } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await getAuthPayload();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await ensureSchema();
    const prisma = getPrisma();
    const data = await prisma.response.findMany({
      where: { userId: auth.userId },
      include: { answers: { include: { question: true } }, survey: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(data);
  } catch (e: any) {
    const err: any = e;
    if (err?.code === "MISSING_DATABASE_URL") {
      return NextResponse.json({ error: "Missing DATABASE_URL for production. Set it in Vercel." }, { status: 503 });
    }
    if (err?.code === "P1001") {
      return NextResponse.json({ error: "Database unreachable (P1001). Check DB URL/permissions." }, { status: 503 });
    }
    return NextResponse.json({ error: "Fetch responses failed" }, { status: 500 });
  }
}