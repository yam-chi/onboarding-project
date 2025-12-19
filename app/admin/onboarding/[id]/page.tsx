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
  const [stadiumInfo, setStadiumInfo] = useState<StadiumInfo | null>(null);
  const [courtInfo, setCourtInfo] = useState<CourtInfo[]>([]);
  const [businessUrl, setBusinessUrl] = useState<string | null>(null);
  const [bankbookUrl, setBankbookUrl] = useState<string | null>(null);
  const [times, setTimes] = useState<TimeRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [finalAccount, setFinalAccount] = useState("");
  const [finalPassword, setFinalPassword] = useState("");

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
    if (info && ["step2_done", "step3_proposed", "step3_approved"].includes(info.step_status)) {
      loadProposals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info?.step_status]);

  const loadStadiumInfo = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/onboarding/${id}/step2`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "구장 정보 불러오기 실패");
      setStadiumInfo(json.stadium || null);
      setCourtInfo(json.courts || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (info && ["step1_pending", "step1_submitted", "step1_need_fix", "step1_approved"].includes(info.step_status)) {
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
      setBusinessUrl(b?.file_url || null);
      setBankbookUrl(bank?.file_url || null);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (info && ["step3_approved", "step4_submitted"].includes(info.step_status)) {
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

  const doAction = async (next: OnboardingState) => {
    if (!id) return;
    setSaving(true);
    setBanner(null);
    setError(null);
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
          active={["step1_pending", "step1_submitted", "step1_need_fix"].includes(info?.step_status || "")}
          actions={step1Actions}
          doAction={doAction}
          saving={saving}
          extraContent={
            stadiumInfo ? (
              <div className="mt-2 space-y-3">
                <div className="text-xs text-[#6b7280]">구장 상세 정보</div>
                <div className="grid md:grid-cols-2 gap-3 text-sm text-[#374151]">
                  <InfoLine label="지역" value={stadiumInfo.region} />
                  <InfoLine label="홈 필터 지역" value={stadiumInfo.home_filter_region} />
                  <InfoLine label="구장명" value={stadiumInfo.stadium_name} />
                  <InfoLine label="주소" value={[stadiumInfo.address, stadiumInfo.address_detail].filter(Boolean).join(" ")} />
                  <InfoLine label="구장 유형" value={stadiumInfo.stadium_type} />
                  <InfoLine label="인조잔디" value={stadiumInfo.artificial_grass ? "예" : stadiumInfo.artificial_grass === false ? "아니오" : "-"} />
                  <InfoLine label="구장 연락처" value={stadiumInfo.stadium_contact} />
                  <InfoLine label="런드리 연락처" value={stadiumInfo.laundry_contact} />
                  <InfoLine label="공지사항" value={stadiumInfo.notice} className="md:col-span-2" />
                  <InfoLine label="주차 가능" value={stadiumInfo.parking_available ? "예" : stadiumInfo.parking_available === false ? "아니오" : "-"} />
                  <InfoLine label="무료 주차" value={stadiumInfo.parking_free ? "예" : stadiumInfo.parking_free === false ? "아니오" : "-"} />
                  <InfoLine label="무료 주차 대수" value={stadiumInfo.parking_count?.toString()} />
                  <InfoLine label="주차 연락처" value={stadiumInfo.parking_contact || ""} />
                  <InfoLine label="주차 요금" value={stadiumInfo.parking_fee || ""} />
                  <InfoLine label="샤워장" value={stadiumInfo.shower_available ? "예" : stadiumInfo.shower_available === false ? "아니오" : "-"} />
                  <InfoLine label="샤워 메모" value={stadiumInfo.shower_memo} />
                  <InfoLine label="풋살화 대여" value={stadiumInfo.shoes_available ? "예" : stadiumInfo.shoes_available === false ? "아니오" : "-"} />
                  <InfoLine label="풋살화 메모" value={stadiumInfo.shoes_memo} />
                  <InfoLine label="화장실" value={stadiumInfo.toilet_available ? "예" : stadiumInfo.toilet_available === false ? "아니오" : "-"} />
                  <InfoLine label="화장실 메모" value={stadiumInfo.toilet_memo} />
                  <InfoLine label="음료" value={stadiumInfo.drinks_available ? "예" : stadiumInfo.drinks_available === false ? "아니오" : "-"} />
                  <InfoLine label="음료 메모" value={stadiumInfo.drinks_memo} />
                  <InfoLine label="소셜 특이사항" value={stadiumInfo.social_special} />
                  <InfoLine label="소셜 알림" value={stadiumInfo.social_message} />
                  <InfoLine label="매니저 노트" value={stadiumInfo.manager_note} />
                  <InfoLine label="대관 특이사항" value={stadiumInfo.rental_note} />
                  <InfoLine label="꼭 지켜주세요" value={stadiumInfo.rental_warning} />
                  <InfoLine label="대관 알림" value={stadiumInfo.rental_message} />
                  <InfoLine label="조끼" value={stadiumInfo.vest_available ? "예" : stadiumInfo.vest_available === false ? "아니오" : "-"} />
                  <InfoLine label="조끼 메모" value={stadiumInfo.vest_memo} />
                  <InfoLine label="공" value={stadiumInfo.ball_available ? "예" : stadiumInfo.ball_available === false ? "아니오" : "-"} />
                  <InfoLine label="공 메모" value={stadiumInfo.ball_memo} />
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-[#6b7280]">면 정보</div>
                  {courtInfo && courtInfo.length > 0 ? (
                    <div className="space-y-2">
                      {courtInfo
                        .slice()
                        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                        .map((c, idx) => (
                          <div key={`${c.court_name}-${idx}`} className="border border-[#E3E6EC] rounded-lg p-3 grid md:grid-cols-3 gap-2 text-sm">
                            <InfoLine label="면 이름" value={c.court_name} />
                            <InfoLine label="인원" value={c.capacity ? `${c.capacity}명` : "-"} />
                            <InfoLine
                              label="사이즈"
                              value={c.size_x && c.size_y ? `${c.size_x} x ${c.size_y}` : c.size_x ? `${c.size_x}` : c.size_y ? `${c.size_y}` : "-"}
                            />
                            <InfoLine label="바닥/유형" value={c.floor_type} />
                            <InfoLine label="실내/실외" value={c.indoor_outdoor} />
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-sm text-[#6b7280]">면 정보가 아직 없습니다.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-[#6b7280]">구장주가 구장 상세 정보를 제출하면 이곳에 표시됩니다.</div>
            )
          }
        />
        <ActionPanel
          title="STEP3 · 서류 검토"
          active={["step3_approved", "step4_submitted"].includes(info?.step_status || "")}
          actions={step4Actions}
          doAction={doAction}
          saving={saving}
          extraContent={
            info && ["step3_approved", "step4_submitted"].includes(info.step_status) ? (
              <div className="space-y-2 text-sm text-[#4b5563]">
                <div className="text-xs text-[#6b7280]">구장주 서류 상태</div>
                {businessUrl || bankbookUrl ? (
                  <div className="grid md:grid-cols-2 gap-3">
                    <DocThumb label="사업자등록증" url={businessUrl} onPreview={setPreviewImage} />
                    <DocThumb label="통장 사본" url={bankbookUrl} onPreview={setPreviewImage} />
                  </div>
                ) : (
                  <div className="text-sm text-[#6b7280]">구장주 서류 제출 대기중입니다.</div>
                )}
              </div>
            ) : null
          }
        />
        <ActionPanel
          title="STEP4 · 세팅 완료 처리"
          active={["step4_complete", "step5_submitted", "step5_complete"].includes(info?.step_status || "")}
          actions={step5Actions}
          doAction={doAction}
          saving={saving}
          extraContent={
            times && times.length > 0 ? (
              <div className="space-y-4 text-sm text-[#4b5563]">
                <div className="text-xs text-[#6b7280]">제출된 세팅 가능 시간</div>
                <div className="border border-[#E3E6EC] rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-[#F3F4F6] text-[#1C1E26]">
                      <tr>
                        <th className="px-3 py-2 text-left">요일</th>
                        <th className="px-3 py-2 text-left">시간</th>
                        <th className="px-3 py-2 text-left">메모</th>
                      </tr>
                    </thead>
                    <tbody>
                      {times
                        .slice()
                        .sort((a, b) => a.day_of_week.localeCompare(b.day_of_week) || a.start_time.localeCompare(b.start_time))
                        .map((t, idx) => (
                          <tr key={`${t.day_of_week}-${t.start_time}-${idx}`} className="border-t border-[#E3E6EC]">
                            <td className="px-3 py-2">{t.day_of_week}</td>
                            <td className="px-3 py-2">
                              {t.start_time} ~ {t.end_time}
                            </td>
                            <td className="px-3 py-2 text-[#6b7280]">{t.note || "-"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-[#6b7280]">구장주 계정 정보 (STEP5에 표시)</div>
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
              </div>
            ) : (
              <div className="space-y-2 text-sm text-[#6b7280]">
                <div>구장주가 제출한 세팅 시간이 없습니다.</div>
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
            )
          }
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
