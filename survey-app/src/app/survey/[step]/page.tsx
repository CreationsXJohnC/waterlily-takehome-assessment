"use client";
import { useEffect, useMemo, useState, use as usePromise } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { QUESTIONS, ChoiceQuestion } from "@/lib/surveyQuestions";

// QUESTIONS imported from shared module

function usePersistedAnswers() {
  const key = "intake_answers";
  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(answers));
    } catch {}
  }, [answers]);
  return [answers, setAnswers] as const;
}

export default function SurveyStepPage({ params }: { params: Promise<{ step: string }> }) {
  const { step } = usePromise(params);
  const stepIndex = Math.max(0, Math.min(QUESTIONS.length - 1, (parseInt(step, 10) || 1) - 1));
  const question = useMemo(() => QUESTIONS[stepIndex], [stepIndex]);
  const [answers, setAnswers] = usePersistedAnswers();
  const [status, setStatus] = useState<string>("");
  const [isAuthed, setIsAuthed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  function setAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  }

  function nextHref(): string | null {
    if (stepIndex === QUESTIONS.length - 1) return null;
    return `/survey/${stepIndex + 2}`;
  }

  function prevHref(): string | null {
    if (stepIndex === 0) return "/"; // go back to home consent
    return `/survey/${stepIndex}`;
  }

  async function onSubmitFinal() {
    // Navigate to review screen to let user confirm answers.
    router.push("/survey/review");
  }

  const currentValue = answers[question.id] ?? "";
  const showConsentExit = question.id === 1 && currentValue === "No";

  useEffect(() => {
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

  return (
    <main className="min-h-screen bg-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-2">Intake Survey</h1>
        <p className="text-gray-600 mb-4">Question {stepIndex + 1} of {QUESTIONS.length}</p>

        <div className="space-y-3">
          <label className="block text-sm font-medium">{question.label}</label>

          {question.type === "choice" ? (
            <div className="flex flex-col gap-2">
              {(question as ChoiceQuestion).options.map((opt) => (
                <label key={opt} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    value={opt}
                    checked={currentValue === opt}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          ) : (
            <input
              type={question.type}
              required={question.required}
              className="mt-1 w-full border rounded px-3 py-2 placeholder-gray-400"
              placeholder={question.id === 6 ? "e.g., 55000" : undefined}
              value={currentValue}
              onChange={(e) => setAnswer(e.target.value)}
            />
          )}
          {question.id === 3 && (
            <p className="text-xs text-gray-500 mt-1">Units: pounds (lbs)</p>
          )}
          {question.id === 6 && (
            <p className="text-xs text-gray-500 mt-1">Currency: US dollars ($)</p>
          )}
        </div>

        {showConsentExit && (
          <p className="mt-3 text-sm text-gray-600">You chose not to participate. You can exit the survey.</p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div>
            {prevHref() ? (
              <Link href={prevHref()!} className="px-4 py-2 rounded border">Back</Link>
            ) : (
              <span className="px-4 py-2 rounded border opacity-50">Back</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {stepIndex < QUESTIONS.length - 1 ? (
              <Link
                href={nextHref()!}
                className={`px-4 py-2 rounded ${question.required && !currentValue ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 text-white"}`}
                aria-disabled={question.required && !currentValue}
              >
                Next
              </Link>
            ) : (
              <button
                onClick={onSubmitFinal}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Finish
              </button>
            )}
          </div>
        </div>

        {status && <p className="mt-3 text-sm text-gray-600">{status}</p>}

        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="flex gap-3">
            {isAuthed ? (
              <span className="px-4 py-2 rounded border border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed">Logged In</span>
            ) : (
              <>
                <Link href={`/signup?redirect=${encodeURIComponent(pathname)}`} className="px-4 py-2 rounded border border-gray-300">Sign Up</Link>
                <Link href={`/login?redirect=${encodeURIComponent(pathname)}`} className="px-4 py-2 rounded border border-gray-300">Log In</Link>
              </>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">{isAuthed ? "You are logged in." : "Sign in to submit your answers."}</p>
        </div>
      </div>
    </main>
  );
}