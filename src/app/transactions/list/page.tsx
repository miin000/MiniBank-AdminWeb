"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Eye, Search } from "lucide-react";
import AdminShell from "../../components/admin-shell";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080"
).replace(/\/+$/, "");

type ApiTransaction = {
  id: number;
  transactionCode: string | null;
  fromAccountNumber: string | null;
  fromAccountName: string | null;
  toAccountNumber: string | null;
  toAccountName: string | null;
  amount: number;
  feeAmount: number | null;
  transactionType: string | null;
  status: string | null;
  createdAt: string | null;
};

type BankTransaction = {
  id: number;
  code: string;
  timestamp: string;
  createdAt: string | null;
  senderName: string;
  senderStk: string;
  receiverName: string;
  receiverStk: string;
  amount: number;
  signedAmount: number;
  status: string;
  transactionType: string;
};

const statusOptions = [
  { value: "ALL", label: "Tat ca trang thai", api: null },
  { value: "completed", label: "Thanh cong", api: "completed" },
  { value: "pending", label: "Dang xu ly", api: "pending" },
  { value: "rejected", label: "Tu choi", api: "rejected" },
  { value: "failed", label: "That bai", api: "failed" },
];

function formatVnd(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

function statusLabel(value: string) {
  switch (value.toLowerCase()) {
    case "completed":
      return "Thanh cong";
    case "pending":
    case "pending_review":
    case "pending_manager":
      return "Dang xu ly";
    case "rejected":
      return "Tu choi";
    case "failed":
      return "That bai";
    default:
      return value || "-";
  }
}

function statusTone(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === "completed") return "bg-emerald-50 text-emerald-600";
  if (normalized.startsWith("pending")) return "bg-amber-50 text-amber-600";
  if (normalized === "rejected") return "bg-purple-50 text-purple-600";
  return "bg-red-50 text-red-600";
}

function signedAmount(item: ApiTransaction) {
  const type = (item.transactionType ?? "").toLowerCase();
  if (type.startsWith("loan_disbursement")) return Math.abs(item.amount ?? 0);
  if (type.startsWith("loan_")) return -Math.abs(item.amount ?? 0);
  if (!item.fromAccountNumber && item.toAccountNumber) return Math.abs(item.amount ?? 0);
  return -Math.abs(item.amount ?? 0);
}

function toTransaction(item: ApiTransaction): BankTransaction {
  return {
    id: item.id,
    code: item.transactionCode ?? `TX-${item.id}`,
    timestamp: formatTime(item.createdAt),
    createdAt: item.createdAt,
    senderName: item.fromAccountName ?? "He thong",
    senderStk: item.fromAccountNumber ?? "-",
    receiverName: item.toAccountName ?? "He thong",
    receiverStk: item.toAccountNumber ?? "-",
    amount: item.amount ?? 0,
    signedAmount: signedAmount(item),
    status: item.status ?? "",
    transactionType: item.transactionType ?? "-",
  };
}

function bucketHour(hour: number) {
  if (hour <= 3) return "00:00";
  if (hour <= 7) return "04:00";
  if (hour <= 11) return "08:00";
  if (hour <= 15) return "12:00";
  if (hour <= 19) return "16:00";
  if (hour <= 22) return "20:00";
  return "23:59";
}

