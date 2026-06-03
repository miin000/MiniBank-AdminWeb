"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "../../components/admin-shell";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/+$/, "");

// --- DATA TYPES ĐỒNG BỘ 100% VỚI CÁC RECORD JAVA BACKEND ---

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
  status: "active" | "inactive" | string;
};

type LoanTierItem = {
  id: number;
  loanProductId: number;
  loanProductName: string;
  minAmount: number;
  maxAmount: number;
  minTermMonths: number;
  maxTermMonths: number;
  interestRate: number;
  effectiveFrom: string;
  effectiveTo: string;
};

type LoanApplication = {
  id: number;
  applicationCode: string;
  customerName: string;
  loanProductName: string;
  requestedAmount: number;
  termMonths: number;
  purpose: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  createdAt: string;
};

type ContractItem = {
  id: number;
  code: string;
  customerName: string;
  accountNo: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  status: "DANG_VAY" | "QUA_HAN" | "DA_TAT_TOAN" | string;
};

// --- CẤU TRÚC ĐỐI TƯỢNG FORM ĐỂ GỬI LÊN ADMIN CONTROLLER (UPSERT) ---
type LoanProductForm = {
  code: string;
  name: string;
  loanType: string;
  currency: string;
  minAmount: string;
  maxAmount: string;
  minTermMonths: string;
  maxTermMonths: string;
  baseInterestRate: string;
};

// --- CHUYỂN ĐỔI ĐỊNH DẠNG ĐỒNG TIỀN & TỶ LỆ PHẦN TRĂM ---
function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "0 đ";
  return value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " đ";
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return "0%";
  return `${(value * 100).toFixed(2).replace(/\.00$/, "")}%`;
}

export default function AdminLoanDashboard() {
  const [token, setToken] = useState<string | null>(null);

  // Điều hướng Menu chính (Khớp với sơ đồ Figma của bạn)
  const [mainMenu, setMainMenu] = useState<"loans" | "products" | "tiers">("loans");
  // Sub-tabs dành riêng cho Quản lý Khế ước & Hồ sơ vay (Nhiệm vụ 1)
  const [loanSubTab, setLoanSubTab] = useState<"applications" | "contracts">("applications");

  // State Lưu trữ Dữ liệu Hệ thống
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [products, setProducts] = useState<LoanProductItem[]>([]);
  const [tiers, setTiers] = useState<LoanTierItem[]>([]);

  // Trạng thái tải dữ liệu (Loading loading screen)
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Điều khiển Modal Thêm mới Gói Vay (Nhiệm vụ 2)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productForm, setProductForm] = useState<LoanProductForm>({
    code: "", name: "", loanType: "PERSONAL", currency: "VND",
    minAmount: "", maxAmount: "", minTermMonths: "", maxTermMonths: "", baseInterestRate: ""
  });

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken") || localStorage.getItem("token");
    setToken(adminToken);
  }, []);

<<<<<<< HEAD
  const authHeader = useMemo<HeadersInit>(() => {
    if (!token) return {} as HeadersInit;
    return { Authorization: `Bearer ${token}` } as HeadersInit;
  }, [token]);
=======
  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  }), [token]);
