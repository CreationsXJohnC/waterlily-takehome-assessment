import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const auth = await getAuthPayload();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const prisma = getPrisma();
    const { surveyId, answers } = await req.json();
    if (!surveyId || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const response = await prisma.response.create({
      data: {
        surveyId,
        userId: auth.userId,
        answers: {
          create: answers.map((a: { questionId: number; value: string }) => ({
            questionId: a.questionId,
            value: String(a.value ?? ""),
          })),
        },
      },
    });
    return NextResponse.json({ id: response.id });
  } catch (e: any) {
    const err: any = e;
    if (err?.code === "MISSING_DATABASE_URL") {
      return NextResponse.json({ error: "Missing DATABASE_URL for production. Set it in Vercel." }, { status: 503 });
    }
    if (err?.code === "P1001") {
      return NextResponse.json({ error: "Database unreachable (P1001). Check DB URL/permissions." }, { status: 503 });
    }
    return NextResponse.json({ error: "Submit failed" }, { status: 500 });
  }
}