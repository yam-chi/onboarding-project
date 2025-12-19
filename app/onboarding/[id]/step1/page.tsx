"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { OnboardingState, statusToLabel, statusToPath } from "@/lib/onboarding";
import Link from "next/link";
import Image from "next/image";

type Proposal = {
  id: string;
  title: string;
  description: string | null;
  image_urls: string[];
  created_at: string;
};

type RequestInfo = {
  step_status: OnboardingState;
};

export default function Step1SettlementPage() {
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const router = useRouter();

  const [info, setInfo] = useState<RequestInfo | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!id) throw new Error("유효하지 않은 경로입니다.");
        const res = await fetch(`/api/onboarding/${id}/step1`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "불러오기 실패");
        if (!mounted) return;
        setInfo({ step_status: json.step_status });
        setProposals(json.proposals || []);
      } catch (e: any) {
        if (mounted) setError(e.message ?? "오류가 발생했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const statusLabel = info ? statusToLabel(info.step_status) : "";
  const nextPath = info ? statusToPath(id, info.step_status) : null;
  const showNext = nextPath && nextPath !== `/onboarding/${id}/step1`;
  const prevPath = `/onboarding/${id}/wait`;

  const statusMessage = useMemo(() => {
    if (!info) return null;
    const s = info.step_status;
    if (s === "step3_proposed") return "정산안이 제안되어 승인 대기 중입니다.";
    if (s === "step3_approved") return "정산안이 승인되었습니다. 다음 단계로 진행하세요.";
    if (s === "step2_done") return "전화 안내가 완료되었습니다. 정산안을 확인한 뒤 승인해 주세요.";
    return "현재 상태에서 정산안을 확인할 수 있습니다.";
  }, [info]);

  const approve = async () => {
    if (!id) return;
    setError(null);
    setBanner(null);
    try {
      const res = await fetch(`/api/onboarding/${id}/step1`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "승인 실패");
      setBanner("정산안을 승인했습니다.");
      setInfo((prev) => (prev ? { ...prev, step_status: json.step_status as OnboardingState } : prev));
      // 승인 후 바로 다음 단계로 이동
      if (json.step_status === "step1_pending") {
        router.replace(`/onboarding/${id}/step2`);
      }
    } catch (e: any) {
      setError(e.message ?? "오류가 발생했습니다.");
    }
  };

  if (loading) return <div className="p-6 text-sm">불러오는 중…</div>;
  if (!id) return <div className="p-6 text-sm text-red-600">유효하지 않은 경로입니다.</div>;

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <header className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6 space-y-2">
          <h1 className="text-xl font-semibold text-[#111827]">STEP1 · 정산안 확인/승인</h1>
          <div className="text-sm text-[#4b5563]">온보딩 ID: {id}</div>
          {info && (
            <div className="text-xs text-[#6b7280]">
              현재 상태: <span className="text-[#1C5DFF] font-semibold">{statusLabel}</span>
            </div>
          )}
          {statusMessage && <div className="bg-blue-50 text-[#1C5DFF] text-sm px-3 py-2 rounded-lg">{statusMessage}</div>}
        </header>

        {banner && <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg text-sm">{banner}</div>}
        {error && <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6 space-y-4">
          <div className="text-lg font-semibold text-[#111827]">정산안 확인 (구장주용)</div>
          <p className="text-sm text-[#4b5563]">
            담당자가 업로드한 정산안이 아래에 표시됩니다. 내용을 확인한 뒤 승인 버튼을 눌러주세요.
          </p>
          {proposals.length === 0 ? (
            <div className="text-sm text-[#6b7280]">아직 제안된 정산안이 없습니다.</div>
          ) : (
            <div className="space-y-4">
              {proposals.map((p, idx) => (
                <div key={p.id} className="border border-[#E3E6EC] rounded-lg p-4 space-y-2 bg-[#F9FAFB]">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-semibold text-[#111827]">
                      {p.title} {idx === 0 && <span className="text-xs text-[#1C5DFF] ml-2">최신</span>}
                    </div>
                    <div className="text-xs text-[#6b7280]">{new Date(p.created_at).toLocaleString()}</div>
                  </div>
                  {p.description && <div className="text-sm text-[#374151]">{p.description}</div>}
                  {Array.isArray(p.image_urls) && p.image_urls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {p.image_urls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="block border border-[#E3E6EC] rounded-lg overflow-hidden"
                        >
                          <Image src={url} alt="settlement" width={300} height={200} className="w-full h-32 object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={approve}
              disabled={info?.step_status !== "step3_proposed"}
              className="px-4 py-2 rounded-lg text-white font-semibold"
              style={{ background: info?.step_status === "step3_proposed" ? "#1C5DFF" : "#9CA3AF" }}
            >
              {info?.step_status === "step1_pending" ? "승인 완료" : "이 정산안으로 진행"}
            </button>
          </div>
        </section>

        <nav className="flex items-center justify-between">
          <Link href={prevPath} className="px-4 py-2 rounded-lg border border-[#1C5DFF] text-[#1C5DFF] font-semibold">
            이전 단계로
          </Link>
          {showNext ? (
            <Link href={nextPath || "#"} className="px-4 py-2 rounded-lg text-white font-semibold" style={{ background: "#1C5DFF" }}>
              다음 단계로 이동
            </Link>
          ) : (
            <button className="px-4 py-2 rounded-lg border border-[#E3E6EC] text-[#6b7280]" disabled>
              다음 단계 준비 중
            </button>
          )}
        </nav>
      </div>
    </main>
  );
}
