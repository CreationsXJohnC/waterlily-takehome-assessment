"use client";
import { useEffect, useState } from "react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirect, setRedirect] = useState<string | null>(null);
  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && password.trim().length > 0;

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const r = params.get("redirect");
      setRedirect(r);
    } catch {}
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as any).error ?? "Signup failed");
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
      return;
    }
    // After successful signup, user is logged in (cookie set).
    // Prefer returning to the last page via ?redirect=…; otherwise, use local progress fallback.
    try {
      const raw = localStorage.getItem("intake_answers");
      const hasStarted = raw ? Object.keys(JSON.parse(raw)).length > 0 : false;
      const target = redirect || (hasStarted ? "/survey/review" : "/");
      window.location.href = target;
    } catch {
      window.location.href = redirect || "/";
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <form noValidate onSubmit={onSubmit} className="w-full max-w-md space-y-4 bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold">Create account</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onInput={(e) => setName((e.target as HTMLInputElement).value)}
            required
            autoComplete="name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            className="mt-1 w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            className="mt-1 w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
            required
            autoComplete="new-password"
          />
        </div>
        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          aria-disabled={!canSubmit || isSubmitting}
          className={`w-full py-2 rounded ${canSubmit && !isSubmitting ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600 cursor-not-allowed"}`}
        >
          {isSubmitting ? "Signing up..." : "Sign Up"}
        </button>
        <p className="text-sm text-gray-600">Already have an account? <a href="/login" className="text-blue-600">Log in</a></p>
      </form>
    </main>
  );
}