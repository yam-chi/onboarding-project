"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { OnboardingState, statusToLabel, statusToPath } from "@/lib/onboarding";

type OnboardingRow = {
  id: string;
  step_status: OnboardingState;
  owner_name?: string | null;
  owner_email?: string | null;
  region?: string | null;
  updated_at?: string | null;
  stadium_name?: string | null;
};

export default function AdminOnboardingDetailPage() {
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [info, setInfo] = useState<OnboardingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setError(null);
    setBanner(null);
    try {
      const res = await fetch(`/api/onboarding/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "불러오기 실패");
      setInfo(json.onboarding);
    } catch (e: any) {
      setError(e.message ?? "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchData();
    // fetchData는 내부에서 id를 사용하므로 id만 의존성으로 처리
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const doAction = async (next: OnboardingState) => {
    if (!id) return;
    setSaving(true);
    setBanner(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/onboarding/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_status: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "상태 변경 실패");
      setBanner(`상태가 ${statusToLabel(next)}(으)로 변경되었습니다.`);
      await fetchData();
    } catch (e: any) {
      setError(e.message ?? "오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const actionButtons = useMemo(() => {
    const s = info?.step_status;
    if (!s) return [];
    const buttons: { label: string; next: OnboardingState }[] = [];
    if (s === "step0_pending") buttons.push({ label: "STEP0 승인", next: "step0_approved" });
    if (["step1_pending", "step1_submitted", "step1_need_fix"].includes(s)) {
      buttons.push({ label: "보완 요청", next: "step1_need_fix" });
      buttons.push({ label: "구장 정보 승인", next: "step1_approved" });
    }
    if (s === "step1_approved") buttons.push({ label: "전화 안내 완료", next: "step2_done" });
    if (["step2_done", "step3_proposed"].includes(s)) {
      buttons.push({ label: "정산안 승인", next: "step3_approved" });
      buttons.push({ label: "정산안 제안/확인중", next: "step3_proposed" });
    }
    if (["step3_approved", "step4_submitted"].includes(s)) {
      buttons.push({ label: "서류 검토 완료", next: "step4_complete" });
    }
    if (["step4_complete", "step5_submitted"].includes(s)) {
      buttons.push({ label: "세팅 완료 처리", next: "step5_complete" });
    }
    return buttons;
  }, [info?.step_status]);

  if (!id) return <div className="p-6 text-sm text-red-600">유효하지 않은 경로입니다.</div>;
  if (loading) return <div className="p-6 text-sm">불러오는 중…</div>;

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <header className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-5 space-y-2">
          <div className="text-xs text-[#6b7280] font-semibold uppercase">ADMIN · Onboarding</div>
          <h1 className="text-2xl font-semibold text-[#111827]">요청 상세</h1>
          {info && (
            <div className="text-sm text-[#4b5563]">
              ID: {info.id} · 현재 상태: <span className="text-[#1C5DFF] font-semibold">{statusToLabel(info.step_status)}</span>
            </div>
          )}
          <div className="text-xs text-[#6b7280]">구장명: {info?.stadium_name || "-"} · 지역: {info?.region || "-"}</div>
          <div className="text-xs text-[#6b7280]">
            구장주: {info?.owner_name || "-"} ({info?.owner_email || "-"})
          </div>
          {banner && <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm">{banner}</div>}
          {error && <div className="bg-red-100 text-red-800 px-3 py-2 rounded-lg text-sm">{error}</div>}
        </header>

        <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-5 space-y-3">
          <div className="text-sm text-[#111827] font-semibold">관리 액션</div>
          {actionButtons.length === 0 ? (
            <div className="text-sm text-[#6b7280]">현재 상태에서 실행할 액션이 없습니다.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {actionButtons.map((b) => (
                <button
                  key={b.next}
                  type="button"
                  disabled={saving}
                  onClick={() => doAction(b.next)}
                  className="px-3 py-2 rounded-lg border border-[#1C5DFF] text-[#1C5DFF] text-sm font-semibold"
                >
                  {saving ? "처리 중…" : b.label}
                </button>
              ))}
            </div>
          )}
          <div className="text-xs text-[#6b7280]">잘못된 전환도 가능하도록 완화되어 있으니 실제 운영 시 정책을 좁히세요.</div>
        </section>

        {info && (
          <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-5 space-y-2 text-sm text-[#4b5563]">
            <div className="text-sm text-[#111827] font-semibold">현재 스텝으로 이동</div>
            <Link href={statusToPath(info.id, info.step_status)} className="text-[#1C5DFF] underline text-sm">
              {statusToPath(info.id, info.step_status)}
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
