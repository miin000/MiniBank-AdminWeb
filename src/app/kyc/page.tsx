"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AdminUser = {
  id: number;
  type: string;
  username?: string | null;
  roles: string[];
};

type KycRequest = {
  id: number;
  userId: number;
  phone: string;
  email: string;
  fullName: string;
  dob: string;
  citizenId: string;
  address: string;
  occupation?: string | null;
  monthlyIncome?: number | null;
  citizenFrontImageUrl?: string | null;
  citizenBackImageUrl?: string | null;
  portraitImageUrl?: string | null;
  status: string;
  submittedAt: string;
};

type DecisionRequest = {
  note: string;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/+$/, "");

export default function KycPage() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [kycList, setKycList] = useState<KycRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedKyc, setSelectedKyc] = useState<KycRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [approvalForm, setApprovalForm] = useState<DecisionRequest>({
    note: "",
  });
  const [decisionMode, setDecisionMode] = useState<"approve" | "reject" | null>(
    null
  );

  useEffect(() => {
    const t = localStorage.getItem("adminToken");
    setToken(t);
    const u = localStorage.getItem("adminUser");
    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const authHeader = useMemo(() => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  async function fetchPendingKyc() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/kyc/pending`, {
        headers: authHeader,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setKycList(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Lỗi khi tải dữ liệu KYC"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPendingKyc();
  }, [token]);

  async function handleApprove() {
    if (!selectedKyc) return;

    setDeciding(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/kyc/${selectedKyc.id}/approve`,
        {
          method: "POST",
          headers: {
            ...authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            note: approvalForm.note,
          }),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      setModalOpen(false);
      setSelectedKyc(null);
      setApprovalForm({ note: "" });
      setDecisionMode(null);
      await fetchPendingKyc();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Lỗi khi phê duyệt KYC"
      );
    } finally {
      setDeciding(false);
    }
  }

  async function handleReject() {
    if (!selectedKyc) return;

    setDeciding(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/kyc/${selectedKyc.id}/reject`,
        {
          method: "POST",
          headers: {
            ...authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            note: approvalForm.note,
          }),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      setModalOpen(false);
      setSelectedKyc(null);
      setApprovalForm({ note: "" });
      setDecisionMode(null);
      await fetchPendingKyc();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Lỗi khi từ chối KYC"
      );
    } finally {
      setDeciding(false);
    }
  }

  function openModal(kyc: KycRequest) {
    setSelectedKyc(kyc);
    setApprovalForm({ note: "" });
    setDecisionMode(null);
    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedKyc(null);
    setApprovalForm({ note: "" });
    setDecisionMode(null);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Kiểm duyệt KYC
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {user?.username && (
              <span className="text-sm text-gray-700">{user.username}</span>
            )}
            <Link
              href="/login"
              onClick={() => {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminUser");
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Đăng xuất
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-0">
          <div className="flex gap-8">
            <Link href="/" className="px-0 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300">
              Dashboard
            </Link>
            <Link href="/staff" className="px-0 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300">
              Quản lý Nhân viên
            </Link>
            <Link href="/kyc" className="px-0 py-4 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
              Kiểm duyệt KYC
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Chờ duyệt</p>
            <p className="text-3xl font-bold text-amber-600 mt-2">
              {kycList.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Đang tải...</p>
            <p className="text-3xl font-bold text-gray-400 mt-2">
              {loading ? "..." : "-"}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Cập nhật lần cuối</p>
            <p className="text-lg font-medium text-gray-700 mt-2">
              {new Date().toLocaleTimeString("vi-VN")}
            </p>
          </div>
        </div>

        {/* KYC List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Danh sách khách hàng chờ duyệt KYC
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : kycList.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Không có yêu cầu KYC chờ duyệt</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Họ tên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Số điện thoại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      CCCD/CMND
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Ngày gửi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {kycList.map((kyc) => (
                    <tr key={kyc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        KYC{String(kyc.id).padStart(5, "0")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {kyc.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {kyc.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {kyc.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {kyc.citizenId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(kyc.submittedAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => openModal(kyc)}
                          className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium transition-colors"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {modalOpen && selectedKyc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Chi tiết KYC - {selectedKyc.fullName}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">
                  Thông tin cá nhân
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 font-medium">
                      Họ tên
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedKyc.fullName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 font-medium">
                      Ngày sinh
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedKyc.dob).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 font-medium">
                      CCCD/CMND
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedKyc.citizenId}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 font-medium">
                      Địa chỉ
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedKyc.address}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 font-medium">
                      Nghề nghiệp
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedKyc.occupation || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 font-medium">
                      Thu nhập tháng
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedKyc.monthlyIncome != null
                        ? `${Number(selectedKyc.monthlyIncome).toLocaleString("vi-VN")} VND`
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">
                  Thông tin liên hệ
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 font-medium">
                      Số điện thoại
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedKyc.phone}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 font-medium">
                      Email
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedKyc.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">
                  Tài liệu định kèm
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-600 font-medium mb-2">
                      CCCD mặt trước
                    </label>
                    {selectedKyc.citizenFrontImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedKyc.citizenFrontImageUrl}
                        alt="CCCD mặt trước"
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center text-gray-500">
                        Chưa có ảnh CCCD mặt trước
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 font-medium mb-2">
                      CCCD mặt sau
                    </label>
                    {selectedKyc.citizenBackImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedKyc.citizenBackImageUrl}
                        alt="CCCD mặt sau"
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center text-gray-500">
                        Chưa có ảnh CCCD mặt sau
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 font-medium mb-2">
                      Ảnh chân dung
                    </label>
                    {selectedKyc.portraitImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedKyc.portraitImageUrl}
                        alt="Ảnh chân dung"
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center text-gray-500">
                        Chưa có ảnh chân dung
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Decision Form */}
              {decisionMode && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                  {decisionMode === "approve" && (
                    <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                      Sau khi phê duyệt, người dùng sẽ tự tạo số tài khoản từ ứng dụng mobile.
                    </p>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Ghi chú
                    </label>
                    <textarea
                      placeholder="Nhập ghi chú..."
                      value={approvalForm.note}
                      onChange={(e) =>
                        setApprovalForm({
                          ...approvalForm,
                          note: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              {!decisionMode ? (
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setDecisionMode("approve")}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors"
                  >
                    ✓ Phê duyệt
                  </button>
                  <button
                    onClick={() => setDecisionMode("reject")}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors"
                  >
                    ✕ Từ chối
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-md hover:bg-gray-400 font-medium transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              ) : (
                <div className="flex gap-3 w-full">
                  <button
                    onClick={
                      decisionMode === "approve" ? handleApprove : handleReject
                    }
                    disabled={deciding}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors"
                  >
                    {deciding
                      ? "Đang xử lý..."
                      : decisionMode === "approve"
                        ? "Xác nhận phê duyệt"
                        : "Xác nhận từ chối"}
                  </button>
                  <button
                    onClick={() => setDecisionMode(null)}
                    disabled={deciding}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-md hover:bg-gray-400 disabled:bg-gray-400 font-medium transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
