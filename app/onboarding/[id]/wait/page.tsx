"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { OnboardingState, statusToLabel, statusToPath } from "@/lib/onboarding";

type Info = {
  step_status: OnboardingState;
  owner_name?: string | null;
  memo?: string | null;
  stadium_name?: string | null;
  region?: string | null;
  address?: string | null;
  operating_status?: string | null;
  facility_count?: number | null;
  size_info?: string | null;
  service_types?: string[] | null;
};
type DocRow = { doc_type: string; file_url: string };

export default function WaitPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [info, setInfo] = useState<Info | null>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!id) return;
        const res = await fetch(`/api/onboarding/${id}/step3`);
        const json = await res.json();
        if (!res.ok) return;
        if (!mounted) return;
        setDocuments(json.documents || []);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const status = info?.step_status;
  const label =
    status === "step0_approved"
      ? "검토 완료"
      : status
      ? statusToLabel(status).replace(/^STEP0\s*·\s*/i, "")
      : "";
  const nextPath = status ? statusToPath(id, status) : null;
  const canGoNext = nextPath && nextPath !== `/onboarding/${id}/wait`;

  let title = "제휴 신청 검토 중";
  let message = "담당자가 구장 정보를 확인하고 있습니다.";

  if (status === "step0_approved") {
    title = "검토 완료 · 전화 안내 대기";
    message = "신청하신 구장 검토가 완료되었습니다.\n담당자와 전화 상담 후 제휴 진행 여부가 결정됩니다.";
  } else if (status === "step0_rejected") {
    title = "제휴 진행이 어렵습니다";
    const reason = info?.memo && info.memo.length ? `반려 사유: ${info.memo}` : "";
    message = `담당자가 제휴 요청을 검토한 결과, 아쉽게도 제휴 진행이 어렵습니다.${reason ? `\n${reason}` : ""}`;
  }

  // step0 단계를 벗어난 상태라면 바로 다음 단계로 이동시켜 UX 개선
  useEffect(() => {
    if (!nextPath) return;
    if (status && !["step0_pending", "step0_approved", "step0_rejected"].includes(status)) {
      router.replace(nextPath);
    }
  }, [nextPath, router, status]);

  if (loading) return <div className="p-6 text-sm">불러오는 중…</div>;
  if (!id) return <div className="p-6 text-sm text-red-600">유효하지 않은 경로입니다.</div>;

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white border border-[#E3E6EC] rounded-2xl shadow-sm p-8 space-y-6 text-center">
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

        <section className="bg-white border border-[#E3E6EC] rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#111827]">구장 기본 정보</h2>
          <div className="grid md:grid-cols-2 gap-3 text-sm text-[#374151]">
            <div>
              <span className="text-xs text-[#6b7280]">구장명</span>
              <div className="font-semibold">{info?.stadium_name || "-"}</div>
            </div>
            <div>
              <span className="text-xs text-[#6b7280]">구장주 성함</span>
              <div className="font-semibold">{info?.owner_name || "-"}</div>
            </div>
            <div>
              <span className="text-xs text-[#6b7280]">지역</span>
              <div className="font-semibold">{info?.region || "-"}</div>
            </div>
            <div>
              <span className="text-xs text-[#6b7280]">주소</span>
              <div className="font-semibold">{info?.address || "-"}</div>
            </div>
            <div>
              <span className="text-xs text-[#6b7280]">운영 상태</span>
              <div className="font-semibold">{info?.operating_status || "-"}</div>
            </div>
            <div>
              <span className="text-xs text-[#6b7280]">면 개수</span>
              <div className="font-semibold">{info?.facility_count ?? "-"}</div>
            </div>
            <div>
              <span className="text-xs text-[#6b7280]">규격/실내외</span>
              <div className="font-semibold">{info?.size_info || "-"}</div>
            </div>
            <div>
              <span className="text-xs text-[#6b7280]">희망 제휴 서비스</span>
              <div className="font-semibold">
                {(info?.service_types || [])
                  .map((s) => (s === "social_match" ? "소셜 매치" : s === "rental" ? "구장 예약" : s))
                  .join(", ") || "-"}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border border-[#E3E6EC] rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#111827]">제출한 서류 확인</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <DocThumb
              label="사업자등록증"
              url={documents.find((d) => d.doc_type === "business_registration")?.file_url || ""}
              onPreview={(url) => setPreviewImage(url)}
            />
            <DocThumb
              label="통장 사본"
              url={documents.find((d) => d.doc_type === "bankbook")?.file_url || ""}
              onPreview={(url) => setPreviewImage(url)}
            />
            <DocThumb
              label="부동산/임대차 계약서"
              url={documents.find((d) => d.doc_type === "lease_contract")?.file_url || ""}
              onPreview={(url) => setPreviewImage(url)}
            />
          </div>
        </section>
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#111827]">원본 보기</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="text-[#6b7280] text-sm px-2 py-1 rounded-md border border-[#E3E6EC]"
              >
                닫기
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewImage} alt="preview" className="w-full max-h-[70vh] object-contain rounded-lg border border-[#E3E6EC]" />
          </div>
        </div>
      )}
    </main>
  );
}

function DocThumb({ label, url, onPreview }: { label: string; url: string; onPreview: (url: string) => void }) {
  return (
    <div className="border border-[#E3E6EC] rounded-lg p-3 bg-[#F9FAFB] space-y-2">
      <div className="text-xs font-semibold text-[#374151]">{label}</div>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={label}
          className="h-24 w-full rounded-md border border-[#E3E6EC] object-cover cursor-pointer"
          onClick={() => onPreview(url)}
        />
      ) : (
        <div className="text-xs text-[#9CA3AF]">업로드된 파일 없음</div>
      )}
    </div>
  );
}
