"use client";

import Link from "next/link";

export default function SystemPage() {
    return (
        <div className="min-h-screen bg-[#f6f7fb] text-[#111827]">
            {/* Header */}
            <header className="border-b border-black/5 bg-white">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
                    <h1 className="text-lg font-semibold">Quản trị hệ thống</h1>
                    <Link href="/" className="text-sm text-blue-600">
                        ← Về dashboard
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="mx-auto max-w-6xl p-6 space-y-6">
                {/* Card */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border">
                    <h2 className="text-sm font-semibold mb-4">
                        Cấu hình hệ thống
                    </h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm">Tên hệ thống</label>
                            <input
                                className="mt-1 w-full h-10 border rounded-lg px-3"
                                placeholder="MiniBank Admin"
                            />
                        </div>

                        <div>
                            <label className="text-sm">Email hỗ trợ</label>
                            <input
                                className="mt-1 w-full h-10 border rounded-lg px-3"
                                placeholder="support@bank.vn"
                            />
                        </div>
                    </div>

                    <button className="mt-4 h-10 px-4 bg-blue-600 text-white rounded-lg">
                        Lưu cấu hình
                    </button>
                </div>

                {/* Log */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border">
                    <h2 className="text-sm font-semibold mb-4">
                        Nhật ký hệ thống
                    </h2>

                    <table className="w-full text-sm">
                        <thead className="text-xs text-gray-500">
                            <tr>
                                <th className="text-left py-2">Thời gian</th>
                                <th className="text-left py-2">Hành động</th>
                                <th className="text-left py-2">Người thực hiện</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-t">
                                <td className="py-2">05/05/2026</td>
                                <td>Cập nhật cấu hình</td>
                                <td>admin</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}