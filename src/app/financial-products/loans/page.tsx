"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, HelpCircle, PlusCircle, Search } from "lucide-react";
import AdminShell from "../../components/admin-shell";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/+$/, "");

type LoanProductItem = { id:number; code:string; name:string; loanType:string; currency:string; minAmount:number; maxAmount:number; minTermMonths:number; maxTermMonths:number; baseInterestRate:number; status:string; };

const statusOptions = [
  { value: "ALL", label: "Tat ca trang thai" },
  { value: "active", label: "Dang hoat dong" },
  { value: "inactive", label: "Tam ngung" },
];

function formatVND(value: number) { return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value ?? 0); }
function formatLoanType(value: string | null | undefined) {
  const v = (value ?? "").toUpperCase();
  if (["SECURED", "MORTGAGE", "COLLATERAL"].includes(v)) return "The chap";
  if (["UNSECURED", "PERSONAL", "CREDIT"].includes(v)) return "Tin chap";
  return value || "Chua phan loai";
}
function loanTypeTone(value: string | null | undefined) {
  const v = (value ?? "").toUpperCase();
  return ["SECURED", "MORTGAGE", "COLLATERAL"].includes(v) ? "border-blue-100 bg-blue-50 text-blue-700" : "border-amber-100 bg-amber-50 text-amber-700";
}

