"use client";

import React, { useEffect, useState, useCallback } from "react";

import AdminShell from "../../components/admin-shell";

import {
    fetchServiceRequests,
    approveServiceRequest,
    rejectServiceRequest,
    ServiceRequestSummary,
} from "../../../lib/api/service-requests";

function formatMoney(amount: number | undefined | null) {
    if (amount == null) return "—";

    return amount.toLocaleString("vi-VN") + " đ";
}

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

export default function LimitsPage() {
    const [requests, setRequests] = useState<ServiceRequestSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [activeTab, setActiveTab] = useState<
        "pending" | "dashboard"
    >("pending");

    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const [toast, setToast] = useState<{
        msg: string;
        type: "success" | "error";
    } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const data = await fetchServiceRequests(
                undefined,
                "limit_change"
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
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const showToast = (
        msg: string,
        type: "success" | "error"
    ) => {
        setToast({ msg, type });

        setTimeout(() => setToast(null), 3000);
    };

    const handleApprove = async (id: number) => {
        setActionLoading(id);

        try {
            await approveServiceRequest(
                id,
                "Đã duyệt bởi admin"
            );

            showToast(
                "Đã duyệt yêu cầu thành công!",
                "success"
            );

            await load();
        } catch {
            showToast(
                "Duyệt thất bại, thử lại!",
                "error"
            );
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: number) => {
        setActionLoading(id);

        try {
            await rejectServiceRequest(
                id,
                "Không đủ điều kiện"
            );

            showToast(
                "Đã từ chối yêu cầu!",
                "success"
            );

            await load();
        } catch {
            showToast(
                "Từ chối thất bại, thử lại!",
                "error"
            );
        } finally {
            setActionLoading(null);
        }
    };

    const pendingRequests = requests.filter(
        (r) => r.status?.toLowerCase() === "submitted"
    );

    return (
        <AdminShell
            title="Quản lý Hạn mức"
            subtitle="Thiết lập và phê duyệt hạn mức giao dịch"
        >
            <div className="min-h-screen bg-gray-50">
                {toast && (
                    <div
                        className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === "success"
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                            }`}
                    >
                        {toast.msg}
                    </div>
                )}

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="flex border-b border-gray-100">
                        <button
                            onClick={() =>
                                setActiveTab("pending")
                            }
                            className={`px-6 py-4 text-sm font-medium transition-colors relative ${activeTab === "pending"
                                ? "text-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Yêu cầu nâng hạn mức (
                            {pendingRequests.length})

                            {activeTab === "pending" && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
                            )}
                        </button>

                        <button
                            onClick={() =>
                                setActiveTab("dashboard")
                            }
                            className={`px-6 py-4 text-sm font-medium transition-colors relative ${activeTab === "dashboard"
                                ? "text-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Bảng điều khiển hạn mức

                            {activeTab === "dashboard" && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
                            )}
                        </button>
                    </div>

                    {activeTab === "pending" && (
                        <div>
                            {loading ? (
                                <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                                    Đang tải...
                                </div>
                            ) : error ? (
                                <div className="flex items-center justify-center py-16 text-red-500 text-sm">
                                    {error}
                                </div>
                            ) : pendingRequests.length === 0 ? (
                                <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                                    Không có yêu cầu chờ duyệt nào
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50">
                                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                                                Khách hàng
                                            </th>

                                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                                                Hạn mức hiện tại
                                            </th>

                                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                                                Hạn mức yêu cầu
                                            </th>

                                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                                                Lý do
                                            </th>

                                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                                                Ngày tạo
                                            </th>

                                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                                                Hành động
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {pendingRequests.map((req) => {
                                            let currentLimit: number | null =
                                                null;

                                            let requestedLimit: number | null =
                                                null;

                                            let reason =
                                                req.title || "—";

                                            try {
                                                const payload =
                                                    req as unknown as {
                                                        payloadJson?: string;
                                                    };

                                                if (
                                                    payload.payloadJson
                                                ) {
                                                    const p = JSON.parse(
                                                        payload.payloadJson
                                                    );

                                                    currentLimit =
                                                        p.currentDailyTransferLimit ??
                                                        null;

                                                    requestedLimit =
                                                        p.requestedDailyTransferLimit ??
                                                        null;

                                                    reason =
                                                        p.reason ||
                                                        reason;
                                                }
                                            } catch { }

                                            const isLoading =
                                                actionLoading ===
                                                req.id;

                                            return (
                                                <tr
                                                    key={req.id}
                                                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-gray-800">
                                                            {
                                                                req.userName
                                                            }
                                                        </div>

                                                        <div className="text-xs text-gray-400 mt-0.5">
                                                            {
                                                                req.userPhone
                                                            }
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4 text-gray-600">
                                                        {formatMoney(
                                                            currentLimit
                                                        )}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        {requestedLimit !=
                                                            null ? (
                                                            <div>
                                                                <div className="text-green-600 font-semibold">
                                                                    {formatMoney(
                                                                        requestedLimit
                                                                    )}
                                                                </div>

                                                                {currentLimit !=
                                                                    null && (
                                                                        <div className="text-xs text-green-500">
                                                                            +
                                                                            {formatMoney(
                                                                                requestedLimit -
                                                                                currentLimit
                                                                            )}
                                                                        </div>
                                                                    )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="px-6 py-4 text-gray-600 max-w-xs">
                                                        {reason}
                                                    </td>

                                                    <td className="px-6 py-4 text-gray-500">
                                                        {formatDate(
                                                            req.submittedAt
                                                        )}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                disabled={
                                                                    isLoading
                                                                }
                                                                onClick={() =>
                                                                    handleApprove(
                                                                        req.id
                                                                    )
                                                                }
                                                                className="px-4 py-1.5 text-xs font-semibold text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {isLoading
                                                                    ? "..."
                                                                    : "Duyệt"}
                                                            </button>

                                                            <button
                                                                disabled={
                                                                    isLoading
                                                                }
                                                                onClick={() =>
                                                                    handleReject(
                                                                        req.id
                                                                    )
                                                                }
                                                                className="px-4 py-1.5 text-xs font-semibold text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {isLoading
                                                                    ? "..."
                                                                    : "Từ chối"}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {activeTab === "dashboard" && (
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                                    <p className="text-xs text-blue-500 font-medium mb-2">
                                        Tổng yêu cầu hạn mức
                                    </p>

                                    <p className="text-3xl font-bold text-blue-700">
                                        {requests.length}
                                    </p>
                                </div>

                                <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-100">
                                    <p className="text-xs text-yellow-600 font-medium mb-2">
                                        Chờ duyệt
                                    </p>

                                    <p className="text-3xl font-bold text-yellow-600">
                                        {
                                            requests.filter(
                                                (r) =>
                                                    r.status?.toLowerCase() ===
                                                    "submitted"
                                            ).length
                                        }
                                    </p>
                                </div>

                                <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                                    <p className="text-xs text-green-600 font-medium mb-2">
                                        Đã duyệt
                                    </p>

                                    <p className="text-3xl font-bold text-green-600">
                                        {
                                            requests.filter(
                                                (r) =>
                                                    r.status?.toLowerCase() ===
                                                    "approved"
                                            ).length
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminShell>
    );
}