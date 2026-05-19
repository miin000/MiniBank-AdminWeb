"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Eye, Filter } from "lucide-react";

import AdminShell from "../components/admin-shell";

import {
    fetchServiceRequests,
    ServiceRequestSummary,
} from "../../lib/api/service-requests";

import { StatusBadge } from "../components/requests/StatusBadge";
import { TypeBadge } from "../components/requests/TypeBadge";

const TYPE_OPTIONS = [
    { value: "", label: "Tất cả loại" },
    { value: "limit_change", label: "Nâng hạn mức" },
    { value: "profile_change", label: "Đổi thông tin" },
    { value: "close_account", label: "Tất toán số" },
    { value: "complaint", label: "Khiếu nại GD" },
];

const STATUS_OPTIONS = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "submitted", label: "Chờ xử lý" },
    { value: "processing", label: "Đang xử lý" },
    { value: "approved", label: "Đã duyệt" },
    { value: "rejected", label: "Từ chối" },
];

function formatDate(isoStr: string) {
    const d = new Date(isoStr);

    return d.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getInitial(name: string) {
    const parts = name?.trim().split(" ") ?? [];

    return parts[parts.length - 1]?.charAt(0)?.toUpperCase() ?? "?";
}

export default function AllRequestsPage() {
    const router = useRouter();

    const [requests, setRequests] = useState<ServiceRequestSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const data = await fetchServiceRequests(
                statusFilter || undefined,
                typeFilter || undefined
            );

            setRequests(data);
        } catch (e: unknown) {
            setError(
                e instanceof Error
                    ? e.message
                    : "Lỗi không xác định"
            );
        } finally {
            setLoading(false);
        }
    }, [statusFilter, typeFilter]);

    useEffect(() => {
        load();
    }, [load]);

    const filtered = requests.filter((r) => {
        const q = search.toLowerCase();

        return (
            !q ||
            r.userName?.toLowerCase().includes(q) ||
            String(r.id).includes(q) ||
            r.title?.toLowerCase().includes(q)
        );
    });

    const total = requests.length;

    const pending = requests.filter(
        (r) => r.status?.toLowerCase() === "submitted"
    ).length;

    const processing = requests.filter(
        (r) => r.status?.toLowerCase() === "processing"
    ).length;

    const highPriority = requests.filter(
        (r) => r.priorityTag?.toLowerCase() === "high"
    ).length;

    const sorted = [...filtered].sort((a, b) => {
        if (
            a.priorityTag === "high" &&
            b.priorityTag !== "high"
        ) {
            return -1;
        }

        if (
            b.priorityTag === "high" &&
            a.priorityTag !== "high"
        ) {
            return 1;
        }

        return (
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime()
        );
    });

    return (
        <AdminShell
            title="Yêu cầu thủ tục"
            subtitle="Quản lý tất cả yêu cầu thủ tục từ khách hàng"
        >
            <div className="min-h-screen bg-gray-50">
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="flex items-center flex-1 border border-gray-200 rounded-lg px-3 py-2 gap-2 bg-gray-50">
                        <svg
                            width="16"
                            height="16"
                            className="w-4 h-4 text-gray-400 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                cx="11"
                                cy="11"
                                r="8"
                                strokeWidth="2"
                            />

                            <path
                                d="m21 21-4.35-4.35"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>

                        <input
                            type="text"
                            className="bg-transparent flex-1 outline-none text-sm text-gray-700 placeholder:text-gray-400"
                            placeholder="Tìm theo tên KH, mã yêu cầu, mô tả..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />

                        <select
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none cursor-pointer"
                            value={typeFilter}
                            onChange={(e) =>
                                setTypeFilter(e.target.value)
                            }
                        >
                            {TYPE_OPTIONS.map((o) => (
                                <option
                                    key={o.value}
                                    value={o.value}
                                >
                                    {o.label}
                                </option>
                            ))}
                        </select>

                        <select
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none cursor-pointer"
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value)
                            }
                        >
                            {STATUS_OPTIONS.map((o) => (
                                <option
                                    key={o.value}
                                    value={o.value}
                                >
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 px-6 py-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-gray-500 mb-1">
                            Tổng yêu cầu
                        </p>

                        <p className="text-2xl font-bold text-gray-900">
                            {total}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 mb-1">
                            Chờ xử lý
                        </p>

                        <p className="text-2xl font-bold text-yellow-500">
                            {pending}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 mb-1">
                            Đang xử lý
                        </p>

                        <p className="text-2xl font-bold text-blue-500">
                            {processing}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 mb-1">
                            Ưu tiên cao
                        </p>

                        <p className="text-2xl font-bold text-red-500">
                            {highPriority}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                            Đang tải...
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center py-16 text-red-500 text-sm">
                            {error}
                        </div>
                    ) : sorted.length === 0 ? (
                        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                            Không có yêu cầu nào
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Mã YC
                                    </th>

                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Khách hàng
                                    </th>

                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Loại yêu cầu
                                    </th>

                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Mô tả
                                    </th>

                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Ngày gửi
                                    </th>

                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Trạng thái
                                    </th>

                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {sorted.map((req) => (
                                    <tr
                                        key={req.id}
                                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {req.priorityTag?.toLowerCase() ===
                                                    "high" && (
                                                        <span className="text-red-500 text-base">
                                                            ★
                                                        </span>
                                                    )}

                                                <span className="font-semibold text-gray-800">
                                                    SR
                                                    {String(req.id).padStart(
                                                        3,
                                                        "0"
                                                    )}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="w-7 h-7 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                                                    {getInitial(
                                                        req.userName || ""
                                                    )}
                                                </span>

                                                <span className="text-gray-700">
                                                    {req.userName}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">
                                            <TypeBadge
                                                type={req.requestType}
                                            />
                                        </td>

                                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                                            {req.title || "—"}
                                        </td>

                                        <td className="px-4 py-3 text-gray-500">
                                            {formatDate(req.submittedAt)}
                                        </td>

                                        <td className="px-4 py-3">
                                            <StatusBadge
                                                status={req.status}
                                            />
                                        </td>

                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() =>
                                                    router.push(
                                                        `/requests/${req.id}`
                                                    )
                                                }
                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />

                                                Chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AdminShell>
    );
}