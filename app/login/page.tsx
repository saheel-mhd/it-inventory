"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "~/app/components/ui/button";
import { APP_DESCRIPTION, APP_NAME } from "~/lib/app-brand";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.message || "Login failed.");
        return;
      }

      router.replace("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border surface-card p-6 shadow-sm">
          <div className="rounded-xl border border-gray-200 bg-gray-100 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">
              {APP_NAME}
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
              Asset custody with clear accountability
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {APP_DESCRIPTION}
            </p>
            <div className="mt-4 grid gap-2 text-sm text-gray-700 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                Track assignments
              </div>
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                Manage returns
              </div>
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                Review audit history
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-bold tracking-tight text-gray-900">
              Admin sign in
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Use your admin account to access the dashboard and protected actions.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Authorized administrators only. Activity may be recorded for accountability.
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">
          Copyright {new Date().getFullYear()} {APP_NAME}
        </p>
      </div>
    </main>
  );
}
