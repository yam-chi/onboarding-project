"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { OnboardingState, statusToLabel } from "@/lib/onboarding";

type Row = {
  id: string;
  owner_name?: string | null;
  owner_email?: string | null;
  region?: string | null;
  step_status: OnboardingState;
  updated_at?: string | null;
  stadium_name?: string | null;
  manager_done?: boolean | null;
  manager?: string | null;
  venue_type?: string | null;
};

type SectionKey = "terms" | "settlement" | "venue_basic" | "venue_detail" | "documents" | "photos";

type SectionConfig = {
  key: SectionKey;
  label: string;
  enabled: boolean;
};

const DEFAULT_SECTIONS: SectionConfig[] = [
  { key: "terms", label: "약관 동의", enabled: true },
  { key: "settlement", label: "정산료 확인", enabled: true },
  { key: "venue_basic", label: "구장 기본 정보", enabled: true },
  { key: "venue_detail", label: "구장 상세 정보", enabled: false },
  { key: "documents", label: "서류 업로드", enabled: true },
  { key: "photos", label: "구장 사진 업로드", enabled: false },
];

const MANAGERS = ["담당자 A", "담당자 B"];
const MY_MANAGER = "담당자 A";

export default function AdminOnboardingListPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<"all" | "inProgress" | "done" | OnboardingState>("all");
  const [managerFilter, setManagerFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 신규 생성 모달
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    stadium_name: "",
    venue_type: "신규" as "신규" | "추가",
    manager: MY_MANAGER,
    region: "",
  });
  const [sections, setSections] = useState<SectionConfig[]>(DEFAULT_SECTIONS);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [createdLinkCopied, setCreatedLinkCopied] = useState(false);

  const copyLink = (id: string) => {
    const link = `${window.location.origin}/onboarding/${id}`;
    navigator.clipboard.writeText(link).catch(() => {
      const el = document.createElement("textarea");
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    });
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyCreatedLink = () => {
    if (!createdLink) return;
    navigator.clipboard.writeText(createdLink).catch(() => {
      const el = document.createElement("textarea");
      el.value = createdLink!;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    });
    setCreatedLinkCopied(true);
    setTimeout(() => setCreatedLinkCopied(false), 2000);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/onboarding");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "불러오기 실패");
      setItems(json.items || []);
    } catch (e: any) {
      setError(e.message ?? "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((row) => {
      if (managerFilter !== "all" && row.manager !== managerFilter) return false;
      if (statusFilter === "done") {
        if (row.step_status !== "step5_complete") return false;
      } else if (statusFilter === "inProgress") {
        if (row.step_status === "step5_complete") return false;
      } else if (statusFilter !== "all") {
        if (row.step_status !== statusFilter) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const hit =
          (row.stadium_name || "").toLowerCase().includes(q) ||
          (row.owner_name || "").toLowerCase().includes(q) ||
          (row.region || "").toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [items, statusFilter, managerFilter, search]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/onboarding/${deleteId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "삭제 실패");
      setItems((prev) => prev.filter((item) => item.id !== deleteId));
      setDeleteId(null);
      setDeleteName(null);
    } catch (e: any) {
      setError(e.message ?? "오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.stadium_name.trim()) return;
    setCreating(true);
    try {
      const defaultSections = DEFAULT_SECTIONS
        .filter((s) => s.enabled)
        .map((s, i) => ({ key: s.key, order: i }));

      const res = await fetch("/api/admin/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stadium_name: createForm.stadium_name,
          venue_type: createForm.venue_type,
          manager: createForm.manager,
          region: createForm.region || null,
          sections: defaultSections,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "생성 실패");
      const link = `${window.location.origin}/onboarding/${json.id}`;
      setCreatedLink(link);
      await fetchItems();
    } catch (e: any) {
      setError(e.message ?? "오류가 발생했습니다.");
    } finally {
      setCreating(false);
    }
  };

  const resetCreate = () => {
    setShowCreate(false);
    setCreatedLink(null);
    setCreatedLinkCopied(false);
    setCreateForm({ stadium_name: "", venue_type: "신규", manager: MY_MANAGER, region: "" });
    setSections(DEFAULT_SECTIONS);
  };

  const toggleSection = (key: SectionKey) => {
    setSections((prev) =>
      prev.map((s) => (s.key === key ? { ...s, enabled: !s.enabled } : s))
    );
  };

  // 담당자 관리
  const [showManagers, setShowManagers] = useState(false);
  const [managerList, setManagerList] = useState<{ id: string; name: string }[]>([]);
  const [newManagerName, setNewManagerName] = useState("");
  const [editingManagerId, setEditingManagerId] = useState<string | null>(null);
  const [editingManagerName, setEditingManagerName] = useState("");
  const [managerSaving, setManagerSaving] = useState(false);

  const fetchManagers = async () => {
    const res = await fetch("/api/admin/managers");
    const json = await res.json();
    if (json.managers) setManagerList(json.managers);
  };

  useEffect(() => { fetchManagers(); }, []);

  const createManager = async () => {
    if (!newManagerName.trim()) return;
    setManagerSaving(true);
    try {
      const res = await fetch("/api/admin/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newManagerName.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setNewManagerName("");
      await fetchManagers();
    } catch (e: any) { setError(e.message); }
    finally { setManagerSaving(false); }
  };

  const renameManager = async (id: string) => {
    if (!editingManagerName.trim()) return;
    setManagerSaving(true);
    try {
      const res = await fetch(`/api/admin/managers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingManagerName.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setEditingManagerId(null);
      setEditingManagerName("");
      await fetchManagers();
      await fetchItems();
    } catch (e: any) { setError(e.message); }
    finally { setManagerSaving(false); }
  };

  const deleteManager = async (id: string) => {
    if (!confirm("담당자를 삭제할까요?")) return;
    setManagerSaving(true);
    try {
      const res = await fetch(`/api/admin/managers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("삭제 실패");
      await fetchManagers();
    } catch (e: any) { setError(e.message); }
    finally { setManagerSaving(false); }
  };

  // 약관 PDF
  const [termPdfUrls, setTermPdfUrls] = useState<Record<string, string | null>>({});
  const [termUploading, setTermUploading] = useState(false);
  const [termSaved, setTermSaved] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const TERMS_LIST = [
    { key: "service", label: "구장 제휴 서비스 이용 약관" },
    { key: "privacy", label: "구장 제휴 세부 정책" },
    { key: "thirdparty", label: "구장 소셜 매치 일정 추가 및 취소 정책" },
    { key: "marketing", label: "구장 회원의 이용자 및 매니저 보상 정책" },
    { key: "operation", label: "구장 런드리 서비스 정책" },
  ];

  useEffect(() => {
    fetch("/api/admin/terms")
      .then((r) => r.json())
      .then((j) => { if (j.urls) setTermPdfUrls(j.urls); })
      .catch(() => {});
  }, []);

  const uploadTerm = async (e: React.ChangeEvent<HTMLInputElement>, termKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTermUploading(true);
    try {
      const formData = new FormData();
      formData.append(termKey, file);
      const res = await fetch("/api/admin/terms", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "업로드 실패");
      setTermPdfUrls((prev) => ({ ...prev, ...json.uploaded }));
      setTermSaved(true);
      setTimeout(() => setTermSaved(false), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTermUploading(false);
      e.target.value = "";
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#111827]">온보딩 요청 관리</h1>
            <p className="text-sm text-[#4b5563] mt-1">담당자 전용 대시보드</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowManagers(true)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-[#E3E6EC] text-[#374151]"
            >
              담당자 관리
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{ background: "#1C5DFF" }}
            >
              + 신규 생성
            </button>
          </div>
        </header>

        {/* 약관 PDF 관리 */}
        <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-4">
          <button
            type="button"
            onClick={() => setShowTerms((v) => !v)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#111827]">공통 약관 PDF 관리</span>
              <span className="text-xs text-[#9CA3AF]">
                {Object.values(termPdfUrls).filter(Boolean).length}/{TERMS_LIST.length} 업로드됨
              </span>
              {termSaved && <span className="text-xs text-[#22c55e] font-semibold">저장됨!</span>}
            </div>
            <span className="text-xs text-[#9CA3AF]">{showTerms ? "▲" : "▼"}</span>
          </button>
          {showTerms && (
            <div className="mt-3 space-y-2">
              {TERMS_LIST.map((t) => (
                <div key={t.key} className="flex items-center gap-3 px-3 py-2.5 border border-[#E3E6EC] rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#374151] truncate">{t.label}</p>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5">{termPdfUrls[t.key] ? "✓ 업로드됨" : "미업로드"}</p>
                  </div>
                  {termPdfUrls[t.key] && (
                    <a href={termPdfUrls[t.key]!} target="_blank" rel="noopener noreferrer" className="text-xs text-[#6b7280] shrink-0">보기</a>
                  )}
                  <label className="shrink-0 cursor-pointer">
                    <input type="file" accept=".pdf" className="hidden" onChange={(e) => uploadTerm(e, t.key)} disabled={termUploading} />
                    <span className="text-xs px-3 py-1.5 rounded-lg border border-[#1C5DFF] text-[#1C5DFF] font-semibold">
                      {termPdfUrls[t.key] ? "재업로드" : "업로드"}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 필터 */}
        <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-4 flex flex-col gap-3 md:flex-row md:items-end">
          <div>
            <label className="text-xs text-[#6b7280]">담당자</label>
            <select
              value={managerFilter}
              onChange={(e) => setManagerFilter(e.target.value)}
              className="w-full mt-1 border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm text-[#111827]"
            >
              <option value="all">전체</option>
              {managerList.map((m) => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-[#6b7280]">상태</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm mt-1"
            >
              <option value="all">전체</option>
              <option value="inProgress">진행 중</option>
              <option value="done">완료</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-[#6b7280]">구장명/지역 검색</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="구장명 또는 지역"
              className="w-full border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm mt-1"
            />
          </div>
        </section>

        {/* 테이블 */}
        <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-[#F7F9FC] text-[#6b7280]">
                <tr>
                  <th className="px-4 py-3">구장명</th>
                  <th className="px-4 py-3">구분</th>
                  <th className="px-4 py-3">지역</th>
                  <th className="px-4 py-3">담당자</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">업데이트</th>
                  <th className="px-4 py-3 text-right">액션</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-4 text-center text-xs text-[#6b7280]" colSpan={7}>불러오는 중…</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td className="px-4 py-4 text-center text-xs text-red-600" colSpan={7}>{error}</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-center text-xs text-[#6b7280]" colSpan={7}>
                      {managerFilter === "mine"
                        ? "내 담당 구장이 없습니다. '+ 신규 생성'으로 추가해보세요."
                        : "검색 결과가 없습니다."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id} className="border-t border-[#E3E6EC] text-[#111827]">
                      <td className="px-4 py-3 font-medium">{row.stadium_name || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${row.venue_type === "추가" ? "bg-[#FEF3C7] text-[#92400E]" : "bg-[#EEF3FF] text-[#1C5DFF]"}`}>
                          {row.venue_type || "신규"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#6b7280]">{row.region || "-"}</td>
                      <td className="px-4 py-3 text-[#6b7280]">{row.manager || "-"}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[#1C5DFF] font-semibold">{statusToLabel(row.step_status)}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#6b7280]">
                        {row.updated_at ? new Date(row.updated_at).toLocaleDateString("ko-KR") : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyLink(row.id)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-[#9CA3AF] text-[#6b7280] text-xs font-semibold"
                          >
                            {copiedId === row.id ? "복사됨!" : "링크"}
                          </button>
                          <Link
                            href={`/admin/onboarding/${row.id}`}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-[#1C5DFF] text-[#1C5DFF] text-xs font-semibold"
                          >
                            열기
                          </Link>
                          <button
                            type="button"
                            onClick={() => { setDeleteId(row.id); setDeleteName(row.stadium_name || "요청"); }}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-[#EF4444] text-[#EF4444] text-xs font-semibold"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* 신규 생성 모달 */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-[#E3E6EC]">
            <div className="px-6 py-4 border-b border-[#E3E6EC] flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#111827]">신규 온보딩 링크 생성</h2>
              <button type="button" onClick={resetCreate} className="text-[#6b7280] text-lg leading-none">✕</button>
            </div>

            {createdLink ? (
              <div className="px-6 py-8 space-y-5">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-14 h-14 rounded-full bg-[#EEF3FF] flex items-center justify-center text-2xl">✓</div>
                  <h3 className="text-lg font-semibold text-[#111827]">링크가 생성되었습니다</h3>
                  <p className="text-sm text-[#6b7280]">아래 링크를 구장주에게 전달해주세요.</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-xs text-[#374151] bg-[#F7F9FC] truncate">
                    {createdLink}
                  </div>
                  <button
                    type="button"
                    onClick={copyCreatedLink}
                    className="shrink-0 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ background: createdLinkCopied ? "#22c55e" : "#1C5DFF" }}
                  >
                    {createdLinkCopied ? "복사됨!" : "복사"}
                  </button>
                </div>
                <button type="button" onClick={resetCreate} className="w-full py-2.5 rounded-xl border border-[#E3E6EC] text-sm text-[#374151]">
                  닫기
                </button>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#374151]">구장명 *</label>
                  <input
                    value={createForm.stadium_name}
                    onChange={(e) => setCreateForm((f) => ({ ...f, stadium_name: e.target.value }))}
                    placeholder="구장명을 입력하세요"
                    className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#1C5DFF]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#374151]">구분</label>
                    <div className="flex gap-2 mt-1">
                      {(["신규", "추가"] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setCreateForm((f) => ({ ...f, venue_type: v }))}
                          className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${createForm.venue_type === v ? "bg-[#1C5DFF] text-white border-[#1C5DFF]" : "border-[#E3E6EC] text-[#6b7280]"}`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#374151]">담당자</label>
                    <select
                      value={createForm.manager}
                      onChange={(e) => setCreateForm((f) => ({ ...f, manager: e.target.value }))}
                      className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827]"
                    >
                      {(managerList.length > 0 ? managerList.map((m) => m.name) : MANAGERS).map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#374151]">지역</label>
                  <RegionSelect
                    value={createForm.region}
                    onChange={(v) => setCreateForm((f) => ({ ...f, region: v }))}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating || !createForm.stadium_name.trim()}
                  className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                  style={{ background: "#1C5DFF" }}
                >
                  {creating ? "생성 중…" : "링크 생성"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 담당자 관리 모달 */}
      {showManagers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-[#E3E6EC] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E3E6EC] flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#111827]">담당자 관리</h2>
              <button type="button" onClick={() => setShowManagers(false)} className="text-[#6b7280] text-lg leading-none">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* 담당자 목록 */}
              <div className="space-y-2">
                {managerList.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 px-3 py-2.5 border border-[#E3E6EC] rounded-xl">
                    {editingManagerId === m.id ? (
                      <>
                        <input
                          value={editingManagerName}
                          onChange={(e) => setEditingManagerName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && renameManager(m.id)}
                          autoFocus
                          className="flex-1 text-sm border border-[#1C5DFF] rounded-lg px-2 py-1 focus:outline-none text-[#111827]"
                        />
                        <button
                          type="button"
                          onClick={() => renameManager(m.id)}
                          disabled={managerSaving}
                          className="text-xs px-2.5 py-1 rounded-lg bg-[#1C5DFF] text-white font-semibold"
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingManagerId(null); setEditingManagerName(""); }}
                          className="text-xs px-2 py-1 rounded-lg border border-[#E3E6EC] text-[#6b7280]"
                        >
                          취소
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-[#111827] font-medium">{m.name}</span>
                        <button
                          type="button"
                          onClick={() => { setEditingManagerId(m.id); setEditingManagerName(m.name); }}
                          className="text-xs text-[#1C5DFF] px-2 py-1 rounded-lg border border-[#C7D8FF]"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteManager(m.id)}
                          className="text-xs text-[#EF4444] px-2 py-1 rounded-lg border border-[#FCA5A5]"
                        >
                          삭제
                        </button>
                      </>
                    )}
                  </div>
                ))}
                {managerList.length === 0 && (
                  <p className="text-xs text-[#9CA3AF] text-center py-2">담당자가 없습니다.</p>
                )}
              </div>

              {/* 새 담당자 추가 */}
              <div className="flex gap-2">
                <input
                  value={newManagerName}
                  onChange={(e) => setNewManagerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createManager()}
                  placeholder="새 담당자 이름"
                  className="flex-1 border border-[#E3E6EC] rounded-xl px-3 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#1C5DFF]"
                />
                <button
                  type="button"
                  onClick={createManager}
                  disabled={managerSaving || !newManagerName.trim()}
                  className="px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
                  style={{ background: "#1C5DFF" }}
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white border border-[#E3E6EC] shadow-lg p-5 space-y-4">
            <div className="text-lg font-semibold text-[#111827]">삭제할까요?</div>
            <div className="text-sm text-[#6b7280]">{deleteName} 요청을 삭제합니다.</div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { if (!deleting) { setDeleteId(null); setDeleteName(null); } }}
                className="px-3 py-2 text-sm rounded-lg border border-[#E3E6EC] text-[#6b7280]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="px-3 py-2 text-sm rounded-lg bg-[#EF4444] text-white font-semibold disabled:opacity-60"
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const REGION_OPTIONS = [
  // 서울
  "서울 강남구", "서울 강동구", "서울 강북구", "서울 강서구", "서울 관악구",
  "서울 광진구", "서울 구로구", "서울 금천구", "서울 노원구", "서울 도봉구",
  "서울 동대문구", "서울 동작구", "서울 마포구", "서울 서대문구", "서울 서초구",
  "서울 성동구", "서울 성북구", "서울 송파구", "서울 양천구", "서울 영등포구",
  "서울 용산구", "서울 은평구", "서울 종로구", "서울 중구", "서울 중랑구",
  // 경기
  "경기 수원시", "경기 성남시", "경기 의정부시", "경기 안양시", "경기 부천시",
  "경기 광명시", "경기 평택시", "경기 안산시", "경기 고양시", "경기 과천시",
  "경기 구리시", "경기 남양주시", "경기 오산시", "경기 시흥시", "경기 군포시",
  "경기 의왕시", "경기 하남시", "경기 용인시", "경기 파주시", "경기 이천시",
  "경기 안성시", "경기 김포시", "경기 화성시", "경기 광주시", "경기 양주시",
  "경기 포천시", "경기 여주시",
  // 인천
  "인천 중구", "인천 동구", "인천 미추홀구", "인천 연수구", "인천 남동구",
  "인천 부평구", "인천 계양구", "인천 서구", "인천 강화군", "인천 옹진군",
  // 부산
  "부산 중구", "부산 서구", "부산 동구", "부산 영도구", "부산 부산진구",
  "부산 동래구", "부산 남구", "부산 북구", "부산 해운대구", "부산 사하구",
  "부산 금정구", "부산 강서구", "부산 연제구", "부산 수영구", "부산 사상구",
  // 대구
  "대구 중구", "대구 동구", "대구 서구", "대구 남구", "대구 북구",
  "대구 수성구", "대구 달서구", "대구 달성군",
  // 광주
  "광주 동구", "광주 서구", "광주 남구", "광주 북구", "광주 광산구",
  // 대전
  "대전 동구", "대전 중구", "대전 서구", "대전 유성구", "대전 대덕구",
  // 울산
  "울산 중구", "울산 남구", "울산 동구", "울산 북구", "울산 울주군",
  // 기타
  "세종", "강원 춘천시", "강원 원주시", "강원 강릉시",
  "충북 청주시", "충남 천안시", "충남 아산시",
  "전북 전주시", "전남 여수시", "전남 순천시",
  "경북 포항시", "경북 경주시", "경남 창원시", "경남 진주시",
  "제주 제주시", "제주 서귀포시",
];

function RegionSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = query
    ? REGION_OPTIONS.filter((r) => r.includes(query))
    : REGION_OPTIONS;

  return (
    <div className="relative mt-1">
      <input
        value={query || value}
        onChange={(e) => { setQuery(e.target.value); onChange(""); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="지역 검색 (예: 서울)"
        className="w-full border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#1C5DFF]"
      />
      {value && !query && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF] pointer-events-none">선택됨</span>
      )}
      {open && filtered.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-[#E3E6EC] rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((r) => (
            <button
              key={r}
              type="button"
              onMouseDown={() => { onChange(r); setQuery(""); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#EEF3FF] transition-colors ${value === r ? "text-[#1C5DFF] font-semibold" : "text-[#374151]"}`}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
