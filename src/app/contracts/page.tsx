"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AdminShell from "../components/admin-shell";

import {
  createContractTemplate,
  getContractTemplate,
  listContractAcceptances,
  listContractTemplates,
  listGeneratedContracts,
  updateContractTemplate,
  uploadContractTemplate,
  type ContractAcceptanceSummary,
  type GeneratedContract,
  type TemplateDetail,
  type TemplatePlaceholder,
  type TemplateSummary,
} from "../../lib/api/admin-contracts";

const ownerTypeLabel = (value: string) => {
  switch (value.toUpperCase()) {
    case "LOAN_APPLICATION":
      return "Vay vốn";
    case "SAVING":
      return "Tiết kiệm";
    case "USER":
      return "Khách hàng";
    default:
      return value;
  }
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date);
};

const isSavingTemplate = (code?: string | null, services?: string | null) => {
  const normalizedCode = (code ?? "").toUpperCase();
  const normalizedServices = (services ?? "").toLowerCase();
  return normalizedCode === "SAVING_AGREEMENT" || normalizedServices.includes("saving");
};

const normalizeStatus = (value?: string | null) => (value ?? "").trim().toLowerCase();

const isActiveStatus = (value?: string | null) => normalizeStatus(value) === "active";

type TemplateForm = {
  name: string;
  code: string;
  description: string;
  services: string;
  status: string;
  templateBody: string;
  placeholders: TemplatePlaceholder[];
};

const emptyTemplateForm = (): TemplateForm => ({
  name: "",
  code: "",
  description: "",
  services: "loan",
  status: "active",
  templateBody: "",
  placeholders: [],
});

const PLACEHOLDER_PRESETS: Array<{
  group: string;
  items: Array<{ fieldCode: string; fieldLabel: string; dataSource: string }>;
}> = [
  {
    group: "Thông tin khách hàng",
    items: [
      { fieldCode: "customer_name", fieldLabel: "Họ và tên", dataSource: "user.fullName" },
      { fieldCode: "customer_dob", fieldLabel: "Ngày sinh", dataSource: "user.dob" },
      { fieldCode: "customer_citizen_id", fieldLabel: "CCCD", dataSource: "user.citizenId" },
      { fieldCode: "customer_phone", fieldLabel: "Số điện thoại", dataSource: "user.phone" },
      { fieldCode: "customer_email", fieldLabel: "Email", dataSource: "user.email" },
      { fieldCode: "customer_address", fieldLabel: "Địa chỉ", dataSource: "user.address" },
    ],
  },
  {
    group: "Thông tin khoản vay",
    items: [
      { fieldCode: "loan_amount", fieldLabel: "Số tiền vay", dataSource: "loan.amount" },
      { fieldCode: "loan_term_months", fieldLabel: "Kỳ hạn (tháng)", dataSource: "loan.termMonths" },
      { fieldCode: "loan_interest_rate", fieldLabel: "Lãi suất", dataSource: "loan.interestRate" },
      { fieldCode: "loan_purpose", fieldLabel: "Mục đích vay", dataSource: "loan.purpose" },
      { fieldCode: "loan_type", fieldLabel: "Loại vay", dataSource: "loan.type" },
      { fieldCode: "loan_product", fieldLabel: "Sản phẩm vay", dataSource: "loan.productName" },
    ],
  },
  {
    group: "Tài sản & thu nhập",
    items: [
      { fieldCode: "income_monthly", fieldLabel: "Thu nhập hàng tháng", dataSource: "loan.monthlyIncome" },
      { fieldCode: "collateral_desc", fieldLabel: "Mô tả tài sản", dataSource: "loan.collateralDescription" },
      { fieldCode: "collateral_value", fieldLabel: "Giá trị tài sản", dataSource: "loan.collateralValue" },
    ],
  },
  {
    group: "Ngày tháng & hợp đồng",
    items: [
      { fieldCode: "contract_number", fieldLabel: "Số hợp đồng", dataSource: "contract.number" },
      { fieldCode: "contract_date", fieldLabel: "Ngày hợp đồng", dataSource: "contract.date" },
      { fieldCode: "sign_date", fieldLabel: "Ngày ký", dataSource: "contract.signedAt" },
      { fieldCode: "today", fieldLabel: "Ngày hiện tại", dataSource: "system.today" },
    ],
  },
];

