import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth";

export async function GET() {
  const auth = getAuthPayload();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let survey = await prisma.survey.findFirst({ include: { questions: true } });
  if (!survey) {
    survey = await prisma.survey.create({
      data: {
        title: "Demo Intake Survey",
        description: "Please fill in your demographic and health information.",
        questions: {
          create: [
            { label: "Full Name", type: "text", required: true },
            { label: "Age", type: "number", required: true },
            { label: "Primary Concern", type: "text", required: false },
          ],
        },
      },
      include: { questions: true },
    });
  }
  return NextResponse.json(survey);
}