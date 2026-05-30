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

type NavItem = {
  label: string;
  href: string;
  isDropdown?: boolean;
  subItems?: { label: string; href: string }[];
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/" },
  {
    label: "Quan ly khach hang",
    href: "#",
    isDropdown: true,
    subItems: [
      { label: "Danh sach khach hang", href: "/customers" },
      { label: "Kiem duyet KYC", href: "/customers/kyc" },
      { label: "Tai lieu khach hang", href: "/customers/documents" },

    ],
  },
  {
    label: "Tai khoan & Giao dich",
    href: "#",
    isDropdown: true,
    subItems: [
      { label: "Tai khoan ngan hang", href: "/transactions/bank-accounts" },
      { label: "Giao dich", href: "/transactions/list" },
      { label: "Bien dong so du", href: "/transactions/balance-fluctuations" },

      { label: "Phan loai giao dich", href: "/transactions/classification" },
      { label: "GD lon cho duyet", href: "/transactions/large-approval" },


    ],
  },
  {
    label: "San pham tai chinh",
    href: "#",
    isDropdown: true,
    subItems: [
      { label: "San pham tiet kiem", href: "/financial-products/savings" },
      { label: "Bac lai suat tiet kiem", href: "/financial-products/savings/tiers" },
      { label: "So tiet kiem", href: "/financial-products/savings/accounts" },
      { label: "Yeu cau tat toan so", href: "/financial-products/savings/closure-requests" },
      { label: "San pham vay", href: "/financial-products/loans" },
      { label: "Bac lai suat vay", href: "/financial-products/loans/tiers" },
      { label: "Ho so vay", href: "/financial-products/loans/applications" },
      { label: "Khoan vay", href: "/financial-products/loans/contracts" },
      { label: "Lich tra no", href: "/financial-products/loans/repayments" },
    ],
  },
  {
    label: "Yeu cau thu tuc",
    href: "#",
    isDropdown: true,
    subItems: [
      { label: "Tat ca yeu cau", href: "/requests" },
      { label: "Yeu cau nang han muc", href: "/requests/limits" },
      { label: "Yeu cau doi thong tin", href: "/requests/profile" },
    ],
  },
  { label: "Ho tro khach hang", href: "/" },
  {
    label: "Hợp đồng",
    href: "#",
    isDropdown: true,
    subItems: [
      { label: "Mẫu hợp đồng", href: "/contracts" },
      { label: "Hợp đồng đã gửi", href: "/contracts/list" },
    ],
  },
  {
    label: "Quan tri he thong",
    href: "#",
    isDropdown: true,
    subItems: [
      { label: "Nhan vien", href: "/staff" },
      { label: "Vai tro", href: "/system/roles" },
      { label: "Nhat ky he thong", href: "/system/audit" },
    ],
  },
];

type AdminShellProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  onLogout?: () => void;
};

export default function AdminShell({
  title,
  subtitle,
  actions,
  children,
  onLogout,
}: AdminShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const u = localStorage.getItem("adminUser");
    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    if (onLogout) {
      onLogout();
      return;
    }
    window.location.href = "/login";
  };

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

        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            item.subItems?.some((sub) => pathname === sub.href);

          if (item.isDropdown) {
            return (
              <div key={item.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between px-3 py-2 text-sm font-bold text-zinc-800">
                  <span>{item.label}</span>
                  <span className="text-[10px] opacity-40">▼</span>
                </div>

                <div className="ml-2 flex flex-col gap-1 border-l border-zinc-100 pl-3">
                  {item.subItems?.map((sub) => (
                    <Link
                      key={sub.label}
                      href={sub.href}
                      className={`block rounded-lg px-3 py-2 text-sm transition ${pathname === sub.href
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
                        }`}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`block rounded-xl px-3 py-2 text-sm transition ${active
                ? "bg-blue-50 text-blue-700 font-bold"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800"
                }`}
            >
              {item.label}
            </Link>
          );
        })}

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
            <div className="text-lg font-semibold">{title}</div>
            {subtitle ? (
              <div className="text-xs text-zinc-500">{subtitle}</div>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {actions}
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
                  {user?.username?.[0]?.toUpperCase() ?? "TB"}
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
                    onClick={handleLogout}
                    type="button"
                  >
                    Dang xuat
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
