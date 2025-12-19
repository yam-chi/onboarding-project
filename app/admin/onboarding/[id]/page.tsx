"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { OnboardingState, statusToLabel, statusToPath } from "@/lib/onboarding";

type OnboardingRow = {
  id: string;
  step_status: OnboardingState;
  owner_name?: string | null;
  owner_email?: string | null;
  contact?: string | null;
  region?: string | null;
  address?: string | null;
  address_detail?: string | null;
  operating_status?: string | null;
  facility_count?: string | null;
  size_info?: string | null;
  service_types?: string[] | null;
  other_services?: string | null;
  memo?: string | null;
  source?: string | null;
  updated_at?: string | null;
  stadium_name?: string | null;
};

type Proposal = {
  id: string;
  title: string;
  description: string | null;
  image_urls: string[] | null;
  created_at: string;
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
  const [rejectionMemo, setRejectionMemo] = useState("");
  const [settlementTitle, setSettlementTitle] = useState("");
  const [settlementDesc, setSettlementDesc] = useState("");
  const [settlementImages, setSettlementImages] = useState("");
  const [settlementPreviews, setSettlementPreviews] = useState<string[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const loadProposals = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/onboarding/${id}/step1`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "불러오기 실패");
      setProposals(json.proposals || []);
    } catch {
      // 제안이 없어도 무시
    }
  };

  useEffect(() => {
    if (info && ["step2_done", "step3_proposed", "step3_approved"].includes(info.step_status)) {
      loadProposals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info?.step_status]);

  const deleteProposal = async (proposalId: string) => {
    if (!id || !proposalId) return;
    setError(null);
    setBanner(null);
    setDeletingId(proposalId);
    try {
      const res = await fetch(`/api/onboarding/${id}/step1`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal_id: proposalId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "삭제 실패");
      setProposals((prev) => prev.filter((p) => p.id !== proposalId));
      setBanner("정산안을 삭제했습니다.");
    } catch (e: any) {
      setError(e.message ?? "오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const doAction = async (next: OnboardingState) => {
    if (!id) return;
    setSaving(true);
    setBanner(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/onboarding/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_status: next, memo: next === "step0_rejected" ? rejectionMemo : undefined }),
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

  // 패널별로 액션을 구분
  const step0Actions =
    info?.step_status === "step0_pending"
      ? [
          { label: "승인", next: "step0_approved" as OnboardingState },
          { label: "반려", next: "step0_rejected" as OnboardingState },
        ]
      : [];
  const step0ApprovedActions =
    info?.step_status === "step0_approved"
      ? [
          { label: "전화 안내 완료", next: "step2_done" as OnboardingState },
          { label: "보류(다시 검토)", next: "step0_pending" as OnboardingState },
          { label: "반려 처리", next: "step0_rejected" as OnboardingState },
        ]
      : [];
  const settlementEnabled = info && ["step2_done", "step3_proposed"].includes(info.step_status);
  const step1Actions =
    info && ["step1_pending", "step1_submitted", "step1_need_fix"].includes(info.step_status)
      ? [
          { label: "보완 요청", next: "step1_need_fix" as OnboardingState },
          { label: "구장 정보 승인", next: "step1_approved" as OnboardingState },
        ]
      : [];
  const step4Actions =
    info && ["step3_approved", "step4_submitted"].includes(info.step_status)
      ? [{ label: "서류 검토 완료", next: "step4_complete" as OnboardingState }]
      : [];
  const step5Actions =
    info && ["step4_complete", "step5_submitted"].includes(info.step_status)
      ? [{ label: "세팅 완료 처리", next: "step5_complete" as OnboardingState }]
      : [];

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

        {info && (
          <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-5 space-y-2 text-sm text-[#4b5563]">
            <div className="text-sm text-[#111827] font-semibold">구장 정보</div>
            <div className="grid md:grid-cols-2 gap-3">
              <InfoLine label="성함" value={info.owner_name} />
              <InfoLine label="연락처" value={info.contact} />
              <InfoLine label="지역" value={info.region} />
              <InfoLine label="주소" value={[info.address, info.address_detail].filter(Boolean).join(" ")} />
              <InfoLine label="운영 상태" value={info.operating_status} />
              <InfoLine label="면 수" value={info.facility_count} />
              <InfoLine label="규격/실내외" value={info.size_info} />
              <InfoLine label="희망 서비스" value={info.service_types?.join(", ")} />
              <InfoLine label="사용 중 서비스" value={info.other_services} />
              <InfoLine label="유입 경로" value={info.source} />
              <InfoLine label="기타 메모" value={info.memo} className="md:col-span-2" />
            </div>
          </section>
        )}

        <ActionPanel
          title="STEP0 · 제휴 요청 검토"
          active={info?.step_status === "step0_pending"}
          actions={step0Actions}
          doAction={doAction}
          saving={saving}
          memoValue={rejectionMemo}
          onMemoChange={setRejectionMemo}
          showMemo={info?.step_status === "step0_pending"}
        />
        <ActionPanel
          title="STEP0 승인 후 · 전화 안내"
          active={info?.step_status === "step0_approved"}
          actions={step0ApprovedActions}
          doAction={doAction}
          saving={saving}
          memoValue={rejectionMemo}
          onMemoChange={setRejectionMemo}
          showMemo={info?.step_status === "step0_approved"}
        />
        <ActionPanel
          title="STEP1 · 정산안 업로드/제안"
          active={settlementEnabled || false}
          actions={[]}
          doAction={doAction}
          saving={saving}
          extraContent={
            settlementEnabled ? (
              <SettlementForm
                id={id}
                saving={saving}
                title={settlementTitle}
                desc={settlementDesc}
                images={settlementImages}
                previews={settlementPreviews}
                setTitle={setSettlementTitle}
                setDesc={setSettlementDesc}
                setImages={setSettlementImages}
                setPreviews={setSettlementPreviews}
                uploading={uploading}
                setUploading={setUploading}
                onSuccess={({ reset, newPreviews } = { reset: false, newPreviews: [] }) => {
                  setBanner("정산안이 업로드되었습니다.");
                  fetchData();
                  loadProposals();
                  if (newPreviews && newPreviews.length) {
                    setSettlementPreviews((prev) => Array.from(new Set([...prev, ...newPreviews])));
                  }
                  if (reset) {
                    setSettlementTitle("");
                    setSettlementDesc("");
                    setSettlementImages("");
                    setSettlementPreviews([]);
                  }
                }}
                onError={(msg) => setError(msg)}
              />
            ) : (
              <div className="text-sm text-[#6b7280]">정산안 업로드는 전화 안내 완료(혹은 제안 중) 상태에서 가능합니다.</div>
            )
          }
        />
        {settlementEnabled && proposals.length > 0 && (
          <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-5 space-y-3 text-sm text-[#4b5563]">
            <div className="text-sm text-[#111827] font-semibold">업로드된 정산안</div>
            <div className="space-y-3">
              {proposals.map((p, idx) => (
                <div key={p.id} className="border border-[#E3E6EC] rounded-lg p-3 space-y-2 bg-[#F9FAFB]">
                  <div className="flex items-center justify-between text-xs text-[#6b7280]">
                    <div className="text-[#111827] font-semibold">
                      {p.title} {idx === 0 && <span className="text-[#1C5DFF] text-[10px] ml-1">최신</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{new Date(p.created_at).toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={() => deleteProposal(p.id)}
                        disabled={deletingId === p.id}
                        className="px-2 py-1 rounded-md border border-[#E3E6EC] text-[#ef4444] text-[11px] font-semibold"
                      >
                        {deletingId === p.id ? "삭제 중..." : "삭제"}
                      </button>
                    </div>
                  </div>
                  {p.description && <div className="text-sm text-[#374151]">{p.description}</div>}
                  {Array.isArray(p.image_urls) && p.image_urls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {p.image_urls.map((url, i) => (
                        <a
                          key={`${p.id}-${i}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="block border rounded-lg overflow-hidden"
                        >
                          <Image src={url} alt="settlement" width={300} height={200} className="w-full h-32 object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
        <ActionPanel
          title="STEP2 · 구장 정보 검토"
          active={["step1_pending", "step1_submitted", "step1_need_fix"].includes(info?.step_status || "")}
          actions={step1Actions}
          doAction={doAction}
          saving={saving}
        />
        <ActionPanel
          title="STEP3 · 서류 검토"
          active={["step3_approved", "step4_submitted"].includes(info?.step_status || "")}
          actions={step4Actions}
          doAction={doAction}
          saving={saving}
        />
        <ActionPanel
          title="STEP4 · 세팅 완료 처리"
          active={["step4_complete", "step5_submitted"].includes(info?.step_status || "")}
          actions={step5Actions}
          doAction={doAction}
          saving={saving}
        />

        {info && (
          <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-5 space-y-3 text-sm text-[#4b5563]">
            <div className="text-sm text-[#111827] font-semibold">링크</div>
            <div className="flex flex-col gap-2">
              <div>
                <div className="text-xs text-[#6b7280]">관리자 상세</div>
                <div className="text-sm font-semibold text-[#1C5DFF]">{`/admin/onboarding/${info.id}`}</div>
              </div>
              <div>
                <div className="text-xs text-[#6b7280]">구장주 화면(현재 스텝)</div>
                <Link href={statusToPath(info.id, info.step_status)} className="text-[#1C5DFF] underline text-sm">
                  {statusToPath(info.id, info.step_status)}
                </Link>
              </div>
              <div>
                <Link
                  href="/admin/onboarding"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg border border-[#E3E6EC] text-[#1C5DFF] text-xs font-semibold"
                >
                  리스트로 돌아가기
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function InfoLine({ label, value, className }: { label: string; value?: string | null; className?: string }) {
  return (
    <div className={className}>
      <div className="text-xs text-[#6b7280]">{label}</div>
      <div className="text-sm text-[#111827]">{value && value.length ? value : "-"}</div>
    </div>
  );
}

function ActionPanel({
  title,
  active,
  actions,
  doAction,
  saving,
  memoValue,
  onMemoChange,
  showMemo,
  extraContent,
}: {
  title: string;
  active: boolean;
  actions: { label: string; next: OnboardingState }[];
  doAction: (next: OnboardingState) => Promise<void>;
  saving: boolean;
  memoValue?: string;
  onMemoChange?: (v: string) => void;
  showMemo?: boolean;
  extraContent?: React.ReactNode;
}) {
  return (
    <section
      className={`bg-white border rounded-xl shadow-sm p-5 space-y-3 ${
        active ? "border-[#1C5DFF]" : "border-[#E3E6EC]"
      }`}
      style={active ? { boxShadow: "0 0 0 2px rgba(28,93,255,0.08)" } : undefined}
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: active ? "#1C5DFF" : "#E3E6EC" }} />
        <div className="text-sm text-[#111827] font-semibold">{title}</div>
      </div>
      {actions.length === 0 ? (
        <div className="text-sm text-[#6b7280]">현재 상태에서 실행할 액션이 없습니다.</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {actions.map((b) => (
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
      {showMemo && onMemoChange && (
        <div className="space-y-1 pt-2 w-full md:w-2/3">
          <label className="text-xs text-[#6b7280]">반려 사유 (반려 시 기록)</label>
          <textarea
            value={memoValue || ""}
            onChange={(e) => onMemoChange(e.target.value)}
            className="w-full border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm"
            rows={3}
            placeholder="반려 사유를 입력하세요."
          />
        </div>
      )}
      {extraContent}
    </section>
  );
}

function SettlementForm({
  id,
  saving,
  title,
  desc,
  images,
  setTitle,
  setDesc,
  setImages,
  previews,
  setPreviews,
  onSuccess,
  onError,
  uploading,
  setUploading,
}: {
  id: string;
  saving: boolean;
  title: string;
  desc: string;
  images: string;
  setTitle: (v: string) => void;
  setDesc: (v: string) => void;
  previews: string[];
  setPreviews: (list: string[]) => void;
  setImages: (v: string) => void;
  onSuccess: (opts?: { reset?: boolean; newPreviews?: string[] }) => void;
  onError: (msg: string) => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const parsedImages = images
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
  const mergedImages = Array.from(new Set([...(previews || []), ...parsedImages]));

  const uploadFile = async (file: File) => {
    setLocalError(null);
    onError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/admin/onboarding/${id}/settlement-upload`, { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "업로드 실패");
      const current = images
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean);
      current.push(json.url);
      setImages(current.join(", "));
      const nextPreviews = Array.from(new Set([...(previews || []), json.url]));
      setPreviews(nextPreviews);
      onSuccess({ reset: false, newPreviews: [json.url] });
    } catch (e: any) {
      const msg = e.message ?? "업로드 중 오류가 발생했습니다.";
      onError(msg);
      setLocalError(msg);
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    setLocalError(null);
    onError("");
    if (!title.trim()) {
      const msg = "제목을 입력해주세요.";
      onError(msg);
      setLocalError(msg);
      return;
    }
    if (parsedImages.length === 0) {
      const msg = "이미지 URL을 1개 이상 입력해주세요.";
      onError(msg);
      setLocalError(msg);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/onboarding/${id}/step1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: desc, image_urls: parsedImages }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "업로드 실패");
      onSuccess({ reset: true });
    } catch (e: any) {
      const msg = e.message ?? "업로드 중 오류가 발생했습니다.";
      onError(msg);
      setLocalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2 border-t border-[#E3E6EC] pt-3">
      <div className="text-sm text-[#111827] font-semibold">정산안 정보</div>
      <div className="space-y-1">
        <label className="text-xs text-[#6b7280]">제목</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm"
          placeholder="예: 요일/시간별 정산안 v1"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-[#6b7280]">설명 (선택)</label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="w-full border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm"
          rows={2}
          placeholder="설명 또는 특이사항"
        />
      </div>
      <div className="space-y-2">
        <div className="space-y-1">
          <label className="text-xs text-[#6b7280]">이미지 URL (쉼표 구분)</label>
          <textarea
            value={images}
            onChange={(e) => setImages(e.target.value)}
            className="w-full border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm"
            rows={2}
            placeholder="https://...jpg, https://...png"
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-2 rounded-lg border border-[#1C5DFF] text-[#1C5DFF] text-sm font-semibold"
          >
            {uploading ? "업로드 중..." : "파일 선택/업로드"}
          </button>
          {mergedImages.length > 0 && <span className="text-xs text-[#6b7280] truncate">추가된 URL: {mergedImages.length}개</span>}
        </div>
        {mergedImages.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-[#6b7280]">업로드/입력된 이미지 미리보기</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {mergedImages.map((url) => (
                <div key={url} className="border border-[#E3E6EC] rounded-lg p-2 flex flex-col gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="정산안" className="w-full h-28 object-cover rounded-md" />
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#1C5DFF] underline break-all"
                  >
                    원본 보기
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={saving || submitting}
          className="px-4 py-2 rounded-lg text-white font-semibold"
          style={{ background: "#1C5DFF" }}
        >
          {saving || submitting ? "업로드 중..." : "정산안 업로드"}
        </button>
      </div>
      {localError && <div className="text-xs text-red-600">{localError}</div>}
    </div>
  );
}
