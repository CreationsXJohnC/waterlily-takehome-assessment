import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Minimal query to verify connectivity and schema.
    const count = await prisma.user.count();
    const urlCandidates = [
      process.env.DATABASE_URL,
      process.env.POSTGRES_URL_NON_POOLING,
      process.env.POSTGRES_URL,
    ].filter((u): u is string => typeof u === "string");
    const url = urlCandidates.find((u) => /^postgres(ql)?:\/\//.test(u)) || "";
    return NextResponse.json({ ok: true, userCount: count, datasourceUrlDetected: Boolean(url) });
  } catch (e: any) {
    const message = e?.message || "Unknown error";
    const code = e?.code;
    console.error("DB health error:", e);
    const status = code === "P1001" ? 503 : 500;
    return NextResponse.json({ ok: false, code, message }, { status });
  }
}