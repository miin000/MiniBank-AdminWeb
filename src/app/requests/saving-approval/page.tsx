"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "../../components/admin-shell";
import {
    Search,
    Check,
    X,
    User,
    Landmark,
    FileText,
    Clock,
    Shield,
} from "lucide-react";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";

async function apiFetch<T>(
    path: string,
    options?: RequestInit
): Promise<T> {
    const token =
        typeof window !== "undefined"
            ? localStorage.getItem("adminToken") ||
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken")
            : null;


    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token
                ? { Authorization: `Bearer ${token}` }
                : {}),
            ...options?.headers,
        },
    });

    if (!res.ok) {
        throw new Error(
            (await res.text()) || `HTTP ${res.status}`
        );
    }

    return res.json();


}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount || 0);
}

function formatDate(value?: string | null) {
    if (!value) return "—";


    const d = new Date(value);

    return d.toLocaleDateString("vi-VN");


}

function statusBadge(status: string) {
    switch (status?.toLowerCase()) {
        case "pending_approval":
            return {
                label: "Chờ duyệt",
                className:
                    "bg-yellow-100 text-yellow-700",
            };

        case "pending_contract":
            return {
                label: "Chờ hợp đồng",
                className:
                    "bg-blue-100 text-blue-700",
            };

        case "pending_otp":
            return {
                label: "Chờ OTP",
                className:
                    "bg-orange-100 text-orange-700",
            };

        case "active":
            return {
                label: "Đã duyệt",
                className:
                    "bg-green-100 text-green-700",
            };

        case "rejected":
            return {
                label: "Từ chối",
                className:
                    "bg-red-100 text-red-700",
            };

        default:
            return {
                label: status,
                className:
                    "bg-zinc-100 text-zinc-600",
            };
    }

}

interface SavingItem {
    id: number;
    requestCode: string;
    customerName: string;
    userPhone: string;
    productName: string;
    principalAmount: number;
    termValue: number;
    termUnit: string;
    status: string;
    openDate: string;
}

interface SavingDocument {
    id: number;
    documentType: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    verifiedStatus: string;
    uploadedAt: string;
    note: string;
}

interface ApprovalAction {
    id: number;
    adminFullName: string;
    approverRole: string;
    action: string;
    note: string;
    actedAt: string;
}

interface SavingDetail {
    id: number;
    code: string;
    status: string;


    principalAmount: number;
    actualInterestRate: number;

    termUnit: string;
    termValue: number;

    autoRenew: boolean;

    openDate: string | null;
    maturityDate: string | null;

    sourceAccountNumber: string;
    sourceAccountName: string;

    settlementAccountNumber?: string;
    settlementAccountName?: string;

    productName: string;

    userFullName: string;
    userPhone: string;
    userEmail: string;
    userDob: string;
    userAddress: string;
    userCitizenId: string;

    customerRank: string;
    creditScoreLevel: string;

    rejectionReason: string | null;

    documents: SavingDocument[];

    approvalProgress?: {
        actions?: ApprovalAction[];
    };


}

