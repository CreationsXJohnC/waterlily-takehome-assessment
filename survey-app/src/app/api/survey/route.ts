import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth";
import { QUESTIONS } from "@/lib/surveyQuestions";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await getAuthPayload();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const prisma = getPrisma();

    // Ensure a survey exists that matches the frontend QUESTIONS
    let survey = await prisma.survey.findFirst({
      where: { title: "Intake Survey" },
      include: { questions: true },
    });

    if (!survey) {
      survey = await prisma.survey.create({
        data: {
          title: "Intake Survey",
          description: "Intake survey capturing demographics and health information.",
          questions: {
            create: QUESTIONS.map((q) => ({
              label: q.label,
              type: q.type === "choice" ? "select" : q.type,
              required: q.required,
              options: ("options" in q && q.type === "choice") ? q.options.join(",") : null,
            })),
          },
        },
        include: { questions: true },
      });
    }

    return NextResponse.json(survey);
  } catch (e: any) {
    const err: any = e;
    if (err?.code === "MISSING_DATABASE_URL") {
      return NextResponse.json({ error: "Missing DATABASE_URL for production. Set it in Vercel." }, { status: 503 });
    }
    if (err?.code === "P1001") {
      return NextResponse.json({ error: "Database unreachable (P1001). Check DB URL/permissions." }, { status: 503 });
    }
    return NextResponse.json({ error: "Survey fetch failed" }, { status: 500 });
  }
}