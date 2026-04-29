"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export default function AdminRegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, fullName, password }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Register failed");
      }

      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Register failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl border border-black/[.08] bg-background p-6 dark:border-white/[.145]">
        <h1 className="text-2xl font-semibold tracking-tight">Admin Register</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Create an admin account with username.
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Username</span>
            <input
              className="h-11 rounded-lg border border-black/[.12] bg-background px-3 outline-none focus:border-black/30 dark:border-white/[.18] dark:focus:border-white/30"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Email</span>
            <input
              className="h-11 rounded-lg border border-black/[.12] bg-background px-3 outline-none focus:border-black/30 dark:border-white/[.18] dark:focus:border-white/30"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Full name</span>
            <input
              className="h-11 rounded-lg border border-black/[.12] bg-background px-3 outline-none focus:border-black/30 dark:border-white/[.18] dark:focus:border-white/30"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Password</span>
            <input
              className="h-11 rounded-lg border border-black/[.12] bg-background px-3 outline-none focus:border-black/30 dark:border-white/[.18] dark:focus:border-white/30"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>

          {error ? (
            <div className="rounded-lg border border-black/[.08] bg-zinc-50 p-3 text-sm text-zinc-800 dark:border-white/[.145] dark:bg-black dark:text-zinc-200">
              {error}
            </div>
          ) : null}

          <button
            className="h-11 rounded-lg bg-foreground text-background disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create account"}
          </button>

          <button
            type="button"
            className="h-11 rounded-lg border border-black/[.08] bg-background text-foreground dark:border-white/[.145]"
            onClick={() => router.push("/login")}
          >
            Back to login
          </button>
        </form>
      </div>
    </div>
  );
}
