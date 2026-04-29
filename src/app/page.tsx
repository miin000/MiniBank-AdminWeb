"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AdminUser = {
  id: number;
  type: string;
  username?: string | null;
  roles: string[];
};

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("adminToken");
    setToken(t);
    const u = localStorage.getItem("adminUser");
    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch {
        setUser(null);
      }
    }
  }, []);

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-6">
      <main className="w-full max-w-md rounded-2xl border border-black/[.08] bg-background p-6 dark:border-white/[.145]">
        <h1 className="text-2xl font-semibold tracking-tight">MiniBank Admin</h1>

        {token ? (
          <div className="mt-4 flex flex-col gap-3">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Logged in as <span className="font-medium">{user?.username}</span>
            </div>
            <button
              className="h-11 rounded-lg border border-black/[.08] bg-background text-foreground dark:border-white/[.145]"
              onClick={() => {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminUser");
                setToken(null);
                setUser(null);
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Please sign in to continue.
            </p>
            <Link
              className="flex h-11 items-center justify-center rounded-lg bg-foreground text-background"
              href="/login"
            >
              Go to login
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
