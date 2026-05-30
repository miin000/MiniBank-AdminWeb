"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Eye, Calendar, X, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import AdminShell from "../../components/admin-shell";

// --- Interface dữ liệu Giao dịch ---
interface BankTransaction {
    id: string;
    timestamp: string; // Định dạng chuẩn: YYYY-MM-DD HH:mm:ss
    senderName: string;
    senderStk: string;
    receiverName: string;
    receiverStk: string;
    amount: number;
    status: "Thành công" | "Đã hoàn trả" | "Đang xử lý" | "Thất bại";
    description: string;
}

export default function TransactionsManagementPage() {
    // --- States quản lý danh sách và bộ lọc ---
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [minAmount, setMinAmount] = useState("");
    const [maxAmount, setMaxAmount] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // --- Phân trang ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // --- Popup biên lai ---
    const [selectedTx, setSelectedTx] = useState<BankTransaction | null>(null);

    // --- HOVER ANIMATION STATES ---
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [activePoint, setActivePoint] = useState<{ x: number; y: number; time: string; amount: number } | null>(null);

    useEffect(() => {
        // Mock Data gốc đầy đủ thông tin dòng tiền
        const mockData: BankTransaction[] = [
            {
                id: "TXN-20260415-881234",
                timestamp: "2026-04-15 16:23:45",
                senderName: "Nguyễn Văn A",
                senderStk: "STK-8001234",
                receiverName: "Trần Thị B",
                receiverStk: "STK-0085678",
                amount: 550000000,
                status: "Thành công",
                description: "Chuyển tiền mua xe ô tô cũ",
            },
            {
                id: "TXN-20260415-881233",
                timestamp: "2026-04-15 12:15:22",
                senderName: "Lê Minh C",
                senderStk: "STK-8002345",
                receiverName: "Phạm Hồng D",
                receiverStk: "STK-0083456",
                amount: 25000000,
                status: "Thành công",
                description: "Thanh toán tiền mượn tháng trước",
            },
            {
                id: "TXN-20260415-881232",
                timestamp: "2026-04-15 08:50:11",
                senderName: "Hoàng Thị E",
                senderStk: "STK-8006789",
                receiverName: "Vũ Văn F",
                receiverStk: "STK-0086789",
                amount: 15000000,
                status: "Đã hoàn trả",
                description: "Hoàn tiền lệnh giao dịch lỗi hệ thống",
            },
            {
                id: "TXN-20260415-881231",
                timestamp: "2026-04-15 20:42:33",
                senderName: "Đặng Minh G",
                senderStk: "STK-8007890",
                receiverName: "Bùi Thị H",
                receiverStk: "STK-0088901",
                amount: 8500000,
                status: "Đang xử lý",
                description: "Chuyển khoản liên ngân hàng 247 chờ quyết toán",
            },
            {
                id: "TXN-20260415-881230",
                timestamp: "2026-04-15 00:30:18",
                senderName: "Ngô Văn I",
                senderStk: "STK-8009012",
                receiverName: "Trương Thị K",
                receiverStk: "STK-0081123",
                amount: 3200000,
                status: "Thất bại",
                description: "Tài khoản nguồn không đủ số dư khả dụng",
            },
            {
                id: "TXN-20260415-881229",
                timestamp: "2026-04-15 12:05:45",
                senderName: "Phan Minh L",
                senderStk: "STK-8002234",
                receiverName: "Lý Thị M",
                receiverStk: "STK-0083345",
                amount: 125000000,
                status: "Thành công",
                description: "Nạp tiền ký quỹ đại lý cấp 1",
            },
        ];
        setTransactions(mockData);
        setLoading(false);
    }, []);

    // --- LOGIC BỘ LỌC NÂNG CAO ---
    const filteredTransactions = transactions.filter((item) => {
        const matchesSearch =
            item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.receiverName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;

        const numMin = minAmount ? parseFloat(minAmount) * 1000000 : 0;
        const numMax = maxAmount ? parseFloat(maxAmount) * 1000000 : Infinity;
        const matchesAmount = item.amount >= numMin && item.amount <= numMax;

        return matchesSearch && matchesStatus && matchesAmount;
    });

    // --- LOGIC TỰ ĐỘNG PHÂN TÍCH DỮ LIỆU ĐỂ DỰNG BIỂU ĐỒ ĐỘNG ---
    const baseHours = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"];

    const dynamicChartData = baseHours.map((time) => {
        // Lấy ra giờ số nguyên (ví dụ: "04:00" -> 4)
        const targetHour = parseInt(time.split(":")[0]);

        // Gom tất cả giao dịch thuộc khoảng giờ này và tính tổng tiền (quy đổi ra đơn vị Triệu Đô/Triệu VNĐ để vẽ đồ thị)
        const totalAmountInSlot = filteredTransactions
            .filter((t) => {
                const tHour = new Date(t.timestamp.replace(/-/g, "/")).getHours();
                if (targetHour === 23) return tHour >= 21 && tHour <= 23;
                return tHour >= targetHour && tHour < targetHour + 4;
            })
            .reduce((sum, t) => sum + t.amount / 1000000, 0); // Chia 1 triệu để lấy đơn vị hiển thị ngắn gọn

        return {
            time,
            amount: parseFloat(totalAmountInSlot.toFixed(1)), // Làm tròn 1 chữ số thập phân
        };
    });

    // --- THIẾT LẬP HÌNH HỌC TỌA ĐỘ CHO ĐỒ THỊ SVG ĐỘNG ---
    const width = 1000;
    const height = 180;
    const paddingX = 50;
    const paddingY = 40;
    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingY * 2;

    // Lấy mốc tiền cao nhất hiện tại của bộ lọc để định cỡ trục Y tự động co giãn
    const maxAmountVal = Math.max(...dynamicChartData.map((d) => d.amount)) || 10;

    const points = dynamicChartData.map((d, index) => {
        const x = paddingX + (index / (dynamicChartData.length - 1)) * chartWidth;
        const y = height - paddingY - (d.amount / maxAmountVal) * chartHeight;
        return { x, y, time: d.time, amount: d.amount };
    });

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

    // --- HIỆU ỨNG TÍNH TOÁN HÚT CHUỘT THEO TOÀN VÙNG SVG ---
    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
        if (!svgRef.current) return;

        const rect = svgRef.current.getBoundingClientRect();
        const mouseXInSvg = ((e.clientX - rect.left) / rect.width) * width;

        let closestPoint = points[0];
        let minDistance = Math.abs(mouseXInSvg - points[0].x);

        for (let i = 1; i < points.length; i++) {
            const distance = Math.abs(mouseXInSvg - points[i].x);
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = points[i];
            }
        }
        setActivePoint(closestPoint);
    };

    // --- Tính toán phân trang bảng dữ liệu ---
    const totalItems = filteredTransactions.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const currentItems = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const totalVolumeSum = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

    return (
        <AdminShell title="Quản lý Giao dịch" subtitle="Theo dõi và quản lý mọi giao dịch chuyển tiền trong hệ thống">
            <div className="space-y-6 font-sans text-gray-800">

                {/* --- KPI Cards Widgets --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div><p className="text-xs font-semibold text-gray-400">Tổng giao dịch </p><p className="text-xl font-bold text-gray-900 mt-1">{totalItems}</p></div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold">đ</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div><p className="text-xs font-semibold text-gray-400">Thành công</p><p className="text-xl font-bold text-emerald-600 mt-1">{filteredTransactions.filter(t => t.status === "Thành công").length}</p></div>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs">📈</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div><p className="text-xs font-semibold text-gray-400">Tổng giá trị</p><p className="text-xl font-bold text-purple-600 mt-1">{new Intl.NumberFormat("vi-VN").format(totalVolumeSum)} đ</p></div>
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg text-xs">💰</div>
                    </div>
                </div>

                {/* --- KHỐI BIỂU ĐỒ ĐỘNG 100% CẬP NHẬT THEO DATA & HOVER MƯỢT MÀ --- */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold text-gray-700">Biểu đồ phát sinh dòng tiền động theo giờ (Triệu đ)</p>
                        {searchQuery || statusFilter !== "ALL" || minAmount || maxAmount ? (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded animate-pulse">Đang hiển thị dữ liệu đã lọc</span>
                        ) : null}
                    </div>

                    <div className="relative w-full overflow-visible mt-4">
                        <svg
                            ref={svgRef}
                            viewBox={`0 0 ${width} ${height}`}
                            className="w-full h-auto overflow-visible cursor-crosshair"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => setActivePoint(null)}
                        >
                            {/* Hệ thống lưới ngang mờ tự động */}
                            <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#f3f4f6" strokeWidth={1} />
                            <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="#f3f4f6" strokeWidth={1} />
                            <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#e5e7eb" strokeWidth={1} />

                            {/* Vẽ đường Path uốn lượn động */}
                            <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300 ease-in-out" />

                            {/* Thước kẻ dọc di chuyển theo chuột */}
                            {activePoint && (
                                <line
                                    x1={activePoint.x}
                                    y1={paddingY}
                                    x2={activePoint.x}
                                    y2={height - paddingY}
                                    stroke="#3b82f6"
                                    strokeWidth={1.5}
                                    strokeDasharray="4 4"
                                    className="transition-all duration-150 ease-out"
                                />
                            )}

                            {/* Vẽ các điểm nút tròn biến đổi vị trí theo dữ liệu */}
                            {points.map((p, i) => (
                                <circle
                                    key={i}
                                    cx={p.x}
                                    cy={p.y}
                                    r={activePoint?.time === p.time ? 6 : 4}
                                    fill="white"
                                    stroke={activePoint?.time === p.time ? "#2563eb" : "#3b82f6"}
                                    strokeWidth={activePoint?.time === p.time ? 3 : 2}
                                    className="transition-all duration-300 ease-in-out"
                                />
                            ))}
                        </svg>

                        {/* TOOLTIP NỔI BÁM THEO DI CHUYỂN CHUỘT CỰC MƯỢT */}
                        {activePoint && (
                            <div
                                className="absolute bg-white text-gray-900 text-[11px] px-3 py-2 rounded-lg shadow-2xl border border-gray-100 font-medium transition-all duration-150 ease-out pointer-events-none z-20"
                                style={{
                                    left: `${(activePoint.x / width) * 100}%`,
                                    top: `${(activePoint.y / height) * 100 - 32}%`,
                                    transform: "translateX(-50%)",
                                }}
                            >
                                <div className="text-gray-900 font-bold text-xs">{activePoint.time}</div>
                                <div className="text-blue-600 font-semibold mt-0.5 whitespace-nowrap">amount : <span className="font-bold">{activePoint.amount}M đ</span></div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between px-10 text-[11px] text-gray-400 font-bold mt-2">
                        {dynamicChartData.map((d) => <span key={d.time}>{d.time}</span>)}
                    </div>
                </div>

                {/* --- THANH BỘ LỌC TÌM KIẾM --- */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">Tìm kiếm</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                placeholder="Mã giao dịch, tên người gửi/nhận..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-gray-50/50 text-gray-800"
                            />
                        </div>
                    </div>

                    <div className="space-y-1 relative">
                        <label className="text-xs font-bold text-gray-600">Trạng thái</label>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full flex items-center justify-between px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-xs text-gray-700 focus:outline-none"
                        >
                            <span>{statusOptions.find(o => o.value === statusFilter)?.label}</span>
                            <ChevronDown size={14} className="text-gray-400" />
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-30 py-1 text-xs">
                                {statusOptions.map(o => (
                                    <button
                                        key={o.value}
                                        onClick={() => { setStatusFilter(o.value); setIsDropdownOpen(false); setCurrentPage(1); }}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700"
                                    >
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">Từ (triệu đ)</label>
                        <input
                            type="number"
                            placeholder="0"
                            value={minAmount}
                            onChange={(e) => { setMinAmount(e.target.value); setCurrentPage(1); }}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">Đến (triệu đ)</label>
                        <input
                            type="text"
                            placeholder="∞"
                            value={maxAmount}
                            onChange={(e) => { setMaxAmount(e.target.value); setCurrentPage(1); }}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* --- BẢNG HIỂN THỊ DỮ LIỆU --- */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-4 py-3">ID</th>
                                    <th className="px-4 py-3">Thời gian</th>
                                    <th className="px-4 py-3">Người gửi</th>
                                    <th className="px-4 py-3">Người nhận</th>
                                    <th className="px-4 py-3 text-right">Số tiền</th>
                                    <th className="px-4 py-3 text-center">Trạng thái</th>
                                    <th className="px-4 py-3 text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs text-gray-600">
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center py-8">Đang tải dữ liệu...</td></tr>
                                ) : currentItems.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-8">Không tìm thấy giao dịch hợp lệ</td></tr>
                                ) : (
                                    currentItems.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50/40 transition-colors">
                                            <td className="px-4 py-4 font-mono font-bold text-blue-600 cursor-pointer hover:underline">{row.id}</td>
                                            <td className="px-4 py-4 text-gray-400 whitespace-nowrap">{row.timestamp}</td>
                                            <td className="px-4 py-4">
                                                <div className="font-bold text-gray-800">{row.senderName}</div>
                                                <div className="text-[10px] text-gray-400 mt-0.5 font-mono">{row.senderStk}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-bold text-gray-800">{row.receiverName}</div>
                                                <div className="text-[10px] text-gray-400 mt-0.5 font-mono">{row.receiverStk}</div>
                                            </td>
                                            <td className="px-4 py-4 text-right font-bold text-gray-900">
                                                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(row.amount).replace("₫", "đ")}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`inline-block px-2.5 py-0.5 rounded font-bold text-[10px] ${row.status === "Thành công" ? "bg-emerald-50 text-emerald-600" :
                                                    row.status === "Đang xử lý" ? "bg-amber-50 text-amber-600" :
                                                        row.status === "Đã hoàn trả" ? "bg-purple-50 text-purple-600" : "bg-red-50 text-red-600"
                                                    }`}>{row.status}</span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <button onClick={() => setSelectedTx(row)} className="text-gray-400 hover:text-blue-600 p-0.5">
                                                    <Eye size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* THANH PHÂN TRANG CHUYỂN TRANG ĐỘNG */}
                    <div className="border-t border-gray-100 px-4 py-3 bg-white flex items-center justify-between text-xs font-medium text-gray-500">
                        <div>Hiển thị {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} / {totalItems} giao dịch</div>
                        <div className="flex items-center gap-1">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="p-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`px-2.5 py-1 rounded border text-xs font-bold transition-colors ${currentPage === i + 1 ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="p-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </AdminShell>
    );
}

const statusOptions = [
    { value: "ALL", label: "Tất cả trạng thái" },
    { value: "Thành công", label: "Thành công" },
    { value: "Đang xử lý", label: "Đang xử lý" },
    { value: "Đã hoàn trả", label: "Đã hoàn trả" },
    { value: "Thất bại", label: "Thất bại" },
];