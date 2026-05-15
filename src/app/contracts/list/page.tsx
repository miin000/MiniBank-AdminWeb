"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "../../components/admin-shell";

type Contract = {
  id: number;
  ownerType: string;
  ownerId: number;
  contractNumber?: string | null;
  status?: string | null;
  fileUrl?: string | null;
  createdAt?: string | null;
};

export default function ContractsListPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/contracts")
      .then((r) => r.json())
      .then((data) => setContracts(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
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
    <AdminShell title="Hợp đồng đã gửi" subtitle="Danh sách hợp đồng gửi cho khách hàng">
      <div className="rounded-lg bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold">Danh sách hợp đồng</div>
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
                <th className="py-2">Loại</th>
                <th className="py-2">Owner</th>
                <th className="py-2">Trạng thái</th>
                <th className="py-2">Ngày tạo</th>
                <th className="py-2">File</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-zinc-400">Đang tải...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-zinc-400">Chưa có hợp đồng</td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="py-2 font-medium">{c.contractNumber ?? `#${c.id}`}</td>
                    <td className="py-2">{c.ownerType}</td>
                    <td className="py-2">{c.ownerId}</td>
                    <td className="py-2">{c.status ?? "N/A"}</td>
                    <td className="py-2">{c.createdAt ?? ""}</td>
                    <td className="py-2">
                      {c.fileUrl ? (
                        <a className="text-blue-600 hover:underline" href={c.fileUrl} target="_blank" rel="noreferrer">Mở</a>
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
