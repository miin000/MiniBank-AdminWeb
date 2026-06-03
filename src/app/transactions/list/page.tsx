"use client";

import { useEffect, useState } from "react";
import AdminShell from "../../components/admin-shell";
type TransactionOverview = {
    totalTransactions: number;
    completedTransactions: number;
    totalCompletedAmount: number;
};

type TransactionItem = {
    id: number;
    transactionCode: string;
    fromAccountNumber: string | null;
    fromAccountName: string | null;
    toAccountNumber: string | null;
    toAccountName: string | null;
    amount: number;
    feeAmount: number;
    transactionType: string;
    status: string;
    createdAt: string;
};

export default function AdminTransactionsListPage() {
    const [overview, setOverview] = useState<TransactionOverview | null>(null);
    const [transactions, setTransactions] = useState<TransactionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const loadData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
            const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

            // 1. Fetch Overview Metrics
            const overviewRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/transactions/overview`, { headers });
            if (overviewRes.ok) {
                const overviewData = await overviewRes.json();
                setOverview(overviewData);
            }

            // 2. Fetch Transaction List with queries
            let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/transactions`;
            const params = new URLSearchParams();
            if (search) params.append("q", search);
            if (statusFilter) params.append("status", statusFilter);
            if (params.toString()) url += `?${params.toString()}`;

            const listRes = await fetch(url, { headers });
            if (listRes.ok) {
                const listData = await listRes.json();
                setTransactions(Array.isArray(listData) ? listData : []);
            }
        } catch (error) {
            console.error("Lỗi đồng bộ cơ sở dữ liệu giao dịch:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [statusFilter]);

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") loadData();
    };

    return (
        <AdminShell title="Lịch sử giao dịch" subtitle="Giám sát và kiểm toán toàn bộ luồng giao dịch tài chính trên hệ thống Core">

            {/* Khối thống kê Overview lấy trực tiếp từ API overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-black/5 shadow-3xs">
                    <div className="text-[11px] font-bold text-zinc-400 uppercase">Tổng số giao dịch</div>
                    <div className="text-xl font-black text-zinc-900 mt-1">{overview?.totalTransactions.toLocaleString() || 0}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-black/5 shadow-3xs">
                    <div className="text-[11px] font-bold text-zinc-400 uppercase">Giao dịch thành công</div>
                    <div className="text-xl font-black text-green-600 mt-1">{overview?.completedTransactions.toLocaleString() || 0}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-black/5 shadow-3xs">
                    <div className="text-[11px] font-bold text-zinc-400 uppercase font-mono">Tổng doanh số thành công</div>
                    <div className="text-xl font-black text-blue-600 mt-1">{(overview?.totalCompletedAmount || 0).toLocaleString()} đ</div>
                </div>
            </div>

            {/* Bộ tìm kiếm thanh công cụ */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-black/5 shadow-3xs mb-4">
                <div className="flex h-9 w-96 items-center gap-2 rounded-lg border border-black/10 bg-zinc-50 px-3">
                    <span className="text-zinc-400 text-xs">🔎</span>
                    <input
                        className="w-full bg-transparent text-xs font-medium text-zinc-700 outline-none"
                        placeholder="Tìm mã giao dịch, số tài khoản, tên... (Ấn Enter)"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                    />
                </div>

                <select
                    className="h-9 rounded-lg border border-black/10 bg-white px-3 text-xs font-semibold text-zinc-700 outline-none"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="completed">Thành công (completed)</option>
                    <option value="pending">Chờ xử lý (pending)</option>
                    <option value="failed">Thất bại (failed)</option>
                </select>
            </div>

            {/* Bảng kết xuất dữ liệu */}
            <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 font-bold uppercase text-[10px]">
                            <th className="p-4">Mã giao dịch</th>
                            <th className="p-4">Tài khoản nguồn</th>
                            <th className="p-4">Tài khoản đích</th>
                            <th className="p-4 text-right">Số tiền</th>
                            <th className="p-4 text-center">Loại</th>
                            <th className="p-4 font-mono">Thời gian</th>
                            <th className="p-4 text-center">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                        {loading ? (
                            <tr><td colSpan={7} className="p-8 text-center text-zinc-400 animate-pulse">Đang đồng bộ dữ liệu giao dịch từ DB...</td></tr>
                        ) : transactions.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-zinc-400">Không tìm thấy bản ghi giao dịch nào.</td></tr>
                        ) : (
                            transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-zinc-50/50">
                                    <td className="p-4 text-zinc-950 font-bold font-mono text-[11px]">{tx.transactionCode}</td>
                                    <td className="p-4">
                                        <div className="text-zinc-900">{tx.fromAccountName || "Hệ thống / Cash-in"}</div>
                                        {tx.fromAccountNumber && <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{tx.fromAccountNumber}</div>}
                                    </td>
                                    <td className="p-4">
                                        <div className="text-zinc-900">{tx.toAccountName || "Hệ thống / Fee-collection"}</div>
                                        {tx.toAccountNumber && <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{tx.toAccountNumber}</div>}
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold text-zinc-950">
                                        {tx.amount.toLocaleString()} đ
                                    </td>
                                    <td className="p-4 text-center text-[10px] uppercase text-zinc-500">{tx.transactionType}</td>
                                    <td className="p-4 font-mono text-zinc-500">{new Date(tx.createdAt).toLocaleString("vi-VN")}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tx.status.toLowerCase() === "completed" ? "bg-green-50 text-green-700" :
                                            tx.status.toLowerCase() === "failed" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                                            }`}>
                                            {tx.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </AdminShell>
    );
}