export default function LoanProductsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [products, setProducts] = useState<LoanProductItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [form, setForm] = useState({ code:"", name:"", loanType:"UNSECURED", minAmount:"", maxAmount:"", minTermMonths:"", maxTermMonths:"", baseInterestRate:"" });

  useEffect(() => { setToken(localStorage.getItem("adminToken")); }, []);

  const fetchLoanProducts = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/financial-products/loan-products`, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.text()) || "Khong the tai danh sach san pham vay");
      setProducts((await res.json()) as LoanProductItem[]);
    } catch (err) { setError(err instanceof Error ? err.message : "Co loi khi ket noi API"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchLoanProducts(); }, [fetchLoanProducts]);

  const handleCreateLoanProduct = async (e: React.FormEvent) => {
    e.preventDefault(); if (!token) return; setFormSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/financial-products/loan-products`, { method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` }, body: JSON.stringify({ ...form, currency:"VND", minAmount:Number(form.minAmount), maxAmount:Number(form.maxAmount), minTermMonths:Number(form.minTermMonths), maxTermMonths:Number(form.maxTermMonths), interestRateType:"FIXED", baseInterestRate:Number(form.baseInterestRate), status:"active" }) });
      if (!res.ok) throw new Error(await res.text());
      setShowCreateForm(false); setForm({ code:"", name:"", loanType:"UNSECURED", minAmount:"", maxAmount:"", minTermMonths:"", maxTermMonths:"", baseInterestRate:"" }); fetchLoanProducts();
    } catch (err) { alert(err instanceof Error ? err.message : "Khong the tao san pham vay"); }
    finally { setFormSubmitting(false); }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    if (!token) return; const nextStatus = currentStatus.toLowerCase() === "active" ? "inactive" : "active";
    const res = await fetch(`${API_BASE}/api/admin/financial-products/loan-products/${id}/status`, { method:"PATCH", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` }, body: JSON.stringify({ status: nextStatus }) });
    if (res.ok) fetchLoanProducts();
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => (!q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || formatLoanType(p.loanType).toLowerCase().includes(q)) && (statusFilter === "ALL" || p.status.toLowerCase() === statusFilter.toLowerCase()));
  }, [products, searchQuery, statusFilter]);

  if (!token) return <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-6"><div className="rounded-xl bg-white p-6 text-sm text-gray-600 shadow">Vui long dang nhap Admin.</div></div>;

  return <AdminShell title="Goi san pham vay" subtitle="Phan biet ro san pham vay tin chap va the chap">
    <div className="space-y-6 font-sans text-gray-800">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-base font-bold text-gray-900">Danh sach san pham vay</h2><button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700"><PlusCircle size={14} /> {showCreateForm ? "Dong" : "Them goi vay moi"}</button></div>
      {showCreateForm && <form onSubmit={handleCreateLoanProduct} className="grid grid-cols-1 gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:grid-cols-2 md:grid-cols-4">
        <input required placeholder="Ma goi" value={form.code} onChange={e=>setForm({...form,code:e.target.value})} className="h-9 rounded-lg border px-3 text-xs" />
        <input required placeholder="Ten goi" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="h-9 rounded-lg border px-3 text-xs" />
        <select value={form.loanType} onChange={e=>setForm({...form,loanType:e.target.value})} className="h-9 rounded-lg border px-2 text-xs"><option value="UNSECURED">Tin chap</option><option value="SECURED">The chap</option></select>
        <input type="number" step="0.01" required placeholder="Lai suat %/nam" value={form.baseInterestRate} onChange={e=>setForm({...form,baseInterestRate:e.target.value})} className="h-9 rounded-lg border px-3 text-xs" />
        <input type="number" required placeholder="Han muc toi thieu" value={form.minAmount} onChange={e=>setForm({...form,minAmount:e.target.value})} className="h-9 rounded-lg border px-3 text-xs" />
        <input type="number" required placeholder="Han muc toi da" value={form.maxAmount} onChange={e=>setForm({...form,maxAmount:e.target.value})} className="h-9 rounded-lg border px-3 text-xs" />
        <input type="number" required placeholder="Ky han min" value={form.minTermMonths} onChange={e=>setForm({...form,minTermMonths:e.target.value})} className="h-9 rounded-lg border px-3 text-xs" />
        <div className="flex gap-2"><input type="number" required placeholder="Ky han max" value={form.maxTermMonths} onChange={e=>setForm({...form,maxTermMonths:e.target.value})} className="h-9 w-full rounded-lg border px-3 text-xs" /><button disabled={formSubmitting} className="h-9 rounded-lg bg-gray-900 px-4 text-xs font-bold text-white">Luu</button></div>
      </form>}
      <div className="flex flex-col items-end justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:flex-row md:items-center"><div className="relative w-full md:w-2/3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/><input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Tim theo ten, ma, loai vay..." className="w-full rounded-lg border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-4 text-sm outline-none focus:border-orange-500"/></div><div className="relative w-full md:w-56"><button onClick={()=>setIsDropdownOpen(!isDropdownOpen)} className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-700"><span>{statusOptions.find(o=>o.value===statusFilter)?.label}</span><ChevronDown size={16}/></button>{isDropdownOpen && <div className="absolute right-0 top-full z-50 mt-1 w-full rounded-lg border bg-white py-1 shadow-xl">{statusOptions.map(o=><button key={o.value} onClick={()=>{setStatusFilter(o.value);setIsDropdownOpen(false)}} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50">{o.label}</button>)}</div>}</div></div>
      {error && <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full border-collapse text-left text-sm"><thead><tr className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-500"><th className="px-4 py-3.5">Ma goi</th><th className="px-4 py-3.5">Ten san pham</th><th className="px-4 py-3.5">Phan loai</th><th className="px-4 py-3.5 text-right">Han muc</th><th className="px-4 py-3.5 text-center">Ky han</th><th className="px-4 py-3.5 text-right">Lai suat</th><th className="px-4 py-3.5 text-center">Trang thai</th></tr></thead><tbody className="divide-y divide-gray-100 text-gray-700">{loading ? <tr><td colSpan={7} className="py-8 text-center text-gray-400">Dang tai...</td></tr> : filteredProducts.length===0 ? <tr><td colSpan={7} className="py-8 text-center text-gray-400">Khong co san pham vay</td></tr> : filteredProducts.map(row=><tr key={row.id} className="hover:bg-gray-50/50"><td className="px-4 py-4 font-bold text-blue-600 uppercase">{row.code}</td><td className="px-4 py-4 font-semibold text-gray-900">{row.name}</td><td className="px-4 py-4"><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${loanTypeTone(row.loanType)}`}>{formatLoanType(row.loanType)}</span></td><td className="px-4 py-4 text-right font-mono text-xs">{formatVND(row.minAmount)} - {formatVND(row.maxAmount)}</td><td className="px-4 py-4 text-center text-xs font-medium">{row.minTermMonths} - {row.maxTermMonths} thang</td><td className="px-4 py-4 text-right font-mono font-bold text-amber-600">{row.baseInterestRate}%/nam</td><td className="px-4 py-4 text-center"><button onClick={()=>handleToggleStatus(row.id,row.status)} className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-medium ${row.status.toLowerCase()==="active"?"border-emerald-100 bg-emerald-50 text-emerald-600":"border-gray-200 bg-gray-100 text-gray-500"}`}>{row.status.toLowerCase()==="active"?<CheckCircle2 size={12}/>:<HelpCircle size={12}/>} {row.status.toLowerCase()==="active"?"Hoat dong":"Tam ngung"}</button></td></tr>)}</tbody></table></div></div>
    </div>
  </AdminShell>;
}
