import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth";

export async function POST(req: Request) {
  const auth = getAuthPayload();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
}