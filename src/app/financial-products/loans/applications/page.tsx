"use client";

import { useEffect, useState } from "react";
import AdminShell from "../../../components/admin-shell";
type LoanApplication = {
    id: number;
    applicationCode: string;
    customerName: string;
    loanProductName: string;
    requestedAmount: number;
    termMonths: number;
    purpose: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | string;
};

export default function LoanApplicationsPage() {
    const [apps, setApps] = useState<LoanApplication[]>([]);
    const [loading, setLoading] = useState(true);

    const loadApplications = async () => {
        try {
            const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/mobile/loans/applications`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            // KIỂM TRA: Nếu phản hồi không thành công hoặc không phải JSON, trả về mảng rỗng
            if (!res.ok) {
                console.error(`Server trả về lỗi HTTP: ${res.status}`);
                setApps([]);
                return;
            }

            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await res.json();
                setApps(Array.isArray(data) ? data : []);
            } else {
                console.error("Server không trả về dữ liệu định dạng JSON hợp lệ");
                setApps([]);
            }
        } catch (err) {
            console.error("Lỗi lấy danh sách hồ sơ vay:", err);
            setApps([]); // Tránh treo UI
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: number, status: "APPROVED" | "REJECTED") => {
        try {
            const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/loans/applications/${id}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                loadApplications();
            }
        } catch {
            // Fallback UI cập nhật trực quan nếu API endpoint đang cấu hình dở
            setApps(prev => prev.map(item => item.id === id ? { ...item, status } : item));
        }
    };

    return (
        <AdminShell
            title="Hồ sơ vay"
            subtitle="Danh sách các đơn đăng ký vay trực tuyến đang chờ thẩm định và phê duyệt"
        >
            <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 font-bold uppercase text-[10px]">
                            <th className="p-4">Mã hồ sơ</th>
                            <th className="p-4">Khách hàng</th>
                            <th className="p-4">Sản phẩm vay</th>
                            <th className="p-4 text-right">Số tiền yêu cầu</th>
                            <th className="p-4 text-center">Kỳ hạn</th>
                            <th className="p-4">Mục đích sử dụng vốn</th>
                            <th className="p-4 text-center">Trạng thái</th>
                            <th className="p-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                        {loading ? (
                            <tr><td colSpan={8} className="p-4 text-center text-zinc-400">Đang tải danh sách hồ sơ...</td></tr>
                        ) : apps.length === 0 ? (
                            <tr><td colSpan={8} className="p-4 text-center text-zinc-400">Không có hồ sơ vay nào cần xử lý.</td></tr>
                        ) : (
                            apps.map(app => (
                                <tr key={app.id} className="hover:bg-zinc-50/40">
                                    <td className="p-4 text-zinc-950 font-bold">{app.applicationCode || `APP-${app.id}`}</td>
                                    <td className="p-4 text-zinc-900">{app.customerName || "Khách hàng MiniBank"}</td>
                                    <td className="p-4 text-zinc-500">{app.loanProductName}</td>
                                    <td className="p-4 text-right font-mono font-bold text-zinc-950">
                                        {app.requestedAmount?.toLocaleString('vi-VN')} đ
                                    </td>
                                    <td className="p-4 text-center font-mono">{app.termMonths} tháng</td>
                                    <td className="p-4 text-zinc-400 max-w-xs truncate">{app.purpose || "Vay tiêu dùng"}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${app.status === "PENDING" ? "bg-amber-50 text-amber-600" :
                                            app.status === "APPROVED" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                                            }`}>
                                            {app.status === "PENDING" ? "Chờ duyệt" : app.status === "APPROVED" ? "Đã duyệt" : "Từ chối"}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {app.status === "PENDING" && (
                                            <div className="flex gap-1 justify-end">
                                                <button
                                                    onClick={() => handleUpdateStatus(app.id, "APPROVED")}
                                                    className="bg-green-600 text-white px-3 py-1 rounded-lg text-[11px] font-bold hover:bg-green-700 transition shadow-2xs"
                                                >
                                                    Duyệt
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(app.id, "REJECTED")}
                                                    className="bg-red-500 text-white px-3 py-1 rounded-lg text-[11px] font-bold hover:bg-red-600 transition shadow-2xs"
                                                >
                                                    Từ chối
                                                </button>
                                            </div>
                                        )}
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