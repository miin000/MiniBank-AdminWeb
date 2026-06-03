"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "../../../components/admin-shell";
import { Search, Filter, Eye } from "lucide-react";

interface LoanApplication {
    id: number;
    applicationCode: string;
    customerName: string;
    productName: string;
    amount: number;
    termMonths: number;
    monthlyIncome: number;
    status: string;
}

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount);

function mapStatus(status: string) {
    switch (status?.toLowerCase()) {
        case "approved":
            return {
                label: "Đã duyệt",
                className: "bg-emerald-100 text-emerald-700",
            };
        case "rejected":
            return {
                label: "Từ chối",
                className: "bg-red-100 text-red-700",
            };
        case "pending":
        default:
            return {
                label: "Chờ duyệt",
                className: "bg-yellow-100 text-yellow-700",
            };
    }
}

async function fetchAllStatuses(token: string): Promise<LoanApplication[]> {
    const statuses = ["pending", "approved", "rejected"];

    const results = await Promise.allSettled(
        statuses.map(async (status) => {
            const response = await fetch(
                `${API_BASE}/api/admin/approvals/loan-applications?status=${status}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
    );

    const merged: LoanApplication[] = [];

    results.forEach((result) => {
        if (result.status === "fulfilled" && Array.isArray(result.value)) {
            const mapped = result.value.map((item: any) => ({
                id: item.id,
                applicationCode: `HSV${String(item.id).padStart(5, "0")}`,
                customerName: item.userFullName || item.customerName || "Khách hàng",
                productName: item.productName || "Vay tiêu dùng",
                amount: Number(item.requestedAmount) || 0,
                termMonths: item.requestedTermMonths || item.termMonths || 0,
                monthlyIncome: Number(item.monthlyIncome) || 0,
                status: item.status || "pending",
            }));
            merged.push(...mapped);
        }
    });

    merged.sort((a, b) => b.id - a.id);
    return merged;
}

export default function LoanApplicationsPage() {
    const router = useRouter(); // ← thêm router

    const [applications, setApplications] = useState<LoanApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    async function fetchApplications() {
        try {
            setLoading(true);
            const token =
                localStorage.getItem("adminToken") ||
                localStorage.getItem("token") ||
                localStorage.getItem("accessToken") ||
                "";
            const data = await fetchAllStatuses(token);
            setApplications(data);
        } catch (error) {
            console.error("FETCH LOAN APPLICATIONS ERROR =", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchApplications();
    }, []);

    const filteredApplications = useMemo(() => {
        return applications.filter((item) => {
            const matchesSearch =
                item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.applicationCode.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus =
                statusFilter === "all" ||
                item.status.toLowerCase() === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [applications, searchQuery, statusFilter]);

    return (
        <AdminShell
            title="Hồ sơ vay"
            subtitle="Xem xét và phê duyệt hồ sơ vay của khách hàng"
        >
            <section className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">

                {/* FILTER */}
                <div className="flex flex-wrap items-center gap-4 border-b border-zinc-200 p-5">
                    <div className="relative min-w-[260px] flex-1">
                        <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                        />
                        <input
                            type="text"
                            placeholder="Tìm theo tên KH, mã hồ sơ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 hover:bg-zinc-50">
                        <Filter size={18} className="text-zinc-500" />
                    </button>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-11 rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-blue-500"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="pending">Chờ duyệt</option>
                        <option value="approved">Đã duyệt</option>
                        <option value="rejected">Từ chối</option>
                    </select>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px]">
                        <thead className="border-b border-zinc-200 bg-zinc-50">
                            <tr>
                                <th className="px-5 py-4 text-left text-sm font-semibold text-zinc-600">Mã hồ sơ</th>
                                <th className="px-5 py-4 text-left text-sm font-semibold text-zinc-600">Khách hàng</th>
                                <th className="px-5 py-4 text-left text-sm font-semibold text-zinc-600">Sản phẩm vay</th>
                                <th className="px-5 py-4 text-left text-sm font-semibold text-zinc-600">Số tiền vay</th>
                                <th className="px-5 py-4 text-left text-sm font-semibold text-zinc-600">Kỳ hạn</th>
                                <th className="px-5 py-4 text-left text-sm font-semibold text-zinc-600">Thu nhập</th>
                                <th className="px-5 py-4 text-left text-sm font-semibold text-zinc-600">Trạng thái</th>
                                <th className="px-5 py-4 text-center text-sm font-semibold text-zinc-600">Thao tác</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-14 text-center text-sm text-zinc-400">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredApplications.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-14 text-center text-sm text-zinc-400">
                                        Không có hồ sơ vay
                                    </td>
                                </tr>
                            ) : (
                                filteredApplications.map((item) => {
                                    const status = mapStatus(item.status);
                                    return (
                                        <tr
                                            key={item.id}
                                            className="border-b border-zinc-100 transition hover:bg-zinc-50"
                                        >
                                            <td className="px-5 py-5 text-[15px] font-semibold text-blue-600">
                                                {item.applicationCode}
                                            </td>

                                            <td className="px-5 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                                                        {item.customerName.charAt(0)}
                                                    </div>
                                                    <p className="text-[15px] font-medium text-zinc-900">
                                                        {item.customerName}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-5 py-5 text-[15px] text-zinc-700">
                                                {item.productName}
                                            </td>

                                            <td className="px-5 py-5 text-[15px] font-semibold text-zinc-900">
                                                {formatCurrency(item.amount)}
                                            </td>

                                            <td className="px-5 py-5 text-[15px] text-zinc-700">
                                                {item.termMonths} tháng
                                            </td>

                                            <td className="px-5 py-5 text-[15px] text-zinc-700">
                                                {formatCurrency(item.monthlyIncome)}
                                            </td>

                                            <td className="px-5 py-5">
                                                <span className={`inline-flex rounded-full px-4 py-2 text-sm font-medium ${status.className}`}>
                                                    {status.label}
                                                </span>
                                            </td>

                                            <td className="px-5 py-5 text-center">
                                                {/* ← SỬA: chuyển sang trang tất toán khoản vay */}
                                                <button
                                                    onClick={() =>
                                                        router.push(`/admin/loan-settlement/${item.id}`)
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                                                >
                                                    <Eye size={16} />
                                                    Chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </AdminShell>
    );
}