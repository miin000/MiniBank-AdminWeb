"use client";

import Link from "next/link";
import {
    Search,
    Activity,
    Shield,
    AlertTriangle,
    ArrowLeft,
} from "lucide-react";
import { useMemo, useState } from "react";

type AuditType = "Giao dịch" | "Bảo mật" | "Cảnh báo";

type AuditLog = {
    id: number;
    time: string;
    type: AuditType;
    actor: string;
    action: string;
    ip: string;
    detail: string;
};

export default function AuditPage() {
    const auditLogs: AuditLog[] = [
        {
            id: 1,
            time: "2026-04-15 14:35:22",
            type: "Giao dịch",
            actor: "Trần Văn B",
            action: "Hoàn trả giao dịch TXN-20260415-001232",
            ip: "192.168.1.100",
            detail: "Lý do: Khách hàng chuyển nhầm số tài khoản",
        },
        {
            id: 2,
            time: "2026-04-15 12:10:15",
            type: "Giao dịch",
            actor: "Nguyễn Thị C",
            action: "Tất toán sổ tiết kiệm #STK-123456",
            ip: "192.168.1.101",
            detail: "Khách hàng: Phạm Minh D - Số tiền: 500,000,000đ",
        },
        {
            id: 3,
            time: "2026-04-15 11:22:33",
            type: "Giao dịch",
            actor: "Trần Văn B",
            action: "Mở hạn mức tín dụng cho User STK-0009876",
            ip: "192.168.1.100",
            detail: "Hạn mức: 200,000,000đ - Thời hạn: 12 tháng",
        },
        {
            id: 4,
            time: "2026-04-15 10:45:15",
            type: "Giao dịch",
            actor: "Trần Văn B",
            action: "Phê duyệt vay vốn ID #123",
            ip: "192.168.1.100",
            detail: "Khách hàng: Phạm Minh D - Số tiền: 500,000,000đ",
        },
        {
            id: 5,
            time: "2026-04-15 09:30:42",
            type: "Giao dịch",
            actor: "Nguyễn Thị C",
            action: "Nạp tiền ảo cho User STK-0001234",
            ip: "192.168.1.101",
            detail: "Số tiền: +10,000,000đ (Testing)",
        },
        {
            id: 6,
            time: "2026-04-14 18:15:22",
            type: "Bảo mật",
            actor: "Trần Văn B",
            action: "Tạo tài khoản nhân viên mới: Võ Thị F",
            ip: "192.168.1.100",
            detail: "Vai trò: Staff - Quyền: users, chat, transaction",
        },
        {
            id: 7,
            time: "2026-04-14 16:30:20",
            type: "Bảo mật",
            actor: "Hệ thống",
            action: "Backup dữ liệu tự động hoàn tất",
            ip: "System",
            detail: "Kích thước: 2.3 GB",
        },
        {
            id: 8,
            time: "2026-04-14 14:12:10",
            type: "Cảnh báo",
            actor: "Hệ thống",
            action: "Phát hiện nhiều yêu cầu đăng nhập từ IP lạ",
            ip: "185.123.45.67",
            detail: "5 lần thử đăng nhập trong 2 phút",
        },
        {
            id: 9,
            time: "2026-04-14 09:30:10",
            type: "Giao dịch",
            actor: "Nguyễn Thị C",
            action: "Phê duyệt KYC cho User STK-0001242",
            ip: "192.168.1.101",
            detail: "Tự động cấp STK mới",
        },
        {
            id: 10,
            time: "2026-04-13 16:55:40",
            type: "Bảo mật",
            actor: "Trần Văn B",
            action: "Khóa tài khoản nhân viên: Phạm Thị E",
            ip: "192.168.1.100",
            detail: "Lý do: Vi phạm quy định nội bộ",
        },
        {
            id: 11,
            time: "2026-04-13 15:20:15",
            type: "Bảo mật",
            actor: "Hệ thống",
            action: "Backup dữ liệu tự động hoàn tất",
            ip: "System",
            detail: "Kích thước: 2.1 GB",
        },
        {
            id: 12,
            time: "2026-04-12 13:45:00",
            type: "Cảnh báo",
            actor: "Hệ thống",
            action: "Phát hiện truy cập trái phép vào admin panel",
            ip: "203.22.11.8",
            detail: "Đã chặn truy cập và gửi cảnh báo",
        },
        {
            id: 13,
            time: "2026-04-12 08:20:18",
            type: "Giao dịch",
            actor: "Nguyễn Thị C",
            action: "Mở tài khoản tiết kiệm cho User STK-999123",
            ip: "192.168.1.101",
            detail: "Số tiền gửi ban đầu: 100,000,000đ",
        },
        {
            id: 14,
            time: "2026-04-11 18:00:00",
            type: "Bảo mật",
            actor: "Hệ thống",
            action: "Cập nhật firewall hệ thống",
            ip: "System",
            detail: "Phiên bản bảo mật: v2.5.1",
        },
    ];

    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("Tất cả");
    const [selectedDate, setSelectedDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 7;

    const filteredLogs = useMemo(() => {
        return auditLogs.filter((log) => {
            const matchSearch =
                log.actor.toLowerCase().includes(search.toLowerCase()) ||
                log.action.toLowerCase().includes(search.toLowerCase());

            const matchType =
                filterType === "Tất cả" || log.type === filterType;

            const matchDate =
                !selectedDate || log.time.startsWith(selectedDate);

            return matchSearch && matchType && matchDate;
        });
    }, [search, filterType, selectedDate]);

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getTypeStyle = (type: AuditType) => {
        switch (type) {
            case "Giao dịch":
                return "bg-blue-50 text-blue-600";
            case "Bảo mật":
                return "bg-green-50 text-green-600";
            case "Cảnh báo":
                return "bg-orange-50 text-orange-500";
        }
    };

    const stats = {
        giaoDich: auditLogs.filter((x) => x.type === "Giao dịch").length,
        baoMat: auditLogs.filter((x) => x.type === "Bảo mật").length,
        canhBao: auditLogs.filter((x) => x.type === "Cảnh báo").length,
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8">
            <div className="mx-auto max-w-7xl">
                {/* HEADER */}
                <div className="mb-6">
                    <div className="mb-3 flex items-center gap-3">
                        <Link
                            href="/"
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-black"
                        >
                            <ArrowLeft size={18} />
                        </Link>

                        <h1 className="text-[34px] font-bold leading-tight text-black md:text-[40px]">
                            Nhật ký hệ thống
                        </h1>
                    </div>

                    <p className="ml-12 text-[15px] font-normal text-gray-600 md:text-[16px]">
                        Audit trail - Theo dõi mọi hoạt động trong hệ thống
                    </p>
                </div>

                {/* FILTER */}
                <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                        <div>
                            <label className="mb-2 block text-[14px] font-semibold text-gray-700">
                                Tìm kiếm
                            </label>

                            <div className="flex items-center rounded-2xl border border-gray-300 px-4 py-3">
                                <Search size={18} className="text-gray-400" />

                                <input
                                    type="text"
                                    placeholder="Tìm theo nhân viên hoặc hành động..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="ml-3 w-full text-[14px] text-gray-700 placeholder:text-gray-400 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-[14px] font-semibold text-gray-700">
                                Loại hành động
                            </label>

                            <select
                                value={filterType}
                                onChange={(e) => {
                                    setFilterType(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-[14px] text-gray-700 outline-none"
                            >
                                <option>Tất cả</option>
                                <option>Giao dịch</option>
                                <option>Bảo mật</option>
                                <option>Cảnh báo</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-[14px] font-semibold text-gray-700">
                                Ngày
                            </label>

                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-[14px] text-gray-700 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* STATS */}
                <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5">
                        <div className="flex items-center gap-4">
                            <div className="rounded-2xl bg-blue-50 p-3">
                                <Activity size={20} className="text-blue-600" />
                            </div>

                            <div>
                                <p className="text-[14px] text-gray-600">
                                    Giao dịch
                                </p>

                                <h3 className="text-[26px] font-bold text-black">
                                    {stats.giaoDich}
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5">
                        <div className="flex items-center gap-4">
                            <div className="rounded-2xl bg-green-50 p-3">
                                <Shield size={20} className="text-green-600" />
                            </div>

                            <div>
                                <p className="text-[14px] text-gray-600">
                                    Bảo mật
                                </p>

                                <h3 className="text-[26px] font-bold text-black">
                                    {stats.baoMat}
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5">
                        <div className="flex items-center gap-4">
                            <div className="rounded-2xl bg-orange-50 p-3">
                                <AlertTriangle
                                    size={20}
                                    className="text-orange-500"
                                />
                            </div>

                            <div>
                                <p className="text-[14px] text-gray-600">
                                    Cảnh báo
                                </p>

                                <h3 className="text-[26px] font-bold text-black">
                                    {stats.canhBao}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TABLE */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1400px] border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 bg-white">
                                    <th className="px-6 py-4 text-left text-[14px] font-semibold text-gray-700">
                                        Thời gian
                                    </th>
                                    <th className="px-6 py-4 text-left text-[14px] font-semibold text-gray-700">
                                        Loại
                                    </th>
                                    <th className="px-6 py-4 text-left text-[14px] font-semibold text-gray-700">
                                        Tác nhân
                                    </th>
                                    <th className="px-6 py-4 text-left text-[14px] font-semibold text-gray-700">
                                        Hành động
                                    </th>
                                    <th className="px-6 py-4 text-left text-[14px] font-semibold text-gray-700">
                                        IP
                                    </th>
                                    <th className="px-6 py-4 text-left text-[14px] font-semibold text-gray-700">
                                        Chi tiết
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedLogs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="border-b border-gray-200 align-top hover:bg-gray-50/40"
                                    >
                                        <td className="whitespace-nowrap px-6 py-5 text-[14px] font-medium text-gray-800">
                                            {log.time}
                                        </td>

                                        <td className="px-6 py-5">
                                            <span
                                                className={`inline-flex rounded-lg px-3 py-2 text-[13px] font-semibold ${getTypeStyle(
                                                    log.type
                                                )}`}
                                            >
                                                {log.type}
                                            </span>
                                        </td>

                                        <td className="px-6 py-5 text-[14px] font-semibold leading-7 text-gray-900">
                                            {log.actor}
                                        </td>

                                        <td className="max-w-[280px] px-6 py-5 text-[14px] font-medium leading-7 text-gray-900">
                                            {log.action}
                                        </td>

                                        <td className="px-6 py-5">
                                            <span className="inline-flex rounded-md bg-gray-100 px-3 py-1.5 font-mono text-[13px] text-gray-700">
                                                {log.ip}
                                            </span>
                                        </td>

                                        <td className="max-w-[340px] px-6 py-5">
                                            <p className="truncate text-[14px] font-normal leading-7 text-gray-600">
                                                {log.detail}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* FOOTER */}
                    <div className="flex flex-col items-start justify-between gap-4 border-t border-gray-200 px-6 py-4 md:flex-row md:items-center">
                        <p className="text-[14px] font-medium text-gray-500">
                            Hiển thị {filteredLogs.length} / {auditLogs.length} bản ghi
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.max(prev - 1, 1)
                                    )
                                }
                                disabled={currentPage === 1}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-[14px] font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Trước
                            </button>

                            {Array.from(
                                { length: totalPages },
                                (_, i) => i + 1
                            ).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`h-9 min-w-9 rounded-lg px-3 text-[14px] font-semibold transition ${currentPage === page
                                            ? "bg-blue-600 text-white"
                                            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.min(prev + 1, totalPages)
                                    )
                                }
                                disabled={currentPage === totalPages}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-[14px] font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}