"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { QUESTIONS } from "@/lib/surveyQuestions";
import { useRouter } from "next/navigation";

// QUESTIONS imported from shared module

export default function SurveyReviewPage() {
  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("intake_answers") : null;
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [mounted, setMounted] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const router = useRouter();
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    // Fetch auth status from server (cookie is httpOnly)
    const check = async () => {
      try {
        const res = await fetch("/api/auth/status", { cache: "no-store" });
        const data = await res.json();
        setIsAuthed(!!data.authenticated);
      } catch {
        setIsAuthed(false);
      }
    };
    check();
  }, []);

  const missingRequiredIds = useMemo(() => {
    return QUESTIONS.filter(
      (q) => q.required && !(answers[q.id] && String(answers[q.id]).trim().length > 0)
    ).map((q) => q.id);
  }, [answers]);
  const isComplete = missingRequiredIds.length === 0;

  if (!mounted) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl bg-white p-6 rounded shadow">
          <h1 className="text-2xl font-bold mb-2">Review Your Answers</h1>
          <p className="text-gray-600 mb-4">Loading your answers…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-2">Review Your Answers</h1>
        <p className="text-gray-600 mb-4">Take a moment to verify your responses. You can edit any question.</p>

        <div className="divide-y">
          {QUESTIONS.map((q, idx) => (
            <div key={q.id} className="py-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">
                  {idx + 1}. {q.label}
                  {q.required && !(answers[q.id] && String(answers[q.id]).trim().length > 0) && (
                    <span className="ml-2 inline-block px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">Required</span>
                  )}
                </p>
                <p className="text-sm mt-1">
                  {answers[q.id] && String(answers[q.id]).trim().length > 0 ? (
                    <span className="text-gray-700">{answers[q.id]}</span>
                  ) : (
                    <span className="text-red-600">No answer</span>
                  )}
                </p>
              </div>
              <Link href={`/survey/${idx + 1}`} className="px-3 py-1 rounded border text-sm">Edit</Link>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Link href={`/survey/${QUESTIONS.length}`} className="px-4 py-2 rounded border">Back</Link>
          <div className="flex gap-3 items-center">
            <button
              disabled={!isComplete || !isAuthed}
              onClick={() => router.push("/responses")}
              className={`px-4 py-2 rounded ${!isComplete || !isAuthed ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 text-white"}`}
            >
              Submit
            </button>
            <Link href="/signup" className="px-4 py-2 rounded border border-gray-300">Sign Up</Link>
            <Link href="/login" className="px-4 py-2 rounded border border-gray-300">Log In</Link>
          </div>
        </div>
        <p className="text-base text-black mt-2">
          {isAuthed ? (
            isComplete ? "All set — you can submit now." : "Please complete all required answers to submit."
          ) : (
            "Sign up or Log in to submit your answers."
          )}
        </p>
      </div>
    </main>
  );
}