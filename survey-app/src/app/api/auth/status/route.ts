import { NextResponse } from "next/server";
import { getAuthPayload } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await getAuthPayload();
    if (!payload) return NextResponse.json({ authenticated: false });
    return NextResponse.json({ authenticated: true, userId: payload.userId });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}