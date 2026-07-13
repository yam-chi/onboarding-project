"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

type SectionKey = "terms" | "settlement" | "venue_basic" | "venue_detail" | "documents" | "photos";

const SECTION_LABELS: Record<SectionKey, string> = {
  terms: "약관 동의",
  settlement: "정산료 확인",
  venue_basic: "구장 기본 정보",
  venue_detail: "구장 상세 정보",
  documents: "서류 업로드",
  photos: "구장 사진 업로드",
};

const TERMS_LIST = [
  { key: "service", label: "구장 제휴 서비스 이용 약관 (필수)" },
  { key: "privacy", label: "구장 제휴 세부 정책 (필수)" },
  { key: "thirdparty", label: "구장 소셜 매치 일정 추가 및 취소 정책 (필수)" },
  { key: "marketing", label: "구장 회원의 이용자 및 매니저 보상 정책 (필수)" },
  { key: "operation", label: "구장 런드리 서비스 정책 (필수)" },
];

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS: Record<string, string> = { mon: "월", tue: "화", wed: "수", thu: "목", fri: "금", sat: "토", sun: "일" };
const HOURS = Array.from({ length: 18 }, (_, i) => String(i + 6).padStart(2, "0"));

type CourtRate = {
  id: string;
  name: string;
  player_count: number;
  base_fee: number;
  rates: Record<string, Record<string, number | null>>;
};

