"use client";

import AdminShell from "../components/admin-shell";

export default function SystemPage() {
    return (
        <AdminShell title="Quan tri he thong" subtitle="Cau hinh va giam sat he thong">
            <main className="mx-auto max-w-6xl space-y-6">
                <div className="rounded-2xl bg-white p-6 shadow-sm border">
                    <h2 className="text-sm font-semibold mb-4">Cau hinh he thong</h2>

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

                <div className="rounded-2xl bg-white p-6 shadow-sm border">
                    <h2 className="text-sm font-semibold mb-4">Nhat ky he thong</h2>

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
        </AdminShell>
    );
}