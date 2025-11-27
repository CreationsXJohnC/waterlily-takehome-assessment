import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const urlCandidates = [
      process.env.DATABASE_URL,
      process.env.POSTGRES_URL_NON_POOLING,
      process.env.POSTGRES_URL,
    ].filter((u): u is string => typeof u === "string");
    const detectedUrl = urlCandidates.find((u) => /^postgres(ql)?:\/\//.test(u)) || "";
    // Short-circuit before touching Prisma when no valid DB URL is present.
    if (!detectedUrl) {
      return NextResponse.json(
        { ok: false, code: "MISSING_DATABASE_URL", message: "No Postgres DATABASE_URL configured", datasourceUrlDetected: false },
        { status: 503 }
      );
    }
    const prisma = getPrisma();
    // Minimal query to verify connectivity and schema.
    const count = await prisma.user.count();
    return NextResponse.json({ ok: true, userCount: count, datasourceUrlDetected: Boolean(detectedUrl) });
  } catch (e: any) {
    const message = e?.message || "Unknown error";
    const code = e?.code;
    console.error("DB health error:", e);
    if (code === "MISSING_DATABASE_URL") {
      return NextResponse.json({ ok: false, code, message, datasourceUrlDetected: false }, { status: 503 });
    }
    const status = code === "P1001" ? 503 : 500;
    return NextResponse.json({ ok: false, code, message }, { status });
  }
}