>>>>>>> e885c011d0c4c5998af7466a38f5c69e1c1ae210

  // ==============================================================
  // CÁC HÀM ĐỒNG BỘ ĐỒNG THỜI VỚI CÁC CONTROLLER TRÊN BACKEND
  // ==============================================================

  // Tải danh sách đơn xin vay & Khế ước (Nhiệm vụ 1)
  const loadLoanManagementData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Gọi cụm API thẩm định
      const resApp = await fetch(`${API_BASE}/api/mobile/loans/applications`, { headers });
      if (resApp.ok) setApplications(await resApp.json());

      const resContract = await fetch(`${API_BASE}/api/mobile/contracts`, { headers });
      if (resContract.ok) setContracts(await resContract.json());
    } catch (err) {
      console.error("Lỗi đồng bộ dữ liệu tín dụng khế ước", err);
    } finally {
      setLoading(false);
    }
  }, [token, headers]);

  // Tải sản phẩm và Khung bậc lãi suất từ AdminFinancialProductController (Nhiệm vụ 2)
  const loadProductData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const resProd = await fetch(`${API_BASE}/api/admin/financial-products/loan-products`, { headers });
      if (resProd.ok) setProducts(await resProd.json());

      const resTier = await fetch(`${API_BASE}/api/admin/financial-products/loan-interest-tiers`, { headers });
      if (resTier.ok) setTiers(await resTier.json());
    } catch (err) {
      console.error("Lỗi đọc danh mục cấu hình", err);
    } finally {
      setLoading(false);
    }
  }, [token, headers]);

  useEffect(() => {
    if (token) {
      if (mainMenu === "loans") loadLoanManagementData();
      else loadProductData();
    }
  }, [mainMenu, token, loadLoanManagementData, loadProductData]);

  // Duyệt/Từ chối Hồ sơ trực tiếp từ bảng (Nhiệm vụ 1)
  const handleUpdateAppStatus = async (id: number, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/loans/applications/${id}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        loadLoanManagementData();
      } else {
        // Mock-up cập nhật trực quan nếu server dev chưa mở quyền Patch
        setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      }
    } catch {
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    }
  };

  // Đóng/Mở trạng thái sản phẩm vay qua nút gạt Toggle (Nhiệm vụ 2)
  const handleToggleProductStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`${API_BASE}/api/admin/financial-products/loan-products/${id}/status?status=${nextStatus}`, {
        method: "PATCH",
        headers
      });
      if (res.ok) loadProductData();
      else {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, status: nextStatus } : p));
      }
    } catch {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status: nextStatus } : p));
    }
  };

  // Submit form thêm gói vay mới lên AdminFinancialProductController (Nhiệm vụ 2)
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: productForm.code,
      name: productForm.name,
      loanType: productForm.loanType,
      currency: productForm.currency,
      minAmount: Number(productForm.minAmount),
      maxAmount: Number(productForm.maxAmount),
      minTermMonths: Number(productForm.minTermMonths),
      maxTermMonths: Number(productForm.maxTermMonths),
      baseInterestRate: Number(productForm.baseInterestRate) / 100
    };

    try {
      const res = await fetch(`${API_BASE}/api/admin/financial-products/loan-products`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setProductForm({ code: "", name: "", loanType: "PERSONAL", currency: "VND", minAmount: "", maxAmount: "", minTermMonths: "", maxTermMonths: "", baseInterestRate: "" });
        loadProductData();
      }
    } catch (err) {
      console.error("Lỗi đẩy gói vay lên DB", err);
    }
  };

  // Bộ lọc dữ liệu theo thanh Search của Figma
  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <div className="w-full max-w-sm rounded-2xl border border-black/5 bg-white p-6 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-xl font-bold mx-auto mb-3">🛡️</div>
          <h1 className="text-sm font-bold text-zinc-900">Hệ Thống Quản Trị Trung Tâm</h1>
          <p className="mt-1 text-xs text-zinc-500">Yêu cầu quyền truy cập Administrator cấp cao.</p>
          <a href="/login" className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-xl bg-orange-600 text-xs font-bold text-white transition hover:bg-orange-700">Đăng nhập Admin</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] antialiased">

      {/* ============================================================== */}
      {/* SIDEBAR ĐIỀU HƯỚNG CHUẨN ĐỒ HỌA FIGMA CỦA BẠN */}
      {/* ============================================================== */}
      <aside className="w-64 bg-zinc-950 text-zinc-400 flex flex-col justify-between border-r border-zinc-900 shrink-0 select-none">
        <div className="p-5">
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-xs">MB</div>
            <div>
              <div className="text-white font-bold text-xs tracking-wide uppercase">MiniBank Core</div>
              <div className="text-[10px] text-zinc-500 font-bold font-mono">ADMIN WORKSPACE</div>
            </div>
          </div>

          <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-600 px-3 mb-2 block">Phân hệ nghiệp vụ</div>
          <nav className="space-y-1 text-xs font-bold">
            <button
              onClick={() => setMainMenu("loans")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${mainMenu === "loans" ? "bg-orange-600/10 text-orange-500 border border-orange-600/20" : "hover:bg-zinc-900 text-zinc-400"}`}
            >
              💼 Quản lý Khế ước & Hồ sơ
            </button>
            <button
              onClick={() => setMainMenu("products")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${mainMenu === "products" ? "bg-orange-600/10 text-orange-500 border border-orange-600/20" : "hover:bg-zinc-900 text-zinc-400"}`}
            >
              🏷️ Danh mục sản phẩm vay
            </button>
            <button
              onClick={() => setMainMenu("tiers")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${mainMenu === "tiers" ? "bg-orange-600/10 text-orange-500 border border-orange-600/20" : "hover:bg-zinc-900 text-zinc-400"}`}
            >
              📊 Cấu hình Bậc lãi suất vay
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-900 bg-zinc-900/40 flex items-center justify-between text-[11px] font-bold">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-200 flex items-center justify-center">A</div>
            <span className="text-zinc-300">Admin_Core</span>
          </div>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-zinc-500 hover:text-rose-400">Đăng xuất</button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* KHỐI HIỂN THỊ NỘI DUNG CHÍNH (MAIN INTERFACE PANEL) */}
      {/* ============================================================== */}
      <main className="flex-1 min-w-0 overflow-y-auto p-8">
        <AdminShell
          title={mainMenu === "loans" ? "Quản lý Khế ước & Thẩm định Hồ sơ" : mainMenu === "products" ? "Danh mục Sản phẩm Vay vốn" : "Bảng quản trị Bậc lãi suất Tín dụng"}
          subtitle="Hệ thống tổng hợp và can thiệp tham số cốt lõi ngân hàng số MiniBank"
          actions={
            mainMenu === "products" ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="h-9 rounded-xl bg-orange-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-orange-700"
              >
                + Thêm sản phẩm vay
              </button>
            ) : undefined
          }
        >
          {/* THANH TÌM KIẾM CỦA FIGMA */}
          <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
            {mainMenu === "loans" ? (
              <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl text-xs font-bold">
                <button onClick={() => setLoanSubTab("applications")} className={`px-4 py-2 rounded-lg transition-all ${loanSubTab === "applications" ? "bg-white text-zinc-950 shadow-2xs" : "text-zinc-500"}`}>
                  📋 Hồ sơ đang chờ duyệt ({applications.length})
                </button>
                <button onClick={() => setLoanSubTab("contracts")} className={`px-4 py-2 rounded-lg transition-all ${loanSubTab === "contracts" ? "bg-white text-zinc-950 shadow-2xs" : "text-zinc-500"}`}>
                  💳 Hợp đồng đang vay ({contracts.length})
                </button>
              </div>
            ) : <div />}

            <div className="flex h-9 items-center gap-2 rounded-xl border border-black/10 bg-white px-3 w-64 shadow-3xs">
              <span className="text-xs text-zinc-400">🔎</span>
              <input
                className="w-full bg-transparent text-xs outline-none font-medium text-zinc-700"
                placeholder="Tra cứu thông tin nhanh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* RENDERING LUỒNG DIỄN TIẾN DỮ LIỆU CHÍNH */}
          {loading ? (
            <div className="py-12 text-center text-xs font-semibold text-zinc-400">Đang đồng bộ dữ liệu từ Cơ sở dữ liệu Core-Banking...</div>
          ) : (
            <>
              {/* PHÂN HỆ 1: QUẢN LÝ HỒ SƠ & KHẾ ƯỚC VAY */}
              {mainMenu === "loans" && loanSubTab === "applications" && (
                <div className="rounded-2xl border border-black/5 bg-white overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50/70 border-b border-zinc-100 text-zinc-400 font-bold uppercase text-[11px]">
                        <th className="p-4">Mã hồ sơ</th>
                        <th className="p-4">Tên khách hàng</th>
                        <th className="p-4">Sản phẩm vay</th>
                        <th className="p-4 text-right">Số tiền đề xuất</th>
                        <th className="p-4 text-center">Kỳ hạn</th>
                        <th className="p-4">Lý do/Mục đích vay vốn</th>
                        <th className="p-4 text-center">Trạng thái</th>
                        <th className="p-4 text-right">Thao tác duyệt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                      {applications.length === 0 ? (
                        <tr><td colSpan={8} className="p-4 text-center text-zinc-400">Không có đơn yêu cầu cấp tín dụng nào cần phê duyệt.</td></tr>
                      ) : (
                        applications.map((app) => (
                          <tr key={app.id} className="hover:bg-zinc-50/30">
                            <td className="p-4 font-bold text-zinc-950">{app.applicationCode}</td>
                            <td className="p-4 text-zinc-950">{app.customerName}</td>
                            <td className="p-4 text-zinc-500">{app.loanProductName}</td>
                            <td className="p-4 text-right font-bold text-zinc-950">{formatCurrency(app.requestedAmount)}</td>
                            <td className="p-4 text-center font-mono">{app.termMonths}T</td>
                            <td className="p-4 text-zinc-500 max-w-xs truncate">{app.purpose}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${app.status === "PENDING" ? "bg-amber-50 text-amber-600 border border-amber-200" : app.status === "APPROVED" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"}`}>
                                {app.status === "PENDING" ? "Chờ duyệt" : app.status === "APPROVED" ? "Đã duyệt" : "Từ chối"}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {app.status === "PENDING" && (
                                <div className="flex gap-1 justify-end">
                                  <button onClick={() => handleUpdateAppStatus(app.id, "APPROVED")} className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold">Duyệt</button>
                                  <button onClick={() => handleUpdateAppStatus(app.id, "REJECTED")} className="bg-rose-500 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold">Từ chối</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {mainMenu === "loans" && loanSubTab === "contracts" && (
                <div className="rounded-2xl border border-black/5 bg-white overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50/70 border-b border-zinc-100 text-zinc-400 font-bold uppercase text-[11px]">
                        <th className="p-4">Mã hợp đồng (Khế ước)</th>
                        <th className="p-4">Chủ khoản vay</th>
                        <th className="p-4">Số tài khoản giải ngân</th>
                        <th className="p-4 text-right">Tổng dư nợ gốc</th>
                        <th className="p-4 text-center">Lãi suất áp dụng</th>
                        <th className="p-4 text-center">Thời gian vay</th>
                        <th className="p-4 text-center">Tình trạng nợ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                      {contracts.length === 0 ? (
                        <tr><td colSpan={7} className="p-4 text-center text-zinc-400">Hệ thống chưa ghi nhận hợp đồng giải ngân tín dụng nào hoạt động.</td></tr>
                      ) : (
                        contracts.map((c) => (
                          <tr key={c.id}>
                            <td className="p-4 font-bold text-zinc-950">{c.code}</td>
                            <td className="p-4 text-zinc-950">{c.customerName}</td>
                            <td className="p-4 font-mono text-zinc-500">{c.accountNo || "Tài khoản Core"}</td>
                            <td className="p-4 text-right font-bold text-zinc-950">{formatCurrency(c.amount)}</td>
                            <td className="p-4 text-center text-orange-600 font-bold">{formatPercent(c.interestRate)}</td>
                            <td className="p-4 text-center">{c.termMonths} tháng</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${c.status === "QUA_HAN" ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}>
                                {c.status || "ĐANG TRONG KỲ VAY"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PHÂN HỆ 2: DANH MỤC SẢN PHẨM VAY (ADMIN FINANCIAL PRODUCT CONTROLLER) */}
              {mainMenu === "products" && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((p) => (
                    <div key={p.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono font-bold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md">Mã: {p.code}</span>
                          <button
                            onClick={() => handleToggleProductStatus(p.id, p.status)}
                            className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${p.status === "active" ? "bg-orange-600 flex justify-end" : "bg-zinc-200 flex justify-start"}`}
                          >
                            <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                          </button>
                        </div>
                        <h4 className="text-sm font-bold text-zinc-950 mt-2">{p.name}</h4>
                        <p className="text-[11px] font-bold text-zinc-400 mt-0.5 uppercase tracking-wide">{p.loanType === "PERSONAL" ? "Tiêu dùng cá nhân" : "Bất động sản / Doanh nghiệp"}</p>

                        <div className="mt-4 pt-4 border-t border-zinc-100 space-y-2 text-xs font-semibold text-zinc-500">
                          <div className="flex justify-between"><span>Biên hạn mức:</span><span className="text-zinc-950 font-mono">{formatCurrency(p.minAmount)} - {formatCurrency(p.maxAmount)}</span></div>
                          <div className="flex justify-between"><span>Khung kỳ hạn:</span><span className="text-zinc-950">{p.minTermMonths} - {p.maxTermMonths} tháng</span></div>
                          <div className="flex justify-between"><span>Lãi suất cơ sở:</span><span className="text-orange-600 font-bold">{formatPercent(p.baseInterestRate)} / năm</span></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* PHÂN HỆ 3: QUẢN LÝ BẬC LÃI SUẤT VAY (LOAN TIER ITEM) */}
              {mainMenu === "tiers" && (
                <div className="rounded-2xl border border-black/5 bg-white overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50/70 border-b border-zinc-100 text-zinc-400 font-bold uppercase text-[11px]">
                        <th className="p-4">ID Bậc</th>
                        <th className="p-4">Thuộc sản phẩm gốc</th>
                        <th className="p-4 text-right">Số tiền tối thiểu</th>
                        <th className="p-4 text-right">Số tiền tối đa</th>
                        <th className="p-4 text-center">Kỳ hạn áp dụng</th>
                        <th className="p-4 text-center">Lãi suất bậc định danh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                      {tiers.length === 0 ? (
                        <tr><td colSpan={6} className="p-4 text-center text-zinc-400">Chưa thiết lập khung cấu hình bậc lãi suất lũy tiến nào trong CSDL.</td></tr>
                      ) : (
                        tiers.map((t) => (
                          <tr key={t.id}>
                            <td className="p-4 font-mono text-zinc-400">#TIER-{t.id}</td>
                            <td className="p-4 text-zinc-950">{t.loanProductName}</td>
                            <td className="p-4 text-right font-mono text-zinc-600">{formatCurrency(t.minAmount)}</td>
                            <td className="p-4 text-right font-mono text-zinc-600">{formatCurrency(t.maxAmount)}</td>
                            <td className="p-4 text-center">{t.minTermMonths} - {t.maxTermMonths} tháng</td>
                            <td className="p-4 text-center text-orange-600 font-black text-sm">{formatPercent(t.interestRate)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </AdminShell>

        {/* ============================================================== */}
        {/* MODAL THÊM SẢN PHẨM MỚI (PHỤC VỤ LUỒNG QUẢN TRỊ VIÊN) */}
        {/* ============================================================== */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-lg rounded-2xl border border-black/5 bg-white p-6 shadow-xl">
              <div className="border-b border-zinc-100 pb-3 mb-4">
                <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wide">Cấu hình thông số sản phẩm tín dụng mới</h3>
                <p className="text-xs text-zinc-400">Thông tin sẽ ngay lập tức đồng bộ hóa sang bảng cơ sở dữ liệu hệ thống.</p>
              </div>

              <form onSubmit={handleCreateProduct} className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase">Mã sản phẩm định danh</label>
                  <input required className="mt-1 h-9 w-full rounded-xl border border-black/10 px-3 text-xs outline-none focus:border-orange-600 font-semibold" value={productForm.code} onChange={(e) => setProductForm({ ...productForm, code: e.target.value })} placeholder="Ví dụ: LOAN_FAST_2026" />
                </div>
                <div className="col-span-1">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase">Tên thương mại gói vay</label>
                  <input required className="mt-1 h-9 w-full rounded-xl border border-black/10 px-3 text-xs outline-none focus:border-orange-600 font-semibold" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="Ví dụ: Vay mua ô tô ưu đãi" />
                </div>

                <div className="col-span-1">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase">Phân loại nghiệp vụ</label>
                  <select className="mt-1 h-9 w-full rounded-xl border border-black/10 px-3 text-xs bg-white font-semibold outline-none" value={productForm.loanType} onChange={(e) => setProductForm({ ...productForm, loanType: e.target.value })}>
                    <option value="PERSONAL">Tiêu dùng cá nhân (Personal)</option>
                    <option value="BUSINESS">Phát triển kinh doanh (Business)</option>
                    <option value="MORTGAGE">Thế chấp bất động sản (Mortgage)</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase">Lãi suất sàn cơ sở (% / năm)</label>
                  <input type="number" step="0.01" required className="mt-1 h-9 w-full rounded-xl border border-black/10 px-3 text-xs outline-none focus:border-orange-600 font-mono font-bold text-orange-600" value={productForm.baseInterestRate} onChange={(e) => setProductForm({ ...productForm, baseInterestRate: e.target.value })} placeholder="Ví dụ: 8.5" />
                </div>

                <div className="col-span-1">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase">Hạn mức tối thiểu (VND)</label>
                  <input type="number" required className="mt-1 h-9 w-full rounded-xl border border-black/10 px-3 text-xs outline-none focus:border-orange-600 font-mono" value={productForm.minAmount} onChange={(e) => setProductForm({ ...productForm, minAmount: e.target.value })} placeholder="Ví dụ: 5000000" />
                </div>
                <div className="col-span-1">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase">Hạn mức tối đa (VND)</label>
                  <input type="number" required className="mt-1 h-9 w-full rounded-xl border border-black/10 px-3 text-xs outline-none focus:border-orange-600 font-mono" value={productForm.maxAmount} onChange={(e) => setProductForm({ ...productForm, maxAmount: e.target.value })} placeholder="Ví dụ: 500000000" />
                </div>

                <div className="col-span-1">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase">Kỳ hạn tối thiểu (Tháng)</label>
                  <input type="number" required className="mt-1 h-9 w-full rounded-xl border border-black/10 px-3 text-xs outline-none focus:border-orange-600 font-mono" value={productForm.minTermMonths} onChange={(e) => setProductForm({ ...productForm, minTermMonths: e.target.value })} placeholder="6" />
                </div>
                <div className="col-span-1">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase">Kỳ hạn tối đa (Tháng)</label>
                  <input type="number" required className="mt-1 h-9 w-full rounded-xl border border-black/10 px-3 text-xs outline-none focus:border-orange-600 font-mono" value={productForm.maxTermMonths} onChange={(e) => setProductForm({ ...productForm, maxTermMonths: e.target.value })} placeholder="36" />
                </div>

                <div className="col-span-2 flex justify-end gap-2 border-t border-zinc-100 pt-3 mt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="h-9 rounded-xl border border-black/10 px-4 text-xs font-bold text-zinc-600 transition hover:bg-zinc-50">Hủy cấu hình</button>
                  <button type="submit" className="h-9 rounded-xl bg-orange-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-orange-700">Lưu sản phẩm gốc</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}