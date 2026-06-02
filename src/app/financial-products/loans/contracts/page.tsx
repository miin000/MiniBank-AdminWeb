"use client";

import React, { useState, useEffect } from "react";
import {
    Search,
    ChevronDown,
    Eye,
    Bell,
    AlertCircle,
    Clock,
    CheckCircle2,
    HelpCircle
} from "lucide-react";
import AdminShell from "../../../components/admin-shell";

// --- Interfaces định nghĩa dữ liệu ---
interface ContractSummary {
    id: number;
    contractCode: string; // MD HD
    customerName: string;
    accountNumber: string; // STK
    loanAmount: number;
    interestRate: number;
    termMonths: number;
    dueDate: string;
    daysOverdue?: number; // Dùng cho trạng thái Quá hạn
    amountDue: number;
    status: "SAP_DEN_HAN" | "QUA_HAN" | "DANG_VAY" | "DA_TAT_TOAN";
}

export default function LoanManagementPage() {
    // --- States ---
    const [contracts, setContracts] = useState<ContractSummary[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // --- Mock Data chuẩn theo thiết kế Figma ---
    useEffect(() => {
        const mockData: ContractSummary[] = [
            {
                id: 1,
                contractCode: "HĐ-2026-001",
                customerName: "Phạm Minh D",
                accountNumber: "STK-0001234",
                loanAmount: 500000000,
                interestRate: 6.5,
                termMonths: 12,
                dueDate: "2026-04-20",
                amountDue: 425000000,
                status: "SAP_DEN_HAN",
            },
            {
                id: 2,
                contractCode: "HĐ-2026-002",
                customerName: "Nguyễn Văn X",
                accountNumber: "STK-0001250",
                loanAmount: 300000000,
                interestRate: 7.2,
                termMonths: 24,
                dueDate: "2026-04-10",
                daysOverdue: 3,
                amountDue: 135000000,
                status: "QUA_HAN",
            },
            {
                id: 3,
                contractCode: "HĐ-2025-089",
                customerName: "Trần Thị Y",
                accountNumber: "STK-0001198",
                loanAmount: 200000000,
                interestRate: 6.0,
                termMonths: 12,
                dueDate: "2026-05-15",
                amountDue: 170000000,
                status: "DANG_VAY",
            },
            {
                id: 4,
                contractCode: "HĐ-2025-045",
                customerName: "Lê Văn Z",
                accountNumber: "STK-0001123",
                loanAmount: 150000000,
                interestRate: 5.8,
                termMonths: 6,
                dueDate: "2025-03-25",
                amountDue: 0,
                status: "DA_TAT_TOAN",
            },
        ];

        setContracts(mockData);
        setLoading(false);
    }, []);

    // --- Tính toán số liệu thống kê (KPI Cards) ---
    const totalOutstanding = contracts
        .filter(c => c.status !== "DA_TAT_TOAN")
        .reduce((sum, c) => sum + c.amountDue, 0);

    const upcomingCount = contracts.filter(c => c.status === "SAP_DEN_HAN").length;
    const overdueCount = contracts.filter(c => c.status === "QUA_HAN").length;

    // --- Bộ lọc và Tìm kiếm ---
    const filteredContracts = contracts.filter((item) => {
        const matchesSearch =
            item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.contractCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.accountNumber.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // --- Helper Render Status Badge ---
    const renderStatusBadge = (status: ContractSummary["status"], daysOverdue?: number) => {
        switch (status) {
            case "SAP_DEN_HAN":
                return (
                    <span className="px-2.5 py-1 text-xs font-medium rounded bg-amber-50 text-amber-600 border border-amber-200">
                        Sắp đến hạn
                    </span>
                );
            case "QUA_HAN":
                return (
                    <div className="flex flex-col items-start">
                        <span className="px-2.5 py-1 text-xs font-medium rounded bg-red-600 text-white">
                            Quá hạn
                        </span>
                        {daysOverdue && (
                            <span className="text-[11px] text-red-600 font-medium mt-0.5">
                                Trễ {daysOverdue} ngày
                            </span>
                        )}
                    </div>
                );
            case "DANG_VAY":
                return (
                    <span className="px-2.5 py-1 text-xs font-medium rounded bg-blue-50 text-blue-600 border border-blue-200">
                        Đang vay
                    </span>
                );
            case "DA_TAT_TOAN":
                return (
                    <span className="px-2.5 py-1 text-xs font-medium rounded bg-emerald-50 text-emerald-600 border border-emerald-200">
                        Đã tất toán
                    </span>
                );
            default:
                return null;
        }
    };

    // --- Định dạng tiền tệ VND ---
    const formatVND = (value: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(value).replace("₫", "đ");
    };

    const statusOptions = [
        { value: "ALL", label: "Tất cả" },
        { value: "DANG_VAY", label: "Đang vay" },
        { value: "SAP_DEN_HAN", label: "Sắp đến hạn" },
        { value: "QUA_HAN", label: "Quá hạn" },
        { value: "DA_TAT_TOAN", label: "Đã tất toán" },
    ];

    return (
        <AdminShell
            title="Quản lý Khoản vay & Nợ"
            subtitle="Kiểm soát rủi ro tín dụng và theo dõi khoản vay"
            onLogout={() => {
                localStorage.removeItem("adminToken");
                window.location.href = "/login";
            }}
        >
            <div className="space-y-6 font-sans">
                {/* --- KPI Cards Widgets --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Card 1: Tổng dư nợ */}
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between">
                        <div className="space-y-2">
                            <span className="text-xs font-medium text-gray-400">Tổng dư nợ hiện tại</span>
                            <div className="text-xl font-bold text-gray-900">{formatVND(totalOutstanding)}</div>
                        </div>
                        <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
                            <span className="text-lg font-bold">đ</span>
                        </div>
                    </div>

                    {/* Card 2: Sắp đến hạn */}
                    <div className="bg-amber-50/60 p-5 rounded-xl border border-amber-100 shadow-sm flex items-start justify-between">
                        <div className="space-y-2">
                            <span className="text-xs font-medium text-amber-700">Sắp đến hạn (7 ngày)</span>
                            <div className="text-xl font-bold text-amber-900">{upcomingCount} khoản</div>
                        </div>
                        <div className="p-2.5 bg-amber-100 text-amber-600 rounded-lg">
                            <Clock size={20} />
                        </div>
                    </div>

                    {/* Card 3: Quá hạn */}
                    <div className="bg-red-50/50 p-5 rounded-xl border border-red-100 shadow-sm flex items-start justify-between">
                        <div className="space-y-2">
                            <span className="text-xs font-medium text-red-700">Nợ quá hạn (Nợ xấu)</span>
                            <div className="text-xl font-bold text-red-900">{overdueCount} khoản</div>
                        </div>
                        <div className="p-2.5 bg-red-100 text-red-600 rounded-lg">
                            <AlertCircle size={20} />
                        </div>
                    </div>
                </div>

                {/* --- Filter Bar Box --- */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
                        {/* Ô tìm kiếm */}
                        <div className="w-full md:w-1/2 space-y-1.5">
                            <label className="text-xs font-semibold text-gray-700">Tìm kiếm</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Tìm theo Tên/STK/Mã hợp đồng..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        {/* Combobox Trạng thái */}
                        <div className="w-full md:w-64 space-y-1.5 relative">
                            <label className="text-xs font-semibold text-gray-700">Trạng thái</label>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-left text-gray-700 hover:bg-gray-50"
                            >
                                <span>{statusOptions.find((o) => o.value === statusFilter)?.label}</span>
                                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                            </button>

                            {/* Dropdown Menu Custom */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 top-full mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-50 overflow-hidden py-1">
                                    {statusOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setStatusFilter(option.value);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${statusFilter === option.value
                                                ? "bg-pink-100 text-pink-700 font-medium"
                                                : "text-gray-700 hover:bg-gray-50"
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- Data Table --- */}
                    <div className="overflow-x-auto border border-gray-100 rounded-lg">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                                    <th className="px-4 py-3.5">Mã HĐ</th>
                                    <th className="px-4 py-3.5">Khách hàng</th>
                                    <th className="px-4 py-3.5 text-right">Số tiền vay</th>
                                    <th className="px-4 py-3.5 text-center">Lãi suất</th>
                                    <th className="px-4 py-3.5 text-center">Kỳ hạn</th>
                                    <th className="px-4 py-3.5 text-center">Ngày đến hạn</th>
                                    <th className="px-4 py-3.5 text-right">Số tiền cần đóng</th>
                                    <th className="px-4 py-3.5 text-center">Trạng thái</th>
                                    <th className="px-4 py-3.5 text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-8 text-gray-400">Đang tải dữ liệu...</td>
                                    </tr>
                                ) : filteredContracts.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-8 text-gray-400">Không tìm thấy dữ liệu phù hợp</td>
                                    </tr>
                                ) : (
                                    filteredContracts.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-4 py-4 font-medium text-gray-900">{row.contractCode}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900">{row.customerName}</span>
                                                    <span className="text-xs text-gray-400 mt-0.5">{row.accountNumber}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right font-medium">{formatVND(row.loanAmount)}</td>
                                            <td className="px-4 py-4 text-center text-gray-600">{row.interestRate}%/năm</td>
                                            <td className="px-4 py-4 text-center text-gray-600">{row.termMonths} tháng</td>
                                            <td className="px-4 py-4 text-center text-gray-600">{row.dueDate}</td>
                                            <td className="px-4 py-4 text-right font-semibold text-gray-900">
                                                {row.amountDue > 0 ? formatVND(row.amountDue) : "0 đ"}
                                            </td>
                                            <td className="px-4 py-4 text-center align-middle">
                                                <div className="flex justify-center">
                                                    {renderStatusBadge(row.status, row.daysOverdue)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex items-center justify-center gap-3 text-blue-500">
                                                    <button className="hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors" title="Xem chi tiết">
                                                        <Eye size={16} />
                                                    </button>
                                                    <button className="hover:text-amber-700 p-1 rounded hover:bg-amber-50 text-amber-500 transition-colors" title="Gửi thông báo">
                                                        <Bell size={16} />
                                                    </button>
                                                </div>
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