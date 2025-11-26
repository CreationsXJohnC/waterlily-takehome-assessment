"use client";
import { useEffect, useState } from "react";

type Question = { id: number; label: string; type: string; required: boolean };
type Survey = { id: number; title: string; description: string; questions: Question[] };

export default function SurveyPage() {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    fetch("/api/survey").then(async (r) => {
      if (r.ok) setSurvey(await r.json());
      else window.location.href = "/login?redirect=/survey";
    });
  }, []);

  function setAnswer(id: number, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!survey) return;
    const payload = {
      surveyId: survey.id,
      answers: survey.questions.map((q) => ({ questionId: q.id, value: answers[q.id] ?? "" })),
    };
    const res = await fetch("/api/survey/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setStatus("Submitted successfully");
      setAnswers({});
    } else {
      setStatus("Submission failed");
    }
  }

  if (!survey) return <main className="min-h-screen flex items-center justify-center">Loading…</main>;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold">{survey.title}</h1>
        <p className="text-gray-600 mb-4">{survey.description}</p>
        <form className="space-y-4" onSubmit={onSubmit}>
          {survey.questions.map((q) => (
            <div key={q.id}>
              <label className="block text-sm font-medium">{q.label}</label>
              <input
                type={q.type === "number" ? "number" : "text"}
                required={q.required}
                className="mt-1 w-full border rounded px-3 py-2"
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
              />
            </div>
          ))}
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Submit</button>
          {status && <p className="text-sm text-gray-600">{status}</p>}
        </form>
        <div className="mt-4">
          <a href="/responses" className="text-blue-600">View your submitted responses</a>
        </div>
      </div>
    </main>
  );
}