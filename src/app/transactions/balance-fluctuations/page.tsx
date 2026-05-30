"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronDown, Calendar, Filter } from "lucide-react";
import AdminShell from "../../components/admin-shell";

// --- Interface định nghĩa cấu trúc dữ liệu biến động ---
interface BalanceFluctuation {
    id: number;
    timestamp: string;      // Thời gian
    accountNumber: string;  // STK
    customerName: string;   // Khách hàng
    type: "IN" | "OUT";     // Loại: Tiền vào hoặc Tiền ra
    amount: number;         // Số tiền
    balanceBefore: number;  // Số dư trước
    balanceAfter: number;   // Số dư sau
    description: string;    // Mô tả
}

export default function BalanceFluctuationsPage() {
    // --- States quản lý dữ liệu và bộ lọc ---
    const [fluctuations, setFluctuations] = useState<BalanceFluctuation[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // --- HÀM TỰ ĐỘNG SINH DỮ LIỆU ĐỘNG (KHÔNG FIX CỨNG) ---
    useEffect(() => {
        const firstNames = ["Nguyễn Văn", "Trần Thị", "Phạm Minh", "Lê Hoàng", "Vũ Đức", "Hoàng Kim"];
        const lastNames = ["A", "B", "C", "D", "E", "G", "H"];
        const descriptionsIn = ["Nhận tiền chuyển khoản", "Gửi tiền tiết kiệm trực tuyến", "Thu tiền tất toán hợp đồng", "Hoàn trả tiền thừa"];
        const descriptionsOut = ["Chuyển tiền nhanh Napas", "Thanh toán hóa đơn điện nước", "Rút tiền tại ATM", "Chuyển khoản thanh toán mua hàng"];

        // Tạo ngẫu nhiên từ 10 đến 20 bản ghi giao dịch để biểu đồ và bảng thay đổi liên tục
        const randomCount = Math.floor(Math.random() * 11) + 10;
        const generatedData: BalanceFluctuation[] = [];

        let currentBalance = 50000000; // Số dư ban đầu làm mốc tính toán

        for (let i = 1; i <= randomCount; i++) {
            const type = Math.random() > 0.5 ? "IN" : "OUT";
            const amount = (Math.floor(Math.random() * 20) + 1) * 1000000; // Từ 1M đến 20M đ

            const balanceBefore = currentBalance;
            const balanceAfter = type === "IN" ? balanceBefore + amount : balanceBefore - amount;
            currentBalance = balanceAfter; // Cập nhật lại số dư cho vòng lặp kế tiếp

            const randomName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
            const randomDesc = type === "IN"
                ? `${descriptionsIn[Math.floor(Math.random() * descriptionsIn.length)]} - Khách hàng: ${randomName}`
                : `${descriptionsOut[Math.floor(Math.random() * descriptionsOut.length)]}`;

            // Sinh mốc thời gian ngẫu nhiên trong ngày
            const hour = String(Math.floor(Math.random() * 24)).padStart(2, "0");
            const minute = String(Math.floor(Math.random() * 60)).padStart(2, "0");

            generatedData.push({
                id: i,
                timestamp: `2026-04-25 ${hour}:${minute}`,
                accountNumber: String(Math.floor(Math.random() * 9000000000) + i * 100000),
                customerName: randomName,
                type,
                amount,
                balanceBefore,
                balanceAfter,
                description: randomDesc,
            });
        }

        // Sắp xếp giao dịch theo thời gian mới nhất lên đầu
        generatedData.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

        setFluctuations(generatedData);
        setLoading(false);
    }, []);

    // --- Xử lý Logic Tìm kiếm và Lọc loại giao dịch ---
    const filteredData = fluctuations.filter((item) => {
        const matchesSearch =
            item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.accountNumber.includes(searchQuery) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = typeFilter === "ALL" || item.type === typeFilter;
        return matchesSearch && matchesType;
    });

    // --- TỰ ĐỘNG TÍNH TOÁN SỐ LIỆU CHO CÁC WIDGET THEO DATA ĐÃ LỌC ---
    const totalCount = filteredData.length;
    const totalIn = filteredData.filter((t) => t.type === "IN").reduce((sum, t) => sum + t.amount, 0);
    const totalOut = filteredData.filter((t) => t.type === "OUT").reduce((sum, t) => sum + t.amount, 0);

    const formatVND = (value: number) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value).replace("₫", "đ");
    };

    const typeOptions = [
        { value: "ALL", label: "Tất cả loại" },
        { value: "IN", label: "Tiền vào" },
        { value: "OUT", label: "Tiền ra" },
    ];

    return (
        <AdminShell title="Biến động số dư" subtitle="Theo dõi lịch sử biến động số dư của tất cả các tài khoản">
            <div className="space-y-6 font-sans text-gray-800">

                {/* --- Thanh bộ lọc Tìm kiếm & Combobox --- */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="w-full md:w-3/4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Tìm theo STK, tên khách hàng, mô tả..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800"
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-44 relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 hover:bg-gray-50 focus:outline-none text-left"
                        >
                            <span className="flex items-center gap-1.5">
                                <Filter size={14} className="text-gray-400" />
                                {typeOptions.find((o) => o.value === typeFilter)?.label}
                            </span>
                            <ChevronDown size={16} className={`text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                                {typeOptions.map((o) => (
                                    <button
                                        key={o.value}
                                        onClick={() => {
                                            setTypeFilter(o.value);
                                            setIsDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${typeFilter === o.value ? "bg-pink-100 text-pink-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- Khối Table chứa Widget tổng hợp lồng bên trong --- */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

                    {/* Thanh thống kê lồng ghép sát viền trên đầu bảng tự động cập nhật số liệu */}
                    <div className="grid grid-cols-3 border-b border-gray-100 bg-gray-50/50 p-4 text-left text-xs font-semibold text-gray-400">
                        <div className="pl-4">
                            <p>Tổng số giao dịch đang lọc</p>
                            <p className="text-sm font-bold text-gray-900 mt-1">{totalCount}</p>
                        </div>
                        <div>
                            <p className="text-emerald-600">Tổng tiền vào nhận được</p>
                            <p className="text-sm font-bold text-emerald-600 mt-1">{formatVND(totalIn)}</p>
                        </div>
                        <div>
                            <p className="text-red-600">Tổng tiền ra đã chuyển</p>
                            <p className="text-sm font-bold text-red-600 mt-1">{formatVND(totalOut)}</p>
                        </div>
                    </div>

                    {/* Bảng hiển thị danh sách biến động */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-6 py-3.5">Thời gian</th>
                                    <th className="px-6 py-3.5">STK</th>
                                    <th className="px-6 py-3.5">Khách hàng</th>
                                    <th className="px-6 py-3.5">Loại</th>
                                    <th className="px-6 py-3.5 text-right">Số tiền</th>
                                    <th className="px-6 py-3.5 text-right">Số dư trước</th>
                                    <th className="px-6 py-3.5 text-right">Số dư sau</th>
                                    <th className="px-6 py-3.5 pl-10">Mô tả</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                                {loading ? (
                                    <tr><td colSpan={8} className="text-center py-8">Đang khởi tạo dòng tiền động...</td></tr>
                                ) : filteredData.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">Không có dữ liệu biến động nào khớp bộ lọc</td></tr>
                                ) : (
                                    filteredData.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50/40 transition-colors">
                                            <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={12} className="opacity-60" />
                                                    {row.timestamp}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-gray-900">{row.accountNumber}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-[9px] font-bold text-blue-600">
                                                        {row.customerName[0]}
                                                    </div>
                                                    <span className="font-semibold text-gray-800">{row.customerName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {row.type === "IN" ? (
                                                    <span className="text-emerald-600 text-[10px] font-bold">▲ Tiền vào</span>
                                                ) : (
                                                    <span className="text-red-500 text-[10px] font-bold">▼ Tiền ra</span>
                                                )}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-bold ${row.type === "IN" ? "text-emerald-600" : "text-red-500"}`}>
                                                {row.type === "IN" ? `+${formatVND(row.amount)}` : `-${formatVND(row.amount)}`}
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-400 font-medium">{formatVND(row.balanceBefore)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-900">{formatVND(row.balanceAfter)}</td>
                                            <td className="px-6 py-4 pl-10 max-w-xs truncate text-gray-500 text-[11px]" title={row.description}>
                                                {row.description}
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