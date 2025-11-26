"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Home() {
  const [choice, setChoice] = useState<string>("");
  const [isAuthed, setIsAuthed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Do not clear answers on home; preserve any progress

  function onContinue() {
    if (choice === "Yes") {
      router.push("/survey/1");
    }
  }

  const disabled = choice !== "Yes";

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

  async function onLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      try { localStorage.removeItem("intake_answers"); } catch {}
      setIsAuthed(false);
    } catch {
      // swallow
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center bg-gray-50 p-6"
      style={{
        backgroundImage: "url('/waterlily/z1gNc8NEnmnRGfmqnP2fUZIDFs.svg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="relative max-w-xl w-full space-y-6 text-center bg-white border rounded shadow p-6">
        {isAuthed && (
          <button
            onClick={onLogout}
            className="absolute top-4 right-4 text-sm text-blue-600 hover:underline"
            aria-label="Log Out"
          >
            Log Out
          </button>
        )}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Waterlily Intake Survey</h1>
          <p className="text-sm text-gray-600">Sign up or Log in to submit your responses.</p>
        </div>
        <div className="flex gap-4 justify-center">
          {isAuthed ? (
            <span className="px-4 py-2 rounded border border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed">Logged In</span>
          ) : (
            <>
              <Link href={`/signup?redirect=${encodeURIComponent(pathname)}`} className="px-4 py-2 rounded bg-blue-600 text-white">Sign Up</Link>
              <Link href={`/login?redirect=${encodeURIComponent(pathname)}`} className="px-4 py-2 rounded bg-gray-800 text-white">Log In</Link>
            </>
          )}
        </div>
        <div className="mt-10 text-center space-y-3">
          <label className="block text-lg font-medium text-center">Would you participate in the intake survey?</label>
          <div className="flex gap-6 justify-center">
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="consent"
                  value={opt}
                  checked={choice === opt}
                  onChange={(e) => setChoice(e.target.value)}
                  className="sr-only"
                />
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 border rounded ${
                    choice === opt ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-400"
                  }`}
                  aria-hidden="true"
                >
                  {choice === opt ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : null}
                </span>
                <span>{opt}</span>
              </label>
            ))}
          </div>
          {choice === "No" && (
            <p className="text-sm text-gray-700">
              This survey requires your permission and participation in order to proceed. If you change your mind, select “Yes” to continue.
            </p>
          )}
          <div className="flex justify-center">
            <button
              onClick={onContinue}
              className={`px-4 py-2 rounded ${disabled ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 text-white"}`}
              aria-disabled={disabled}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