export default function TransactionsManagementPage() {
  const [token, setToken] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<BankTransaction | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activePoint, setActivePoint] = useState<{ x: number; y: number; time: string; amount: number } | null>(null);
  const itemsPerPage = 8;

  useEffect(() => {
    setToken(localStorage.getItem("adminToken"));
  }, []);

  const fetchTransactions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_BASE}/api/admin/transactions`);
      const option = statusOptions.find((item) => item.value === statusFilter);
      if (option?.api) url.searchParams.set("status", option.api);
      if (searchQuery.trim()) url.searchParams.set("q", searchQuery.trim());
      if (minAmount) url.searchParams.set("minAmount", String(Number(minAmount) * 1_000_000));
      if (maxAmount) url.searchParams.set("maxAmount", String(Number(maxAmount) * 1_000_000));

      const res = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error((await res.text()) || "Load failed");
      const data = (await res.json()) as ApiTransaction[];
      setTransactions(data.map(toTransaction));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [maxAmount, minAmount, searchQuery, statusFilter, token]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const totalItems = transactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentItems = transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const completedCount = transactions.filter((item) => item.status.toLowerCase() === "completed").length;
  const totalVolumeSum = transactions.reduce((sum, item) => sum + item.amount, 0);

  const dynamicChartData = useMemo(() => {
    const labels = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"];
    const totals = new Map(labels.map((label) => [label, 0]));
    for (const tx of transactions) {
      const date = tx.createdAt ? new Date(tx.createdAt) : null;
      if (!date) continue;
      if (Number.isNaN(date.getTime())) continue;
      const key = bucketHour(date.getHours());
      totals.set(key, (totals.get(key) ?? 0) + tx.amount / 1_000_000);
    }
    return labels.map((time) => ({ time, amount: Number((totals.get(time) ?? 0).toFixed(1)) }));
  }, [transactions]);

  const width = 1000;
  const height = 180;
  const paddingX = 50;
  const paddingY = 40;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;
  const maxAmountVal = Math.max(...dynamicChartData.map((d) => d.amount), 10);
  const points = dynamicChartData.map((d, index) => {
    const x = paddingX + (index / (dynamicChartData.length - 1)) * chartWidth;
    const y = height - paddingY - (d.amount / maxAmountVal) * chartHeight;
    return { x, y, time: d.time, amount: d.amount };
  });
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseXInSvg = ((event.clientX - rect.left) / rect.width) * width;
    const closest = points.reduce((best, point) =>
      Math.abs(point.x - mouseXInSvg) < Math.abs(best.x - mouseXInSvg) ? point : best
    );
    setActivePoint(closest);
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-6">
        <div className="rounded-xl bg-white p-6 text-sm text-gray-600">Vui long dang nhap de tiep tuc.</div>
      </div>
    );
  }

  return (
    <AdminShell title="Quan ly Giao dich" subtitle="Theo doi giao dich chuyen tien va vay von trong he thong">
      <div className="space-y-6 font-sans text-gray-800">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400">Tong giao dich</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{totalItems}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400">Thanh cong</p>
            <p className="mt-1 text-xl font-bold text-emerald-600">{completedCount}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400">Tong gia tri</p>
            <p className="mt-1 text-xl font-bold text-purple-600">{formatVnd(totalVolumeSum)}</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-700">Dong tien theo gio (trieu VND)</p>
            {loading ? <span className="text-[10px] font-bold text-blue-600">Dang tai</span> : null}
          </div>
          <div className="relative mt-4 w-full overflow-visible">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${width} ${height}`}
              className="h-auto w-full cursor-crosshair overflow-visible"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setActivePoint(null)}
            >
              <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#f3f4f6" />
              <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="#f3f4f6" />
              <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#e5e7eb" />
              <path d={linePath} fill="none" stroke="#3b82f6" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} />
              {activePoint ? (
                <line x1={activePoint.x} y1={paddingY} x2={activePoint.x} y2={height - paddingY} stroke="#3b82f6" strokeDasharray="4 4" />
              ) : null}
              {points.map((point) => (
                <circle key={point.time} cx={point.x} cy={point.y} r={activePoint?.time === point.time ? 6 : 4} fill="white" stroke="#3b82f6" strokeWidth={2} />
              ))}
            </svg>
            {activePoint ? (
              <div
                className="pointer-events-none absolute z-20 rounded-lg border border-gray-100 bg-white px-3 py-2 text-[11px] font-medium text-gray-900 shadow-xl"
                style={{ left: `${(activePoint.x / width) * 100}%`, top: `${(activePoint.y / height) * 100 - 32}%`, transform: "translateX(-50%)" }}
              >
                <div className="font-bold">{activePoint.time}</div>
                <div className="mt-0.5 whitespace-nowrap text-blue-600">{activePoint.amount}M VND</div>
              </div>
            ) : null}
          </div>
          <div className="mt-2 flex justify-between px-10 text-[11px] font-bold text-gray-400">
            {dynamicChartData.map((item) => <span key={item.time}>{item.time}</span>)}
          </div>
        </div>

        <div className="grid grid-cols-1 items-end gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600">Tim kiem</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Ma giao dich, ten, STK..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full rounded-lg border border-gray-200 bg-gray-50/50 py-1.5 pl-9 pr-3 text-xs text-gray-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="relative space-y-1">
            <label className="text-xs font-bold text-gray-600">Trang thai</label>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700"
              type="button"
            >
              <span>{statusOptions.find((item) => item.value === statusFilter)?.label}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {isDropdownOpen ? (
              <div className="absolute left-0 top-full z-30 mt-1 w-full rounded-lg border border-gray-100 bg-white py-1 text-xs shadow-xl">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setStatusFilter(option.value); setIsDropdownOpen(false); setCurrentPage(1); }}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600">Tu (trieu VND)</label>
            <input type="number" value={minAmount} onChange={(e) => { setMinAmount(e.target.value); setCurrentPage(1); }} className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600">Den (trieu VND)</label>
            <input type="number" value={maxAmount} onChange={(e) => { setMaxAmount(e.target.value); setCurrentPage(1); }} className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500" />
          </div>
        </div>

        {error ? <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Thoi gian</th>
                  <th className="px-4 py-3">Nguoi gui</th>
                  <th className="px-4 py-3">Nguoi nhan</th>
                  <th className="px-4 py-3 text-right">So tien</th>
                  <th className="px-4 py-3 text-center">Loai</th>
                  <th className="px-4 py-3 text-center">Trang thai</th>
                  <th className="px-4 py-3 text-center">Hanh dong</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-600">
                {loading ? (
                  <tr><td colSpan={8} className="py-8 text-center">Dang tai du lieu...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center">Khong co giao dich phu hop</td></tr>
                ) : currentItems.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-gray-50/40">
                    <td className="px-4 py-4 font-mono font-bold text-blue-600">{row.code}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-400">{row.timestamp}</td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-gray-800">{row.senderName}</div>
                      <div className="mt-0.5 font-mono text-[10px] text-gray-400">{row.senderStk}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-gray-800">{row.receiverName}</div>
                      <div className="mt-0.5 font-mono text-[10px] text-gray-400">{row.receiverStk}</div>
                    </td>
                    <td className={`px-4 py-4 text-right font-bold ${row.signedAmount >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {row.signedAmount >= 0 ? "+" : "-"}{formatVnd(Math.abs(row.signedAmount))}
                    </td>
                    <td className="px-4 py-4 text-center text-[11px] text-gray-500">{row.transactionType}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-block rounded px-2.5 py-0.5 text-[10px] font-bold ${statusTone(row.status)}`}>
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button onClick={() => setSelectedTx(row)} className="p-0.5 text-gray-400 hover:text-blue-600" type="button">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3 text-xs font-medium text-gray-500">
            <div>Hien thi {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} / {totalItems}</div>
            <div className="flex items-center gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => prev - 1)} className="rounded border border-gray-200 p-1 disabled:opacity-40" type="button"><ChevronLeft size={14} /></button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => prev + 1)} className="rounded border border-gray-200 p-1 disabled:opacity-40" type="button"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      {selectedTx ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold">Chi tiet giao dich</div>
                <div className="text-xs text-gray-400">{selectedTx.code}</div>
              </div>
              <button className="text-gray-400" onClick={() => setSelectedTx(null)} type="button">x</button>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-gray-700">
              <div className="flex justify-between"><span>Thoi gian</span><span className="font-medium">{selectedTx.timestamp}</span></div>
              <div className="flex justify-between"><span>Loai</span><span className="font-medium">{selectedTx.transactionType}</span></div>
              <div className="flex justify-between"><span>So tien</span><span className="font-semibold">{formatVnd(selectedTx.amount)}</span></div>
              <div className="flex justify-between"><span>Trang thai</span><span className="font-medium">{statusLabel(selectedTx.status)}</span></div>
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-xs text-gray-400">Nguoi gui</div>
                <div className="font-medium">{selectedTx.senderName} - {selectedTx.senderStk}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-xs text-gray-400">Nguoi nhan</div>
                <div className="font-medium">{selectedTx.receiverName} - {selectedTx.receiverStk}</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
