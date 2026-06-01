"use client";

import { useEffect, useState } from "react";
import AdminShell from "../../components/admin-shell";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface LoanApplication {
    id: number;
    userFullName: string;
    userPhone: string;
    productName: string;
    requestedAmount: number;
    termMonths: number;
    monthlyIncome: number;
    priorityTag: string;
    status: string;
    submittedAt: string;
}

export default function LoanApprovalPage() {
    const [data, setData] = useState<LoanApplication[]>([]);
    const [loading, setLoading] = useState(true);

    ```
const loadData = async () => {
    try {
        const token = localStorage.getItem("token");

        const res = await fetch(
            `${ API } /api/admin / approvals / loan - applications`,
            {
                headers: {
                    Authorization: `Bearer ${ token } `,
                },
            }
        );

        const json = await res.json();
        setData(json);
    } finally {
        setLoading(false);
    }
};

useEffect(() => {
    loadData();
}, []);

const approve = async (id: number) => {
    const token = localStorage.getItem("token");

    await fetch(
        `${ API } /api/admin / approvals / loan - applications / ${ id }/approve`,
    {
        method: "POST",
            headers: {
            Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        body: JSON.stringify({}),
        }
    );

    loadData();
};

const reject = async (id: number) => {
    const token = localStorage.getItem("token");

    await fetch(
        `${API}/api/admin/approvals/loan-applications/${id}/reject`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                reason: "Không đạt điều kiện",
            }),
        }
    );

    loadData();
};

return (
    <AdminShell
        title="Duyệt vay vốn"
        subtitle="Xét duyệt hồ sơ vay vốn khách hàng"
    >
        <div className="bg-white rounded-xl border border-gray-200">
            {loading ? (
                <div className="p-8 text-center">
                    Đang tải...
                </div>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="px-4 py-3 text-left">
                                Khách hàng
                            </th>
                            <th className="px-4 py-3 text-left">
                                Sản phẩm
                            </th>
                            <th className="px-4 py-3 text-left">
                                Số tiền
                            </th>
                            <th className="px-4 py-3 text-left">
                                Kỳ hạn
                            </th>
                            <th className="px-4 py-3 text-left">
                                Ưu tiên
                            </th>
                            <th className="px-4 py-3 text-left">
                                Hành động
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {data.map((item) => (
                            <tr
                                key={item.id}
                                className="border-b"
                            >
                                <td className="px-4 py-4">
                                    <div className="font-medium">
                                        {item.userFullName}
                                    </div>

                                    <div className="text-xs text-gray-500">
                                        {item.userPhone}
                                    </div>
                                </td>

                                <td className="px-4 py-4">
                                    {item.productName}
                                </td>

                                <td className="px-4 py-4 text-blue-600 font-semibold">
                                    {Number(
                                        item.requestedAmount
                                    ).toLocaleString("vi-VN")} đ
                                </td>

                                <td className="px-4 py-4">
                                    {item.termMonths} tháng
                                </td>

                                <td className="px-4 py-4">
                                    <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs">
                                        {item.priorityTag || "NORMAL"}
                                    </span>
                                </td>

                                <td className="px-4 py-4">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                approve(item.id)
                                            }
                                            className="px-3 py-1 rounded border border-green-300 text-green-600"
                                        >
                                            Duyệt
                                        </button>

                                        <button
                                            onClick={() =>
                                                reject(item.id)
                                            }
                                            className="px-3 py-1 rounded border border-red-300 text-red-600"
                                        >
                                            Từ chối
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    </AdminShell>
);
```

}
