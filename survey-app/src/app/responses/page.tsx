"use client";
import { useEffect, useState } from "react";

type Answer = { id: number; value: string; question: { label: string } };
type ResponseItem = { id: number; createdAt: string; survey: { title: string }; answers: Answer[] };

export default function ResponsesPage() {
  const [items, setItems] = useState<ResponseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/responses/me").then(async (r) => {
      setLoading(false);
      if (!r.ok) {
        window.location.href = "/login?redirect=/responses";
        return;
      }
      setItems(await r.json());
    });
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login?m=signedout";
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Your Responses</h1>
          <div className="flex gap-3">
            <a href="/survey" className="px-3 py-2 rounded bg-blue-600 text-white">Go to Survey</a>
            <button onClick={signOut} className="px-3 py-2 rounded bg-gray-800 text-white">Sign Out</button>
          </div>
        </div>

        {loading ? (
          <p>Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-gray-600">You haven’t submitted any responses yet.</p>
        ) : (
          <ul className="space-y-4">
            {items.map((res) => (
              <li key={res.id} className="bg-white rounded shadow p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{res.survey.title}</h2>
                  <span className="text-sm text-gray-600">{new Date(res.createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-2 space-y-2">
                  {res.answers.map((a) => (
                    <div key={a.id} className="text-sm">
                      <span className="font-medium">{a.question.label}: </span>
                      <span className="text-gray-700">{a.value}</span>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}