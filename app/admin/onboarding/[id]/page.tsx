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
  temp_code?: string | null;
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
  final_account?: string | null;
  final_password?: string | null;
};

type Proposal = {
  id: string;
  title: string;
  description: string | null;
  image_urls: string[] | null;
  created_at: string;
};

type DocRow = { doc_type: string; file_url: string; uploaded_at: string };

type StadiumInfo = {
  region?: string;
  home_filter_region?: string;
  stadium_name?: string;
  address?: string;
  address_detail?: string;
  account_email?: string;
  stadium_type?: string;
  artificial_grass?: boolean;
  stadium_contact?: string;
  laundry_contact?: string;
  notice?: string;
  parking_available?: boolean;
  parking_free?: boolean;
  parking_count?: number | null;
  parking_contact?: string | null;
  parking_fee?: string | null;
  shower_available?: boolean;
  shower_memo?: string | null;
  shoes_available?: boolean;
  shoes_memo?: string | null;
  toilet_available?: boolean;
  toilet_memo?: string | null;
  drinks_available?: boolean;
  drinks_memo?: string | null;
  social_special?: string | null;
  social_message?: string | null;
  manager_note?: string | null;
  rental_note?: string | null;
  rental_warning?: string | null;
  rental_message?: string | null;
  vest_available?: boolean;
  vest_memo?: string | null;
  ball_available?: boolean;
  ball_memo?: string | null;
  hoped_times_note?: string | null;
};

type CourtInfo = {
  court_name?: string;
  capacity?: number | null;
  size_x?: number | null;
  size_y?: number | null;
  floor_type?: string;
  indoor_outdoor?: string;
  sort_order?: number | null;
};

