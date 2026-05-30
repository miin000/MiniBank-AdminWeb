"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronDown, Eye, QrCode, PlusCircle, MinusCircle, X, CheckCircle2 } from "lucide-react";
import AdminShell from "../../components/admin-shell";

// --- Interface cấu trúc dữ liệu theo hình ảnh Figma ---
interface BankAccount {
    id: number;
    accountNumber: string;    // STK
    accountName: string;      // Tên tài khoản
    customerName: string;     // Chủ tài khoản
    accountType: "Thanh toán" | "Tiết kiệm" | "Doanh nghiệp";
    actualBalance: number;    // Số dư thực tế
    heldBalance: number;      // Đang tạm giữ
    availableBalance: number; // Số dư khả dụng
    status: "Hoạt động" | "Đã khóa";
    openedDate: string;
    dailyLimit: number;
    monthlyLimit: number;
}

export default function BankAccountsPage() {
    // --- States quản lý danh sách và bộ lọc ---
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // --- States quản lý Modals (Popup) ---
    const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
    const [activeModal, setActiveModal] = useState<"DETAIL" | "QR" | "DEPOSIT" | "WITHDRAW" | null>(null);

    // --- States xử lý số tiền Test ---
    const [testAmount, setTestAmount] = useState<string>("");

    // --- State quản lý thông báo Toast ---
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // --- Khởi tạo dữ liệu mẫu khớp 100% với màn hình của bạn ---
    useEffect(() => {
        const mockData: BankAccount[] = [
            {
                id: 1,
                accountNumber: "1234567890",
                accountName: "Tài khoản thanh toán",
                customerName: "Nguyễn Văn A",
                accountType: "Thanh toán",
                actualBalance: 300000000,
                heldBalance: 250000000,
                availableBalance: 50000000,
                status: "Hoạt động",
                openedDate: "2026-01-15",
                dailyLimit: 100000000,
                monthlyLimit: 500000000,
            },
            {
                id: 2,
                accountNumber: "0987654321",
                accountName: "Tài khoản tiết kiệm",
                customerName: "Nguyễn Văn A",
                accountType: "Tiết kiệm",
                actualBalance: 100000000,
                heldBalance: 0,
                availableBalance: 100000000,
                status: "Hoạt động",
                openedDate: "2026-02-10",
                dailyLimit: 0,
                monthlyLimit: 0,
            },
            {
                id: 3,
                accountNumber: "5655566677",
                accountName: "Tài khoản thanh toán",
                customerName: "Trần Thị B",
                accountType: "Thanh toán",
                actualBalance: 25000000,
                heldBalance: 0,
                availableBalance: 25000000,
                status: "Hoạt động",
                openedDate: "2026-03-05",
                dailyLimit: 50000000,
                monthlyLimit: 200000000,
            },
            {
                id: 4,
                accountNumber: "8888988800",
                accountName: "Tài khoản doanh nghiệp",
                customerName: "Lê Văn C",
                accountType: "Doanh nghiệp",
                actualBalance: 500000000,
                heldBalance: 0,
                availableBalance: 500000000,
                status: "Hoạt động",
                openedDate: "2025-11-20",
                dailyLimit: 2000000000,
                monthlyLimit: 10000000000,
            },
        ];
        setAccounts(mockData);
        setLoading(false);
    }, []);

    // --- Trigger hiển thị Toast thông báo ---
    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 4000);
    };

    // --- Hành động xử lý Số dư Test (Nạp/Trừ tiền) ---
    const handleUpdateBalance = (actionType: "ADD" | "SUB") => {
        const numAmount = parseFloat(testAmount);
        if (!numAmount || numAmount <= 0 || !selectedAccount) return;

        setAccounts(prev => prev.map(acc => {
            if (acc.id === selectedAccount.id) {
                const diff = actionType === "ADD" ? numAmount : -numAmount;
                const nextActual = acc.actualBalance + diff;
                const nextAvailable = nextActual - acc.heldBalance;
                return {
                    ...acc,
                    actualBalance: nextActual,
                    availableBalance: nextAvailable
                };
            }
            return acc;
        }));

        showToast(`${actionType === "ADD" ? "Nạp tiền" : "Trừ tiền"} tài khoản ${selectedAccount.accountNumber} thành công!`);
        closeModal();
    };

    // --- Hành động Toggle trạng thái tài khoản Khóa/Mở ---
    const toggleAccountStatus = (account: BankAccount) => {
        setAccounts(prev => prev.map(acc => {
            if (acc.id === account.id) {
                const nextStatus = acc.status === "Hoạt động" ? "Đã khóa" : "Hoạt động";
                showToast(`${nextStatus === "Đã khóa" ? "Đã khóa" : "Đã mở khóa"} tài khoản ${acc.accountNumber}`);
                return { ...acc, status: nextStatus };
            }
            return acc;
        }));
    };

    const closeModal = () => {
        setActiveModal(null);
        setSelectedAccount(null);
        setTestAmount("");
    };

    const openModal = (account: BankAccount, type: "DETAIL" | "QR" | "DEPOSIT" | "WITHDRAW") => {
        setSelectedAccount(account);
        setActiveModal(type);
    };

    // --- Xử lý Tìm kiếm & Bộ lọc dữ liệu ---
    const filteredAccounts = accounts.filter(item => {
        const matchesSearch =
            item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.accountNumber.includes(searchQuery) ||
            item.accountName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalAccountsCount = accounts.length;
    const activeCount = accounts.filter(a => a.status === "Hoạt động").length;
    const lockedCount = accounts.filter(a => a.status === "Đã khóa").length;
    const totalBalanceSum = accounts.reduce((sum, a) => sum + a.actualBalance, 0);

    const formatVND = (val: number) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val).replace("₫", "đ");
    };

    return (
        <AdminShell title="Quản lý tài khoản ngân hàng" subtitle="Quản lý tất cả tài khoản ngân hàng của khách hàng">
            <div className="space-y-6 font-sans relative">

                {/* --- TOAST NOTIFICATION POPUP (Góc trên bên phải hình của bạn) --- */}
                {toastMessage && (
                    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 shadow-xl animate-fade-in-down">
                        <CheckCircle2 className="text-emerald-600" size={18} />
                        <span className="text-sm font-medium text-emerald-800">{toastMessage}</span>
                    </div>
                )}

                {/* --- Thanh tìm kiếm nâng cao --- */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="w-full md:w-2/3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Tìm theo STK, tên tài khoản, tên khách hàng..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800"
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-48 relative">
                        <button
                            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                            className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 focus:outline-none text-left"
                        >
                            <span>{statusFilter === "ALL" ? "Tất cả trạng thái" : statusFilter}</span>
                            <ChevronDown size={16} className="text-gray-400" />
                        </button>
                        {isStatusDropdownOpen && (
                            <div className="absolute right-0 top-full mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-30 py-1">
                                {["ALL", "Hoạt động", "Đã khóa"].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => { setStatusFilter(opt); setIsStatusDropdownOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                                    >
                                        {opt === "ALL" ? "Tất cả trạng thái" : opt}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- Khối bảng và Panel thống kê tích hợp --- */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-4 border-b border-gray-100 bg-gray-50/60 p-4 text-center text-xs font-semibold text-gray-500">
                        <div>
                            <p>Tổng số tài khoản</p>
                            <p className="text-sm font-bold text-gray-900 mt-1">{totalAccountsCount}</p>
                        </div>
                        <div>
                            <p className="text-emerald-600">Đang hoạt động</p>
                            <p className="text-sm font-bold text-emerald-600 mt-1">{activeCount}</p>
                        </div>
                        <div>
                            <p className="text-red-600">Đã khóa</p>
                            <p className="text-sm font-bold text-red-600 mt-1">{lockedCount}</p>
                        </div>
                        <div>
                            <p className="text-blue-600">Tổng số dư</p>
                            <p className="text-sm font-bold text-blue-600 mt-1">{formatVND(totalBalanceSum)}</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                                    <th className="px-4 py-3.5">STK</th>
                                    <th className="px-4 py-3.5">Tên tài khoản</th>
                                    <th className="px-4 py-3.5">Chủ tài khoản</th>
                                    <th className="px-4 py-3.5 text-center">Loại TK</th>
                                    <th className="px-4 py-3.5 text-right">Số dư thực tế</th>
                                    <th className="px-4 py-3.5 text-right">Đang tạm giữ</th>
                                    <th className="px-4 py-3.5 text-right">Số dư khả dụng</th>
                                    <th className="px-4 py-3.5 text-center">Trạng thái</th>
                                    <th className="px-4 py-3.5 text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                {loading ? (
                                    <tr><td colSpan={9} className="text-center py-8">Đang tải...</td></tr>
                                ) : filteredAccounts.map(row => (
                                    <tr key={row.id} className="hover:bg-gray-50/40 transition-colors">
                                        <td className="px-4 py-4 font-mono font-bold text-gray-900">{row.accountNumber}</td>
                                        <td className="px-4 py-4 text-gray-600 text-xs font-medium">{row.accountName}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">
                                                    {row.customerName[0]}
                                                </div>
                                                <span className="font-semibold text-gray-900 text-xs">{row.customerName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${row.accountType === "Thanh toán" ? "bg-blue-50 text-blue-600" :
                                                    row.accountType === "Tiết kiệm" ? "bg-purple-50 text-purple-600" : "bg-indigo-50 text-indigo-600"
                                                }`}>{row.accountType}</span>
                                        </td>
                                        <td className="px-4 py-4 text-right font-semibold text-gray-900">{formatVND(row.actualBalance)}</td>
                                        <td className={`px-4 py-4 text-right font-medium ${row.heldBalance > 0 ? "text-orange-500" : "text-gray-400"}`}>
                                            {row.heldBalance > 0 ? formatVND(row.heldBalance) : "-"}
                                        </td>
                                        <td className="px-4 py-4 text-right font-bold text-gray-900">{formatVND(row.availableBalance)}</td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${row.status === "Hoạt động" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                                }`}>{row.status}</span>
                                        </td>
                                        {/* Hàng nút hành động như Figma của bạn */}
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button onClick={() => openModal(row, "DETAIL")} className="p-1 rounded text-blue-500 hover:bg-blue-50" title="Chi tiết"><Eye size={15} /></button>
                                                <button onClick={() => openModal(row, "QR")} className="p-1 rounded text-purple-500 hover:bg-purple-50" title="Mã QR"><QrCode size={15} /></button>
                                                <button onClick={() => toggleAccountStatus(row)} className={`p-1 rounded ${row.status === 'Hoạt động' ? 'text-red-400 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}`} title={row.status === 'Hoạt động' ? 'Khóa' : 'Mở khóa'}>🔒</button>
                                                <button onClick={() => openModal(row, "DEPOSIT")} className="p-1 rounded text-emerald-600 hover:bg-emerald-50" title="Nạp tiền test"><PlusCircle size={15} /></button>
                                                <button onClick={() => openModal(row, "WITHDRAW")} className="p-1 rounded text-orange-600 hover:bg-orange-50" title="Trừ tiền test"><MinusCircle size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* =========================================================================
            CÁC KHỐI MODALS POPUP CHẠY ĐỘNG KHI BẤM NÚT THAO TÁC
           ========================================================================= */}

                {activeModal && selectedAccount && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

                        {/* COMPONENT 1: CHI TIẾT TÀI KHOẢN MODAL */}
                        {activeModal === "DETAIL" && (
                            <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl relative animate-zoom-in">
                                <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                                <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Chi tiết tài khoản</h3>

                                <div className="mt-4 grid grid-cols-2 gap-y-4 text-xs">
                                    <div><p className="text-gray-400">Số tài khoản:</p><p className="font-bold text-gray-900 mt-1">{selectedAccount.accountNumber}</p></div>
                                    <div><p className="text-gray-400">Tên tài khoản:</p><p className="font-bold text-gray-900 mt-1">{selectedAccount.accountName}</p></div>
                                    <div><p className="text-gray-400">Chủ tài khoản:</p><p className="font-bold text-gray-900 mt-1">{selectedAccount.customerName}</p></div>
                                    <div><p className="text-gray-400">Loại tài khoản:</p><p className="font-bold text-gray-900 mt-1">{selectedAccount.accountType}</p></div>
                                </div>

                                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-2.5 text-xs text-gray-700">
                                    <p className="font-bold text-gray-900 mb-1">Thông tin số dư</p>
                                    <div className="flex justify-between"><span>Số dư thực tế:</span><span className="font-bold text-gray-900">{formatVND(selectedAccount.actualBalance)}</span></div>
                                    <div className="flex justify-between text-orange-600"><span>Đang tạm giữ:</span><span className="font-bold">- {formatVND(selectedAccount.heldBalance)}</span></div>
                                    <div className="flex justify-between border-t border-blue-100 pt-2 font-bold text-blue-600 text-sm"><span>Số dư khả dụng:</span><span>{formatVND(selectedAccount.availableBalance)}</span></div>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-4 text-xs border-t border-gray-100 pt-4">
                                    <div><p className="text-gray-400">Hạn mức giao dịch/ngày:</p><p className="font-semibold text-gray-900 mt-1">{formatVND(selectedAccount.dailyLimit)}</p></div>
                                    <div><p className="text-gray-400">Hạn mức giao dịch/tháng:</p><p className="font-semibold text-gray-900 mt-1">{formatVND(selectedAccount.monthlyLimit)}</p></div>
                                    <div><p className="text-gray-400">Ngày mở:</p><p className="font-semibold text-gray-900 mt-1">{selectedAccount.openedDate}</p></div>
                                    <div><p className="text-gray-400">Trạng thái:</p><p className="font-semibold text-gray-900 mt-1">{selectedAccount.status}</p></div>
                                </div>
                            </div>
                        )}

                        {/* COMPONENT 2: MODAL MÃ QR TÀI KHOẢN */}
                        {activeModal === "QR" && (
                            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center relative animate-zoom-in">
                                <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                                <h3 className="text-sm font-semibold text-gray-500 mb-4">Mã QR tài khoản</h3>
                                <div className="mx-auto flex h-48 w-48 items-center justify-center border-2 border-gray-100 rounded-2xl bg-gray-50 p-2">
                                    <div className="w-full h-full border-4 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 font-mono text-xs">
                                        <span>[ QR CODE ]</span>
                                        <span className="text-[10px] mt-1">Napas 247</span>
                                    </div>
                                </div>
                                <div className="mt-4 text-xs font-medium">
                                    <p className="text-gray-400">STK: <span className="font-bold text-gray-900">{selectedAccount.accountNumber}</span></p>
                                    <p className="text-gray-900 font-bold mt-1 text-sm">{selectedAccount.customerName}</p>
                                </div>
                            </div>
                        )}

                        {/* COMPONENT 3 & 4: POPUP NẠP TIỀN TEST / TRỪ TIỀN TEST */}
                        {(activeModal === "DEPOSIT" || activeModal === "WITHDRAW") && (
                            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl relative animate-zoom-in">
                                <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                                <h3 className="text-sm font-bold text-gray-800">{activeModal === "DEPOSIT" ? "Nạp tiền test" : "Trừ tiền test"}</h3>

                                <div className="mt-4 space-y-2">
                                    <label className="text-xs font-semibold text-gray-500">Số tiền</label>
                                    <input
                                        type="number"
                                        placeholder="Nhập số tiền..."
                                        value={testAmount}
                                        onChange={(e) => setTestAmount(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-semibold"
                                    />
                                </div>

                                <div className="mt-5 flex gap-3 justify-end text-xs font-semibold">
                                    <button onClick={closeModal} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">Hủy</button>
                                    <button
                                        onClick={() => handleUpdateBalance(activeModal === "DEPOSIT" ? "ADD" : "SUB")}
                                        className={`px-4 py-2 text-white rounded-lg transition-colors ${activeModal === "DEPOSIT" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-orange-600 hover:bg-orange-700"
                                            }`}
                                    >
                                        Xác nhận
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                )}

            </div>
        </AdminShell>
    );
}