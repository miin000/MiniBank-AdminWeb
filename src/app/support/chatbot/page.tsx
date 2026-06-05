"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import AdminShell from "@/src/app/components/admin-shell";
import {
  addChatNote,
  AdminChatConversationDetail,
  AdminChatConversationSummary,
  AdminFaqCategory,
  AdminFaqItem,
  assignChatConversation,
  closeChatConversation,
  createFaqCategory,
  createFaqItem,
  deleteFaqItem,
  getChatConversation,
  listChatConversations,
  listFaqCategories,
  listFaqItems,
  replyChatConversation,
  updateFaqCategory,
  updateFaqItem,
} from "@/src/lib/api/chatbot-admin";
import { backendWsUrl, MiniStompClient } from "@/src/lib/stomp-client";

type Tab = "faq" | "chat";

type FaqNode = AdminFaqItem & {
  children: FaqNode[];
};

function formatTime(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatbotManagementPage() {
  const [tab, setTab] = useState<Tab>("faq");

  const [categories, setCategories] = useState<AdminFaqCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [faqs, setFaqs] = useState<AdminFaqItem[]>([]);
  const [selectedFaq, setSelectedFaq] = useState<AdminFaqItem | null>(null);
  const [faqSearch, setFaqSearch] = useState("");

  const [categoryForm, setCategoryForm] = useState({
    id: 0,
    code: "",
    name: "",
    description: "",
    sortOrder: 10,
    active: true,
  });

  const [faqForm, setFaqForm] = useState({
    id: 0,
    categoryId: 0,
    parentFaqId: 0,
    question: "",
    answer: "",
    active: true,
    keywords: "",
  });

  const [chatStatus, setChatStatus] = useState("");
  const [conversations, setConversations] = useState<AdminChatConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<AdminChatConversationDetail | null>(null);
  const [replyText, setReplyText] = useState("");
  const [noteText, setNoteText] = useState("");
  const stompRef = useRef<MiniStompClient | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );

  const faqTree = useMemo(() => {
    const keyword = faqSearch.trim().toLowerCase();
    const source = selectedCategoryId
      ? faqs.filter((item) => item.categoryId === selectedCategoryId)
      : faqs;

    const nodes = source.map((item) => ({ ...item, children: [] as FaqNode[] }));
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const byParent = new Map<number, FaqNode[]>();

    for (const node of nodes) {
      const parentId = node.parentFaqId ?? 0;
      const effectiveParentId = parentId > 0 && nodeById.has(parentId) ? parentId : 0;
      byParent.set(effectiveParentId, [...(byParent.get(effectiveParentId) ?? []), node]);
    }

    for (const node of nodes) {
      node.children = byParent.get(node.id) ?? [];
    }

    const roots = byParent.get(0) ?? [];
    if (!keyword) return roots;

    const isMatched = (node: FaqNode) =>
      node.question.toLowerCase().includes(keyword) ||
      node.answer.toLowerCase().includes(keyword) ||
      node.keywords.some((item) => item.toLowerCase().includes(keyword));

    const filterNode = (node: FaqNode): FaqNode | null => {
      const matched = isMatched(node);
      const filteredChildren = node.children
        .map(filterNode)
        .filter((item): item is FaqNode => Boolean(item));

      // Nếu node cha khớp keyword, giữ nguyên toàn bộ nhánh con để không làm vỡ ngữ cảnh cây.
      if (matched) return { ...node, children: node.children };

      // Nếu node con khớp keyword, giữ lại node cha làm đường dẫn ngữ cảnh.
      if (filteredChildren.length > 0) return { ...node, children: filteredChildren };

      return null;
    };

    return roots.map(filterNode).filter((item): item is FaqNode => Boolean(item));
  }, [faqs, faqSearch, selectedCategoryId]);

  const faqParentOptions = useMemo(() => {
    const categoryId = Number(faqForm.categoryId || selectedCategoryId || 0);
    const sameCategoryFaqs = faqs.filter((item) => item.categoryId === categoryId);
    const childrenByParent = new Map<number, AdminFaqItem[]>();

    for (const item of sameCategoryFaqs) {
      const parentId = item.parentFaqId ?? 0;
      childrenByParent.set(parentId, [...(childrenByParent.get(parentId) ?? []), item]);
    }

    const excludedIds = new Set<number>();
    if (faqForm.id > 0) {
      const stack = [faqForm.id];
      while (stack.length > 0) {
        const id = stack.pop()!;
        excludedIds.add(id);
        for (const child of childrenByParent.get(id) ?? []) {
          stack.push(child.id);
        }
      }
    }

    const result: { item: AdminFaqItem; level: number }[] = [];
    const visited = new Set<number>();

    const walk = (parentId: number, level: number) => {
      const children = [...(childrenByParent.get(parentId) ?? [])].sort((a, b) =>
        a.question.localeCompare(b.question, "vi")
      );

      for (const item of children) {
        if (visited.has(item.id) || excludedIds.has(item.id)) continue;
        visited.add(item.id);
        result.push({ item, level });
        walk(item.id, level + 1);
      }
    };

    walk(0, 0);

    // Fallback cho dữ liệu cũ bị mồ côi: parent không còn trong danh sách hiện tại.
    for (const item of sameCategoryFaqs) {
      if (visited.has(item.id) || excludedIds.has(item.id)) continue;
      visited.add(item.id);
      result.push({ item, level: 0 });
      walk(item.id, 1);
    }

    return result;
  }, [faqs, faqForm.categoryId, faqForm.id, selectedCategoryId]);

  const selectedParentFaq = useMemo(
    () => faqs.find((item) => item.id === faqForm.parentFaqId) ?? null,
    [faqs, faqForm.parentFaqId]
  );

  async function loadCategories() {
    const list = await listFaqCategories();
    setCategories(list);
    if (!selectedCategoryId && list.length > 0) {
      setSelectedCategoryId(list[0].id);
    }
  }

  async function loadFaqs() {
    if (!selectedCategoryId) {
      setFaqs([]);
      return;
    }

    // Luôn load toàn bộ FAQ của danh mục; search chỉ filter ở client để không làm vỡ cây.
    const list = await listFaqItems(selectedCategoryId);
    setFaqs(list);
  }

  async function loadConversations() {
    const list = await listChatConversations(chatStatus || undefined);
    setConversations(list);
  }

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    Promise.all([loadCategories(), loadConversations()])
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Không thể tải dữ liệu");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const client = new MiniStompClient(backendWsUrl());
    stompRef.current = client;
    client.connect();
    const unsubscribeWaiting = client.subscribe("/topic/chat-waiting", (body) => {
      const event = body as {
        conversationId?: number;
        userId?: number;
        customerName?: string | null;
        customerPhone?: string | null;
        customerRank?: string | null;
        status?: string;
        startedAt?: string;
        escalatedAt?: string | null;
        assignedAdminUserId?: number | null;
        assignedAdminUsername?: string | null;
        lastMessagePreview?: string | null;
      };
      if (!event.conversationId) return;
      setConversations((prev) => {
        const next: AdminChatConversationSummary = {
          id: event.conversationId!,
          userId: event.userId ?? 0,
          userName: event.customerName ?? null,
          userPhone: event.customerPhone ?? null,
          customerRank: event.customerRank ?? null,
          status: event.status ?? "WAITING_AGENT",
          lastIntent: null,
          lastConfidence: null,
          startedAt: event.startedAt ?? new Date().toISOString(),
          escalatedAt: event.escalatedAt ?? null,
          lastMessagePreview: event.lastMessagePreview ?? null,
          assignedAdminUserId: event.assignedAdminUserId ?? null,
          assignedAdminUsername: event.assignedAdminUsername ?? null,
        };
        return [next, ...prev.filter((item) => item.id !== next.id)];
      });
      setSelectedConversation((current) => {
        if (!current || current.id !== event.conversationId) return current;
        return {
          ...current,
          status: event.status ?? current.status,
          assignedAdminUserId: event.assignedAdminUserId ?? current.assignedAdminUserId,
          assignedAdminUsername: event.assignedAdminUsername ?? current.assignedAdminUsername,
        };
      });
    });

    return () => {
      unsubscribeWaiting();
      client.disconnect();
      stompRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!selectedConversation || !stompRef.current) return;
    const conversationId = selectedConversation.id;
    return stompRef.current.subscribe(`/topic/chat/${conversationId}`, (body) => {
      const message = body as AdminChatConversationDetail["messages"][number];
      if (!message?.id) return;
      setSelectedConversation((current) => {
        if (!current || current.id !== conversationId || current.messages.some((item) => item.id === message.id)) {
          return current;
        }
        return { ...current, messages: [...current.messages, message] };
      });
    });
  }, [selectedConversation?.id]);

  useEffect(() => {
    let alive = true;
    loadFaqs().catch((e: unknown) => {
      if (!alive) return;
      setError(e instanceof Error ? e.message : "Không thể tải danh sách FAQ");
    });
    return () => {
      alive = false;
    };
  }, [selectedCategoryId]);

  useEffect(() => {
    let alive = true;
    loadConversations().catch((e: unknown) => {
      if (!alive) return;
      setError(e instanceof Error ? e.message : "Không thể tải danh sách chat");
    });
    return () => {
      alive = false;
    };
  }, [chatStatus]);

  function selectFaq(item: AdminFaqItem) {
    setSelectedFaq(item);
    setFaqForm({
      id: item.id,
      categoryId: item.categoryId,
      parentFaqId: item.parentFaqId ?? 0,
      question: item.question,
      answer: item.answer,
      active: item.active,
      keywords: item.keywords.join(", "),
    });
  }

  async function onSaveCategory() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        code: categoryForm.code.trim(),
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
        sortOrder: Number(categoryForm.sortOrder),
        active: categoryForm.active,
      };
      if (!payload.code || !payload.name) {
        throw new Error("Mã và tên danh mục là bắt buộc");
      }

      if (categoryForm.id > 0) {
        await updateFaqCategory(categoryForm.id, payload);
      } else {
        await createFaqCategory(payload);
      }

      await loadCategories();
      setCategoryForm({ id: 0, code: "", name: "", description: "", sortOrder: 10, active: true });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể lưu danh mục");
    } finally {
      setSaving(false);
    }
  }

  async function onSaveFaq() {
    setSaving(true);
    setError("");
    try {
      const categoryId = Number(faqForm.categoryId || selectedCategoryId || 0);
      if (!categoryId) throw new Error("Vui lòng chọn danh mục");
      if (!faqForm.question.trim() || !faqForm.answer.trim()) {
        throw new Error("Câu hỏi và câu trả lời là bắt buộc");
      }
      if (faqForm.parentFaqId > 0) {
        const parentFaq = faqs.find((item) => item.id === faqForm.parentFaqId);
        if (!parentFaq) throw new Error("FAQ cha không tồn tại trong danh mục đang chọn");
        if (parentFaq.categoryId !== categoryId) throw new Error("FAQ cha phải cùng danh mục với FAQ hiện tại");
        if (faqForm.id > 0 && parentFaq.id === faqForm.id) throw new Error("Không thể chọn chính FAQ này làm cha");
      }

      const payload = {
        categoryId,
        parentFaqId: faqForm.parentFaqId > 0 ? faqForm.parentFaqId : null,
        question: faqForm.question.trim(),
        answer: faqForm.answer.trim(),
        active: faqForm.active,
        keywords: faqForm.keywords
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      };

      if (faqForm.id > 0) {
        await updateFaqItem(faqForm.id, payload);
      } else {
        await createFaqItem(payload);
      }

      await Promise.all([loadFaqs(), loadCategories()]);
      setFaqForm({
        id: 0,
        categoryId,
        parentFaqId: faqForm.parentFaqId,
        question: "",
        answer: "",
        active: true,
        keywords: "",
      });
      setSelectedFaq(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể lưu FAQ");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteFaq() {
    if (!selectedFaq) return;
    if (!window.confirm("Xóa FAQ đã chọn?")) return;

    setSaving(true);
    setError("");
    try {
      await deleteFaqItem(selectedFaq.id);
      await Promise.all([loadFaqs(), loadCategories()]);
      setSelectedFaq(null);
      setFaqForm({
        id: 0,
        categoryId: selectedCategoryId ?? 0,
        parentFaqId: 0,
        question: "",
        answer: "",
        active: true,
        keywords: "",
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể xóa FAQ");
    } finally {
      setSaving(false);
    }
  }

  async function openConversation(conversationId: number) {
    setLoading(true);
    setError("");
    try {
      const detail = await getChatConversation(conversationId);
      setSelectedConversation(detail);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể tải chi tiết cuộc chat");
    } finally {
      setLoading(false);
    }
  }

  async function onAssignConversation() {
    if (!selectedConversation) return;
    setSaving(true);
    setError("");
    try {
      const detail = await assignChatConversation(selectedConversation.id);
      setSelectedConversation(detail);
      await loadConversations();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể nhận cuộc chat");
    } finally {
      setSaving(false);
    }
  }

  async function onReplyConversation() {
    if (!selectedConversation || !replyText.trim()) return;
    setSaving(true);
    setError("");
    try {
      const detail = await replyChatConversation(selectedConversation.id, replyText.trim());
      setSelectedConversation(detail);
      setReplyText("");
      await loadConversations();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể gửi phản hồi");
    } finally {
      setSaving(false);
    }
  }

  async function onCloseConversation() {
    if (!selectedConversation) return;
    setSaving(true);
    setError("");
    try {
      const detail = await closeChatConversation(selectedConversation.id);
      setSelectedConversation(detail);
      await loadConversations();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể đóng cuộc chat");
    } finally {
      setSaving(false);
    }
  }

  async function onAddNote() {
    if (!selectedConversation || !noteText.trim()) return;
    setSaving(true);
    setError("");
    try {
      await addChatNote(selectedConversation.id, noteText.trim());
      setNoteText("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể lưu ghi chú");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell
      title="FAQ / Chat CSKH"
      subtitle="Quản lý cây hỏi đáp nghiệp vụ và luồng chat được chuyển cho CSKH"
    >
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("faq")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === "faq" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            Quản lý FAQ tree
          </button>
          <button
            type="button"
            onClick={() => setTab("chat")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === "chat" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            Luồng chat CSKH
          </button>
        </div>

        {error ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}

        {tab === "faq" ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-[280px_1fr_1.1fr]">
            <section className="rounded-xl border border-gray-200 p-3">
              <div className="mb-2 text-sm font-semibold text-gray-800">Danh mục</div>
              <div className="space-y-2">
                {categories.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(item.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left ${
                      selectedCategoryId === item.id ? "border-blue-300 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>{item.name}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{item.faqCount}</span>
                    </div>
                    <div className="text-xs text-gray-500">{item.code}</div>
                  </button>
                ))}
              </div>

              <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Mã danh mục"
                  value={categoryForm.code}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, code: e.target.value }))}
                />
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Tên danh mục"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                />
                <textarea
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Mô tả"
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                />
                <div className="flex items-center gap-2">
                  <input
                    className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    type="number"
                    value={categoryForm.sortOrder}
                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                  />
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={categoryForm.active}
                      onChange={(e) => setCategoryForm((prev) => ({ ...prev, active: e.target.checked }))}
                    />
                    Kích hoạt
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={onSaveCategory}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Lưu danh mục
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedCategory) return;
                      setCategoryForm({
                        id: selectedCategory.id,
                        code: selectedCategory.code,
                        name: selectedCategory.name,
                        description: selectedCategory.description ?? "",
                        sortOrder: selectedCategory.sortOrder,
                        active: selectedCategory.active,
                      });
                    }}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700"
                  >
                    Sửa mục chọn
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-gray-800">Danh sách câu hỏi</div>
                <input
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                  placeholder="Tìm câu hỏi..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                />
              </div>
              <div className="max-h-[560px] space-y-2 overflow-auto pr-1">
                {faqTree.length ? faqTree.map((item) => (
                  <FaqTreeRow
                    key={item.id}
                    node={item}
                    level={0}
                    selectedId={selectedFaq?.id ?? null}
                    onSelect={selectFaq}
                  />
                )) : (
                  <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                    Chưa có câu hỏi nào trong danh mục này.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 p-3">
              <div className="mb-2 text-sm font-semibold text-gray-800">Chi tiết FAQ</div>
              <div className="space-y-2">
                <select
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  value={faqForm.categoryId || selectedCategoryId || 0}
                  onChange={(e) => setFaqForm((prev) => ({ ...prev, categoryId: Number(e.target.value), parentFaqId: 0 }))}
                >
                  <option value={0}>Chọn danh mục</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  value={faqForm.parentFaqId}
                  onChange={(e) => setFaqForm((prev) => ({ ...prev, parentFaqId: Number(e.target.value) }))}
                >
                  <option value={0}>— Câu hỏi gốc (không có cha) —</option>
                  {faqParentOptions.map(({ item, level }) => (
                    <option key={item.id} value={item.id}>
                      {`${"— ".repeat(level)}${item.question.length > 70 ? `${item.question.slice(0, 70)}…` : item.question}`}
                    </option>
                  ))}
                </select>

                {selectedParentFaq ? (
                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                    Đang chọn FAQ cha: <span className="font-semibold">{selectedParentFaq.question}</span>
                  </div>
                ) : null}

                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Câu hỏi"
                  value={faqForm.question}
                  onChange={(e) => setFaqForm((prev) => ({ ...prev, question: e.target.value }))}
                />
                <textarea
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Câu trả lời"
                  rows={6}
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm((prev) => ({ ...prev, answer: e.target.value }))}
                />
                <textarea
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Keywords, ngăn cách bằng dấu phẩy"
                  rows={3}
                  value={faqForm.keywords}
                  onChange={(e) => setFaqForm((prev) => ({ ...prev, keywords: e.target.value }))}
                />
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={faqForm.active}
                    onChange={(e) => setFaqForm((prev) => ({ ...prev, active: e.target.checked }))}
                  />
                  Kích hoạt
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={onSaveFaq}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Lưu FAQ
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={onDeleteFaq}
                    className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700"
                  >
                    Xóa FAQ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const parentId = selectedFaq?.id ?? 0;
                      setSelectedFaq(null);
                      setFaqForm({
                        id: 0,
                        categoryId: selectedCategoryId ?? 0,
                        parentFaqId: parentId,
                        question: "",
                        answer: "",
                        active: true,
                        keywords: "",
                      });
                    }}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700"
                  >
                    {selectedFaq ? `+ Nhánh con của "${selectedFaq.question.slice(0, 20)}…"` : "Mới (gốc)"}
                  </button>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 xl:grid-cols-[360px_1fr]">
            <section className="rounded-xl border border-gray-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-800">Hàng chờ chat</div>
                <select
                  className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                  value={chatStatus}
                  onChange={(e) => setChatStatus(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="WAITING_AGENT">Đang chờ CSKH</option>
                  <option value="IN_PROGRESS">Đang xử lý</option>
                  <option value="OPEN">Bot xử lý</option>
                  <option value="CLOSED">Đã đóng</option>
                </select>
              </div>

              <div className="max-h-[620px] space-y-2 overflow-auto pr-1">
                {conversations.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openConversation(item.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left ${
                      selectedConversation?.id === item.id ? "border-blue-300 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>#{item.id}</span>
                      <span>{item.customerRank ?? "Đồng"}</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-800">{item.userName ?? "Khách hàng"}</div>
                    <div className="text-xs text-gray-500">{item.userPhone ?? "-"}</div>
                    <div className="mt-1 text-xs text-gray-700">{item.lastMessagePreview ?? "Chưa có tin nhắn"}</div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                      <span>{item.status}</span>
                      <span>{item.lastConfidence != null ? `${item.lastConfidence}%` : "-"}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 p-3">
              {!selectedConversation ? (
                <div className="flex h-[640px] items-center justify-center text-sm text-gray-400">
                  Chọn một cuộc chat để xem chi tiết.
                </div>
              ) : (
                <div className="flex h-[640px] flex-col">
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                    <div className="font-semibold text-gray-800">{selectedConversation.userName ?? "Khách hàng"}</div>
                    <div className="text-xs text-gray-600">{selectedConversation.userPhone ?? "-"}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      Trạng thái: {selectedConversation.status} | Intent: {selectedConversation.lastIntent ?? "-"} | Bắt đầu: {formatTime(selectedConversation.startedAt)}
                    </div>
                  </div>

                  <div className="mt-3 flex-1 space-y-2 overflow-auto rounded-lg border border-gray-100 bg-white p-3">
                    {selectedConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                          message.senderType === "USER"
                            ? "ml-auto bg-blue-600 text-white"
                            : message.senderType === "ADMIN"
                              ? "ml-auto bg-emerald-600 text-white"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <div className="text-[11px] opacity-80">{message.senderType}</div>
                        <div>{message.content}</div>
                        <div className="mt-1 text-[11px] opacity-80">{formatTime(message.createdAt)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto]">
                    <input
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Nhập phản hồi cho khách hàng..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <button
                      type="button"
                      disabled={saving}
                      onClick={onReplyConversation}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                    >
                      Gửi phản hồi
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={onAssignConversation}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700"
                    >
                      Nhận xử lý
                    </button>
                  </div>

                  <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto]">
                    <input
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Ghi chú nội bộ..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                    />
                    <button
                      type="button"
                      disabled={saving}
                      onClick={onAddNote}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700"
                    >
                      Lưu ghi chú
                    </button>
                  </div>

                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={onCloseConversation}
                      className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700"
                    >
                      Đóng cuộc chat
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {loading ? <div className="mt-3 text-xs text-gray-500">Đang tải dữ liệu...</div> : null}
      </div>
    </AdminShell>
  );
}

function FaqTreeRow({
  node,
  level,
  selectedId,
  onSelect,
}: {
  node: FaqNode;
  level: number;
  selectedId: number | null;
  onSelect: (item: AdminFaqItem) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2" style={{ marginLeft: level * 20 }}>
        {level > 0 ? <div className="mt-2 h-auto w-4 border-l border-t border-gray-200" /> : null}
        <div
          className={`flex-1 rounded-xl border bg-white p-3 ${
            selectedId === node.id ? "border-blue-300 bg-blue-50" : "border-gray-200"
          }`}
        >
          <button type="button" onClick={() => onSelect(node)} className="w-full text-left">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-gray-400">
                  {level === 0 ? "Câu gốc" : `Nhánh cấp ${level + 1}`}
                </div>
                <div className="text-sm font-semibold text-gray-800">{node.question}</div>
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                {node.childCount} nhánh
              </span>
            </div>
            <div className="mt-2 line-clamp-2 text-xs text-gray-500">{node.answer}</div>
            <div className="mt-2 text-[11px] text-gray-400">{node.active ? "Hoạt động" : "Tắt"}</div>
          </button>
        </div>
      </div>
      {node.children.map((child) => (
        <FaqTreeRow
          key={child.id}
          node={child}
          level={level + 1}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