type TimeRow = { day_of_week: string; start_time: string; end_time: string; note?: string | null };

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
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editing, setEditing] = useState(false);
  // stadiumInfo/courtInfo는 admin 편집 폼으로 대체되었으므로 사용하지 않음(legacy)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stadiumInfo, setStadiumInfo] = useState<StadiumInfo | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [courtInfo, setCourtInfo] = useState<CourtInfo[]>([]);
  const [adminStadium, setAdminStadium] = useState<StadiumInfo | null>(null);
  const [adminCourts, setAdminCourts] = useState<CourtInfo[]>([]);
  const [stadiumSaveMsg, setStadiumSaveMsg] = useState<string | null>(null);
  const [stadiumSaveErr, setStadiumSaveErr] = useState<string | null>(null);
  const [step1ApproveMsg, setStep1ApproveMsg] = useState<string | null>(null);
  const [stadiumSaving, setStadiumSaving] = useState(false);
  const [businessUrl, setBusinessUrl] = useState<string | null>(null);
  const [bankbookUrl, setBankbookUrl] = useState<string | null>(null);
  const [leaseUrl, setLeaseUrl] = useState<string | null>(null);
  const [times, setTimes] = useState<TimeRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [finalAccount, setFinalAccount] = useState("");
  const [finalPassword, setFinalPassword] = useState("");
  const [stadiumPanelOpen, setStadiumPanelOpen] = useState(false);

  const fetchData = async () => {
    setError(null);
    setBanner(null);
    try {
      const res = await fetch(`/api/onboarding/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "불러오기 실패");
      setInfo(json.onboarding);
      setFinalAccount(json.onboarding?.final_account || "");
      setFinalPassword(json.onboarding?.final_password || "");
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
    if (!id) return;
    loadProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadStadiumInfo = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/onboarding/${id}/step2`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "구장 정보 불러오기 실패");
      setStadiumInfo(json.stadium || null);
      setCourtInfo(json.courts || []);
      setAdminStadium(json.stadium || null);
      setAdminCourts(json.courts || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (info) {
      loadStadiumInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info?.step_status]);

  const loadDocs = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/onboarding/${id}/step3`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "서류 불러오기 실패");
      const b = (json.documents || []).find((d: DocRow) => d.doc_type === "business_registration");
      const bank = (json.documents || []).find((d: DocRow) => d.doc_type === "bankbook");
      const lease = (json.documents || []).find((d: DocRow) => d.doc_type === "lease_contract");
      setBusinessUrl(b?.file_url || null);
      setBankbookUrl(bank?.file_url || null);
      setLeaseUrl(lease?.file_url || null);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (info?.step_status) {
      loadDocs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info?.step_status]);

  const loadTimes = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/onboarding/${id}/step4`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "세팅 가능 시간 불러오기 실패");
      setTimes(json.times || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (info && ["step4_complete", "step5_submitted"].includes(info.step_status)) {
      loadTimes();
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

  const startEditProposal = (proposal: Proposal) => {
    setEditingProposalId(proposal.id);
    setEditTitle(proposal.title || "");
    setEditDesc(proposal.description || "");
  };

  const cancelEditProposal = () => {
    setEditingProposalId(null);
    setEditTitle("");
    setEditDesc("");
  };

  const updateProposal = async () => {
    if (!id || !editingProposalId) return;
    setEditing(true);
    setError(null);
    try {
      const res = await fetch(`/api/onboarding/${id}/step1`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          proposal_id: editingProposalId,
          title: editTitle.trim(),
          description: editDesc.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "수정 실패");
      setBanner("정산안이 수정되었습니다.");
      cancelEditProposal();
      loadProposals();
    } catch (e: any) {
      setError(e.message ?? "오류가 발생했습니다.");
    } finally {
      setEditing(false);
    }
  };

  const doAction = async (next: OnboardingState) => {
    if (!id) return;
    setSaving(true);
    setBanner(null);
    setError(null);
    setStep1ApproveMsg(null);
    try {
      const res = await fetch(`/api/admin/onboarding/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_status: next,
          memo: next === "step0_rejected" ? rejectionMemo : undefined,
          final_account: finalAccount,
          final_password: finalPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "상태 변경 실패");
      if (next === "step1_approved") {
        setStep1ApproveMsg("승인 완료");
      }
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
  // 정산안 업로드 패널은 항상 노출
  const step1Actions =
    info && ["step1_pending", "step1_submitted", "step1_need_fix", "step4_submitted"].includes(info.step_status)
      ? [
          { label: "보완 요청", next: "step1_need_fix" as OnboardingState },
          { label: "구장 정보 승인", next: "step1_approved" as OnboardingState },
        ]
      : [];
  const isStep1Active =
    !!info && ["step1_pending", "step1_submitted", "step1_need_fix", "step4_submitted"].includes(info.step_status);
  // 서류 검토 패널은 스텝2 패널에 통합되었으므로 별도 액션 없음
  const step5Actions =
    info && ["step4_complete", "step5_submitted", "step5_complete"].includes(info.step_status)
      ? [{ label: "세팅 완료 처리", next: "step5_complete" as OnboardingState }]
      : [];

  if (!id) return <div className="p-6 text-sm text-red-600">유효하지 않은 경로입니다.</div>;
  if (loading) return <div className="p-6 text-sm">불러오는 중…</div>;

  return (
    <>
      <main className="min-h-screen bg-[#F7F9FC] px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-4">
        <header className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-5 space-y-2">
          <div className="text-xs text-[#6b7280] font-semibold uppercase">ADMIN · Onboarding</div>
          <h1 className="text-2xl font-semibold text-[#111827]">요청 상세</h1>
          {info && (
            <div className="text-sm text-[#4b5563]">
              현재 상태: <span className="text-[#1C5DFF] font-semibold">{statusToLabel(info.step_status)}</span>
            </div>
          )}
          {banner && <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm">{banner}</div>}
          {error && <div className="bg-red-100 text-red-800 px-3 py-2 rounded-lg text-sm">{error}</div>}
        </header>

        {info && (
          <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-5 space-y-4 text-sm text-[#4b5563]">
            <div className="text-sm text-[#111827] font-semibold">구장 정보</div>
            <div className="grid md:grid-cols-2 gap-3">
              <InfoLine label="계정 이메일" value={adminStadium?.account_email} />
              <InfoLine label="지역" value={adminStadium?.region || info.region} />
              <InfoLine label="구장명" value={adminStadium?.stadium_name || info.stadium_name} />
              <InfoLine label="주소" value={adminStadium?.address || info.address} />
              <InfoLine label="구장 유형" value={adminStadium?.stadium_type} />
              <InfoLine label="실내/실외" value={adminStadium?.indoor_outdoor} />
              <InfoLine label="구장 연락처" value={adminStadium?.stadium_contact || info.contact || info.temp_code} />
              <InfoLine label="런드리 연락처" value={adminStadium?.laundry_contact} />
            </div>
            <div className="border-t border-[#E3E6EC] pt-3" />

            <div className="flex flex-col gap-3 pt-2">
              <InfoLine label="공지사항" value={adminStadium?.notice} />
              <InfoLine label="주차 가능" value={formatYesNo(adminStadium?.parking_available)} />
              <InfoLine label="무료 주차" value={formatYesNo(adminStadium?.parking_free)} />
              <InfoLine label="무료 주차 대수" value={adminStadium?.parking_count} />
              <InfoLine label="주차 등록 연락처" value={adminStadium?.parking_contact} />
              <InfoLine label="주차 요금" value={adminStadium?.parking_fee} />
              <div className="grid md:grid-cols-2 gap-3">
                <EditableSelect
                  label="샤워장"
                  value={adminStadium?.shower_available === true ? "예" : adminStadium?.shower_available === false ? "아니오" : ""}
                  options={["예", "아니오"]}
                  onChange={(v) =>
                    setAdminStadium({
                      ...adminStadium,
                      shower_available: v === "" ? null : v === "예",
                    })
                  }
                />
                <EditableInput
                  label="샤워 메모"
                  value={adminStadium?.shower_memo || ""}
                  onChange={(v) => setAdminStadium({ ...adminStadium, shower_memo: v })}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <InfoLine label="풋살화 대여" value={formatYesNo(adminStadium?.shoes_available)} />
                <InfoLine label="풋살화 메모" value={adminStadium?.shoes_memo} />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <InfoLine label="화장실" value={formatYesNo(adminStadium?.toilet_available)} />
                <InfoLine label="화장실 메모" value={adminStadium?.toilet_memo} />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <InfoLine label="음료" value={formatYesNo(adminStadium?.drinks_available)} />
                <InfoLine label="음료 메모" value={adminStadium?.drinks_memo} />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <InfoLine label="소셜매치 특이사항" value={adminStadium?.social_special} />
              <InfoLine label="소셜매치 알림톡" value={adminStadium?.social_message} />
              <InfoLine label="매니저 특이사항" value={adminStadium?.manager_note} />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <InfoLine label="대관 특이사항" value={adminStadium?.rental_note} />
              <InfoLine label="꼭 지켜주세요" value={adminStadium?.rental_warning} />
              <InfoLine label="구장 예약 알림톡" value={adminStadium?.rental_message} />
              <div className="grid md:grid-cols-2 gap-3">
                <InfoLine label="조끼 제공" value={formatYesNo(adminStadium?.vest_available)} />
                <InfoLine label="조끼 메모" value={adminStadium?.vest_memo} />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <InfoLine label="공 제공" value={formatYesNo(adminStadium?.ball_available)} />
                <InfoLine label="공 메모" value={adminStadium?.ball_memo} />
              </div>
              <InfoLine label="희망 운영 시간" value={adminStadium?.hoped_times_note} />
            </div>

            <div className="pt-3 space-y-2">
              <div className="text-sm text-[#374151] font-semibold">서류 확인</div>
              {businessUrl || bankbookUrl || leaseUrl ? (
                <div className="grid md:grid-cols-3 gap-3">
                  <DocThumb label="사업자등록증" url={businessUrl} onPreview={setPreviewImage} />
                  <DocThumb label="통장 사본" url={bankbookUrl} onPreview={setPreviewImage} />
                  <DocThumb label="임대차 계약서" url={leaseUrl} onPreview={setPreviewImage} />
                </div>
              ) : (
                <div className="text-sm text-[#6b7280]">구장주 서류 제출 대기중입니다.</div>
              )}
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
          active={["step2_done", "step3_proposed", "step3_approved"].includes(info?.step_status || "")}
          actions={[]}
          doAction={doAction}
          saving={saving}
          extraContent={
            ["step2_done", "step3_proposed", "step3_approved"].includes(info?.step_status || "") ? (
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
              <div className="text-sm text-[#6b7280]">
                전화 안내 완료 후 정산안 업로드가 가능합니다.
              </div>
            )
          }
        />
        {proposals.length > 0 && (
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
                        onClick={() => startEditProposal(p)}
                        className="px-2 py-1 rounded-md border border-[#E3E6EC] text-[#1C5DFF] text-[11px] font-semibold"
                      >
                        수정
                      </button>
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
                  {editingProposalId === p.id ? (
                    <div className="space-y-2 text-sm text-[#374151]">
                      <input
                        className="w-full border border-[#E3E6EC] rounded-md px-3 py-2"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="제안 제목"
                      />
                      <textarea
                        className="w-full border border-[#E3E6EC] rounded-md px-3 py-2 min-h-[90px]"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="간단 설명"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={updateProposal}
                          disabled={editing || !editTitle.trim()}
                          className="px-3 py-2 rounded-md bg-[#1C5DFF] text-white text-xs font-semibold"
                        >
                          {editing ? "저장 중..." : "저장"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditProposal}
                          className="px-3 py-2 rounded-md border border-[#E3E6EC] text-xs font-semibold"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    p.description && <div className="text-sm text-[#374151]">{p.description}</div>
                  )}
                  {Array.isArray(p.image_urls) && p.image_urls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {p.image_urls.map((url, i) => (
                        <button
                          key={`${p.id}-${i}`}
                          type="button"
                          onClick={() => setPreviewImage(url)}
                          className="block border rounded-lg overflow-hidden"
                        >
                          <Image src={url} alt="settlement" width={300} height={200} className="w-full h-32 object-cover" />
                        </button>
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
          active={isStep1Active}
          actions={step1Actions}
          doAction={doAction}
          saving={saving}
          hideActions
          collapsed={!stadiumPanelOpen}
          onToggleCollapse={() => setStadiumPanelOpen((prev) => !prev)}
          extraContent={
            adminStadium ? (
              <div className="mt-2 space-y-3">
                <div className="text-sm text-[#374151] font-semibold">계정 이메일</div>
                <div className="grid md:grid-cols-2 gap-3 text-sm text-[#374151]">
                  <EditableInput
                    label="계정 이메일"
                    value={adminStadium.account_email || ""}
                    onChange={(v) => setAdminStadium({ ...adminStadium, account_email: v })}
                    placeholder="예: owner@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-[#374151] font-semibold">구관사 계정 정보 (구장구 공유용)</div>
                  <div className="grid md:grid-cols-2 gap-2">
                    <label className="text-xs text-[#6b7280] flex flex-col gap-1">
                      계정(ID)
                      <input
                        value={finalAccount}
                        onChange={(e) => setFinalAccount(e.target.value)}
                        className="border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm"
                        placeholder="예: stadium123"
                      />
                    </label>
                    <label className="text-xs text-[#6b7280] flex flex-col gap-1">
                      비밀번호
                      <input
                        value={finalPassword}
                        onChange={(e) => setFinalPassword(e.target.value)}
                        className="border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm"
                        placeholder="예: temp1234"
                      />
                    </label>
                  </div>
                  <div className="text-[11px] text-[#9CA3AF]">세팅 완료 처리 시 함께 저장됩니다.</div>
                </div>
                <div className="flex flex-col gap-3 text-sm text-[#374151]">
                  <EditableInput label="지역" value={adminStadium.region || ""} onChange={(v) => setAdminStadium({ ...adminStadium, region: v })} />
                  <EditableInput
                    label="구장명"
                    value={adminStadium.stadium_name || ""}
                    onChange={(v) => setAdminStadium({ ...adminStadium, stadium_name: v })}
                  />
                  <EditableInput
                    label="주소"
                    value={adminStadium.address || ""}
                    onChange={(v) => setAdminStadium({ ...adminStadium, address: v })}
                  />
                  <EditableInput
                    label="구장 유형"
                    value={adminStadium.stadium_type || ""}
                    onChange={(v) => setAdminStadium({ ...adminStadium, stadium_type: v })}
                  />
                  <EditableInput
                    label="실내/실외"
                    value={adminStadium.indoor_outdoor || ""}
                    onChange={(v) => setAdminStadium({ ...adminStadium, indoor_outdoor: v })}
                  />
                  <EditableInput
                    label="구장 연락처"
                    value={adminStadium.stadium_contact || ""}
                    onChange={(v) => setAdminStadium({ ...adminStadium, stadium_contact: v })}
                  />
                  <EditableInput
                    label="런드리 연락처"
                    value={adminStadium.laundry_contact || ""}
                    onChange={(v) => setAdminStadium({ ...adminStadium, laundry_contact: v })}
                  />
                  <div className="border-t border-[#E3E6EC] pt-3 text-sm font-semibold text-[#111827]">공통 정보</div>
                  <EditableInput
                    label="공지사항"
                    value={adminStadium.notice || ""}
                    onChange={(v) => setAdminStadium({ ...adminStadium, notice: v })}
                  />
                  <EditableSelect
                    label="주차 가능"
                    value={adminStadium.parking_available === true ? "예" : adminStadium.parking_available === false ? "아니오" : ""}
                    options={["예", "아니오"]}
                    onChange={(v) =>
                      setAdminStadium({
                        ...adminStadium,
                        parking_available: v === "" ? null : v === "예",
                      })
                    }
                  />
                  <EditableSelect
                    label="무료 주차"
                    value={adminStadium.parking_free === true ? "예" : adminStadium.parking_free === false ? "아니오" : ""}
                    options={["예", "아니오"]}
                    onChange={(v) =>
                      setAdminStadium({
                        ...adminStadium,
                        parking_free: v === "" ? null : v === "예",
                      })
                    }
                  />
                  <EditableInput
                    label="무료 주차 대수"
                    value={adminStadium.parking_count ?? ""}
                    onChange={(v) => setAdminStadium({ ...adminStadium, parking_count: Number(v) || null })}
                  />
                  <EditableInput
                    label="주차 연락처"
                    value={adminStadium.parking_contact || ""}
                    onChange={(v) => setAdminStadium({ ...adminStadium, parking_contact: v })}
                  />
                  <EditableInput
                    label="주차 요금"
                    value={adminStadium.parking_fee || ""}
                    onChange={(v) => setAdminStadium({ ...adminStadium, parking_fee: v })}
                  />
                  <div className="grid md:grid-cols-2 gap-3">
                    <EditableSelect
                      label="샤워장"
                      value={adminStadium?.shower_available === true ? "예" : adminStadium?.shower_available === false ? "아니오" : ""}
                      options={["예", "아니오"]}
                      onChange={(v) =>
                        setAdminStadium({
                          ...adminStadium,
                          shower_available: v === "" ? null : v === "예",
                        })
                      }
                    />
                    <EditableInput
                      label="샤워 메모"
                      value={adminStadium.shower_memo || ""}
                      onChange={(v) => setAdminStadium({ ...adminStadium, shower_memo: v })}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <EditableSelect
                      label="풋살화 대여"
                      value={adminStadium?.shoes_available === true ? "예" : adminStadium?.shoes_available === false ? "아니오" : ""}
                      options={["예", "아니오"]}
                      onChange={(v) =>
                        setAdminStadium({
                          ...adminStadium,
                          shoes_available: v === "" ? null : v === "예",
                        })
                      }
                    />
                    <EditableInput
                      label="풋살화 메모"
                      value={adminStadium.shoes_memo || ""}
                      onChange={(v) => setAdminStadium({ ...adminStadium, shoes_memo: v })}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <EditableSelect
                      label="화장실"
                      value={adminStadium?.toilet_available === true ? "예" : adminStadium?.toilet_available === false ? "아니오" : ""}
                      options={["예", "아니오"]}
                      onChange={(v) =>
                        setAdminStadium({
                          ...adminStadium,
                          toilet_available: v === "" ? null : v === "예",
                        })
                      }
                    />
                    <EditableInput
                      label="화장실 메모"
                      value={adminStadium.toilet_memo || ""}
                      onChange={(v) => setAdminStadium({ ...adminStadium, toilet_memo: v })}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <EditableSelect
                      label="음료"
                      value={adminStadium?.drinks_available === true ? "예" : adminStadium?.drinks_available === false ? "아니오" : ""}
                      options={["예", "아니오"]}
                      onChange={(v) =>
                        setAdminStadium({
                          ...adminStadium,
                          drinks_available: v === "" ? null : v === "예",
                        })
                      }
                    />
                    <EditableInput
                      label="음료 메모"
                      value={adminStadium.drinks_memo || ""}
                      onChange={(v) => setAdminStadium({ ...adminStadium, drinks_memo: v })}
                    />
                  </div>
                  <div className="border-t border-[#E3E6EC] pt-3 text-sm font-semibold text-[#111827]">소셜 매치</div>
                  <EditableInput
                    label="소셜 특이사항"
                    value={adminStadium.social_special || ""}
                    onChange={(v) => setAdminStadium({ ...adminStadium, social_special: v })}
                  />
                  <EditableInput
                    label="소셜 알림"
                    value={adminStadium.social_message || ""}
                    onChange={(v) => setAdminStadium({ ...adminStadium, social_message: v })}
                  />
                  <EditableInput
                    label="매니저 노트"
                    value={adminStadium.manager_note || ""}
                    onChange={(v) => setAdminStadium({ ...adminStadium, manager_note: v })}
                  />
                  <div className="border-t border-[#E3E6EC] pt-3 text-sm font-semibold text-[#111827]">구장 예약</div>
                  <EditableInput
                    label="대관 특이사항"
                    value={adminStadium.rental_note || ""}
                    onChange={(v) => setAdminStadium({ ...adminStadium, rental_note: v })}
                  />
                  <EditableInput
                    label="꼭 지켜주세요"
                    value={adminStadium.rental_warning || ""}
                    onChange={(v) => setAdminStadium({ ...adminStadium, rental_warning: v })}
                  />
                  <EditableInput
                    label="대관 알림"
                    value={adminStadium.rental_message || ""}
                    onChange={(v) => setAdminStadium({ ...adminStadium, rental_message: v })}
                  />
                  <div className="grid md:grid-cols-2 gap-3">
                    <EditableSelect
                      label="조끼 제공"
                      value={adminStadium?.vest_available === true ? "예" : adminStadium?.vest_available === false ? "아니오" : ""}
                      options={["예", "아니오"]}
                      onChange={(v) =>
                        setAdminStadium({
                          ...adminStadium,
                          vest_available: v === "" ? null : v === "예",
                        })
                      }
                    />
                    <EditableInput
                      label="조끼 메모"
                      value={adminStadium.vest_memo || ""}
                      onChange={(v) => setAdminStadium({ ...adminStadium, vest_memo: v })}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <EditableSelect
                      label="공 제공"
                      value={adminStadium?.ball_available === true ? "예" : adminStadium?.ball_available === false ? "아니오" : ""}
                      options={["예", "아니오"]}
                      onChange={(v) =>
                        setAdminStadium({
                          ...adminStadium,
                          ball_available: v === "" ? null : v === "예",
                        })
                      }
                    />
                    <EditableInput
                      label="공 메모"
                      value={adminStadium.ball_memo || ""}
                      onChange={(v) => setAdminStadium({ ...adminStadium, ball_memo: v })}
                    />
                  </div>
                  <div className="border-t border-[#E3E6EC] pt-3" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-[#111827]">면 정보</div>
                    <button
                      type="button"
                      onClick={() => setAdminCourts((prev) => [...prev, { court_name: "", size_x: null, size_y: null, floor_type: "", indoor_outdoor: "" }])}
                      className="px-2 py-1 rounded border border-[#1C5DFF] text-[#1C5DFF] text-xs font-semibold"
                    >
                      면 추가
                    </button>
                  </div>
                  {adminCourts && adminCourts.length > 0 ? (
                    <div className="space-y-2">
                      {adminCourts
                        .slice()
                        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                        .map((c, idx) => (
                          <div key={`${c.court_name}-${idx}`} className="border border-[#E3E6EC] rounded-lg p-3 grid md:grid-cols-3 gap-2 text-sm">
                            <EditableInput
                              label="면 이름"
                              value={c.court_name || ""}
                              onChange={(v) => {
                                const next = [...adminCourts];
                                next[idx] = { ...next[idx], court_name: v };
                                setAdminCourts(next);
                              }}
                            />
                            <EditableInput
                              label="사이즈 X"
                              value={c.size_x ?? ""}
                              onChange={(v) => {
                                const next = [...adminCourts];
                                next[idx] = { ...next[idx], size_x: Number(v) || null };
                                setAdminCourts(next);
                              }}
                            />
                            <EditableInput
                              label="사이즈 Y"
                              value={c.size_y ?? ""}
                              onChange={(v) => {
                                const next = [...adminCourts];
                                next[idx] = { ...next[idx], size_y: Number(v) || null };
                                setAdminCourts(next);
                              }}
                            />
                            <EditableInput
                              label="바닥/유형"
                              value={c.floor_type || ""}
                              onChange={(v) => {
                                const next = [...adminCourts];
                                next[idx] = { ...next[idx], floor_type: v };
                                setAdminCourts(next);
                              }}
                            />
                            <EditableInput
                              label="실내/실외"
                              value={c.indoor_outdoor || ""}
                              onChange={(v) => {
                                const next = [...adminCourts];
                                next[idx] = { ...next[idx], indoor_outdoor: v };
                                setAdminCourts(next);
                              }}
                            />
                            {adminCourts.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const next = [...adminCourts];
                                  next.splice(idx, 1);
                                  setAdminCourts(next);
                                }}
                                className="text-xs text-red-500"
                              >
                                삭제
                              </button>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-sm text-[#111827]">면 정보가 아직 없습니다.</div>
                  )}
                </div>
                <div className="text-sm text-[#374151] space-y-2">
                  <div className="font-semibold">희망 운영 시간</div>
                  <div className="border border-[#E3E6EC] rounded-lg px-3 py-2 bg-[#F9FAFB] min-h-[48px]">
                    {adminStadium.hoped_times_note && adminStadium.hoped_times_note.trim().length > 0
                      ? adminStadium.hoped_times_note
                      : "구장주가 입력한 희망 시간이 없습니다."}
                  </div>
                </div>

                {stadiumSaveMsg && <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm">{stadiumSaveMsg}</div>}
                {step1ApproveMsg && <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm">{step1ApproveMsg}</div>}
                {stadiumSaveErr && <div className="bg-red-100 text-red-800 px-3 py-2 rounded-lg text-sm">{stadiumSaveErr}</div>}
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!id || !adminStadium) return;
                        setStadiumSaveErr(null);
                        setStadiumSaveMsg(null);
                        setStadiumSaving(true);
                        try {
                          const res = await fetch(`/api/onboarding/${id}/step2`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ stadium: adminStadium, courts: adminCourts, submit: false }),
                          });
                          const json = await res.json();
                          if (!res.ok) throw new Error(json?.error || "저장 실패");
                          setStadiumSaveMsg("저장되었습니다. 구장주 화면에도 반영되었습니다.");
                          loadStadiumInfo();
                        } catch (e: any) {
                          setStadiumSaveErr(e.message ?? "저장 중 오류가 발생했습니다.");
                        } finally {
                          setStadiumSaving(false);
                        }
                      }}
                      disabled={stadiumSaving}
                      className="px-3 py-2 rounded-lg border border-[#1C5DFF] text-[#1C5DFF] text-sm font-semibold"
                    >
                      {stadiumSaving ? "저장 중…" : "수정 내용 저장"}
                    </button>
                    {info?.step_status === "step1_approved" && (
                      <span className="text-sm text-[#6b7280]">승인 완료</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {step1Actions.map((b) => (
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
                </div>
              </div>
            ) : (
              <div className="text-sm text-[#6b7280]">구장주가 구장 상세 정보를 제출하면 이곳에 표시됩니다.</div>
            )
          }
        />
        <div className="flex justify-end">
          <Link
            href="/admin/onboarding"
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-[#E3E6EC] text-[#1C5DFF] text-xs font-semibold"
          >
            리스트로 돌아가기
          </Link>
        </div>
        </div>
      </main>

      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-4 space-y-3">
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
    </>
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

function formatYesNo(value?: boolean | null) {
  if (value === true) return "예";
  if (value === false) return "아니오";
  return "-";
}

function EditableInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string | number | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-[#6b7280]">
      <span>{label}</span>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm text-[#111827]"
      />
    </label>
  );
}

function EditableSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-[#6b7280]">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm text-[#111827] bg-white"
      >
        <option value="">선택하세요</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function EditableToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-xs text-[#6b7280]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-[#111827] text-sm">{label}</span>
    </label>
  );
}

function ActionPanel({
  title,
  active,
  actions,
  doAction,
  saving,
  hideActions,
  collapsed,
  onToggleCollapse,
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
  hideActions?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
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
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="text-[#6b7280] text-sm hover:text-[#1C5DFF] cursor-pointer"
            aria-label={collapsed ? "열기" : "접기"}
          >
            <span aria-hidden>{collapsed ? "▶" : "▼"}</span>
          </button>
        )}
      </div>
      {collapsed ? null : (
        <>
          {!hideActions &&
            (actions.length === 0 ? (
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
            ))}
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
        </>
      )}
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

function DocThumb({ label, url, onPreview }: { label: string; url: string | null; onPreview?: (url: string) => void }) {
  if (!url) {
    return (
      <div className="border border-dashed border-[#E3E6EC] rounded-lg p-3 text-sm text-[#9CA3AF] flex flex-col gap-2 items-start">
        <span className="text-xs text-[#6b7280]">{label}</span>
        <span>미업로드</span>
      </div>
    );
  }
  const fileName = url.split("/").pop() || "download";
  const downloadUrl = url.includes("?") ? `${url}&download=1` : `${url}?download=1`;
  return (
    <div className="border border-[#E3E6EC] rounded-lg p-3 flex flex-col gap-2 bg-[#F9FAFB]">
      <span className="text-xs text-[#6b7280]">{label}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={label}
        className="w-full h-28 object-contain bg-white rounded-md border border-[#E3E6EC] cursor-pointer"
        onClick={() => onPreview?.(url)}
      />
      <div className="flex items-center gap-2">
        <a href={downloadUrl} download={fileName} className="text-[#1C5DFF] underline text-sm">
          다운로드
        </a>
      </div>
    </div>
  );
}