const REGION_OPTIONS = [
  "서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종",
  "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

const DECLINE_REASONS = [
  "정산 비율이 맞지 않아서",
  "다른 플랫폼과 이미 제휴 중이어서",
  "지금 당장 제휴가 필요하지 않아서",
  "서비스 내용을 더 알아보고 싶어서",
  "기타",
];

type OnboardingData = {
  id: string;
  stadium_name?: string | null;
  manager?: string | null;
  settlement_rate?: string | null;
  settlement_rate_data?: CourtRate[] | null;
  sections?: { key: SectionKey; order: number }[];
  completed_sections?: SectionKey[];
  settlement_decision?: string | null;
  owner_name?: string | null;
  contact?: string | null;
  region?: string | null;
  address?: string | null;
  address_detail?: string | null;
  operating_status?: string | null;
  facility_count?: number | null;
  size_info?: string | null;
  service_types?: string[] | null;
  parking_available?: string | null;
  parking_free?: boolean | null;
  parking_count?: number | null;
  parking_contact?: string | null;
  parking_fee?: string | null;
  shower_available?: string | null;
  shower_memo?: string | null;
  shoes_available?: string | null;
  shoes_memo?: string | null;
  toilet_type?: string | null;
  toilet_available?: boolean | null;
  toilet_memo?: string | null;
  drinks_available?: string | null;
  drinks_memo?: string | null;
  vest_available?: boolean | null;
  vest_memo?: string | null;
  ball_available?: boolean | null;
  ball_memo?: string | null;
  notice?: string | null;
  social_special?: string | null;
  social_message?: string | null;
  manager_note?: string | null;
  rental_note?: string | null;
  rental_warning?: string | null;
  rental_message?: string | null;
  hoped_times_note?: string | null;
};

export default function VenueOwnerPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);

  // 약관
  const [termsChecked, setTermsChecked] = useState<Record<string, boolean>>({});
  const allTermsChecked = TERMS_LIST.every((t) => termsChecked[t.key]);
  const [termPdfUrls, setTermPdfUrls] = useState<Record<string, string | null>>({});
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  // 정산료 테이블 탭
  const [activeCourtTab, setActiveCourtTab] = useState(0);

  // 정산료
  const [settlementDecision, setSettlementDecision] = useState<"accept" | "decline" | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [declineReasonDetail, setDeclineReasonDetail] = useState("");

  // 구장 기본 정보
  const [venueBasic, setVenueBasic] = useState({
    owner_name: "", contact: "", region: "", address: "", address_detail: "",
  });

  // 구장 상세
  const [venueDetail, setVenueDetail] = useState({
    operating_status: "",
    facility_count: "",
    size_info: "",
    service_types: [] as string[],
    parking_available: "",
    parking_free: null as boolean | null,
    parking_count: "" as string,
    parking_contact: "",
    parking_fee: "",
    shower_available: "",
    shower_memo: "",
    shoes_available: "",
    shoes_memo: "",
    toilet_type: "",
    toilet_available: null as boolean | null,
    toilet_memo: "",
    drinks_available: "",
    drinks_memo: "",
    vest_available: null as boolean | null,
    vest_memo: "",
    ball_available: null as boolean | null,
    ball_memo: "",
    notice: "",
    social_special: "",
    social_message: "",
    manager_note: "",
    rental_note: "",
    rental_warning: "",
    rental_message: "",
    hoped_times_note: "",
  });

  // 서류
  const [docs, setDocs] = useState<Record<string, File | null>>({
    business_registration: null, bankbook: null, lease_contract: null,
  });

  // 사진
  const [photos, setPhotos] = useState<File[]>([]);

  useEffect(() => {
    fetch("/api/admin/terms")
      .then((r) => r.json())
      .then((j) => { if (j.urls) setTermPdfUrls(j.urls); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/onboarding/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "불러오기 실패");
        const d = json.onboarding;
        setData(d);

        // 기존 데이터 pre-fill
        if (d?.owner_name || d?.contact) {
          setVenueBasic({
            owner_name: d.owner_name || "",
            contact: d.contact || "",
            region: d.region || "",
            address: d.address || "",
            address_detail: d.address_detail || "",
          });
        }
        if (d?.operating_status || d?.facility_count || d?.parking_available) {
          setVenueDetail({
            operating_status: d.operating_status || "",
            facility_count: d.facility_count?.toString() || "",
            size_info: d.size_info || "",
            service_types: d.service_types || [],
            parking_available: d.parking_available ?? "",
            parking_free: d.parking_free ?? null,
            parking_count: d.parking_count?.toString() ?? "",
            parking_contact: d.parking_contact || "",
            parking_fee: d.parking_fee || "",
            shower_available: d.shower_available ?? "",
            shower_memo: d.shower_memo || "",
            shoes_available: d.shoes_available ?? "",
            shoes_memo: d.shoes_memo || "",
            toilet_type: d.toilet_type || "",
            toilet_available: d.toilet_available ?? null,
            toilet_memo: d.toilet_memo || "",
            drinks_available: d.drinks_available ?? "",
            drinks_memo: d.drinks_memo || "",
            vest_available: d.vest_available ?? null,
            vest_memo: d.vest_memo || "",
            ball_available: d.ball_available ?? null,
            ball_memo: d.ball_memo || "",
            notice: d.notice || "",
            social_special: d.social_special || "",
            social_message: d.social_message || "",
            manager_note: d.manager_note || "",
            rental_note: d.rental_note || "",
            rental_warning: d.rental_warning || "",
            rental_message: d.rental_message || "",
            hoped_times_note: d.hoped_times_note || "",
          });
        }
        if (d?.settlement_decision) {
          setSettlementDecision(d.settlement_decision as "accept" | "decline");
        }

        // 첫 번째 미완료 섹션으로 이동
        const secs = (d?.sections || []).sort((a: any, b: any) => a.order - b.order);
        const done = d?.completed_sections || [];
        const nextIdx = secs.findIndex((s: any) => !done.includes(s.key));
        setActiveSectionIdx(nextIdx === -1 ? secs.length : nextIdx);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const sections = (data?.sections || []).sort((a, b) => a.order - b.order);
  const completed = data?.completed_sections || [];
  const activeSection = sections[activeSectionIdx];
  const allDone = activeSectionIdx >= sections.length && sections.length > 0;

  const markSectionComplete = async (key: SectionKey, extra?: Record<string, any>) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/onboarding/${id}/section`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: key, ...extra }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "저장 실패");
      setData((prev) => prev ? { ...prev, completed_sections: json.completed_sections } : prev);
      setActiveSectionIdx((i) => i + 1);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const goToSection = (idx: number) => {
    if (idx < 0 || idx >= sections.length) return;
    setActiveSectionIdx(idx);
    setError(null);
  };

  const isCompleted = (key: SectionKey) => completed.includes(key);

  if (loading) return <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center text-sm text-[#6b7280]">불러오는 중…</div>;
  if (!id || !data) return <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center text-sm text-red-600">링크 정보를 찾을 수 없습니다.</div>;

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-8">
      <div className="max-w-xl mx-auto space-y-5">

        {/* 로고 */}
        <div className="flex flex-col items-center gap-1">
          <Image src="/plab-logo3.png" alt="PLAB" width={110} height={40} priority />
          <p className="text-xs text-[#9CA3AF]">{data.stadium_name} 구장 제휴 신청</p>
        </div>

        {/* 스텝 네비게이션 */}
        {sections.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
            {sections.map((s, i) => {
              const isDone = isCompleted(s.key);
              const isActive = i === activeSectionIdx;
              return (
                <div key={s.key} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => goToSection(i)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                      isDone
                        ? "bg-[#22c55e] text-white"
                        : isActive
                        ? "bg-[#1C5DFF] text-white"
                        : "bg-[#E5E7EB] text-[#9CA3AF]"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${isDone ? "bg-white/30" : isActive ? "bg-white/30" : "bg-white/50"}`}>
                      {isDone ? "✓" : i + 1}
                    </span>
                    <span className="text-[11px]">{SECTION_LABELS[s.key]}</span>
                  </button>
                  {i < sections.length - 1 && <div className="w-2 h-0.5 bg-[#E5E7EB]" />}
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {/* 완료 화면 */}
        {allDone && (
          <div className="bg-white border border-[#E3E6EC] rounded-2xl shadow-sm p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[#DCFCE7] flex items-center justify-center text-3xl">✓</div>
            <h1 className="text-xl font-semibold text-[#111827]">모든 단계가 완료되었습니다!</h1>
            <p className="text-sm text-[#6b7280]">담당자({data.manager || "담당자"})가 내용을 확인 후 연락드리겠습니다.</p>
            <button type="button" onClick={() => goToSection(0)} className="text-xs text-[#1C5DFF] underline">처음으로 돌아가기</button>
          </div>
        )}

        {/* 각 섹션 */}
        {!allDone && activeSection && (
          <>
            {/* 약관 동의 */}
            {activeSection.key === "terms" && (
              <SectionCard
                title="약관 동의"
                desc="제휴 진행을 위해 아래 약관에 동의해주세요."
                isDone={isCompleted("terms")}
              >
                <label className="flex items-center gap-3 p-4 rounded-xl bg-[#F7F9FC] border border-[#E3E6EC] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allTermsChecked}
                    onChange={(e) => setTermsChecked(Object.fromEntries(TERMS_LIST.map((t) => [t.key, e.target.checked])))}
                    className="w-5 h-5 accent-[#1C5DFF]"
                  />
                  <span className="text-sm font-semibold text-[#111827]">전체 동의</span>
                </label>
                <div className="space-y-1">
                  {TERMS_LIST.map((t) => {
                    const pdfUrl = termPdfUrls[t.key];
                    const isExpanded = expandedTerm === t.key;
                    return (
                      <div key={t.key} className="border border-[#E3E6EC] rounded-xl overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3">
                          <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={!!termsChecked[t.key]}
                              onChange={(e) => setTermsChecked((prev) => ({ ...prev, [t.key]: e.target.checked }))}
                              className="w-4 h-4 accent-[#1C5DFF] shrink-0"
                            />
                            <span className="text-sm text-[#374151] truncate">{t.label}</span>
                          </label>
                          {pdfUrl && (
                            <button
                              type="button"
                              onClick={() => setExpandedTerm(isExpanded ? null : t.key)}
                              className="text-xs text-[#1C5DFF] shrink-0 flex items-center gap-1 font-medium"
                            >
                              보기 {isExpanded ? "▲" : "▼"}
                            </button>
                          )}
                        </div>
                        {isExpanded && pdfUrl && (
                          <div className="border-t border-[#E3E6EC]">
                            <iframe
                              src={pdfUrl}
                              className="w-full h-72 bg-[#F9FAFB]"
                              title={t.label}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <NavButtons
                  idx={activeSectionIdx}
                  total={sections.length}
                  onPrev={() => goToSection(activeSectionIdx - 1)}
                  onNext={() => markSectionComplete("terms")}
                  nextLabel={isCompleted("terms") ? "다음 단계로" : "동의하고 다음 단계로"}
                  nextDisabled={!allTermsChecked && !isCompleted("terms")}
                  saving={saving}
                />
              </SectionCard>
            )}

            {/* 정산료 확인 */}
            {activeSection.key === "settlement" && (
              <SectionCard
                title="정산료 확인"
                desc="담당자가 제안한 정산 조건을 확인해주세요."
                isDone={isCompleted("settlement")}
              >
                {/* 정산료 테이블 (구조화된 데이터) */}
                {data.settlement_rate_data && data.settlement_rate_data.length > 0 ? (
                  <SettlementRateView courts={data.settlement_rate_data} activeTab={activeCourtTab} onTabChange={setActiveCourtTab} />
                ) : data.settlement_rate ? (
                  <div className="bg-[#EEF3FF] border border-[#C7D8FF] rounded-xl p-5 space-y-2">
                    <p className="text-xs text-[#1C5DFF] font-semibold">제안 정산료</p>
                    <p className="text-3xl font-bold text-[#111827]">{data.settlement_rate}</p>
                    <p className="text-xs text-[#6b7280]">담당자: {data.manager || "-"}</p>
                  </div>
                ) : (
                  <div className="bg-[#F9FAFB] border border-[#E3E6EC] rounded-xl p-5 text-center text-sm text-[#9CA3AF]">
                    정산료 정보가 아직 설정되지 않았습니다.
                  </div>
                )}

                {isCompleted("settlement") ? (
                  <div className={`px-4 py-3 rounded-xl text-sm font-semibold text-center ${settlementDecision === "decline" ? "bg-red-50 text-red-600 border border-red-200" : "bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]"}`}>
                    {settlementDecision === "decline" ? "제휴 희망하지 않음으로 제출됨" : "정산료 동의 완료"}
                  </div>
                ) : settlementDecision === null ? (
                  <div className="flex flex-col gap-3">
                    <button type="button" onClick={() => setSettlementDecision("accept")} className="w-full py-3 rounded-xl text-white text-sm font-semibold" style={{ background: "#1C5DFF" }}>
                      확인하고 다음 단계로
                    </button>
                    <button type="button" onClick={() => setSettlementDecision("decline")} className="w-full py-3 rounded-xl border border-[#E3E6EC] text-sm text-[#6b7280]">
                      제휴 희망하지 않습니다
                    </button>
                  </div>
                ) : settlementDecision === "accept" ? (
                  <NavButtons idx={activeSectionIdx} total={sections.length} onPrev={() => goToSection(activeSectionIdx - 1)} onNext={() => markSectionComplete("settlement", { decision: "accept" })} nextLabel="정산료 동의 완료" saving={saving} />
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[#374151]">희망하지 않는 이유를 선택해주세요.</p>
                    <div className="space-y-2">
                      {DECLINE_REASONS.map((r) => (
                        <label key={r} className="flex items-center gap-3 cursor-pointer">
                          <input type="radio" name="decline_reason" value={r} checked={declineReason === r} onChange={() => setDeclineReason(r)} className="accent-[#1C5DFF]" />
                          <span className="text-sm text-[#374151]">{r}</span>
                        </label>
                      ))}
                    </div>
                    {declineReason === "기타" && (
                      <textarea value={declineReasonDetail} onChange={(e) => setDeclineReasonDetail(e.target.value)} placeholder="자세한 이유를 입력해주세요" className="w-full border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827] resize-none h-24 focus:outline-none focus:border-[#1C5DFF]" />
                    )}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setSettlementDecision(null)} className="flex-1 py-2.5 rounded-xl border border-[#E3E6EC] text-sm text-[#6b7280]">돌아가기</button>
                      <button type="button" disabled={!declineReason || saving} onClick={() => markSectionComplete("settlement", { decision: "decline", decline_reason: declineReason, decline_reason_detail: declineReasonDetail })} className="flex-1 py-2.5 rounded-xl bg-[#EF4444] text-white text-sm font-semibold disabled:opacity-40">
                        {saving ? "저장 중…" : "제출"}
                      </button>
                    </div>
                  </div>
                )}

                {isCompleted("settlement") && (
                  <NavButtons idx={activeSectionIdx} total={sections.length} onPrev={() => goToSection(activeSectionIdx - 1)} onNext={() => goToSection(activeSectionIdx + 1)} saving={saving} />
                )}
              </SectionCard>
            )}

            {/* 구장 기본 정보 */}
            {activeSection.key === "venue_basic" && (
              <SectionCard title="구장 기본 정보" desc="구장주 정보와 위치를 입력해주세요." isDone={isCompleted("venue_basic")}>
                <div className="space-y-3">
                  {[
                    { key: "owner_name", label: "구장주 성함 *", placeholder: "성함을 입력하세요" },
                    { key: "contact", label: "연락처 *", placeholder: "010-0000-0000" },
                    { key: "address", label: "주소", placeholder: "도로명 주소" },
                    { key: "address_detail", label: "상세 주소", placeholder: "동/층/호수" },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="text-xs font-semibold text-[#374151]">{f.label}</label>
                      <input
                        value={(venueBasic as any)[f.key]}
                        onChange={(e) => setVenueBasic((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#1C5DFF]"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-semibold text-[#374151]">지역</label>
                    <select value={venueBasic.region} onChange={(e) => setVenueBasic((f) => ({ ...f, region: e.target.value }))} className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827]">
                      <option value="">선택</option>
                      {REGION_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <NavButtons
                  idx={activeSectionIdx}
                  total={sections.length}
                  onPrev={() => goToSection(activeSectionIdx - 1)}
                  onNext={() => markSectionComplete("venue_basic", venueBasic)}
                  nextLabel={isCompleted("venue_basic") ? "저장하고 다음으로" : "다음 단계로"}
                  nextDisabled={!venueBasic.owner_name || !venueBasic.contact}
                  saving={saving}
                />
              </SectionCard>
            )}

            {/* 구장 상세 정보 */}
            {activeSection.key === "venue_detail" && (
              <SectionCard title="구장 상세 정보" desc="구장 운영 현황을 상세히 입력해주세요." isDone={isCompleted("venue_detail")}>
                <div className="space-y-5">
                  {/* 운영 현황 */}
                  <div className="border-b border-[#F3F4F6] pb-4 space-y-3">
                    <p className="text-xs font-bold text-[#374151] uppercase tracking-wide">운영 현황</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-[#374151]">운영 상태</label>
                        <select value={venueDetail.operating_status} onChange={(e) => setVenueDetail((f) => ({ ...f, operating_status: e.target.value }))} className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827]">
                          <option value="">선택</option>
                          <option value="운영중">운영중</option>
                          <option value="준비중">준비중</option>
                          <option value="리모델링중">리모델링중</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#374151]">면 수</label>
                        <input type="number" value={venueDetail.facility_count} onChange={(e) => setVenueDetail((f) => ({ ...f, facility_count: e.target.value }))} placeholder="예: 3" className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#1C5DFF]" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#374151]">규격/실내외</label>
                      <input value={venueDetail.size_info} onChange={(e) => setVenueDetail((f) => ({ ...f, size_info: e.target.value }))} placeholder="예: 실내 풋살 5인제" className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#1C5DFF]" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#374151]">희망 서비스</label>
                      <div className="flex gap-4 mt-2">
                        {[{ key: "social_match", label: "소셜 매치" }, { key: "rental", label: "구장 예약" }].map((s) => (
                          <label key={s.key} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={venueDetail.service_types.includes(s.key)} onChange={(e) => setVenueDetail((f) => ({ ...f, service_types: e.target.checked ? [...f.service_types, s.key] : f.service_types.filter((k) => k !== s.key) }))} className="accent-[#1C5DFF]" />
                            <span className="text-sm text-[#374151]">{s.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#374151]">공지사항</label>
                      <textarea value={venueDetail.notice} onChange={(e) => setVenueDetail((f) => ({ ...f, notice: e.target.value }))} placeholder="구장 공지사항을 입력해주세요" className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827] resize-none h-20 focus:outline-none focus:border-[#1C5DFF]" />
                    </div>
                  </div>

                  {/* 주차 */}
                  <div className="border-b border-[#F3F4F6] pb-4 space-y-3">
                    <p className="text-xs font-bold text-[#374151] uppercase tracking-wide">주차</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-[#374151]">주차 가능</label>
                        <select value={venueDetail.parking_available} onChange={(e) => setVenueDetail((f) => ({ ...f, parking_available: e.target.value }))} className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827]">
                          <option value="">선택</option>
                          <option value="가능">가능</option>
                          <option value="불가">불가</option>
                          <option value="유료 주차">유료 주차</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#374151]">무료 주차</label>
                        <select value={venueDetail.parking_free === null ? "" : venueDetail.parking_free ? "예" : "아니오"} onChange={(e) => setVenueDetail((f) => ({ ...f, parking_free: e.target.value === "" ? null : e.target.value === "예" }))} className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827]">
                          <option value="">선택</option>
                          <option value="예">예</option>
                          <option value="아니오">아니오</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#374151]">무료 주차 대수</label>
                        <input type="number" value={venueDetail.parking_count} onChange={(e) => setVenueDetail((f) => ({ ...f, parking_count: e.target.value }))} placeholder="예: 10" className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#1C5DFF]" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#374151]">주차 요금</label>
                        <input value={venueDetail.parking_fee} onChange={(e) => setVenueDetail((f) => ({ ...f, parking_fee: e.target.value }))} placeholder="예: 1시간 무료" className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#1C5DFF]" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#374151]">주차 등록 연락처</label>
                      <input value={venueDetail.parking_contact} onChange={(e) => setVenueDetail((f) => ({ ...f, parking_contact: e.target.value }))} placeholder="주차 등록 연락처" className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#1C5DFF]" />
                    </div>
                  </div>

                  {/* 편의시설 */}
                  <div className="border-b border-[#F3F4F6] pb-4 space-y-3">
                    <p className="text-xs font-bold text-[#374151] uppercase tracking-wide">편의시설</p>
                    {[
                      { availKey: "shower_available", memoKey: "shower_memo", label: "샤워장", opts: ["있음", "없음"], memoPlaceholder: "샤워장 관련 메모" },
                      { availKey: "shoes_available", memoKey: "shoes_memo", label: "풋살화 대여", opts: ["가능", "불가"], memoPlaceholder: "풋살화 대여 관련 메모" },
                      { availKey: "drinks_available", memoKey: "drinks_memo", label: "음료 판매", opts: ["있음", "없음"], memoPlaceholder: "음료 관련 메모" },
                    ].map(({ availKey, memoKey, label, opts, memoPlaceholder }) => (
                      <div key={availKey} className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-[#374151]">{label}</label>
                          <select value={(venueDetail as any)[availKey]} onChange={(e) => setVenueDetail((f) => ({ ...f, [availKey]: e.target.value }))} className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827]">
                            <option value="">선택</option>
                            {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[#374151]">메모</label>
                          <input value={(venueDetail as any)[memoKey]} onChange={(e) => setVenueDetail((f) => ({ ...f, [memoKey]: e.target.value }))} placeholder={memoPlaceholder} className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#1C5DFF]" />
                        </div>
                      </div>
                    ))}
                    {/* 화장실 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-[#374151]">화장실</label>
                        <select value={venueDetail.toilet_type} onChange={(e) => setVenueDetail((f) => ({ ...f, toilet_type: e.target.value }))} className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827]">
                          <option value="">선택</option>
                          <option value="남녀구분">남녀구분</option>
                          <option value="남녀공용">남녀공용</option>
                          <option value="없음">없음</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#374151]">메모</label>
                        <input value={venueDetail.toilet_memo} onChange={(e) => setVenueDetail((f) => ({ ...f, toilet_memo: e.target.value }))} placeholder="화장실 관련 메모" className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#1C5DFF]" />
                      </div>
                    </div>
                    {/* 조끼 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-[#374151]">조끼 제공</label>
                        <select value={venueDetail.vest_available === null ? "" : venueDetail.vest_available ? "예" : "아니오"} onChange={(e) => setVenueDetail((f) => ({ ...f, vest_available: e.target.value === "" ? null : e.target.value === "예" }))} className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827]">
                          <option value="">선택</option>
                          <option value="예">예</option>
                          <option value="아니오">아니오</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#374151]">메모</label>
                        <input value={venueDetail.vest_memo} onChange={(e) => setVenueDetail((f) => ({ ...f, vest_memo: e.target.value }))} placeholder="조끼 관련 메모" className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#1C5DFF]" />
                      </div>
                    </div>
                    {/* 공 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-[#374151]">공 제공</label>
                        <select value={venueDetail.ball_available === null ? "" : venueDetail.ball_available ? "예" : "아니오"} onChange={(e) => setVenueDetail((f) => ({ ...f, ball_available: e.target.value === "" ? null : e.target.value === "예" }))} className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827]">
                          <option value="">선택</option>
                          <option value="예">예</option>
                          <option value="아니오">아니오</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#374151]">메모</label>
                        <input value={venueDetail.ball_memo} onChange={(e) => setVenueDetail((f) => ({ ...f, ball_memo: e.target.value }))} placeholder="공 관련 메모" className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#1C5DFF]" />
                      </div>
                    </div>
                  </div>

                  {/* 소셜매치 */}
                  <div className="border-b border-[#F3F4F6] pb-4 space-y-3">
                    <p className="text-xs font-bold text-[#374151] uppercase tracking-wide">소셜매치</p>
                    <div>
                      <label className="text-xs font-semibold text-[#374151]">소셜매치 특이사항</label>
                      <input value={venueDetail.social_special} onChange={(e) => setVenueDetail((f) => ({ ...f, social_special: e.target.value }))} placeholder="소셜매치 특이사항" className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#1C5DFF]" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#374151]">소셜매치 알림톡</label>
                      <input value={venueDetail.social_message} onChange={(e) => setVenueDetail((f) => ({ ...f, social_message: e.target.value }))} placeholder="소셜매치 알림톡 내용" className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#1C5DFF]" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#374151]">매니저 특이사항</label>
                      <input value={venueDetail.manager_note} onChange={(e) => setVenueDetail((f) => ({ ...f, manager_note: e.target.value }))} placeholder="매니저 특이사항" className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#1C5DFF]" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#374151]">운영 불가 시간</label>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">소셜 매치 배정이 어려운 시간대를 알려주세요.</p>
                      <textarea value={venueDetail.hoped_times_note} onChange={(e) => setVenueDetail((f) => ({ ...f, hoped_times_note: e.target.value }))} placeholder="예: 평일 오전 6시~9시, 주말 오후 3시~5시" className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827] resize-none h-20 focus:outline-none focus:border-[#1C5DFF]" />
                    </div>
                  </div>

                  {/* 대관 */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-[#374151] uppercase tracking-wide">대관</p>
                    <div>
                      <label className="text-xs font-semibold text-[#374151]">대관 특이사항</label>
                      <input value={venueDetail.rental_note} onChange={(e) => setVenueDetail((f) => ({ ...f, rental_note: e.target.value }))} placeholder="대관 특이사항" className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#1C5DFF]" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#374151]">꼭 지켜주세요</label>
                      <input value={venueDetail.rental_warning} onChange={(e) => setVenueDetail((f) => ({ ...f, rental_warning: e.target.value }))} placeholder="꼭 지켜야 할 사항" className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#1C5DFF]" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#374151]">구장 예약 알림톡</label>
                      <input value={venueDetail.rental_message} onChange={(e) => setVenueDetail((f) => ({ ...f, rental_message: e.target.value }))} placeholder="구장 예약 알림톡 내용" className="w-full mt-1 border border-[#E3E6EC] rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#1C5DFF]" />
                    </div>
                  </div>
                </div>

                <NavButtons
                  idx={activeSectionIdx}
                  total={sections.length}
                  onPrev={() => goToSection(activeSectionIdx - 1)}
                  onNext={() => markSectionComplete("venue_detail", {
                    operating_status: venueDetail.operating_status || null,
                    facility_count: venueDetail.facility_count ? parseInt(venueDetail.facility_count) : null,
                    size_info: venueDetail.size_info || null,
                    service_types: venueDetail.service_types,
                    parking_available: venueDetail.parking_available || null,
                    parking_free: venueDetail.parking_free,
                    parking_count: venueDetail.parking_count ? parseInt(venueDetail.parking_count) : null,
                    parking_contact: venueDetail.parking_contact || null,
                    parking_fee: venueDetail.parking_fee || null,
                    shower_available: venueDetail.shower_available || null,
                    shower_memo: venueDetail.shower_memo || null,
                    shoes_available: venueDetail.shoes_available || null,
                    shoes_memo: venueDetail.shoes_memo || null,
                    toilet_type: venueDetail.toilet_type || null,
                    toilet_memo: venueDetail.toilet_memo || null,
                    drinks_available: venueDetail.drinks_available || null,
                    drinks_memo: venueDetail.drinks_memo || null,
                    vest_available: venueDetail.vest_available,
                    vest_memo: venueDetail.vest_memo || null,
                    ball_available: venueDetail.ball_available,
                    ball_memo: venueDetail.ball_memo || null,
                    notice: venueDetail.notice || null,
                    social_special: venueDetail.social_special || null,
                    social_message: venueDetail.social_message || null,
                    manager_note: venueDetail.manager_note || null,
                    rental_note: venueDetail.rental_note || null,
                    rental_warning: venueDetail.rental_warning || null,
                    rental_message: venueDetail.rental_message || null,
                    hoped_times_note: venueDetail.hoped_times_note || null,
                  })}
                  saving={saving}
                />
              </SectionCard>
            )}

            {/* 서류 업로드 */}
            {activeSection.key === "documents" && (
              <SectionCard title="서류 업로드" desc="제휴에 필요한 서류를 업로드해주세요." isDone={isCompleted("documents")}>
                {isCompleted("documents") ? (
                  <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-4 py-3 text-sm text-[#16A34A] font-semibold text-center">
                    서류 업로드 완료 ✓
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      { key: "business_registration", label: "사업자등록증 *" },
                      { key: "bankbook", label: "통장 사본 *" },
                      { key: "lease_contract", label: "임대차 계약서" },
                    ].map((d) => (
                      <div key={d.key}>
                        <label className="text-xs font-semibold text-[#374151]">{d.label}</label>
                        <label className="mt-1 flex items-center justify-center gap-2 border-2 border-dashed border-[#E3E6EC] rounded-xl py-3 cursor-pointer hover:border-[#1C5DFF] transition-colors">
                          <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setDocs((prev) => ({ ...prev, [d.key]: e.target.files?.[0] ?? null }))} />
                          <span className="text-sm text-[#6b7280]">{docs[d.key] ? docs[d.key]!.name : "파일 선택"}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                <NavButtons
                  idx={activeSectionIdx}
                  total={sections.length}
                  onPrev={() => goToSection(activeSectionIdx - 1)}
                  onNext={isCompleted("documents") ? () => goToSection(activeSectionIdx + 1) : async () => {
                    setSaving(true);
                    setError(null);
                    try {
                      const formData = new FormData();
                      Object.entries(docs).forEach(([k, v]) => { if (v) formData.append(k, v); });
                      const res = await fetch(`/api/onboarding/${id}/section-documents`, { method: "POST", body: formData });
                      const json = await res.json();
                      if (!res.ok) throw new Error(json?.error || "업로드 실패");
                      setData((prev) => prev ? { ...prev, completed_sections: json.completed_sections } : prev);
                      setActiveSectionIdx((i) => i + 1);
                    } catch (e: any) {
                      setError(e.message);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  nextDisabled={!isCompleted("documents") && (!docs.business_registration || !docs.bankbook)}
                  nextLabel={isCompleted("documents") ? "다음 단계로" : saving ? "업로드 중…" : "업로드하고 다음으로"}
                  saving={saving}
                />
              </SectionCard>
            )}

            {/* 사진 업로드 */}
            {activeSection.key === "photos" && (
              <SectionCard title="구장 사진 업로드" desc="구장 전경, 내부, 시설 사진을 업로드해주세요." isDone={isCompleted("photos")}>
                {isCompleted("photos") ? (
                  <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-4 py-3 text-sm text-[#16A34A] font-semibold text-center">
                    사진 업로드 완료 ✓
                  </div>
                ) : (
                  <>
                    <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#E3E6EC] rounded-xl py-8 cursor-pointer hover:border-[#1C5DFF] transition-colors">
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setPhotos(Array.from(e.target.files || []))} />
                      <span className="text-2xl">📷</span>
                      <span className="text-sm text-[#6b7280]">사진을 선택하세요 (여러 장 가능)</span>
                    </label>
                    {photos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {photos.map((p, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={URL.createObjectURL(p)} alt={p.name} className="aspect-square rounded-lg object-cover border border-[#E3E6EC]" />
                        ))}
                      </div>
                    )}
                  </>
                )}
                <NavButtons
                  idx={activeSectionIdx}
                  total={sections.length}
                  onPrev={() => goToSection(activeSectionIdx - 1)}
                  onNext={isCompleted("photos") ? () => goToSection(activeSectionIdx + 1) : async () => {
                    setSaving(true);
                    setError(null);
                    try {
                      const formData = new FormData();
                      photos.forEach((p) => formData.append("photos", p));
                      const res = await fetch(`/api/onboarding/${id}/section-photos`, { method: "POST", body: formData });
                      const json = await res.json();
                      if (!res.ok) throw new Error(json?.error || "업로드 실패");
                      setData((prev) => prev ? { ...prev, completed_sections: json.completed_sections } : prev);
                      setActiveSectionIdx((i) => i + 1);
                    } catch (e: any) {
                      setError(e.message);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  nextDisabled={!isCompleted("photos") && photos.length === 0}
                  nextLabel={isCompleted("photos") ? "다음 단계로" : saving ? "업로드 중…" : "업로드하고 완료"}
                  saving={saving}
                />
              </SectionCard>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function SettlementRateView({ courts, activeTab, onTabChange }: { courts: CourtRate[]; activeTab: number; onTabChange: (i: number) => void }) {
  const court = courts[activeTab];
  if (!court) return null;

  const fmt = (n: number) => n.toLocaleString("ko-KR");
  const calcPerPerson = (rate: number | null) => {
    if (rate == null || !court.base_fee || !court.player_count) return "-";
    return fmt(Math.round((court.base_fee * rate) / 100 / court.player_count)) + "원";
  };

  return (
    <div className="space-y-3">
      {/* 면 탭 */}
      {courts.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          {courts.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onTabChange(i)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${i === activeTab ? "bg-[#1C5DFF] text-white" : "bg-[#F3F4F6] text-[#6b7280]"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* 면 기본 정보 */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#EEF3FF] border border-[#C7D8FF] rounded-xl text-xs text-[#1C5DFF]">
        <span className="font-bold">{court.name}</span>
        <span>·</span>
        <span>기준 인원 {court.player_count}명</span>
        <span>·</span>
        <span>구장료 {fmt(court.base_fee)}원</span>
      </div>

      {/* 정산율 표 */}
      <div>
        <p className="text-xs font-semibold text-[#374151] mb-1.5">정산율 (%)</p>
        <div className="overflow-x-auto rounded-xl border border-[#E3E6EC]">
          <table className="w-full text-[11px] border-collapse min-w-[340px]">
            <thead>
              <tr className="bg-[#F9FAFB]">
                <th className="px-2 py-2 text-left text-[#9CA3AF] font-semibold border-b border-[#E3E6EC] w-10">시간</th>
                {DAYS.map((d) => (
                  <th key={d} className="px-1 py-2 text-center text-[#374151] font-semibold border-b border-[#E3E6EC]">{DAY_LABELS[d]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((h) => (
                <tr key={h} className="even:bg-[#F9FAFB]">
                  <td className="px-2 py-1.5 text-[#6b7280] font-medium border-b border-[#F3F4F6] whitespace-nowrap">{h}시</td>
                  {DAYS.map((d) => {
                    const rate = court.rates?.[d]?.[h];
                    return (
                      <td key={d} className="px-1 py-1.5 text-center border-b border-[#F3F4F6]">
                        <span className={rate != null ? "text-[#1C5DFF] font-semibold" : "text-[#D1D5DB]"}>
                          {rate != null ? `${rate}%` : "-"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 인당 금액 표 */}
      <div>
        <p className="text-xs font-semibold text-[#374151] mb-1.5">인당 금액 (원) <span className="text-[#9CA3AF] font-normal">= 구장료 × 정산율 ÷ {court.player_count}명</span></p>
        <div className="overflow-x-auto rounded-xl border border-[#E3E6EC]">
          <table className="w-full text-[11px] border-collapse min-w-[340px]">
            <thead>
              <tr className="bg-[#F9FAFB]">
                <th className="px-2 py-2 text-left text-[#9CA3AF] font-semibold border-b border-[#E3E6EC] w-10">시간</th>
                {DAYS.map((d) => (
                  <th key={d} className="px-1 py-2 text-center text-[#374151] font-semibold border-b border-[#E3E6EC]">{DAY_LABELS[d]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((h) => (
                <tr key={h} className="even:bg-[#F9FAFB]">
                  <td className="px-2 py-1.5 text-[#6b7280] font-medium border-b border-[#F3F4F6] whitespace-nowrap">{h}시</td>
                  {DAYS.map((d) => {
                    const rate = court.rates?.[d]?.[h];
                    return (
                      <td key={d} className="px-1 py-1.5 text-center border-b border-[#F3F4F6]">
                        <span className={rate != null ? "text-[#374151]" : "text-[#D1D5DB]"}>
                          {calcPerPerson(rate ?? null)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, desc, isDone, children }: { title: string; desc: string; isDone: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E3E6EC] rounded-2xl shadow-sm p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#111827]">{title}</h2>
          <p className="text-sm text-[#6b7280] mt-1">{desc}</p>
        </div>
        {isDone && (
          <span className="shrink-0 text-xs bg-[#DCFCE7] text-[#16A34A] px-2 py-1 rounded-full font-semibold">완료됨</span>
        )}
      </div>
      {children}
    </div>
  );
}

function NavButtons({
  idx, total, onPrev, onNext, nextLabel = "다음 단계로", nextDisabled = false, saving = false,
}: {
  idx: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  saving?: boolean;
}) {
  return (
    <div className="flex gap-2 pt-2">
      {idx > 0 && (
        <button
          type="button"
          onClick={onPrev}
          className="px-4 py-2.5 rounded-xl border border-[#E3E6EC] text-sm text-[#6b7280] font-semibold"
        >
          ← 이전
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled || saving}
        className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
        style={{ background: "#1C5DFF" }}
      >
        {saving ? "저장 중…" : nextLabel}
      </button>
    </div>
  );
}
