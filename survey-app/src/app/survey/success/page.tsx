"use client";
import Link from "next/link";

export default function SurveySuccessPage() {
  return (
    <main className="min-h-screen bg-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white p-6 rounded shadow text-center">
        <img
          src="/waterlily/uu2gTK3AMRaQhNfmU7CcnqIthBs.svg"
          alt="Survey completed"
          className="mx-auto mb-6 w-48 h-auto"
        />
        <h1 className="text-2xl font-bold mb-3">Thank you!</h1>
        <p className="text-gray-700 mb-6">
          Thank you for your participation in our Intake Survey, your reponses have successfully been submited!
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="px-4 py-2 rounded border">Back to Home</Link>
          <Link href="/survey/review" className="px-4 py-2 rounded border">View Responses</Link>
        </div>
      </div>
    </main>
  );
}