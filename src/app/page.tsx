"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type AdminUser = {
  id: number;
  type: string;
  username?: string | null;
  roles: string[];
};

const stats = [
  { label: "Tong so khach hang", value: "12,458", delta: "+245 trong thang", tone: "blue" },
  { label: "Cho KYC", value: "47", delta: "Can xu ly", tone: "amber" },
  { label: "Tai khoan dang hoat dong", value: "18,234", delta: "+312 hom nay", tone: "green" },
  { label: "GD trong ngay", value: "1,847", delta: "+2.31% so voi hom qua", tone: "indigo" },
  { label: "Tong tien GD hom nay", value: "d125.4B", delta: "+1.5% so voi hom qua", tone: "emerald" },
  { label: "So TK dang mo", value: "3,421", delta: "142 sap doi han", tone: "purple" },
  { label: "Khoan vay dang hoat dong", value: "892", delta: "45 sap den han", tone: "orange" },
  { label: "Ho so vay cho duyet", value: "63", delta: "12 uu tien cao", tone: "rose" },
  { label: "Yeu cau tu ho tro", value: "128", delta: "28 uu tien cao", tone: "teal" },
  { label: "Chat dang cho NV", value: "15", delta: "Thoi gian cho TB 3 phut", tone: "cyan" },
];

const toneStyles: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  green: "bg-green-50 text-green-600",
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  purple: "bg-purple-50 text-purple-600",
  orange: "bg-orange-50 text-orange-600",
  rose: "bg-rose-50 text-rose-600",
  teal: "bg-teal-50 text-teal-600",
  cyan: "bg-cyan-50 text-cyan-600",
};

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Quan ly tai khoan", href: "/staff" },
  { label: "Quan ly khach hang", href: "/" },
  { label: "Tai khoan & Giao dich", href: "/" },
  { label: "San pham tai chinh", href: "/" },
  { label: "Yeu cau thu tuc", href: "/" },
  { label: "Ho tro khach hang", href: "/" },
  { label: "Quan tri he thong", href: "/" },
];

const lineSeries = [
  { label: "00:00", value: 120 },
  { label: "04:00", value: 80 },
  { label: "08:00", value: 260 },
  { label: "12:00", value: 380 },
  { label: "16:00", value: 320 },
  { label: "20:00", value: 240 },
  { label: "23:59", value: 140 },
];

const lineValueSeries = [
  { label: "00:00", value: 8 },
  { label: "04:00", value: 6 },
  { label: "08:00", value: 18 },
  { label: "12:00", value: 30 },
  { label: "16:00", value: 26 },
  { label: "20:00", value: 18 },
  { label: "23:59", value: 12 },
];

const barSeries = [
  { label: "Tiet kiem", value: 42 },
  { label: "Vay von", value: 78 },
  { label: "Thanh toan", value: 24 },
];

