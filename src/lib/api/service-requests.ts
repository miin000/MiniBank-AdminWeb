// src/lib/api/service-requests.ts

export interface ServiceRequestSummary {
    id: number;
    requestType: string;
    title: string;
    status: string;
    priorityTag: string | null;
    submittedAt: string;
    userId: number;
    userName: string;
    userPhone: string;
}

export interface LimitChange {
    id: number;
    serviceRequestId: number;
    accountId: number;
    accountNumber: string;
    accountName: string;
    currentDailyTransferLimit: number;
    requestedDailyTransferLimit: number;
    reason: string;
    status: string;
    submittedAt: string;
    processedAt: string | null;
    processNote: string | null;
}

export interface ServiceRequestDetail extends ServiceRequestSummary {
    description: string;
    payloadJson: string | null;
    processedAt: string | null;
    processNote: string | null;
    limitChange: LimitChange | null;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function getAuthHeader(): HeadersInit {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchServiceRequests(
    status?: string,
    type?: string
): Promise<ServiceRequestSummary[]> {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    const query = params.toString() ? `?${params.toString()}` : "";

    const res = await fetch(`${BASE_URL}/api/admin/service-requests${query}`, {
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
        },
    });
    if (!res.ok) throw new Error("Không thể tải danh sách yêu cầu");
    return res.json();
}

export async function fetchServiceRequestDetail(
    id: number
): Promise<ServiceRequestDetail> {
    const res = await fetch(`${BASE_URL}/api/admin/service-requests/${id}`, {
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
        },
    });
    if (!res.ok) throw new Error("Không thể tải chi tiết yêu cầu");
    return res.json();
}

export async function approveServiceRequest(
    id: number,
    note: string
): Promise<void> {
    const res = await fetch(
        `${BASE_URL}/api/admin/service-requests/${id}/approve`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader(),
            },
            body: JSON.stringify({ note }),
        }
    );
    if (!res.ok) throw new Error("Không thể duyệt yêu cầu");
}

export async function rejectServiceRequest(
    id: number,
    note: string
): Promise<void> {
    const res = await fetch(
        `${BASE_URL}/api/admin/service-requests/${id}/reject`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader(),
            },
            body: JSON.stringify({ note }),
        }
    );
    if (!res.ok) throw new Error("Không thể từ chối yêu cầu");
}