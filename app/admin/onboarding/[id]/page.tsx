"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type SectionKey = "terms" | "settlement" | "venue_basic" | "venue_detail" | "documents" | "photos";

const ALL_SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "terms", label: "약관 동의" },
  { key: "settlement", label: "정산료 확인" },
  { key: "venue_detail", label: "구장 상세 정보" },
  { key: "documents", label: "서류 업로드" },
  { key: "photos", label: "구장 사진 업로드" },
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

type OnboardingData = {
  id: string;
  stadium_name?: string | null;
  manager?: string | null;
  venue_type?: string | null;
  region?: string | null;
  settlement_rate?: string | null;
  settlement_rate_data?: CourtRate[] | null;
  step_status?: string | null;
  sections?: { key: SectionKey; order: number }[];
  completed_sections?: SectionKey[];
  settlement_decision?: string | null;
  decline_reason?: string | null;
  decline_reason_detail?: string | null;
  owner_name?: string | null;
  contact?: string | null;
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
  document_urls?: Record<string, string> | null;
  photo_urls?: string[] | null;
  updated_at?: string | null;
};

export default function AdminOnboardingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 섹션 편집
  const [editSections, setEditSections] = useState<{ key: SectionKey; enabled: boolean }[]>([]);
  const [editCourts, setEditCourts] = useState<CourtRate[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [sectionSaving, setSectionSaving] = useState(false);
  const [sectionSaved, setSectionSaved] = useState(false);


  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/onboarding/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "불러오기 실패");
        const d = json.onboarding;
        setData(d);
        setEditCourts(d?.settlement_rate_data || []);

        const activeSectionKeys: SectionKey[] = (d?.sections || []).map((s: any) => s.key);
        setEditSections(
          ALL_SECTIONS.map((s) => ({ key: s.key, enabled: activeSectionKeys.includes(s.key) }))
        );
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const copyLink = () => {
    const link = `${window.location.origin}/onboarding/${id}`;
    navigator.clipboard.writeText(link).catch(() => {
      const el = document.createElement("textarea");
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveSections = async () => {
    setSectionSaving(true);
    setSectionSaved(false);
    try {
      const sections = editSections
        .filter((s) => s.enabled)
        .map((s, i) => ({ key: s.key, order: i }));

      const res = await fetch(`/api/admin/onboarding/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections, settlement_rate_data: editCourts.length > 0 ? editCourts : null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "저장 실패");
      setData((prev) => prev ? { ...prev, sections: json.sections, settlement_rate_data: json.settlement_rate_data } : prev);
      setSectionSaved(true);
      setTimeout(() => setSectionSaved(false), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSectionSaving(false);
    }
  };

  const toggleSection = (key: SectionKey) => {
    setEditSections((prev) => prev.map((s) => s.key === key ? { ...s, enabled: !s.enabled } : s));
  };

  const addCourt = () => {
    const newCourt: CourtRate = {
      id: Date.now().toString(),
      name: "",
      player_count: 18,
      base_fee: 0,
      rates: {},
    };
    setEditCourts((prev) => [...prev, newCourt]);
  };

  const removeCourt = (id: string) => {
    setEditCourts((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCourt = (id: string, field: keyof CourtRate, value: any) => {
    setEditCourts((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value } : c));
  };

  const updateRate = (courtId: string, day: string, hour: string, value: string) => {
    const num = value === "" ? null : Number(value);
    setEditCourts((prev) => prev.map((c) => {
      if (c.id !== courtId) return c;
      const rates = { ...c.rates };
      if (!rates[day]) rates[day] = {};
      rates[day] = { ...rates[day], [hour]: num };
      return { ...c, rates };
    }));
  };


  if (!id) return <div className="p-6 text-sm text-red-600">유효하지 않은 경로입니다.</div>;
  if (loading) return <div className="p-6 text-sm text-[#6b7280]">불러오는 중…</div>;
  if (!data) return <div className="p-6 text-sm text-red-600">{error || "데이터를 찾을 수 없습니다."}</div>;

  const sections = (data.sections || []).sort((a, b) => a.order - b.order);
  const completed = data.completed_sections || [];
  const isDeclined = data.settlement_decision === "decline";
  const progressPct = sections.length > 0 ? Math.round((completed.length / sections.length) * 100) : 0;

  return (
    <>
      <main className="min-h-screen bg-[#F7F9FC] px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <Link href="/admin/onboarding" className="text-sm text-[#6b7280] hover:text-[#1C5DFF]">
              ← 목록으로
            </Link>
            <button
              type="button"
              onClick={copyLink}
              className="px-3 py-1.5 rounded-lg border border-[#1C5DFF] text-[#1C5DFF] text-xs font-semibold"
            >
              {copied ? "복사됨!" : "구장주 링크 복사"}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          {/* 기본 정보 */}
          <div className="bg-white border border-[#E3E6EC] rounded-2xl shadow-sm px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-[#111827]">{data.stadium_name || "-"}</h1>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${data.venue_type === "추가" ? "bg-[#FEF3C7] text-[#92400E]" : "bg-[#EEF3FF] text-[#1C5DFF]"}`}>
                    {data.venue_type || "신규"}
                  </span>
                </div>
                <p className="text-sm text-[#6b7280] mt-1">담당자: {data.manager || "-"} · {data.region || "-"}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#9CA3AF]">진행률</div>
                <div className="text-sm font-bold text-[#1C5DFF]">{completed.length} / {sections.length}</div>
              </div>
            </div>
            {isDeclined && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-1">
                <p className="text-sm font-semibold text-red-600">제휴 희망하지 않음</p>
                <p className="text-sm text-red-500">{data.decline_reason || "-"}</p>
                {data.decline_reason_detail && <p className="text-xs text-red-400">{data.decline_reason_detail}</p>}
              </div>
            )}
          </div>

          {/* 섹션 구성 편집 */}
          <div className="bg-white border border-[#E3E6EC] rounded-2xl shadow-sm p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-[#111827]">섹션 구성 관리</h2>
              <p className="text-xs text-[#9CA3AF] mt-1">구장주 링크에서 보여줄 항목을 선택하세요. 저장 후 같은 링크로 즉시 반영됩니다.</p>
            </div>

            {/* 정산료 테이블 에디터 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#374151]">정산료 설정 (면별 요일×시간)</label>
                <button type="button" onClick={addCourt} className="text-xs px-2.5 py-1 rounded-lg bg-[#EEF3FF] text-[#1C5DFF] font-semibold">+ 면 추가</button>
              </div>
              {editCourts.length === 0 && (
                <p className="text-xs text-[#9CA3AF] text-center py-3 border border-dashed border-[#E3E6EC] rounded-xl">면을 추가하고 정산율을 입력하세요.</p>
              )}
              {editCourts.map((court) => (
                <div key={court.id} className="border border-[#E3E6EC] rounded-xl overflow-hidden">
                  {/* 면 헤더 */}
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-[#F9FAFB] border-b border-[#E3E6EC]">
                    <input
                      value={court.name}
                      onChange={(e) => updateCourt(court.id, "name", e.target.value)}
                      placeholder="면 이름 (예: 실내 6:6)"
                      className="flex-1 text-xs border border-[#E3E6EC] rounded-lg px-2 py-1 focus:outline-none focus:border-[#1C5DFF]"
                    />
                    <input
                      type="number"
                      value={court.player_count || ""}
                      onChange={(e) => updateCourt(court.id, "player_count", Number(e.target.value))}
                      placeholder="인원"
                      className="w-14 text-xs border border-[#E3E6EC] rounded-lg px-2 py-1 focus:outline-none focus:border-[#1C5DFF] text-center"
                    />
                    <span className="text-[10px] text-[#9CA3AF]">명</span>
                    <input
                      type="number"
                      value={court.base_fee || ""}
                      onChange={(e) => updateCourt(court.id, "base_fee", Number(e.target.value))}
                      placeholder="구장료"
                      className="w-20 text-xs border border-[#E3E6EC] rounded-lg px-2 py-1 focus:outline-none focus:border-[#1C5DFF] text-right"
                    />
                    <span className="text-[10px] text-[#9CA3AF]">원</span>
                    <button type="button" onClick={() => removeCourt(court.id)} className="text-[#EF4444] text-xs font-bold ml-1">✕</button>
                  </div>
                  {/* 정산율 테이블 */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px] border-collapse min-w-[420px]">
                      <thead>
                        <tr className="bg-[#F9FAFB]">
                          <th className="px-2 py-1.5 text-left text-[#9CA3AF] border-b border-[#E3E6EC] w-10">시간</th>
                          {DAYS.map((d) => (
                            <th key={d} className="px-1 py-1.5 text-center text-[#374151] font-semibold border-b border-[#E3E6EC]">{DAY_LABELS[d]}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {HOURS.map((h) => (
                          <tr key={h} className="even:bg-[#F9FAFB]">
                            <td className="px-2 py-1 text-[#6b7280] border-b border-[#F3F4F6] whitespace-nowrap font-medium">{h}시</td>
                            {DAYS.map((d) => (
                              <td key={d} className="px-0.5 py-0.5 border-b border-[#F3F4F6]">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={court.rates?.[d]?.[h] ?? ""}
                                  onChange={(e) => updateRate(court.id, d, h, e.target.value)}
                                  className="w-full text-center text-[10px] border border-transparent rounded focus:border-[#1C5DFF] focus:outline-none py-0.5 bg-transparent focus:bg-white"
                                  placeholder="-"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {editSections.map((s, i) => {
                const label = ALL_SECTIONS.find((a) => a.key === s.key)?.label || s.key;
                const isDone = completed.includes(s.key);
                return (
                  <label
                    key={s.key}
                    draggable
                    onDragStart={() => setDragIdx(i)}
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={() => {
                      if (dragIdx === null || dragIdx === i) return;
                      const next = [...editSections];
                      const [moved] = next.splice(dragIdx, 1);
                      next.splice(i, 0, moved);
                      setEditSections(next);
                      setDragIdx(null);
                    }}
                    onDragEnd={() => setDragIdx(null)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors cursor-grab active:cursor-grabbing ${
                      dragIdx === i ? "opacity-40" : ""
                    } ${s.enabled ? "border-[#1C5DFF] bg-[#EEF3FF]" : "border-[#E3E6EC] bg-[#F9FAFB]"}`}
                  >
                    <span className="text-[#9CA3AF] text-sm select-none">⠿</span>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={`text-sm font-medium ${s.enabled ? "text-[#1C5DFF]" : "text-[#9CA3AF]"}`}>{label}</span>
                      {isDone && <span className="text-xs bg-[#DCFCE7] text-[#16A34A] px-2 py-0.5 rounded-full font-semibold">완료됨</span>}
                    </div>
                    <input
                      type="checkbox"
                      checked={s.enabled}
                      onChange={() => toggleSection(s.key)}
                      className="w-4 h-4 accent-[#1C5DFF] shrink-0"
                    />
                  </label>
                );
              })}
            </div>

            <button
              type="button"
              onClick={saveSections}
              disabled={sectionSaving}
              className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-colors"
              style={{ background: sectionSaved ? "#22c55e" : "#1C5DFF" }}
            >
              {sectionSaving ? "저장 중…" : sectionSaved ? "저장됨!" : "저장 및 반영"}
            </button>
          </div>


          {/* 구장 상세 (venue_detail 완료 시) */}
          {completed.includes("venue_detail") && (
            <div className="bg-white border border-[#E3E6EC] rounded-2xl shadow-sm p-6 space-y-5">
              <h2 className="text-sm font-semibold text-[#111827]">구장 상세 정보</h2>

              {/* 운영 현황 */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">운영 현황</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <InfoRow label="운영 상태" value={data.operating_status} />
                  <InfoRow label="면 수" value={data.facility_count?.toString()} />
                  <InfoRow label="규격/실내외" value={data.size_info} />
                  <InfoRow label="희망 서비스" value={(data.service_types || []).map((s) => s === "social_match" ? "소셜 매치" : s === "rental" ? "구장 예약" : s).join(", ")} />
                </div>
                {data.notice && <div><p className="text-xs text-[#9CA3AF]">공지사항</p><p className="text-sm text-[#374151] mt-0.5 whitespace-pre-wrap">{data.notice}</p></div>}
              </div>

              {/* 주차 */}
              <div className="space-y-2 border-t border-[#F3F4F6] pt-4">
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">주차</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <InfoRow label="주차 가능" value={data.parking_available} />
                  <InfoRow label="무료 주차" value={data.parking_free === null || data.parking_free === undefined ? undefined : data.parking_free ? "예" : "아니오"} />
                  <InfoRow label="주차 대수" value={data.parking_count?.toString()} />
                  <InfoRow label="주차 요금" value={data.parking_fee} />
                  <InfoRow label="주차 등록 연락처" value={data.parking_contact} />
                </div>
              </div>

              {/* 편의시설 */}
              <div className="space-y-2 border-t border-[#F3F4F6] pt-4">
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">편의시설</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <InfoRow label="샤워장" value={data.shower_available} />
                  <InfoRow label="샤워 메모" value={data.shower_memo} />
                  <InfoRow label="풋살화 대여" value={data.shoes_available} />
                  <InfoRow label="풋살화 메모" value={data.shoes_memo} />
                  <InfoRow label="화장실" value={data.toilet_type} />
                  <InfoRow label="화장실 메모" value={data.toilet_memo} />
                  <InfoRow label="음료 판매" value={data.drinks_available} />
                  <InfoRow label="음료 메모" value={data.drinks_memo} />
                  <InfoRow label="조끼 제공" value={data.vest_available === null || data.vest_available === undefined ? undefined : data.vest_available ? "예" : "아니오"} />
                  <InfoRow label="조끼 메모" value={data.vest_memo} />
                  <InfoRow label="공 제공" value={data.ball_available === null || data.ball_available === undefined ? undefined : data.ball_available ? "예" : "아니오"} />
                  <InfoRow label="공 메모" value={data.ball_memo} />
                </div>
              </div>

              {/* 소셜매치 */}
              <div className="space-y-2 border-t border-[#F3F4F6] pt-4">
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">소셜매치</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <InfoRow label="소셜매치 특이사항" value={data.social_special} />
                  <InfoRow label="소셜매치 알림톡" value={data.social_message} />
                  <InfoRow label="매니저 특이사항" value={data.manager_note} />
                </div>
                {data.hoped_times_note && <div><p className="text-xs text-[#9CA3AF]">운영 불가 시간</p><p className="text-sm text-[#374151] mt-0.5 whitespace-pre-wrap">{data.hoped_times_note}</p></div>}
              </div>

              {/* 대관 */}
              <div className="space-y-2 border-t border-[#F3F4F6] pt-4">
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">대관</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <InfoRow label="대관 특이사항" value={data.rental_note} />
                  <InfoRow label="꼭 지켜주세요" value={data.rental_warning} />
                  <InfoRow label="구장 예약 알림톡" value={data.rental_message} />
                </div>
              </div>
            </div>
          )}

          {/* 서류 (documents 완료 시) */}
          {completed.includes("documents") && data.document_urls && (
            <div className="bg-white border border-[#E3E6EC] rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-semibold text-[#111827]">제출 서류</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "business_registration", label: "사업자등록증" },
                  { key: "bankbook", label: "통장 사본" },
                  { key: "lease_contract", label: "임대차 계약서" },
                ].map(({ key, label }) => {
                  const url = data.document_urls?.[key];
                  return (
                    <div key={key} className="border border-[#E3E6EC] rounded-xl p-3 space-y-2">
                      <p className="text-xs text-[#6b7280]">{label}</p>
                      {url ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={label} className="w-full h-20 object-cover rounded-lg cursor-pointer border border-[#E3E6EC]" onClick={() => setPreviewImage(url)} />
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1C5DFF]">원본 보기</a>
                        </>
                      ) : (
                        <p className="text-xs text-[#9CA3AF]">없음</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 사진 (photos 완료 시) */}
          {completed.includes("photos") && data.photo_urls && data.photo_urls.length > 0 && (
            <div className="bg-white border border-[#E3E6EC] rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-semibold text-[#111827]">구장 사진 ({data.photo_urls.length}장)</h2>
              <div className="grid grid-cols-3 gap-2">
                {data.photo_urls.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt={`사진 ${i + 1}`}
                    className="aspect-square object-cover rounded-lg border border-[#E3E6EC] cursor-pointer"
                    onClick={() => setPreviewImage(url)}
                  />
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-center text-[#9CA3AF]">
            마지막 업데이트: {data.updated_at ? new Date(data.updated_at).toLocaleString("ko-KR") : "-"}
          </p>
        </div>
      </main>

      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setPreviewImage(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#111827]">원본 보기</span>
              <button type="button" onClick={() => setPreviewImage(null)} className="text-[#6b7280] text-sm px-2 py-1 rounded-md border border-[#E3E6EC]">닫기</button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewImage} alt="preview" className="w-full max-h-[70vh] object-contain rounded-lg border border-[#E3E6EC]" />
          </div>
        </div>
      )}
    </>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-[#9CA3AF]">{label}</p>
      <p className="text-sm text-[#374151] font-medium">{value || "-"}</p>
    </div>
  );
}
