"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "../../components/admin-shell";

import { listGeneratedContracts, type GeneratedContract } from "../../../lib/api/admin-contracts";

const ownerTypeLabel = (value: string) => {
  switch (value) {
    case "loan_application":
      return "Vay vốn";
    case "saving":
      return "Tiết kiệm";
    default:
      return value;
  }
};

export default function ContractsListPage() {
  const [contracts, setContracts] = useState<GeneratedContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    listGeneratedContracts()
      .then((data) => {
        if (!alive) return;
        setContracts(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return contracts;
    return contracts.filter((c) =>
      [c.contractNumber, c.ownerType, c.ownerId?.toString(), c.status]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    );
  }, [contracts, filter]);

  return (
    <AdminShell title="Tài liệu đã sinh" subtitle="Hợp đồng & thỏa thuận đã gửi cho khách hàng">
      {error ? (
        <div className="mb-4 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      <div className="rounded-lg bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold">Danh sách tài liệu</div>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Tìm theo mã, loại, trạng thái"
            className="w-full max-w-xs rounded border border-black/10 px-3 py-2 text-sm"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-zinc-500">
              <tr>
                <th className="py-2">Mã</th>
                <th className="py-2">Loại tài liệu</th>
                <th className="py-2">Hồ sơ</th>
                <th className="py-2">Trạng thái</th>
                <th className="py-2">Ngày tạo</th>
                <th className="py-2">PDF</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-zinc-400">Đang tải...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-zinc-400">Chưa có tài liệu</td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="py-2 font-medium">{c.contractNumber ?? `#${c.id}`}</td>
                    <td className="py-2">{ownerTypeLabel(c.ownerType)}</td>
                    <td className="py-2">#{c.ownerId}</td>
                    <td className="py-2">{c.status ?? "N/A"}</td>
                    <td className="py-2">{c.createdAt ?? ""}</td>
                    <td className="py-2">
                      {c.fileUrl ? (
                        <a className="text-blue-600 hover:underline" href={c.fileUrl} target="_blank" rel="noreferrer">Xem PDF</a>
                      ) : (
                        <span className="text-zinc-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
