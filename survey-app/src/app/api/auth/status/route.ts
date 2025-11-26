import { NextResponse } from "next/server";
import { getAuthPayload } from "@/lib/auth";

export async function GET() {
  // Check auth via HTTP-only cookie on the server
  const payload = getAuthPayload();
  return NextResponse.json({ authenticated: !!payload });
}