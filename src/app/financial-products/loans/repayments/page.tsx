"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronDown, Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import AdminShell from "../../../components/admin-shell";

// --- Interfaces định nghĩa dữ liệu ---
interface RepaymentScheduleItem {
    id: number;
    periodText: string;     // Kỳ 1, Kỳ 2...
    loanCode: string;       // Mã khoản vay (LOAN001)
    customerName: string;   // Khách hàng
    dueDate: string;        // Ngày đến hạn
    principalAmount: number;// Tiền gốc
    interestAmount: number; // Tiền lãi
    totalAmount: number;    // Tổng phải trả
    paidAmount: number;     // Đã trả
    status: "DA_TRA" | "SAP_DEN_HAN" | "QUA_HAN";
}

export default function LoanRepaymentPage() {
    // --- States ---
    const [schedules, setSchedules] = useState<RepaymentScheduleItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // --- Mock Data chuẩn theo đúng hình ảnh Figma ---
    useEffect(() => {
        const mockData: RepaymentScheduleItem[] = [
            {
                id: 1,
                periodText: "Kỳ 1",
                loanCode: "LOAN001",
                customerName: "Nguyễn Văn A",
                dueDate: "15/05/2026",
                principalAmount: 2083333,
                interestAmount: 520833,
                totalAmount: 2604166,
                paidAmount: 2604166,
                status: "DA_TRA",
            },
            {
                id: 2,
                periodText: "Kỳ 2",
                loanCode: "LOAN001",
                customerName: "Nguyễn Văn A",
                dueDate: "15/06/2026",
                principalAmount: 2083333,
                interestAmount: 498858,
                totalAmount: 2582201,
                paidAmount: 0,
                status: "SAP_DEN_HAN",
            },
            {
                id: 3,
                periodText: "Kỳ 1",
                loanCode: "LOAN002",
                customerName: "Lê Văn C",
                dueDate: "20/04/2026",
                principalAmount: 5555556,
                interestAmount: 1800000,
                totalAmount: 7355556,
                paidAmount: 0,
                status: "QUA_HAN",
            },
            {
                id: 4,
                periodText: "Kỳ 2",
                loanCode: "LOAN002",
                customerName: "Lê Văn C",
                dueDate: "20/05/2026",
                principalAmount: 5555556,
                interestAmount: 1740000,
                totalAmount: 7295556,
                paidAmount: 0,
                status: "SAP_DEN_HAN",
            },
        ];

        setSchedules(mockData);
        setLoading(false);
    }, []);

    // --- Bộ lọc và Tìm kiếm ---
    const filteredSchedules = schedules.filter((item) => {
        const matchesSearch =
            item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.loanCode.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // --- Tính toán tổng số lượng theo trạng thái thẻ Widget ---
    const totalPeriods = schedules.length;
    const upcomingCount = schedules.filter((s) => s.status === "SAP_DEN_HAN").length;
    const paidCount = schedules.filter((s) => s.status === "DA_TRA").length;
    const overdueCount = schedules.filter((s) => s.status === "QUA_HAN").length;

    const formatVND = (value: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(value).replace("₫", "đ");
    };

    const statusOptions = [
        { value: "ALL", label: "Tất cả trạng thái" },
        { value: "SAP_DEN_HAN", label: "Sắp đến hạn" },
        { value: "DA_TRA", label: "Đã trả" },
        { value: "QUA_HAN", label: "Quá hạn" },
    ];

    return (
        <AdminShell
            title="Lịch trả nợ"
            subtitle="Theo dõi lịch trả nợ của tất cả các khoản vay"
        >
            <div className="space-y-6 font-sans">

                {/* --- Bộ lọc thanh tìm kiếm và Combobox --- */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="w-full md:w-2/3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Tìm theo tên KH, mã khoản vay..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-56 relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 hover:bg-gray-50 text-left focus:outline-none"
                        >
                            <span>{statusOptions.find((o) => o.value === statusFilter)?.label}</span>
                            <ChevronDown size={16} className={`text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                                {statusOptions.map((o) => (
                                    <button
                                        key={o.value}
                                        onClick={() => {
                                            setStatusFilter(o.value);
                                            setIsDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${statusFilter === o.value ? "bg-pink-100 text-pink-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- Bảng dữ liệu chính --- */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Sub-Header Widgets inside Table */}
                    <div className="grid grid-cols-4 border-b border-gray-100 bg-gray-50/50 p-4 text-center text-xs font-semibold text-gray-500">
                        <div className="border-r border-gray-100 last:border-0">
                            <p>Tổng số kỳ</p>
                            <p className="text-sm font-bold text-gray-900 mt-1">{totalPeriods}</p>
                        </div>
                        <div className="border-r border-gray-100 last:border-0">
                            <p className="text-blue-600">Sắp đến hạn</p>
                            <p className="text-sm font-bold text-blue-600 mt-1">{upcomingCount}</p>
                        </div>
                        <div className="border-r border-gray-100 last:border-0">
                            <p className="text-emerald-600">Đã trả</p>
                            <p className="text-sm font-bold text-emerald-600 mt-1">{paidCount}</p>
                        </div>
                        <div className="last:border-0">
                            <p className="text-red-600">Quá hạn</p>
                            <p className="text-sm font-bold text-red-600 mt-1">{overdueCount}</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase">
                                    <th className="px-4 py-3.5">Kỳ</th>
                                    <th className="px-4 py-3.5">Mã khoản vay</th>
                                    <th className="px-4 py-3.5">Khách hàng</th>
                                    <th className="px-4 py-3.5">Ngày đến hạn</th>
                                    <th className="px-4 py-3.5 text-right">Tiền gốc</th>
                                    <th className="px-4 py-3.5 text-right">Tiền lãi</th>
                                    <th className="px-4 py-3.5 text-right">Tổng phải trả</th>
                                    <th className="px-4 py-3.5 text-right">Đã trả</th>
                                    <th className="px-4 py-3.5 text-center">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                {loading ? (
                                    <tr><td colSpan={9} className="text-center py-8 text-gray-400">Đang tải...</td></tr>
                                ) : filteredSchedules.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-4 font-medium text-gray-900">{row.periodText}</td>
                                        <td className="px-4 py-4 text-blue-600 font-semibold hover:underline cursor-pointer">{row.loanCode}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
                                                    {row.customerName[0]}
                                                </div>
                                                <span className="font-medium text-gray-900">{row.customerName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-gray-600">{row.dueDate}</td>
                                        <td className="px-4 py-4 text-right font-medium">{formatVND(row.principalAmount)}</td>
                                        <td className="px-4 py-4 text-right font-medium">{formatVND(row.interestAmount)}</td>
                                        <td className="px-4 py-4 text-right font-semibold text-gray-900">{formatVND(row.totalAmount)}</td>
                                        <td className="px-4 py-4 text-right font-semibold text-emerald-600">
                                            {row.paidAmount > 0 ? formatVND(row.paidAmount) : "0 đ"}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex justify-center">
                                                {row.status === "DA_TRA" && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                        <CheckCircle2 size={12} /> Đã trả
                                                    </span>
                                                )}
                                                {row.status === "SAP_DEN_HAN" && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-blue-50 text-blue-600 border border-blue-100">
                                                        <Clock size={12} /> Sắp đến hạn
                                                    </span>
                                                )}
                                                {row.status === "QUA_HAN" && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-red-50 text-red-600 border border-red-100">
                                                        <AlertCircle size={12} /> Quá hạn
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </AdminShell>
    );
}