export default function SavingApprovalPage() {
    const [items, setItems] =
        useState<SavingItem[]>([]);


    const [selected, setSelected] =
        useState<SavingItem | null>(null);

    const [selectedDetail, setSelectedDetail] =
        useState<SavingDetail | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [detailLoading, setDetailLoading] =
        useState(false);

    const [searchQuery, setSearchQuery] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("all");

    const [activeTab, setActiveTab] =
        useState<
            "customer" |
            "saving" |
            "documents" |
            "timeline"
        >("customer");

    const [modalType, setModalType] =
        useState<"approve" | "reject" | null>(
            null
        );

    const [rejectReason, setRejectReason] =
        useState("");

    const [submitting, setSubmitting] =
        useState(false);

    async function fetchItems() {
        setLoading(true);

        try {
            const data = await apiFetch<any[]>(
                "/api/admin/savings?status=pending_otp,pending_approval,pending_contract,active,rejected"
            );

            const mapped = data.map((item) => ({
                id: item.id,
                requestCode:
                    item.code ??
                    `SV${String(item.id).padStart(
                        3,
                        "0"
                    )}`,

                customerName:
                    item.userFullName ??
                    "Khách hàng",

                userPhone:
                    item.userPhone ?? "",

                productName:
                    item.productName ??
                    "Tiết kiệm",

                principalAmount:
                    Number(
                        item.principalAmount
                    ) || 0,

                termValue:
                    item.termValue ?? 0,

                termUnit:
                    item.termUnit ?? "",

                status:
                    item.status ?? "",

                openDate:
                    item.openDate ??
                    item.createdAt ??
                    "",
            }));

            setItems(mapped);

            if (mapped.length > 0) {
                setSelected(mapped[0]);
                loadDetail(mapped[0].id);
            }
        } catch (err) {
            console.error(
                "FETCH ITEMS ERROR",
                err
            );
        } finally {
            setLoading(false);
        }
    }

    async function loadDetail(id: number) {
        try {
            setDetailLoading(true);

            const detail =
                await apiFetch<SavingDetail>(
                    `/api/admin/savings/${id}`
                );

            setSelectedDetail(detail);
        } catch (err) {
            console.error(
                "DETAIL ERROR",
                err
            );
        } finally {
            setDetailLoading(false);
        }
    }

    useEffect(() => {
        fetchItems();
    }, []);

    const filtered = useMemo(
        () =>
            items.filter((item) => {
                const matchSearch =
                    item.customerName
                        .toLowerCase()
                        .includes(
                            searchQuery.toLowerCase()
                        ) ||
                    item.requestCode
                        .toLowerCase()
                        .includes(
                            searchQuery.toLowerCase()
                        ) ||
                    item.productName
                        .toLowerCase()
                        .includes(
                            searchQuery.toLowerCase()
                        );

                const matchStatus =
                    statusFilter === "all" ||
                    item.status ===
                    statusFilter;

                return (
                    matchSearch &&
                    matchStatus
                );
            }),
        [
            items,
            searchQuery,
            statusFilter,
        ]
    );

    async function handleDecision() {
        if (!selected || !modalType)
            return;

        try {
            setSubmitting(true);

            if (
                modalType === "approve"
            ) {
                await apiFetch(
                    `/api/admin/savings/${selected.id}/approve`,
                    {
                        method: "POST",
                    }
                );
            } else {
                await apiFetch(
                    `/api/admin/savings/${selected.id}/reject`,
                    {
                        method: "POST",
                        body: JSON.stringify(
                            {
                                reason:
                                    rejectReason,
                            }
                        ),
                    }
                );
            }

            setModalType(null);
            setRejectReason("");

            await fetchItems();

            if (selected?.id) {
                await loadDetail(
                    selected.id
                );
            }
        } catch (err) {
            console.error(
                "APPROVAL ERROR",
                err
            );
        } finally {
            setSubmitting(false);
        }
    }

    const pendingCount =
        items.filter(
            (i) =>
                i.status ===
                "pending_approval"
        ).length;

    const approvedCount =
        items.filter(
            (i) =>
                i.status === "active"
        ).length;

    const rejectedCount =
        items.filter(
            (i) =>
                i.status ===
                "rejected"
        ).length;

    return (
        <AdminShell
            title="Duyệt sổ tiết kiệm"
            subtitle="Quản lý và xét duyệt hồ sơ mở sổ tiết kiệm"
        >

            <div className="grid grid-cols-12 gap-6">

                {/* LEFT PANEL */}

                <div className="col-span-4">

                    <div className="rounded-2xl border border-zinc-200 bg-white">

                        <div className="border-b border-zinc-200 p-4">

                            <div className="relative">

                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                                />

                                <input
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Tìm hồ sơ..."
                                    className="h-11 w-full rounded-xl border border-zinc-200 pl-10 pr-4 text-sm"
                                />
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(
                                        e.target.value
                                    )
                                }
                                className="mt-3 h-11 w-full rounded-xl border border-zinc-200 px-4 text-sm"
                            >
                                <option value="all">
                                    Tất cả trạng thái
                                </option>

                                <option value="pending_approval">
                                    Chờ duyệt
                                </option>

                                <option value="active">
                                    Đã duyệt
                                </option>

                                <option value="rejected">
                                    Từ chối
                                </option>
                            </select>
                        </div>

                        <div className="grid grid-cols-3 border-b border-zinc-200 text-center">

                            <div className="p-3">
                                <div className="text-xl font-bold">
                                    {pendingCount}
                                </div>

                                <div className="text-xs text-zinc-500">
                                    Chờ duyệt
                                </div>
                            </div>

                            <div className="p-3">
                                <div className="text-xl font-bold text-green-600">
                                    {approvedCount}
                                </div>

                                <div className="text-xs text-zinc-500">
                                    Đã duyệt
                                </div>
                            </div>

                            <div className="p-3">
                                <div className="text-xl font-bold text-red-600">
                                    {rejectedCount}
                                </div>

                                <div className="text-xs text-zinc-500">
                                    Từ chối
                                </div>
                            </div>

                        </div>

                        <div className="max-h-[70vh] overflow-y-auto">

                            {filtered.map((item) => {

                                const badge =
                                    statusBadge(
                                        item.status
                                    );

                                return (

                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setSelected(
                                                item
                                            );

                                            loadDetail(
                                                item.id
                                            );
                                        }}
                                        className={`w-full border-b border-zinc-100 p-4 text-left transition hover:bg-zinc-50 ${selected?.id ===
                                            item.id
                                            ? "bg-blue-50"
                                            : ""
                                            }`}
                                    >

                                        <div className="flex items-start justify-between">

                                            <div>

                                                <div className="font-semibold text-zinc-900">
                                                    {
                                                        item.customerName
                                                    }
                                                </div>

                                                <div className="mt-1 text-xs text-zinc-500">
                                                    {
                                                        item.requestCode
                                                    }
                                                </div>

                                            </div>

                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}
                                            >
                                                {
                                                    badge.label
                                                }
                                            </span>

                                        </div>

                                        <div className="mt-3 text-sm text-zinc-600">
                                            {
                                                item.productName
                                            }
                                        </div>

                                        <div className="mt-1 font-semibold text-blue-600">
                                            {formatCurrency(
                                                item.principalAmount
                                            )}
                                        </div>

                                        <div className="mt-2 text-xs text-zinc-400">
                                            {
                                                item.userPhone
                                            }
                                        </div>

                                    </button>

                                );
                            })}

                        </div>

                    </div>

                </div>

                {/* RIGHT PANEL */}

                <div className="col-span-8">

                    <div className="rounded-2xl border border-zinc-200 bg-white">

                        {detailLoading ? (

                            <div className="p-10 text-center text-zinc-500">
                                Đang tải hồ sơ...
                            </div>

                        ) : !selectedDetail ? (

                            <div className="p-10 text-center text-zinc-500">
                                Chưa chọn hồ sơ
                            </div>

                        ) : (

                            <>

                                <div className="border-b border-zinc-200 p-6">

                                    <div className="flex items-start justify-between">

                                        <div>

                                            <h2 className="text-2xl font-bold">
                                                {
                                                    selectedDetail.userFullName
                                                }
                                            </h2>

                                            <p className="mt-1 text-sm text-zinc-500">
                                                {
                                                    selectedDetail.code
                                                }
                                            </p>

                                        </div>

                                        <div className="flex gap-3">

                                            {selectedDetail.status ===
                                                "pending_approval" && (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                setModalType(
                                                                    "reject"
                                                                )
                                                            }
                                                            className="rounded-xl bg-red-100 px-5 py-3 text-sm font-medium text-red-700"
                                                        >
                                                            <X
                                                                size={
                                                                    16
                                                                }
                                                            />
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                setModalType(
                                                                    "approve"
                                                                )
                                                            }
                                                            className="rounded-xl bg-green-600 px-5 py-3 text-sm font-medium text-white"
                                                        >
                                                            Duyệt hồ sơ
                                                        </button>
                                                    </>
                                                )}

                                        </div>

                                    </div>


                                    <div className="border-b border-zinc-200 px-6">

                                        <div className="flex gap-6">

                                            <button
                                                onClick={() =>
                                                    setActiveTab(
                                                        "customer"
                                                    )
                                                }
                                                className={`border-b-2 px-2 py-4 text-sm font-medium ${activeTab ===
                                                    "customer"
                                                    ? "border-blue-600 text-blue-600"
                                                    : "border-transparent text-zinc-500"
                                                    }`}
                                            >
                                                <User
                                                    size={
                                                        16
                                                    }
                                                    className="mr-2 inline"
                                                />
                                                Khách hàng
                                            </button>

                                            <button
                                                onClick={() =>
                                                    setActiveTab(
                                                        "saving"
                                                    )
                                                }
                                                className={`border-b-2 px-2 py-4 text-sm font-medium ${activeTab ===
                                                    "saving"
                                                    ? "border-blue-600 text-blue-600"
                                                    : "border-transparent text-zinc-500"
                                                    }`}
                                            >
                                                <Landmark
                                                    size={
                                                        16
                                                    }
                                                    className="mr-2 inline"
                                                />
                                                Sổ tiết kiệm
                                            </button>

                                            <button
                                                onClick={() =>
                                                    setActiveTab(
                                                        "documents"
                                                    )
                                                }
                                                className={`border-b-2 px-2 py-4 text-sm font-medium ${activeTab ===
                                                    "documents"
                                                    ? "border-blue-600 text-blue-600"
                                                    : "border-transparent text-zinc-500"
                                                    }`}
                                            >
                                                <FileText
                                                    size={
                                                        16
                                                    }
                                                    className="mr-2 inline"
                                                />
                                                Giấy tờ
                                            </button>

                                            <button
                                                onClick={() =>
                                                    setActiveTab(
                                                        "timeline"
                                                    )
                                                }
                                                className={`border-b-2 px-2 py-4 text-sm font-medium ${activeTab ===
                                                    "timeline"
                                                    ? "border-blue-600 text-blue-600"
                                                    : "border-transparent text-zinc-500"
                                                    }`}
                                            >
                                                <Clock
                                                    size={
                                                        16
                                                    }
                                                    className="mr-2 inline"
                                                />
                                                Phê duyệt
                                            </button>

                                        </div>

                                    </div>

                                    <div className="p-6">

                                        {activeTab ===
                                            "customer" && (

                                                <div className="grid grid-cols-2 gap-6">

                                                    <div className="rounded-2xl border border-zinc-200 p-5">

                                                        <h3 className="mb-4 font-semibold">
                                                            Thông tin cá nhân
                                                        </h3>

                                                        <div className="space-y-4">

                                                            <InfoRow
                                                                label="Họ tên"
                                                                value={
                                                                    selectedDetail.userFullName
                                                                }
                                                            />

                                                            <InfoRow
                                                                label="Số điện thoại"
                                                                value={
                                                                    selectedDetail.userPhone
                                                                }
                                                            />

                                                            <InfoRow
                                                                label="Email"
                                                                value={
                                                                    selectedDetail.userEmail ||
                                                                    "—"
                                                                }
                                                            />

                                                            <InfoRow
                                                                label="Ngày sinh"
                                                                value={
                                                                    selectedDetail.userDob ||
                                                                    "—"
                                                                }
                                                            />

                                                            <InfoRow
                                                                label="CCCD"
                                                                value={
                                                                    selectedDetail.userCitizenId ||
                                                                    "—"
                                                                }
                                                            />

                                                        </div>

                                                    </div>

                                                    <div className="rounded-2xl border border-zinc-200 p-5">

                                                        <h3 className="mb-4 font-semibold">
                                                            Hồ sơ khách hàng
                                                        </h3>

                                                        <div className="space-y-4">

                                                            <InfoRow
                                                                label="Địa chỉ"
                                                                value={
                                                                    selectedDetail.userAddress ||
                                                                    "—"
                                                                }
                                                            />

                                                            <InfoRow
                                                                label="Hạng khách hàng"
                                                                value={
                                                                    selectedDetail.customerRank ||
                                                                    "—"
                                                                }
                                                            />

                                                            <InfoRow
                                                                label="Điểm tín dụng"
                                                                value={
                                                                    selectedDetail.creditScoreLevel ||
                                                                    "—"
                                                                }
                                                            />

                                                        </div>

                                                    </div>

                                                </div>

                                            )}

                                        {activeTab ===
                                            "saving" && (

                                                <div className="grid grid-cols-2 gap-6">

                                                    <div className="rounded-2xl border border-zinc-200 p-5">

                                                        <h3 className="mb-4 font-semibold">
                                                            Thông tin sổ
                                                        </h3>

                                                        <div className="space-y-4">

                                                            <InfoRow
                                                                label="Sản phẩm"
                                                                value={
                                                                    selectedDetail.productName
                                                                }
                                                            />

                                                            <InfoRow
                                                                label="Số tiền gửi"
                                                                value={formatCurrency(
                                                                    selectedDetail.principalAmount
                                                                )}
                                                            />

                                                            <InfoRow
                                                                label="Lãi suất"
                                                                value={`${(
                                                                    selectedDetail.actualInterestRate *
                                                                    100
                                                                ).toFixed(
                                                                    2
                                                                )}%`}
                                                            />

                                                            <InfoRow
                                                                label="Kỳ hạn"
                                                                value={`${selectedDetail.termValue} ${selectedDetail.termUnit}`}
                                                            />

                                                            <InfoRow
                                                                label="Tự động tái tục"
                                                                value={
                                                                    selectedDetail.autoRenew
                                                                        ? "Có"
                                                                        : "Không"
                                                                }
                                                            />

                                                        </div>

                                                    </div>

                                                    <div className="rounded-2xl border border-zinc-200 p-5">

                                                        <h3 className="mb-4 font-semibold">
                                                            Tài khoản nguồn
                                                        </h3>

                                                        <div className="space-y-4">

                                                            <InfoRow
                                                                label="Số tài khoản"
                                                                value={
                                                                    selectedDetail.sourceAccountNumber
                                                                }
                                                            />

                                                            <InfoRow
                                                                label="Chủ tài khoản"
                                                                value={
                                                                    selectedDetail.sourceAccountName
                                                                }
                                                            />

                                                            <InfoRow
                                                                label="Ngày mở"
                                                                value={formatDate(
                                                                    selectedDetail.openDate
                                                                )}
                                                            />

                                                            <InfoRow
                                                                label="Ngày đáo hạn"
                                                                value={formatDate(
                                                                    selectedDetail.maturityDate
                                                                )}
                                                            />

                                                        </div>

                                                    </div>

                                                </div>

                                            )}

                                        {activeTab ===
                                            "documents" && (

                                                <div>

                                                    <div className="grid grid-cols-2 gap-6">

                                                        {selectedDetail.documents?.length >
                                                            0 ? (
                                                            selectedDetail.documents.map(
                                                                (
                                                                    doc
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            doc.id
                                                                        }
                                                                        className="rounded-2xl border border-zinc-200 p-5"
                                                                    >
                                                                        <div className="mb-3 flex items-center justify-between">

                                                                            <h3 className="font-semibold">
                                                                                {
                                                                                    doc.documentType
                                                                                }
                                                                            </h3>

                                                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
                                                                                {
                                                                                    doc.verifiedStatus
                                                                                }
                                                                            </span>

                                                                        </div>

                                                                        <div className="text-sm text-zinc-500">
                                                                            {
                                                                                doc.fileName
                                                                            }
                                                                        </div>

                                                                        <a
                                                                            href={
                                                                                doc.fileUrl
                                                                            }
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm text-white"
                                                                        >
                                                                            Xem tài liệu
                                                                        </a>

                                                                    </div>
                                                                )
                                                            )
                                                        ) : (
                                                            <div className="col-span-2 rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500">
                                                                Chưa có tài liệu
                                                            </div>
                                                        )}

                                                    </div>

                                                </div>

                                            )}

                                        {activeTab ===
                                            "timeline" && (

                                                <div>

                                                    <div className="space-y-4">

                                                        {selectedDetail
                                                            .approvalProgress
                                                            ?.actions
                                                            ?.length ? (
                                                            selectedDetail.approvalProgress.actions.map(
                                                                (
                                                                    action
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            action.id
                                                                        }
                                                                        className="rounded-2xl border border-zinc-200 p-5"
                                                                    >
                                                                        <div className="flex items-center justify-between">

                                                                            <div>

                                                                                <div className="font-semibold">
                                                                                    {
                                                                                        action.adminFullName
                                                                                    }
                                                                                </div>

                                                                                <div className="text-sm text-zinc-500">
                                                                                    {
                                                                                        action.approverRole
                                                                                    }
                                                                                </div>

                                                                            </div>

                                                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                                                                                {
                                                                                    action.action
                                                                                }
                                                                            </span>

                                                                        </div>

                                                                        <div className="mt-4 whitespace-pre-wrap text-sm text-zinc-600">
                                                                            {
                                                                                action.note
                                                                            }
                                                                        </div>

                                                                        <div className="mt-3 text-xs text-zinc-400">
                                                                            {formatDate(
                                                                                action.actedAt
                                                                            )}
                                                                        </div>

                                                                    </div>
                                                                )
                                                            )
                                                        ) : (
                                                            <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500">
                                                                Chưa có lịch sử phê duyệt
                                                            </div>
                                                        )}

                                                    </div>

                                                </div>

                                            )}

                                    </div>
                                </div>

                            </>
                        )}

                    </div>

                </div>

            </div>

            {modalType && selected && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

                    <div className="w-full max-w-md rounded-2xl bg-white p-6">

                        <h3 className="text-lg font-semibold">

                            {modalType === "approve"
                                ? "Xác nhận duyệt hồ sơ"
                                : "Từ chối hồ sơ"}

                        </h3>

                        {modalType === "reject" && (

                            <textarea
                                rows={4}
                                value={rejectReason}
                                onChange={(e) =>
                                    setRejectReason(
                                        e.target.value
                                    )
                                }
                                placeholder="Nhập lý do từ chối..."
                                className="mt-4 w-full rounded-xl border border-zinc-200 p-3"
                            />

                        )}

                        <div className="mt-6 flex justify-end gap-3">

                            <button
                                onClick={() =>
                                    setModalType(
                                        null
                                    )
                                }
                                className="rounded-xl border border-zinc-300 px-5 py-2"
                            >
                                Huỷ
                            </button>

                            <button
                                disabled={
                                    submitting
                                }
                                onClick={
                                    handleDecision
                                }
                                className={`rounded-xl px-5 py-2 text-white ${modalType ===
                                    "approve"
                                    ? "bg-green-600"
                                    : "bg-red-600"
                                    }`}
                            >
                                {submitting
                                    ? "Đang xử lý..."
                                    : "Xác nhận"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </AdminShell>
    );

}

function InfoRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (<div>


        <div className="text-xs uppercase tracking-wide text-zinc-400">
            {label}
        </div>

        <div className="mt-1 font-medium text-zinc-900">
            {value || "—"}
        </div>

    </div>
    );

}

