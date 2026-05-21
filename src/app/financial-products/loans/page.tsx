"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "../../components/admin-shell";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/+$/, "");

type LoanProductItem = {
  id: number;
  code: string;
  name: string;
  loanType: string;
  currency: string;
  minAmount: number;
  maxAmount: number;
  minTermMonths: number;
  maxTermMonths: number;
  baseInterestRate: number;
  status: string;
};

type LoanFormState = {
  code: string;
  name: string;
  loanType: string;
  minAmount: string;
  maxAmount: string;
  minTermMonths: string;
  maxTermMonths: string;
  baseInterestRate: string;
  status: string;
};

const defaultForm: LoanFormState = {
  code: "",
  name: "",
  loanType: "PERSONAL",
  minAmount: "",
  maxAmount: "",
  minTermMonths: "",
  maxTermMonths: "",
  baseInterestRate: "",
  status: "active",
};

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return value
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return `${(value * 100).toFixed(2).replace(/\.00$/, "")}%`;
}

function toDecimalPercent(input: string) {
  const normalized = input.replace(/,/g, ".").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (Number.isNaN(parsed)) return null;
  return parsed / 100;
}

function toNumber(input: string) {
  const normalized = input.replace(/,/g, "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

function toPercentInput(value: number | null | undefined) {
  if (value === null || value === undefined) return "";
  return (value * 100).toFixed(2).replace(/\.00$/, "");
}

function formatLoanType(value: string | null | undefined) {
  if (!value) return "-";
  const normalized = value.toUpperCase();
  switch (normalized) {
    case "PERSONAL":
      return "Tieu dung ca nhan";
    case "BUSINESS":
      return "Kinh doanh";
    case "MORTGAGE":
      return "Mua nha";
    default:
      return value;
  }
}

export default function LoanProductsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<LoanProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LoanProductItem | null>(null);
  const [form, setForm] = useState<LoanFormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("adminToken");
    setToken(t);
  }, []);

  const authHeader = useMemo(() => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const fetchProducts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/financial-products/loan-products`, {
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Load failed");
      }
      const data = (await res.json()) as LoanProductItem[];
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [authHeader, token]);

  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [fetchProducts, token]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((item) =>
      [item.code, item.name, item.loanType].some((value) => value?.toLowerCase().includes(q))
    );
  }, [items, query]);

  function openCreate() {
    setEditing(null);
    setForm(defaultForm);
    setModalOpen(true);
  }

  function openEdit(item: LoanProductItem) {
    setEditing(item);
    setForm({
      code: item.code ?? "",
      name: item.name ?? "",
      loanType: item.loanType ?? "PERSONAL",
      minAmount: item.minAmount ? String(item.minAmount) : "",
      maxAmount: item.maxAmount ? String(item.maxAmount) : "",
      minTermMonths: String(item.minTermMonths ?? ""),
      maxTermMonths: String(item.maxTermMonths ?? ""),
      baseInterestRate: toPercentInput(item.baseInterestRate),
      status: item.status ?? "active",
    });
    setModalOpen(true);
  }

  function updateForm<K extends keyof LoanFormState>(key: K, value: LoanFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);

    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      loanType: form.loanType,
      currency: "VND",
      minAmount: toNumber(form.minAmount),
      maxAmount: toNumber(form.maxAmount),
      minTermMonths: Number(form.minTermMonths),
      maxTermMonths: Number(form.maxTermMonths),
      interestRateType: "FIXED",
      baseInterestRate: toDecimalPercent(form.baseInterestRate),
      processingFeeRate: 0,
      processingFeeFlat: 0,
      earlyRepaymentFeeRate: 0,
      earlyRepaymentFeeFlat: 0,
      interestCalculationMethod: "REDUCING_BALANCE",
      repaymentFrequency: "MONTHLY",
      status: form.status,
    };

    try {
      const url = editing
        ? `${API_BASE}/api/admin/financial-products/loan-products/${editing.id}`
        : `${API_BASE}/api/admin/financial-products/loan-products`;
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Save failed");
      }
      await fetchProducts();
      setModalOpen(false);
      setForm(defaultForm);
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(item: LoanProductItem) {
    if (!token) return;
    const nextStatus = item.status?.toLowerCase() === "active" ? "inactive" : "active";
    setStatusUpdatingId(item.id);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/financial-products/loan-products/${item.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
          body: JSON.stringify({ status: nextStatus }),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Update failed");
      }
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setStatusUpdatingId(null);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-6 text-[#111827]">
        <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-6">
          <h1 className="text-xl font-semibold">San pham vay</h1>
          <p className="mt-2 text-sm text-zinc-500">Vui long dang nhap de tiep tuc.</p>
          <a
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white"
            href="/login"
          >
            Di toi dang nhap
          </a>
        </div>
      </div>
    );
  }

  return (
    <AdminShell
      title="San pham vay"
      subtitle="Quan ly cac san pham vay cua ngan hang"
      actions={
        <button
          className="h-10 rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
          onClick={openCreate}
          type="button"
        >
          Tao san pham moi
        </button>
      }
    >
      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Danh sach san pham vay</div>
            <div className="text-xs text-zinc-500">Cap nhat lai suat va han muc</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3">
              <span className="text-xs text-zinc-400">🔎</span>
              <input
                className="h-8 w-52 bg-transparent text-sm outline-none"
                placeholder="Tim theo ma, ten..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              className="h-10 rounded-lg border border-black/10 px-3 text-sm"
              onClick={fetchProducts}
              type="button"
            >
              Lam moi
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full rounded-xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-400">
              Dang tai du lieu...
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-400">
              Chua co san pham nao.
            </div>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="rounded-2xl border border-black/5 bg-white shadow-sm">
                <div className="rounded-t-2xl bg-orange-600 px-4 py-3 text-white">
                  <div className="text-xs text-white/70">Ma san pham</div>
                  <div className="text-lg font-semibold">{item.code}</div>
                  <div className="text-xs text-white/80">{item.name}</div>
                </div>
                <div className="p-4 text-sm text-zinc-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Loai vay</span>
                    <span>{formatLoanType(item.loanType)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Han muc</span>
                    <span>
                      {formatCurrency(item.minAmount)} d - {formatCurrency(item.maxAmount)} d
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Ky han</span>
                    <span>
                      {item.minTermMonths} - {item.maxTermMonths} thang
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Lai suat co ban</span>
                    <span className="font-semibold text-orange-600">
                      {formatPercent(item.baseInterestRate)} / nam
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Trang thai</span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${item.status?.toLowerCase() === "active"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-rose-50 text-rose-600"
                        }`}
                    >
                      {item.status?.toLowerCase() === "active" ? "Hoat dong" : "Da khoa"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t border-black/5 px-4 py-3 text-sm">
                  <button
                    className="flex-1 rounded-lg bg-orange-50 py-2 text-orange-600 hover:bg-orange-100"
                    type="button"
                    onClick={() => openEdit(item)}
                  >
                    Sua
                  </button>
                  <button
                    className="flex-1 rounded-lg bg-rose-50 py-2 text-rose-600 hover:bg-rose-100 disabled:opacity-60"
                    type="button"
                    onClick={() => toggleStatus(item)}
                    disabled={statusUpdatingId === item.id}
                  >
                    {statusUpdatingId === item.id
                      ? "Dang xu ly..."
                      : item.status?.toLowerCase() === "active"
                        ? "Khoa"
                        : "Mo"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold">
                  {editing ? "Cap nhat san pham" : "Tao san pham vay"}
                </div>
                <div className="text-xs text-zinc-500">Cap nhat thong tin san pham</div>
              </div>
              <button
                className="text-zinc-400"
                type="button"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={saveProduct}>
              <label className="text-sm">
                Ma san pham
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-black/10 px-3 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  placeholder="VD: VAYCN"
                  value={form.code}
                  onChange={(e) => updateForm("code", e.target.value)}
                  required
                />
              </label>

              <label className="text-sm">
                Ten san pham
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-black/10 px-3 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  placeholder="Vay tieu dung"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  required
                />
              </label>

              <label className="text-sm">
                Loai vay
                <select
                  className="mt-1 h-10 w-full rounded-lg border border-black/10 px-3 outline-none"
                  value={form.loanType}
                  onChange={(e) => updateForm("loanType", e.target.value)}
                >
                  <option value="PERSONAL">Tieu dung ca nhan</option>
                  <option value="BUSINESS">Kinh doanh</option>
                  <option value="MORTGAGE">Mua nha</option>
                </select>
              </label>

              <label className="text-sm">
                Lai suat co ban (%/nam)
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-black/10 px-3 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  placeholder="12.5"
                  value={form.baseInterestRate}
                  onChange={(e) => updateForm("baseInterestRate", e.target.value)}
                  required
                />
              </label>

              <label className="text-sm">
                Han muc toi thieu (VND)
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-black/10 px-3 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  placeholder="10000000"
                  value={form.minAmount}
                  onChange={(e) => updateForm("minAmount", e.target.value)}
                  required
                />
              </label>

              <label className="text-sm">
                Han muc toi da (VND)
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-black/10 px-3 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  placeholder="500000000"
                  value={form.maxAmount}
                  onChange={(e) => updateForm("maxAmount", e.target.value)}
                  required
                />
              </label>

              <label className="text-sm">
                Ky han toi thieu (thang)
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-black/10 px-3 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  placeholder="6"
                  type="number"
                  min={1}
                  value={form.minTermMonths}
                  onChange={(e) => updateForm("minTermMonths", e.target.value)}
                  required
                />
              </label>

              <label className="text-sm">
                Ky han toi da (thang)
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-black/10 px-3 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  placeholder="36"
                  type="number"
                  min={1}
                  value={form.maxTermMonths}
                  onChange={(e) => updateForm("maxTermMonths", e.target.value)}
                  required
                />
              </label>

              <label className="text-sm">
                Trang thai
                <select
                  className="mt-1 h-10 w-full rounded-lg border border-black/10 px-3 outline-none"
                  value={form.status}
                  onChange={(e) => updateForm("status", e.target.value)}
                >
                  <option value="active">Hoat dong</option>
                  <option value="inactive">Tam dung</option>
                </select>
              </label>

              <div className="mt-2 flex items-center justify-end gap-2 md:col-span-2">
                <button
                  className="h-10 rounded-lg border border-black/10 px-4 text-sm"
                  type="button"
                  onClick={() => setModalOpen(false)}
                >
                  Huy
                </button>
                <button
                  className="h-10 rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Dang luu..." : "Luu thay doi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
