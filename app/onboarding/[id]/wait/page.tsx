"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { OnboardingState, statusToLabel } from "@/lib/onboarding";

type Info = { step_status: OnboardingState; owner_name?: string | null };

export default function WaitPage() {
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [info, setInfo] = useState<Info | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!id) throw new Error("유효하지 않은 경로입니다.");
        const res = await fetch(`/api/onboarding/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "불러오기 실패");
        if (!mounted) return;
        setInfo(json.onboarding);
      } catch {
        // 대기 페이지이므로 별도 에러 표시는 생략
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <div className="p-6 text-sm">불러오는 중…</div>;
  if (!id) return <div className="p-6 text-sm text-red-600">유효하지 않은 경로입니다.</div>;

  const status = info?.step_status;
  const label = status ? statusToLabel(status) : "";

  let message = "담당자가 구장 정보를 확인하고 있습니다.";
  if (status === "step0_approved") {
    message =
      "신청하신 구장 검토가 완료되었습니다. 담당자가 곧 전화를 드려 서비스 구조와 정산 방식을 안내드립니다. 전화 상담 후 제휴 진행 여부가 결정됩니다.";
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-12">
      <div className="max-w-3xl mx-auto bg-white border border-[#E3E6EC] rounded-2xl shadow-sm p-8 space-y-6 text-center">
        <h1 className="text-2xl font-semibold text-[#111827]">제휴 신청 검토 중</h1>
        <div className="text-sm text-[#6b7280]">온보딩 ID: {id}</div>
        {label && <div className="text-xs text-[#1C5DFF] font-semibold">{label}</div>}
        <p className="text-sm text-[#4b5563] leading-6 whitespace-pre-line">{message}</p>
      </div>
    </main>
  );
}