const toForm = (detail: TemplateDetail | null): TemplateForm => {
  if (!detail) return emptyTemplateForm();
  return {
    name: detail.name ?? "",
    code: detail.code ?? "",
    description: detail.description ?? "",
    services: detail.services ?? "loan",
    status: normalizeStatus(detail.status) || "active",
    templateBody: detail.templateBody ?? "",
    placeholders: detail.placeholders ? detail.placeholders.map((p) => ({ ...p })) : [],
  };
};

export default function ContractsPage() {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [templateDetail, setTemplateDetail] = useState<TemplateDetail | null>(null);
  const [templateForm, setTemplateForm] = useState<TemplateForm>(emptyTemplateForm());
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);

  const [acceptances, setAcceptances] = useState<ContractAcceptanceSummary[]>([]);
  const [contracts, setContracts] = useState<GeneratedContract[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [selectedCustomerKey, setSelectedCustomerKey] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [error, setError] = useState("");

  const templateBodyRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadTemplates() {
      setLoadingTemplates(true);
      setError("");
      try {
        const data = await listContractTemplates();
        if (!alive) return;
        setTemplates(data);
        if (!selectedTemplateId && data.length > 0) {
          setSelectedTemplateId(data[0].id);
        }
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Không thể tải template");
      } finally {
        if (alive) setLoadingTemplates(false);
      }
    }

    loadTemplates();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedTemplateId) {
      if (!isCreatingNew) {
        setTemplateDetail(null);
        setTemplateForm(emptyTemplateForm());
      }
      return;
    }

    let alive = true;
    setError("");

    getContractTemplate(selectedTemplateId)
      .then((detail) => {
        if (!alive) return;
        setTemplateDetail(detail);
        setTemplateForm(toForm(detail));
        setIsCreatingNew(false);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Không thể tải chi tiết template");
      });

    return () => {
      alive = false;
    };
  }, [selectedTemplateId, isCreatingNew]);

  useEffect(() => {
    let alive = true;

    async function loadDocuments() {
      setLoadingDocs(true);
      setError("");
      try {
        const [acc, docs] = await Promise.all([
          listContractAcceptances("all"),
          listGeneratedContracts(),
        ]);
        if (!alive) return;
        setAcceptances(acc);
        setContracts(docs);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Không thể tải danh sách hợp đồng");
      } finally {
        if (alive) setLoadingDocs(false);
      }
    }

    loadDocuments();

    return () => {
      alive = false;
    };
  }, []);

  const loanTemplates = useMemo(
    () => templates.filter((t) => !isSavingTemplate(t.code, t.services)),
    [templates]
  );

  const savingTemplates = useMemo(
    () => templates.filter((t) => isSavingTemplate(t.code, t.services)),
    [templates]
  );

  const contractMap = useMemo(() => {
    const map = new Map<string, GeneratedContract>();
    contracts.forEach((item) => {
      if (item.contractNumber) {
        map.set(item.contractNumber, item);
      }
    });
    return map;
  }, [contracts]);

  const customers = useMemo(() => {
    const map = new Map<string, { key: string; userId: number | null; name: string; phone: string; count: number; lastAcceptedAt: string }>();
    acceptances.forEach((item) => {
      const key = item.userId != null
        ? `user:${item.userId}`
        : `phone:${item.userPhone ?? item.referenceId}`;
      const existing = map.get(key) ?? {
        key,
        userId: item.userId ?? null,
        name: item.userFullName ?? "Khách hàng",
        phone: item.userPhone ?? "",
        count: 0,
        lastAcceptedAt: "",
      };
      existing.count += 1;
      if (item.acceptedAt && item.acceptedAt > existing.lastAcceptedAt) {
        existing.lastAcceptedAt = item.acceptedAt;
      }
      map.set(key, existing);
    });

    const list = Array.from(map.values());
    const q = customerSearch.trim().toLowerCase();
    const filtered = q
      ? list.filter((item) =>
        [item.name, item.phone, String(item.userId ?? ""), item.key]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(q))
      )
      : list;

    return filtered.sort((a, b) => (b.lastAcceptedAt ?? "").localeCompare(a.lastAcceptedAt ?? ""));
  }, [acceptances, customerSearch]);

  useEffect(() => {
    if (!selectedCustomerKey && customers.length > 0) {
      setSelectedCustomerKey(customers[0].key);
    }
  }, [customers, selectedCustomerKey]);

  const selectedAcceptances = useMemo(() => {
    if (!selectedCustomerKey) return [];
    if (selectedCustomerKey.startsWith("user:")) {
      const id = Number(selectedCustomerKey.replace("user:", ""));
      return acceptances.filter((item) => item.userId === id);
    }
    if (selectedCustomerKey.startsWith("phone:")) {
      const phone = selectedCustomerKey.replace("phone:", "");
      return acceptances.filter((item) => (item.userPhone ?? "") === phone);
    }
    return [];
  }, [acceptances, selectedCustomerKey]);

  const isSavingAgreement = isSavingTemplate(templateForm.code, templateForm.services);

  async function handleSaveTemplate() {
    setSavingTemplate(true);
    setError("");
    try {
      const payload = {
        name: templateForm.name.trim(),
        code: templateForm.code.trim(),
        description: templateForm.description.trim() || null,
        services: templateForm.services.trim() || null,
        status: templateForm.status.trim().toLowerCase() || null,
        templateBody: templateForm.templateBody,
        templateFileUrl: templateDetail?.templateFileUrl ?? null,
        placeholders: isSavingAgreement ? [] : templateForm.placeholders.map((p, index) => {
          const sortOrder = Number.isFinite(p.sortOrder as number) ? (p.sortOrder as number) : index + 1;
          return {
            fieldCode: p.fieldCode.trim(),
            fieldLabel: p.fieldLabel?.trim() || null,
            dataSource: p.dataSource?.trim() || null,
            sortOrder,
          };
        }),
      };

      if (templateDetail && !isCreatingNew) {
        const updated = await updateContractTemplate(templateDetail.id, payload);
        setTemplateDetail(updated);
        setTemplateForm(toForm(updated));
      } else {
        const created = await createContractTemplate(payload);
        setTemplateDetail(created);
        setTemplateForm(toForm(created));
        setSelectedTemplateId(created.id);
        setIsCreatingNew(false);
      }

      const refreshed = await listContractTemplates();
      setTemplates(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu template");
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleUploadTemplate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.querySelector("input[type=file]") as HTMLInputElement;
    if (!input || !input.files || input.files.length === 0) return;
    const file = input.files[0];
    setUploadingTemplate(true);
    setError("");

    try {
      const data = new FormData(form);
      const name = (data.get("name") as string) || file.name;
      const code = (data.get("code") as string) ||
        "TPL-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const description = (data.get("description") as string) || "";
      const services = (data.get("services") as string) || "loan";

      const uploaded = await uploadContractTemplate({
        file,
        name,
        code,
        description,
        services,
      });

      setTemplateDetail(uploaded);
      setTemplateForm(toForm(uploaded));
      setSelectedTemplateId(uploaded.id);
      setIsCreatingNew(false);

      const refreshed = await listContractTemplates();
      setTemplates(refreshed);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải template lên");
    } finally {
      setUploadingTemplate(false);
    }
  }

  function handleAddPlaceholder() {
    setTemplateForm((prev) => ({
      ...prev,
      placeholders: [
        ...prev.placeholders,
        { fieldCode: "", fieldLabel: "", dataSource: "", sortOrder: prev.placeholders.length + 1 },
      ],
    }));
  }

  function handleAddPreset(item: { fieldCode: string; fieldLabel: string; dataSource: string }) {
    setTemplateForm((prev) => {
      const exists = prev.placeholders.some((p) => p.fieldCode === item.fieldCode);
      const nextPlaceholders = exists
        ? prev.placeholders
        : [
          ...prev.placeholders,
          {
            fieldCode: item.fieldCode,
            fieldLabel: item.fieldLabel,
            dataSource: item.dataSource,
            sortOrder: prev.placeholders.length + 1,
          },
        ];

      const token = `{{${item.fieldCode}}}`;
      const body = prev.templateBody ?? "";
      const textarea = templateBodyRef.current;

      if (!textarea) {
        return {
          ...prev,
          templateBody: body ? `${body}\n${token}` : token,
          placeholders: nextPlaceholders,
        };
      }

      const start = textarea.selectionStart ?? body.length;
      const end = textarea.selectionEnd ?? start;
      const nextBody = `${body.slice(0, start)}${token}${body.slice(end)}`;

      queueMicrotask(() => {
        const pos = start + token.length;
        textarea.focus();
        textarea.setSelectionRange(pos, pos);
      });

      return {
        ...prev,
        templateBody: nextBody,
        placeholders: nextPlaceholders,
      };
    });
  }

  function handlePlaceholderChange(index: number, key: keyof TemplatePlaceholder, value: string) {
    setTemplateForm((prev) => {
      const updated = [...prev.placeholders];
      const nextValue = key === "sortOrder" ? Number(value) : value;
      updated[index] = { ...updated[index], [key]: nextValue };
      return { ...prev, placeholders: updated };
    });
  }

  function handleRemovePlaceholder(index: number) {
    setTemplateForm((prev) => ({
      ...prev,
      placeholders: prev.placeholders.filter((_, idx) => idx !== index),
    }));
  }

  return (
    <AdminShell
      title="Quản lý hợp đồng & thỏa thuận"
      subtitle="Danh sách khách hàng + chỉnh sửa template"
    >
      {error ? (
        <div className="mb-4 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <div className="font-semibold">Luồng xử lý hợp đồng & thỏa thuận</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px]">
          <li>Danh sách khách hàng → chọn khách hàng → tải hợp đồng/thỏa thuận đã sinh.</li>
          <li>Template hợp đồng cho vay có placeholder, thỏa thuận tiết kiệm dùng 1 bản cố định.</li>
          <li>Chỉnh sửa template trực tiếp trước khi áp dụng phiên bản mới.</li>
        </ul>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[320px,1fr]">
        <div className="rounded-lg bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Danh sách khách hàng</h3>
            <div className="text-xs text-zinc-500">{customers.length} KH</div>
          </div>
          <input
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            placeholder="Tìm theo tên, SĐT"
            className="mt-3 w-full rounded border border-black/10 px-3 py-2 text-sm"
          />
          <div className="mt-3 flex max-h-[420px] flex-col gap-2 overflow-y-auto">
            {loadingDocs ? (
              <div className="text-xs text-zinc-400">Đang tải dữ liệu...</div>
            ) : customers.length === 0 ? (
              <div className="text-xs text-zinc-500">Chưa có dữ liệu hợp đồng.</div>
            ) : (
              customers.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSelectedCustomerKey(item.key)}
                  className={`flex items-start justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                    selectedCustomerKey === item.key
                      ? "border-blue-200 bg-blue-50"
                      : "border-transparent hover:bg-zinc-50"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-zinc-900">{item.name}</div>
                    <div className="text-xs text-zinc-500">{item.phone || `ID ${item.userId ?? "—"}`}</div>
                  </div>
                  <div className="text-xs text-zinc-400">{item.count} hợp đồng</div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg bg-white p-4">
          <h3 className="text-sm font-bold">Hợp đồng & thỏa thuận của khách hàng</h3>
          <div className="mt-1 text-xs text-zinc-500">
            Chọn khách hàng để xem danh sách hợp đồng và tải file đã sinh.
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {loadingDocs ? (
              <div className="text-xs text-zinc-400">Đang tải dữ liệu...</div>
            ) : selectedAcceptances.length === 0 ? (
              <div className="text-xs text-zinc-500">Chưa có hợp đồng cho khách hàng này.</div>
            ) : (
              selectedAcceptances.map((item) => {
                const contract = item.contractNumber ? contractMap.get(item.contractNumber) : undefined;
                return (
                  <div key={`${item.referenceType}-${item.referenceId}-${item.contractNumber ?? ""}`}
                       className="rounded-lg border border-zinc-100 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">
                          {item.contractNumber ?? "Chưa có số"}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {item.templateName ?? item.templateCode ?? "Template"} · {ownerTypeLabel(item.referenceType)}
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500">{item.acceptanceStatus ?? "—"}</div>
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">
                      Xác nhận: {formatDateTime(item.acceptedAt)}
                    </div>
                    <div className="mt-3">
                      {contract?.fileUrl ? (
                        <a
                          className="inline-flex rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
                          href={contract.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Tải file
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-400">Chưa có file hợp đồng</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[320px,1fr]">
        <div className="rounded-lg bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Danh sách template</h3>
            <button
              type="button"
              onClick={() => {
                setIsCreatingNew(true);
                setSelectedTemplateId(null);
                setTemplateDetail(null);
                setTemplateForm({
                  ...emptyTemplateForm(),
                  name: "Thỏa thuận tiết kiệm",
                  code: "SAVING_AGREEMENT",
                  services: "saving",
                });
              }}
              className="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
            >
              Tạo thỏa thuận
            </button>
          </div>

          <div className="mt-3">
            <div className="text-xs font-semibold text-zinc-500">Hợp đồng vay</div>
            <div className="mt-2 flex flex-col gap-2">
              {loadingTemplates ? (
                <div className="text-xs text-zinc-400">Đang tải template...</div>
              ) : loanTemplates.length === 0 ? (
                <div className="text-xs text-zinc-500">Chưa có template hợp đồng.</div>
              ) : (
                loanTemplates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(t.id)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                      selectedTemplateId === t.id
                        ? "border-blue-200 bg-blue-50"
                        : "border-transparent hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-zinc-900">{t.name}</div>
                      {isActiveStatus(t.status) ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          ACTIVE
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-zinc-500">{t.code}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold text-zinc-500">Thỏa thuận tiết kiệm</div>
            <div className="mt-2 flex flex-col gap-2">
              {savingTemplates.length === 0 ? (
                <div className="text-xs text-zinc-500">Chưa có template thỏa thuận.</div>
              ) : (
                savingTemplates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(t.id)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                      selectedTemplateId === t.id
                        ? "border-blue-200 bg-blue-50"
                        : "border-transparent hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-zinc-900">{t.name}</div>
                      {isActiveStatus(t.status) ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          ACTIVE
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-zinc-500">{t.code}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Chỉnh sửa template</h3>
            <button
              type="button"
              onClick={handleSaveTemplate}
              className="rounded bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
              disabled={savingTemplate}
            >
              {savingTemplate ? "Đang lưu..." : templateDetail && !isCreatingNew ? "Lưu thay đổi" : "Tạo template"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              value={templateForm.name}
              onChange={(e) => setTemplateForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Tên template"
              className="rounded border p-2 text-sm"
            />
            <input
              value={templateForm.code}
              onChange={(e) => setTemplateForm((prev) => ({ ...prev, code: e.target.value }))}
              placeholder="Mã template (VD: LOAN_CONTRACT)"
              className="rounded border p-2 text-sm"
            />
            <input
              value={templateForm.description}
              onChange={(e) => setTemplateForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Mô tả"
              className="rounded border p-2 text-sm"
            />
            <div className="flex gap-2">
              <select
                value={templateForm.services}
                onChange={(e) => setTemplateForm((prev) => ({ ...prev, services: e.target.value }))}
                className="w-full rounded border p-2 text-sm"
              >
                <option value="loan">Hợp đồng vay</option>
                <option value="saving">Thỏa thuận tiết kiệm</option>
                <option value="general">Khác</option>
              </select>
              <select
                value={templateForm.status}
                onChange={(e) => setTemplateForm((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full rounded border p-2 text-sm"
              >
                <option value="active">ACTIVE</option>
                <option value="archived">ARCHIVED</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold text-zinc-500">Nội dung template</div>
            <textarea
              ref={templateBodyRef}
              value={templateForm.templateBody}
              onChange={(e) => setTemplateForm((prev) => ({ ...prev, templateBody: e.target.value }))}
              rows={10}
              className="mt-2 w-full rounded border p-3 text-sm"
              placeholder="Nhập nội dung template..."
            />
          </div>

          {!isSavingAgreement ? (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-zinc-500">Placeholder</div>
                <button
                  type="button"
                  onClick={handleAddPlaceholder}
                  className="rounded bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700"
                >
                  Thêm placeholder
                </button>
              </div>
              <div className="mt-3 rounded border border-zinc-100 bg-zinc-50 p-3">
                <div className="text-xs font-semibold text-zinc-600">Mẫu placeholder có sẵn</div>
                <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {PLACEHOLDER_PRESETS.map((group) => (
                    <div key={group.group} className="rounded border border-zinc-100 bg-white p-2">
                      <div className="text-xs font-semibold text-zinc-500">{group.group}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {group.items.map((item) => (
                          <button
                            key={item.fieldCode}
                            type="button"
                            onClick={() => handleAddPreset(item)}
                            className="rounded-full border border-zinc-200 px-2 py-1 text-[11px] text-zinc-700 hover:bg-zinc-100"
                          >
                            {item.fieldLabel}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 flex flex-col gap-2">
                {templateForm.placeholders.length === 0 ? (
                  <div className="text-xs text-zinc-400">Chưa có placeholder.</div>
                ) : (
                  templateForm.placeholders.map((item, index) => (
                    <div key={`placeholder-${index}`} className="grid grid-cols-1 gap-2 rounded border border-zinc-100 p-2 md:grid-cols-5">
                      <input
                        value={item.fieldCode ?? ""}
                        onChange={(e) => handlePlaceholderChange(index, "fieldCode", e.target.value)}
                        placeholder="Mã (VD: customer_name)"
                        className="rounded border p-2 text-xs"
                      />
                      <input
                        value={item.fieldLabel ?? ""}
                        onChange={(e) => handlePlaceholderChange(index, "fieldLabel", e.target.value)}
                        placeholder="Nhãn hiển thị"
                        className="rounded border p-2 text-xs"
                      />
                      <input
                        value={item.dataSource ?? ""}
                        onChange={(e) => handlePlaceholderChange(index, "dataSource", e.target.value)}
                        placeholder="Nguồn dữ liệu"
                        className="rounded border p-2 text-xs"
                      />
                      <input
                        value={item.sortOrder ?? index + 1}
                        onChange={(e) => handlePlaceholderChange(index, "sortOrder", e.target.value)}
                        placeholder="Thứ tự"
                        className="rounded border p-2 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePlaceholder(index)}
                        className="rounded bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600"
                      >
                        Xóa
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              Thỏa thuận tiết kiệm không cần placeholder, chỉ dùng một bản nội dung cố định.
            </div>
          )}

          {!isSavingAgreement ? (
            <div className="mt-6 rounded border border-dashed border-zinc-200 p-3">
              <div className="text-xs font-semibold text-zinc-600">Upload template DOCX (hợp đồng vay)</div>
              <form onSubmit={handleUploadTemplate} className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                <input name="name" placeholder="Tên template" className="rounded border p-2 text-sm" />
                <input name="code" placeholder="Mã template" className="rounded border p-2 text-sm" />
                <input name="description" placeholder="Mô tả" className="rounded border p-2 text-sm" />
                <select name="services" className="rounded border p-2 text-sm">
                  <option value="loan">Hợp đồng vay</option>
                  <option value="general">Khác</option>
                </select>
                <input type="file" accept=".docx" className="col-span-1 md:col-span-3" />
                <button className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white" disabled={uploadingTemplate}>
                  {uploadingTemplate ? "Đang tải..." : "Upload"}
                </button>
              </form>
              <div className="mt-2 text-xs text-zinc-400">
                Sau khi upload, bạn có thể chỉnh sửa nội dung và placeholder ngay trong form bên trên.
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}
