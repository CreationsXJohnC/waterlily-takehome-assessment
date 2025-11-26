export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-xl w-full space-y-4 text-center">
        <h1 className="text-3xl font-bold">Waterlily Survey App</h1>
        <p className="text-gray-600">Sign up or log in to complete the survey and review your responses.</p>
        <div className="flex gap-4 justify-center">
          <a href="/signup" className="px-4 py-2 rounded bg-blue-600 text-white">Sign Up</a>
          <a href="/login" className="px-4 py-2 rounded bg-gray-800 text-white">Log In</a>
        </div>
      </div>
    </main>
  );
}
