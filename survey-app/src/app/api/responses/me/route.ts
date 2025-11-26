import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAuthPayload();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await prisma.response.findMany({
    where: { userId: auth.userId },
    include: { answers: { include: { question: true } }, survey: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(data);
}