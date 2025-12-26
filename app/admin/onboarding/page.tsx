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
};

export default function AdminOnboardingListPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<"all" | "inProgress" | "done" | OnboardingState>("all");
  const [regionFilter, setRegionFilter] = useState("");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/onboarding");
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "불러오기 실패");
        if (!mounted) return;
        setItems(json.items || []);
      } catch (e: any) {
        if (mounted) setError(e.message ?? "오류가 발생했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return items.filter((row) => {
      // 상태 필터
      if (statusFilter === "done") {
        if (row.step_status !== "step5_complete") return false;
      } else if (statusFilter === "inProgress") {
        if (row.step_status === "step5_complete") return false;
      } else if (statusFilter !== "all") {
        if (row.step_status !== statusFilter) return false;
      }
      // 지역 필터
      if (regionFilter && !(row.region || "").toLowerCase().includes(regionFilter.toLowerCase())) return false;
      // 검색 (구장명 또는 이메일)
      if (search) {
        const q = search.toLowerCase();
        const hit = (row.stadium_name || "").toLowerCase().includes(q) || (row.owner_email || "").toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [items, statusFilter, regionFilter, search]);

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

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-[#111827]">온보딩 요청 관리</h1>
          <p className="text-sm text-[#4b5563]">담당자 전용 대시보드 · 상태/검색 필터로 요청을 찾아보세요.</p>
        </header>

        <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-4 flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="text-xs text-[#6b7280]">상태</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">전체</option>
              <option value="inProgress">진행 중</option>
              <option value="done">완료</option>
              {[
                "step0_pending",
                "step0_approved",
                "step1_pending",
                "step1_submitted",
                "step1_need_fix",
                "step1_approved",
                "step2_done",
                "step3_proposed",
                "step3_approved",
                "step4_submitted",
                "step4_complete",
                "step5_submitted",
                "step5_complete",
              ].map((s) => (
                <option key={s} value={s}>
                  {statusToLabel(s as OnboardingState)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-[#6b7280]">지역 검색</label>
            <input
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              placeholder="예: 서울, 경기, 부산…"
              className="w-full border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-[#6b7280]">구장명/이메일 검색</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="구장명 또는 이메일"
              className="w-full border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </section>

        <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-[#F7F9FC] text-[#6b7280]">
                <tr>
                  <th className="px-4 py-3">구장명</th>
                  <th className="px-4 py-3">지역</th>
                  <th className="px-4 py-3">구장주</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">업데이트</th>
                  <th className="px-4 py-3 text-right">액션</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-4 text-center text-xs text-[#6b7280]" colSpan={6}>
                      불러오는 중…
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td className="px-4 py-4 text-center text-xs text-red-600" colSpan={6}>
                      {error}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-center text-xs text-[#6b7280]" colSpan={6}>
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => {
                    const adminPath = `/admin/onboarding/${row.id}`;
                    return (
                      <tr key={row.id} className="border-t border-[#E3E6EC] text-[#111827]">
                        <td className="px-4 py-3">{row.stadium_name || "-"}</td>
                        <td className="px-4 py-3">{row.region || "-"}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm">{row.owner_name || "-"}</div>
                          <div className="text-xs text-[#6b7280]">{row.owner_email || ""}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#1C5DFF] font-semibold">{statusToLabel(row.step_status)}</td>
                        <td className="px-4 py-3 text-xs text-[#6b7280]">{row.updated_at ? new Date(row.updated_at).toLocaleString() : "-"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              href={adminPath}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-[#1C5DFF] text-[#1C5DFF] text-xs font-semibold"
                            >
                              열기
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteId(row.id);
                                setDeleteName(row.stadium_name || row.owner_name || "요청");
                              }}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-[#EF4444] text-[#EF4444] text-xs font-semibold"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white border border-[#E3E6EC] shadow-lg p-5 space-y-4">
            <div className="text-lg font-semibold text-[#111827]">삭제할까요?</div>
            <div className="text-sm text-[#6b7280]">
              {deleteName ? `${deleteName} 요청을 삭제합니다.` : "요청을 삭제합니다."}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (deleting) return;
                  setDeleteId(null);
                  setDeleteName(null);
                }}
                className="px-3 py-2 text-sm rounded-lg border border-[#E3E6EC] text-[#6b7280]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-3 py-2 text-sm rounded-lg bg-[#EF4444] text-white font-semibold disabled:opacity-60"
                disabled={deleting}
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
