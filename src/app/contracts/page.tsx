"use client";

import { useEffect, useState } from "react";
import AdminShell from "../components/admin-shell";

type Template = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
};

type Contract = {
  id: number;
  ownerType: string;
  ownerId: number;
  contractNumber?: string | null;
  status?: string | null;
};

export default function ContractsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/contracts/templates")
      .then((r) => r.json())
      .then(setTemplates)
      .catch(console.error);

    fetch("/api/admin/contracts")
      .then((r) => r.json())
      .then(setContracts)
      .catch(console.error);
  }, []);

  return (
    <AdminShell title="Quản lý hợp đồng" subtitle="Mẫu & hợp đồng gửi cho khách hàng">
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-lg bg-white p-4">
          <h3 className="text-sm font-bold">Mẫu hợp đồng</h3>
          <div className="mt-3 flex flex-col gap-2">
            {templates.length === 0 ? (
              <div className="text-xs text-zinc-500">Chưa có mẫu nào.</div>
            ) : (
              templates.map((t) => (
                <div key={t.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-xs text-zinc-500">{t.code}</div>
                  </div>
                  <div className="text-xs text-zinc-400">...</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg bg-white p-4">
          <h3 className="text-sm font-bold">Hợp đồng</h3>
          <div className="mt-3 flex flex-col gap-2">
            {contracts.length === 0 ? (
              <div className="text-xs text-zinc-500">Chưa có hợp đồng nào.</div>
            ) : (
              contracts.map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{c.contractNumber ?? `#${c.id}`}</div>
                    <div className="text-xs text-zinc-500">{c.ownerType} {c.ownerId}</div>
                  </div>
                  <div className="text-xs text-zinc-400">{c.status}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-white p-4">
        <h3 className="text-sm font-bold">Tạo hợp đồng từ mẫu</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const data = new FormData(form);
            const payload = {
              ownerType: data.get("ownerType"),
              ownerId: Number(data.get("ownerId")),
              templateId: Number(data.get("templateId")),
              contractNumber: data.get("contractNumber"),
            };
            fetch("/api/admin/contracts/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
              .then((r) => r.json())
              .then((c) => {
                setContracts((prev) => [c, ...prev]);
                form.reset();
              })
              .catch(console.error);
          }}
        >
          <div className="mt-3 grid grid-cols-4 gap-3">
            <select name="templateId" className="col-span-1 rounded border p-2">
              <option value="">--Chọn mẫu--</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <input name="ownerType" placeholder="ownerType (loan_application|saving)" className="col-span-1 rounded border p-2" />
            <input name="ownerId" placeholder="ownerId" className="col-span-1 rounded border p-2" />
            <input name="contractNumber" placeholder="Mã hợp đồng (tùy)" className="col-span-1 rounded border p-2" />
          </div>
          <div className="mt-3">
            <button className="rounded bg-blue-600 px-3 py-2 text-white">Tạo hợp đồng</button>
          </div>
        </form>
      </div>

      <div className="mt-6 rounded-lg bg-white p-4">
        <h3 className="text-sm font-bold">Tải lên mẫu hợp đồng</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const input = form.querySelector("input[type=file]") as HTMLInputElement;
            if (!input || !input.files || input.files.length === 0) return;
            const f = input.files[0];
            setUploading(true);
            const fd = new FormData();
            fd.append("file", f);
            try {
              const up = await fetch("/api/admin/documents/upload", { method: "POST", body: fd });
              const js = await up.json();
              const tpl = { name: f.name, code: "TPL-" + Math.random().toString(36).substring(2,8).toUpperCase(), templateFileUrl: js.fileUrl };
              const created = await fetch("/api/admin/contracts/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tpl) });
              const t = await created.json();
              setTemplates((prev) => [t, ...prev]);
              form.reset();
            } catch (err) {
              console.error(err);
            } finally { setUploading(false); }
          }}
        >
          <div className="mt-3 grid grid-cols-3 gap-3">
            <input type="file" accept=".pdf,.doc,.docx" className="col-span-2" />
            <button className="col-span-1 rounded bg-blue-600 px-3 py-2 text-white" disabled={uploading}>{uploading? 'Uploading...':'Upload'}</button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
