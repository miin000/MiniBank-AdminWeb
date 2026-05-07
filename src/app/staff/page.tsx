"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminShell from "../components/admin-shell";

type AdminUser = {
  id: number;
  type: string;
  username?: string | null;
  roles: string[];
};

type StaffItem = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  status: string;
  roles: string[];
  createdAt: string;
};

type StaffForm = {
  fullName: string;
  email: string;
  username: string;
  password: string;
  roleCode: string;
  permissions: string[];
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/+$/, "");

const roleOptions = [
  { code: "CUSTOMER_SUPPORT", label: "Staff - Xu ly ho so" },
  { code: "OPS", label: "Staff - Van hanh" },
  { code: "TEAM_LEAD", label: "Truong nhom" },
];

const permissionOptions = [
  { code: "DASHBOARD", label: "Tong quan" },
  { code: "CUSTOMER", label: "Quan ly Khach hang" },
  { code: "STAFF", label: "Quan ly Nhan vien" },
  { code: "PROCEDURE", label: "Xu ly Thu tuc" },
  { code: "LIMIT", label: "Quan ly Han muc" },
  { code: "TRANSACTION", label: "Quan ly Giao dich" },
  { code: "SAVING", label: "Quan ly So tiet kiem" },
  { code: "LOAN", label: "Quan ly Vay & No" },
  { code: "CHAT", label: "Live Chat" },
  { code: "AUDIT", label: "Nhat ky he thong" },
];

const defaultForm: StaffForm = {
  fullName: "",
  email: "",
  username: "",
  password: "",
  roleCode: roleOptions[0].code,
  permissions: [],
};

export default function StaffPage() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<StaffForm>(defaultForm);
  const [saving, setSaving] = useState(false);

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

  const authHeader = useMemo(() => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  async function fetchStaff(search?: string) {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const qs = search ? `?q=${encodeURIComponent(search)}` : "";
      const res = await fetch(`${API_BASE}/api/admin/staff${qs}`, {
        headers: {
          ...authHeader,
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Load failed");
      }
      const data = (await res.json()) as StaffItem[];
      setStaff(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      fetchStaff();
    }
  }, [token]);

  function updateForm<K extends keyof StaffForm>(key: K, value: StaffForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function togglePermission(code: string) {
    setForm((prev) => {
      const exists = prev.permissions.includes(code);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((item) => item !== code)
          : [...prev.permissions, code],
      };
    });
  }

  async function createStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);

    const roles = Array.from(
      new Set([form.roleCode, ...form.permissions].filter(Boolean))
    );

    try {
      const res = await fetch(`${API_BASE}/api/admin/staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          roles,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Create failed");
      }
      await fetchStaff(query);
      setModalOpen(false);
      setForm(defaultForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-6 text-[#111827]">
        <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-6">
          <h1 className="text-xl font-semibold">Quan ly tai khoan</h1>
          <p className="mt-2 text-sm text-zinc-500">Vui long dang nhap de tiep tuc.</p>
          <Link
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white"
            href="/login"
          >
            Di toi dang nhap
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminShell
        title="Quan ly tai khoan"
        subtitle="Theo doi tai khoan va vai tro"
        actions={
          <button
            className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            onClick={() => setModalOpen(true)}
            type="button"
          >
            Them nhan vien
          </button>
        }
        onLogout={() => {
          setToken(null);
          setUser(null);
        }}
      >
        <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Danh sách tài khoản</div>
              <div className="text-xs text-zinc-500">Theo dõi trạng thái tài khoản và vai trò</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3">
                <span className="text-xs text-zinc-400">🔎</span>
                <input
                  className="h-8 w-52 bg-transparent text-sm outline-none"
                  placeholder="Tìm theo tên, email..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button
                className="h-10 rounded-lg border border-black/10 px-3 text-sm"
                onClick={() => fetchStaff(query)}
                type="button"
              >
                Tìm
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-4 overflow-hidden rounded-xl border border-black/5">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs text-zinc-500">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Ho ten</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Vai tro</th>
                  <th className="px-4 py-3">Trang thai</th>
                  <th className="px-4 py-3">Ngay tao</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-zinc-400" colSpan={6}>
                      Dang tai...
                    </td>
                  </tr>
                ) : staff.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-zinc-400" colSpan={6}>
                      Chua co tai khoan nao.
                    </td>
                  </tr>
                ) : (
                  staff.map((item) => (
                    <tr key={item.id} className="border-t border-black/5 hover:bg-zinc-50/70">
                      <td className="px-4 py-3 text-zinc-500">#{item.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.fullName}</div>
                        <div className="text-xs text-zinc-400">{item.username}</div>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{item.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {item.roles?.length ? (
                            item.roles.map((role) => (
                              <span
                                key={role}
                                className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-600"
                              >
                                {role}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-zinc-400">Không có</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            item.status?.toLowerCase() === "active"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {item.status?.toLowerCase() === "active" ? "Hoạt động" : "Đã khóa"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </AdminShell>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold">Thêm nhân viên mới</div>
                <div className="text-xs text-zinc-500">Tạo tài khoản cho nhân viên hỗ trợ</div>
              </div>
              <button
                className="text-zinc-400"
                type="button"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={createStaff}>
              <label className="text-sm">
                Họ tên
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-black/10 px-3 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="Nhập họ tên"
                  value={form.fullName}
                  onChange={(e) => updateForm("fullName", e.target.value)}
                  required
                />
              </label>

              <label className="text-sm">
                Email
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-black/10 px-3 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="email@bank.vn"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  required
                />
              </label>

              <label className="text-sm">
                Tên đăng nhập
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-black/10 px-3 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="ten.dang.nhap"
                  value={form.username}
                  onChange={(e) => updateForm("username", e.target.value)}
                  required
                />
              </label>

              <label className="text-sm">
                Mật khẩu
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-black/10 px-3 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  type="password"
                  value={form.password}
                  onChange={(e) => updateForm("password", e.target.value)}
                  required
                />
              </label>

              <label className="text-sm">
                Vai trò
                <select
                  className="mt-1 h-10 w-full rounded-lg border border-black/10 px-3 outline-none"
                  value={form.roleCode}
                  onChange={(e) => updateForm("roleCode", e.target.value)}
                >
                  {roleOptions.map((role) => (
                    <option key={role.code} value={role.code}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="text-sm md:col-span-2">
                Phân quyền
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {permissionOptions.map((permission) => (
                    <label key={permission.code} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={form.permissions.includes(permission.code)}
                        onChange={() => togglePermission(permission.code)}
                      />
                      {permission.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-2 flex items-center justify-end gap-2 md:col-span-2">
                <button
                  className="h-10 rounded-lg border border-black/10 px-4 text-sm"
                  type="button"
                  onClick={() => setModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Đang tạo..." : "Thêm nhân viên"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
