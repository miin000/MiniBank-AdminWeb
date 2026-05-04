"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface KycRequestSummary {
    id: number;
    userId: number;
    phone: string;
    email: string;
    fullName: string;
    dob: string;
    citizenId: string;
    address: string;
    status: string;
    submittedAt: string;
}

const API_BASE = "http://localhost:8080/api/admin/kyc";

export default function KycAdminPage() {
    const [requests, setRequests] = useState<KycRequestSummary[]>([]);
    const [selectedKyc, setSelectedKyc] = useState<KycRequestSummary | null>(null);
    const [note, setNote] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const fetchPendingKyc = async () => {
        try {
            const token = localStorage.getItem("adminToken");
            const res = await fetch(`${API_BASE}/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setRequests(await res.json());
        } catch (error) {
            console.error("Lỗi tải KYC:", error);
        }
    };

    useEffect(() => { fetchPendingKyc(); }, []);

    const handleDecision = async (type: 'approve' | 'reject') => {
        if (!selectedKyc) return;
        try {
            const token = localStorage.getItem("adminToken");
            const res = await fetch(`${API_BASE}/${selectedKyc.id}/${type}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    note,
                    accountNumber: type === 'approve' ? accountNumber : null
                })
            });

            if (res.ok) {
                alert(type === 'approve' ? "Đã phê duyệt!" : "Đã từ chối!");
                setSelectedKyc(null);
                fetchPendingKyc();
            }
        } catch (error) {
            alert("Lỗi xử lý hệ thống");
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-[#F9FAFB] p-8 text-[#111827]">
            {/* Header tương tự các trang khác */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Kiểm duyệt KYC</h1>
                    <p className="mt-1 text-sm text-zinc-500">Xem xét và phê duyệt hồ sơ xác minh danh tính.</p>
                </div>
                <Link href="/" className="h-11 flex items-center px-5 rounded-xl border border-black/10 bg-white text-sm font-bold hover:bg-zinc-50">
                    QUAY LẠI
                </Link>
            </div>

            <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50/50 text-xs font-bold uppercase text-zinc-500">
                        <tr>
                            <th className="px-6 py-4">Mã KYC</th>
                            <th className="px-6 py-4">Khách hàng</th>
                            <th className="px-6 py-4">Ngày gửi</th>
                            <th className="px-6 py-4">Trạng thái</th>
                            <th className="px-6 py-4 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                        {requests.map((req) => (
                            <tr key={req.id} className="hover:bg-zinc-50/50">
                                <td className="px-6 py-4 font-medium">KYC{req.id.toString().padStart(3, '0')}</td>
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-blue-600">{req.fullName}</div>
                                    <div className="text-xs text-zinc-400">{req.phone}</div>
                                </td>
                                <td className="px-6 py-4 text-zinc-500">{new Date(req.submittedAt).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700 font-medium">Chờ duyệt</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => setSelectedKyc(req)} className="text-blue-600 font-bold text-xs hover:underline">
                                        XEM CHI TIẾT
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedKyc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Chi tiết KYC - KYC{selectedKyc.id}</h2>
                            <button onClick={() => setSelectedKyc(null)} className="text-2xl text-zinc-400">×</button>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            {/* Cột trái: Thông tin cá nhân */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Thông tin cá nhân</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <span className="text-zinc-500">Họ tên:</span> <span className="font-bold">{selectedKyc.fullName}</span>
                                    <span className="text-zinc-500">Ngày sinh:</span> <span className="font-bold">{selectedKyc.dob}</span>
                                    <span className="text-zinc-500">Số CCCD:</span> <span className="font-bold">{selectedKyc.citizenId}</span>
                                    <span className="text-zinc-500">Địa chỉ:</span> <span className="font-bold">{selectedKyc.address}</span>
                                </div>

                                <div className="mt-6 pt-6 border-t border-zinc-100">
                                    <label className="text-xs font-bold text-zinc-400 uppercase">Lý do từ chối (nếu có)</label>
                                    <textarea
                                        className="mt-2 w-full p-3 border rounded-xl outline-none focus:border-blue-400 min-h-[100px]"
                                        placeholder="Nhập lý do..."
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Tài liệu đính kèm</h3>
                                <div className="grid grid-cols-1 gap-4">

                                    {['Mặt trước CCCD', 'Mặt sau CCCD', 'Ảnh chân dung'].map(label => (
                                        <div key={label} className="border rounded-xl p-4 text-center">
                                            <p className="text-xs text-zinc-400 mb-2">{label}</p>
                                            <div className="h-32 bg-zinc-50 rounded flex items-center justify-center border-dashed border-2 text-zinc-300">
                                                [Hình ảnh {label}]
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3 pt-6 border-t">
                            <button
                                onClick={() => handleDecision('reject')}
                                className="px-6 py-2.5 rounded-xl border font-bold text-red-600 hover:bg-red-50"
                            >
                                TỪ CHỐI
                            </button>
                            <button
                                onClick={() => handleDecision('approve')}
                                className="px-6 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700"
                            >
                                PHÊ DUYỆT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}