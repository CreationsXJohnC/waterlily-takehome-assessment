"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SurveyConsentPage() {
  const [choice, setChoice] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    // Clear any previous answers when visiting consent
    try {
      localStorage.removeItem("intake_answers");
    } catch {}
  }, []);

  function onContinue() {
    if (choice === "Yes") {
      router.push("/survey/1");
    }
  }

  const disabled = choice !== "Yes";

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-2">Welcome to the Intake Survey</h1>
        <p className="text-gray-600 mb-4">
          We value your time. Before we begin, please let us know if you agree to participate.
        </p>

        <div className="space-y-3">
          <label className="block text-sm font-medium">Would you participate in the intake survey?</label>
          <div className="flex gap-6">
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="consent"
                  value={opt}
                  checked={choice === opt}
                  onChange={(e) => setChoice(e.target.value)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>

        {choice === "No" && (
          <p className="mt-3 text-sm text-gray-700">
            This survey requires your permission and participation in order to proceed. If you change your mind, select
            “Yes” to continue.
          </p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <span />
          <button
            onClick={onContinue}
            className={`px-4 py-2 rounded ${disabled ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 text-white"}`}
            aria-disabled={disabled}
          >
            Continue
          </button>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="flex gap-3">
            <Link href="/signup" className="px-4 py-2 rounded border border-gray-300">Sign Up</Link>
            <Link href="/login" className="px-4 py-2 rounded border border-gray-300">Log In</Link>
          </div>
          <p className="text-xs text-gray-500 mt-1">Sign in to submit your answers.</p>
        </div>
      </div>
    </main>
  );
}