"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { OnboardingState, statusToLabel, statusToPath } from "@/lib/onboarding";

type Info = { step_status: OnboardingState; owner_name?: string | null; memo?: string | null };

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
  const label = status ? statusToLabel(status).replace(/^STEP0\s*·\s*/i, "") : "";
  const nextPath = status ? statusToPath(id, status) : null;
  const canGoNext = nextPath && nextPath !== `/onboarding/${id}/wait`;

  let title = "제휴 신청 검토 중";
  let message = "담당자가 구장 정보를 확인하고 있습니다.";

  if (status === "step0_approved") {
    title = "검토 완료 · 전화 안내 대기";
    message =
      "신청하신 구장 검토가 완료되었습니다.\n담당자가 곧 전화를 드려 서비스 구조와 정산 방식을 안내드립니다.\n전화 상담 후 제휴 진행 여부가 결정됩니다.";
  } else if (status === "step0_rejected") {
    title = "제휴 진행이 어렵습니다";
    const reason = info?.memo && info.memo.length ? `반려 사유: ${info.memo}\n` : "";
    message = `${reason}담당자가 제휴 요청을 검토한 결과, 아쉽게도 제휴 진행이 어렵습니다.\n문의사항이 있다면 담당자에게 연락주세요.`;
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-12">
      <div className="max-w-3xl mx-auto bg-white border border-[#E3E6EC] rounded-2xl shadow-sm p-8 space-y-6 text-center">
        <h1 className="text-2xl font-semibold text-[#111827]">{title}</h1>
        {label && <div className="text-xs text-[#1C5DFF] font-semibold">{label}</div>}
        <p className="text-sm text-[#4b5563] leading-6 whitespace-pre-line">{message}</p>

        {canGoNext && (
          <div className="pt-4">
            <Link
              href={nextPath || "#"}
              className="inline-flex items-center px-5 py-3 rounded-lg text-white font-semibold"
              style={{ background: "#1C5DFF" }}
            >
              다음 단계로 이동
            </Link>
          </div>
        )}

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 rounded-lg border border-[#E3E6EC] text-sm font-semibold text-[#374151]"
          >
            로그아웃
          </Link>
        </div>
      </div>
    </main>
  );
}
