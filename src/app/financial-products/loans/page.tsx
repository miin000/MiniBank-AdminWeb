"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, PlusCircle, Search, HelpCircle } from "lucide-react";
import AdminShell from "../../components/admin-shell";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080"
).replace(/\/+$/, "");

// Khớp chính xác với cấu trúc LoanProductItem trong AdminFinancialProductController.java
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

const statusOptions = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "active", label: "Đang hoạt động (Active)" },
  { value: "inactive", label: "Tạm ngưng (Inactive)" },
];

function formatVND(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function LoanProductsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [products, setProducts] = useState<LoanProductItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States cho Form Thêm gói sản phẩm vay mới
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loanType, setLoanType] = useState("PERSONAL");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [minTermMonths, setMinTermMonths] = useState("");
  const [maxTermMonths, setMaxTermMonths] = useState("");
  const [baseInterestRate, setBaseInterestRate] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem("adminToken"));
  }, []);

  // Gọi API lấy danh sách gói vay
  const fetchLoanProducts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/financial-products/loan-products`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error((await res.text()) || "Không thể tải danh sách sản phẩm vay");
      setProducts((await res.json()) as LoanProductItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi kết nối API");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchLoanProducts();
  }, [fetchLoanProducts]);

  // Gửi dữ liệu tạo mới lên Backend (Khớp LoanProductUpsertRequest)
  const handleCreateLoanProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/financial-products/loan-products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code,
          name,
          loanType,
          currency: "VND",
          minAmount: parseFloat(minAmount),
          maxAmount: parseFloat(maxAmount),
          minTermMonths: parseInt(minTermMonths),
          maxTermMonths: parseInt(maxTermMonths),
          interestRateType: "FIXED",
          baseInterestRate: parseFloat(baseInterestRate),
          status: "active",
        }),
      });

      if (res.ok) {
        setShowCreateForm(false);
        setCode("");
        setName("");
        setMinAmount("");
        setMaxAmount("");
        setMinTermMonths("");
        setMaxTermMonths("");
        setBaseInterestRate("");
        fetchLoanProducts(); // Tải lại bảng dữ liệu
      } else {
        const errMsg = await res.text();
        alert(`Lỗi từ hệ thống: ${errMsg}`);
      }
    } catch (err) {
      console.error(err);
      alert("Không thể kết nối đến máy chủ Backend.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Cập nhật trạng thái Active/Inactive nhanh qua API PatchMapping
  const handleToggleStatus = async (id: number, currentStatus: string) => {
    if (!token) return;
    const nextStatus = currentStatus.toLowerCase() === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`${API_BASE}/api/admin/financial-products/loan-products/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchLoanProducts();
      }
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
    }
  };

  // Bộ lọc Client-side tìm kiếm
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "ALL" || item.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [products, searchQuery, statusFilter]);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-6">
        <div className="rounded-xl bg-white p-6 text-sm text-gray-600 shadow">
          Vui lòng đăng nhập tài khoản Admin/Staff để tiếp tục quản trị sản phẩm tài chính.
        </div>
      </div>
    );
  }

  return (
    <AdminShell title="Gói sản phẩm vay" subtitle="Cấu hình danh mục, hạn mức và lãi suất cơ sở của dịch vụ tín dụng">
      <div className="space-y-6 font-sans text-gray-800">

        {/* Tiêu đề & Nút bật tắt Form thêm nhanh */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-bold text-gray-900">Danh sách sản phẩm vay hiện hành</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-700"
          >
            <PlusCircle size={14} /> {showCreateForm ? "Đóng trình tạo" : "Thêm gói vay mới"}
          </button>
        </div>

        {/* FORM THÊM GÓI SẢN PHẨM MỚI */}
        {showCreateForm && (
          <form onSubmit={handleCreateLoanProduct} className="grid grid-cols-1 gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:grid-cols-2 md:grid-cols-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Mã gói vay</label>
              <input type="text" required placeholder="Ví dụ: VMN01" value={code} onChange={(e) => setCode(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-orange-500 bg-gray-50/50" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Tên gói sản phẩm</label>
              <input type="text" required placeholder="Vay mua nhà ưu đãi" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-orange-500 bg-gray-50/50" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Loại hình vay</label>
              <select value={loanType} onChange={(e) => setLoanType(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-gray-200 px-2 text-xs outline-none focus:border-orange-500 bg-gray-50/50">
                <option value="PERSONAL">Vay cá nhân (Personal)</option>
                <option value="BUSINESS">Vay doanh nghiệp (Business)</option>
                <option value="MORTGAGE">Vay thế chấp (Mortgage)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Lãi suất cơ sở (%/Năm)</label>
              <input type="number" step="0.01" required placeholder="6.8" value={baseInterestRate} onChange={(e) => setBaseInterestRate(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-orange-500 bg-gray-50/50" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Hạn mức tối thiểu (VND)</label>
              <input type="number" required placeholder="10000000" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-orange-500 bg-gray-50/50" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Hạn mức tối đa (VND)</label>
              <input type="number" required placeholder="2000000000" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-orange-500 bg-gray-50/50" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Kỳ hạn ít nhất (Tháng)</label>
              <input type="number" required placeholder="6" value={minTermMonths} onChange={(e) => setMinTermMonths(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-orange-500 bg-gray-50/50" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Kỳ hạn tối đa (Tháng)</label>
              <div className="mt-1 flex gap-2">
                <input type="number" required placeholder="120" value={maxTermMonths} onChange={(e) => setMaxTermMonths(e.target.value)} className="h-9 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-orange-500 bg-gray-50/50" />
                <button type="submit" disabled={formSubmitting} className="h-9 rounded-lg bg-gray-900 px-4 text-xs font-bold text-white transition hover:bg-gray-800 disabled:opacity-50">
                  {formSubmitting ? "Lưu..." : "Khởi tạo"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* BỘ LỌC VÀ THANH TÌM KIẾM */}
        <div className="flex flex-col items-end justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:flex-row md:items-center">
          <div className="w-full md:w-2/3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Tìm sản phẩm theo tên gói hoặc mã định danh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-4 text-sm outline-none focus:border-orange-500"
              />
            </div>
          </div>
          <div className="relative w-full md:w-56">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-700"
              type="button"
            >
              <span>{statusOptions.find((opt) => opt.value === statusFilter)?.label}</span>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-100 bg-white py-1 shadow-xl">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setStatusFilter(option.value); setIsDropdownOpen(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {/* BẢNG HIỂN THỊ CÁC GÓI SẢN PHẨM VAY */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                  <th className="px-4 py-3.5">Mã gói</th>
                  <th className="px-4 py-3.5">Tên sản phẩm</th>
                  <th className="px-4 py-3.5">Phân loại</th>
                  <th className="px-4 py-3.5 text-right">Hạn mức tối thiểu</th>
                  <th className="px-4 py-3.5 text-right">Hạn mức tối đa</th>
                  <th className="px-4 py-3.5 text-center">Kỳ hạn (Tháng)</th>
                  <th className="px-4 py-3.5 text-right">Lãi suất cơ sở</th>
                  <th className="px-4 py-3.5 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {loading ? (
                  <tr><td colSpan={8} className="py-8 text-center text-gray-400">Đang tải danh sách sản phẩm tín dụng...</td></tr>
                ) : filteredProducts.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-gray-400">Không tìm thấy sản phẩm vay phù hợp tiêu chí lọc</td></tr>
                ) : (
                  filteredProducts.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-4 py-4 font-bold text-blue-600 uppercase">{row.code}</td>
                      <td className="px-4 py-4 font-semibold text-gray-900">{row.name}</td>
                      <td className="px-4 py-4">
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 font-medium">
                          {row.loanType}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-xs text-gray-600">{formatVND(row.minAmount)}</td>
                      <td className="px-4 py-4 text-right font-mono text-xs font-medium text-gray-900">{formatVND(row.maxAmount)}</td>
                      <td className="px-4 py-4 text-center text-xs font-medium">{row.minTermMonths} - {row.maxTermMonths} m</td>
                      <td className="px-4 py-4 text-right font-mono font-bold text-amber-600">{row.baseInterestRate}%/năm</td>
                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(row.id, row.status)}
                          className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-medium transition cursor-pointer ${row.status.toLowerCase() === "active"
                              ? "border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              : "border-gray-200 bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                        >
                          {row.status.toLowerCase() === "active" ? <CheckCircle2 size={12} /> : <HelpCircle size={12} />}
                          {row.status.toLowerCase() === "active" ? "Hoạt động" : "Tạm ngưng"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminShell>
  );
}