function buildLinePath(values: number[], width: number, height: number) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

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

  if (!token) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background px-6">
        <main className="w-full max-w-md rounded-2xl border border-black/[.08] bg-background p-6 dark:border-white/[.145]">
          <h1 className="text-2xl font-semibold tracking-tight">MiniBank Admin</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Vui long dang nhap de tiep tuc.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              className="flex h-11 items-center justify-center rounded-lg bg-foreground text-background"
              href="/login"
            >
              Di toi dang nhap
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const linePath = buildLinePath(lineSeries.map((item) => item.value), 520, 160);
  const lineValuePath = buildLinePath(
    lineValueSeries.map((item) => item.value),
    520,
    160
  );

  return (
    <div className="flex min-h-screen w-full bg-[#f6f7fb] text-[#111827]">
      <aside className="hidden w-64 flex-col border-r border-black/5 bg-white p-5 lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white">
            MB
          </div>
          <div>
            <div className="text-sm font-semibold">Admin Dashboard</div>
            <div className="text-xs text-zinc-500">He thong quan tri noi bo</div>
          </div>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                  active ? "bg-blue-50 text-blue-700" : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-current opacity-70" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="rounded-2xl border border-black/5 bg-gradient-to-br from-blue-600 to-indigo-600 p-4 text-white">
          <div className="text-sm font-semibold">Bao cao thang</div>
          <div className="mt-2 text-xs text-white/80">
            Tong quan giao dich va hieu suat he thong.
          </div>
          <button className="mt-4 h-9 w-full rounded-lg bg-white/15 text-xs font-medium">
            Xem chi tiet
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 bg-white px-6 py-4">
          <div>
            <div className="text-lg font-semibold">Dashboard Tong quan</div>
            <div className="text-xs text-zinc-500">Cap nhat luc 14:35 30/04/2026</div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-sm">
              🔔
            </button>
            <div className="relative">
              <button
                className="flex items-center gap-3 rounded-full border border-black/10 bg-white px-3 py-1.5"
                onClick={() => setMenuOpen((prev) => !prev)}
                type="button"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                  TB
                </div>
                <div className="text-xs text-left">
                  <div className="font-semibold">{user?.username ?? "Tran Van B"}</div>
                  <div className="text-zinc-500">Toan quyen</div>
                </div>
                <span className="text-xs text-zinc-400">▾</span>
              </button>

              {menuOpen ? (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-black/10 bg-white text-sm shadow-lg">
                  <Link
                    className="flex items-center gap-2 px-4 py-2 text-zinc-700 hover:bg-zinc-50"
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                  >
                    Thong tin ca nhan
                  </Link>
                  <Link
                    className="flex items-center gap-2 px-4 py-2 text-zinc-700 hover:bg-zinc-50"
                    href="/change-password"
                    onClick={() => setMenuOpen(false)}
                  >
                    Doi mat khau
                  </Link>
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-red-50"
                    onClick={() => {
                      localStorage.removeItem("adminToken");
                      localStorage.removeItem("adminUser");
                      setToken(null);
                      setUser(null);
                      setMenuOpen(false);
                    }}
                    type="button"
                  >
                    Dang xuat
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6 px-6 py-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs text-zinc-500">{item.label}</div>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs ${
                      toneStyles[item.tone] ?? "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    ●
                  </span>
                </div>
                <div className="mt-3 text-2xl font-semibold">{item.value}</div>
                <div className="mt-1 text-xs text-zinc-500">{item.delta}</div>
              </div>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold">Giao dich theo thoi gian</div>
              <div className="text-xs text-zinc-500">So luong giao dich trong ngay</div>
              <div className="mt-4 h-48">
                <svg viewBox="0 0 520 180" className="h-full w-full">
                  <defs>
                    <linearGradient id="lineFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`${linePath} L520,180 L0,180 Z`}
                    fill="url(#lineFill)"
                    stroke="none"
                  />
                  <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="3" />
                </svg>
                <div className="mt-2 flex justify-between text-xs text-zinc-400">
                  {lineSeries.map((item) => (
                    <span key={item.label}>{item.label}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold">Gia tri giao dich theo thoi gian</div>
              <div className="text-xs text-zinc-500">Tong tien giao dich (ty VND)</div>
              <div className="mt-4 h-48">
                <svg viewBox="0 0 520 180" className="h-full w-full">
                  <defs>
                    <linearGradient id="lineFill2" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`${lineValuePath} L520,180 L0,180 Z`}
                    fill="url(#lineFill2)"
                    stroke="none"
                  />
                  <path d={lineValuePath} fill="none" stroke="#10b981" strokeWidth="3" />
                </svg>
                <div className="mt-2 flex justify-between text-xs text-zinc-400">
                  {lineValueSeries.map((item) => (
                    <span key={item.label}>{item.label}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold">Hieu suat san pham</div>
            <div className="text-xs text-zinc-500">Doanh thu theo san pham (ty VND)</div>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {barSeries.map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-3">
                  <div className="flex h-28 w-full items-end rounded-xl bg-zinc-100">
                    <div
                      className="w-full rounded-xl bg-blue-500"
                      style={{ height: `${item.value}%` }}
                    />
                  </div>
                  <div className="text-xs text-zinc-500">{item.label}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold">Yeu cau can xu ly</div>
              <div className="mt-4 space-y-3 text-xs text-zinc-600">
                <div className="flex items-center justify-between">
                  <span>Mo tai khoan moi</span>
                  <span className="font-semibold text-zinc-800">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mo khoa giao dich</span>
                  <span className="font-semibold text-zinc-800">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Yeu cau ho tro nhanh</span>
                  <span className="font-semibold text-zinc-800">16</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold">Hoat dong gan day</div>
              <div className="mt-4 space-y-3 text-xs text-zinc-600">
                <div className="flex items-center justify-between">
                  <span>Dang duyet ho so vay</span>
                  <span className="text-zinc-400">2 phut truoc</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cap nhat han muc</span>
                  <span className="text-zinc-400">10 phut truoc</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dong bo he thong</span>
                  <span className="text-zinc-400">30 phut truoc</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold">Thong bao</div>
              <div className="mt-4 space-y-3 text-xs text-zinc-600">
                <div>Cap nhat tu dong luc 18:00.</div>
                <div>He thong dang hoat dong on dinh.</div>
                <div>Mo luong ho tro trong gio cao diem.</div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
