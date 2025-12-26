"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { OnboardingState, statusToPath } from "@/lib/onboarding";

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
  size_x?: number | null;
  size_y?: number | null;
  floor_type?: string;
  indoor_outdoor?: string;
  sort_order?: number;
};

export default function Step2Page() {
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [stadium, setStadium] = useState<StadiumInfo>({});
  const [courts, setCourts] = useState<CourtInfo[]>([{ court_name: "", size_x: null, size_y: null, floor_type: "", indoor_outdoor: "" }]);
  const [status, setStatus] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!id) throw new Error("유효하지 않은 경로입니다.");
        const res = await fetch(`/api/onboarding/${id}/step2`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "불러오기 실패");
        if (!mounted) return;
        setStatus(json.step_status);
        setStadium(json.stadium || {});
        setCourts((prev) => {
          if (json.courts?.length) return json.courts;
          return prev && Array.isArray(prev) && prev.length
            ? prev
            : [{ court_name: "", size_x: null, size_y: null, floor_type: "", indoor_outdoor: "" }];
        });
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

  const statusLabel = "구장 정보 입력 대기";
  const nextPath = status ? statusToPath(id, status) : null;
  const showNext = status === "step1_approved" && nextPath && nextPath !== `/onboarding/${id}/step2`;
  const statusMessage = useMemo(() => {
    if (!status) return null;
    if (status === "step1_need_fix") return "담당자가 보완을 요청했습니다. 수정 후 다시 제출해주세요.";
    if (status === "step1_submitted") return "담당자 검토 중입니다.";
    return "구장 정보를 입력하고 제출해주세요.";
  }, [status]);

  const handleStadium = (key: keyof StadiumInfo, value: any) => setStadium((prev) => ({ ...prev, [key]: value }));
  const updateCourt = (idx: number, key: keyof CourtInfo, value: any) =>
    setCourts((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });

  const addCourt = () => setCourts((prev) => [...prev, { court_name: "", size_x: null, size_y: null, floor_type: "", indoor_outdoor: "" }]);
  const removeCourt = (idx: number) =>
    setCourts((prev) => {
      if (prev.length <= 1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });

  const save = async (submit: boolean) => {
    if (!id) return;
    setError(null);
    setBanner(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/onboarding/${id}/step2`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stadium, courts, submit }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "저장 실패");
      let nextStatus = json.step_status as OnboardingState;

      setStatus(nextStatus);
      setBanner(submit ? "제출되었습니다. 담당자 검토 후 안내됩니다." : "임시 저장 완료");
    } catch (e: any) {
      const msg = e.message ?? "오류가 발생했습니다.";
      if (msg.includes("invalid_phone")) {
        setError("구장 연락처 입력이 필요합니다.");
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm">불러오는 중…</div>;
  if (!id) return <div className="p-6 text-sm text-red-600">유효하지 않은 경로입니다.</div>;

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <header className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6 space-y-2">
          <h1 className="text-xl font-semibold text-[#111827]">3. 구장 상세 정보 입력</h1>
          <div className="text-xs text-[#6b7280]">
            현재 상태: <span className="text-[#1C5DFF] font-semibold">{statusLabel}</span>
          </div>
          {statusMessage && <div className="bg-blue-50 text-[#1C5DFF] text-sm px-3 py-2 rounded-lg">{statusMessage}</div>}
        </header>

        <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#111827]">구장 기본 정보</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <Input label="지역(시/군)" value={stadium.region || ""} onChange={(v) => handleStadium("region", v)} required />
            <Input label="홈 지역 필터" value={stadium.home_filter_region || ""} onChange={(v) => handleStadium("home_filter_region", v)} />
            <Input label="구장명" value={stadium.stadium_name || ""} onChange={(v) => handleStadium("stadium_name", v)} required />
            <Input label="구장 유형" value={stadium.stadium_type || ""} onChange={(v) => handleStadium("stadium_type", v)} placeholder="예: 실내, 실외" />
            <Input label="주소" value={stadium.address || ""} onChange={(v) => handleStadium("address", v)} required />
            <Input label="상세 주소" value={stadium.address_detail || ""} onChange={(v) => handleStadium("address_detail", v)} />
            <Input label="구장 연락처" value={stadium.stadium_contact || ""} onChange={(v) => handleStadium("stadium_contact", v)} required />
            <div className="md:col-span-2 text-xs text-[#6b7280]">
              구장·매치 안내가 필요한 모든 전화번호를 기입해주세요.
            </div>
            <Input label="런드리 연락처" value={stadium.laundry_contact || ""} onChange={(v) => handleStadium("laundry_contact", v)} />
            <Toggle label="인조잔디 여부" checked={!!stadium.artificial_grass} onChange={(v) => handleStadium("artificial_grass", v)} />
          </div>
        </section>

        <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6 space-y-3">
          <h2 className="text-lg font-semibold text-[#111827]">계정용 이메일</h2>
          <p className="text-sm text-[#6b7280]">구장주 사이트 접속 계정 발급에 사용됩니다.</p>
          <div className="grid md:grid-cols-2 gap-3">
            <Input
              label="계정 이메일"
              value={stadium.account_email || ""}
              onChange={(v) => handleStadium("account_email", v)}
              placeholder="예: owner@example.com"
            />
          </div>
        </section>

        <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#111827]">공통 정보</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <Toggle label="주차 가능" checked={!!stadium.parking_available} onChange={(v) => handleStadium("parking_available", v)} />
            <Toggle label="무료 주차" checked={!!stadium.parking_free} onChange={(v) => handleStadium("parking_free", v)} />
            <Input label="무료 주차 대수" value={stadium.parking_count ?? ""} onChange={(v) => handleStadium("parking_count", Number(v) || null)} />
            <Input label="주차 등록 연락처" value={stadium.parking_contact || ""} onChange={(v) => handleStadium("parking_contact", v)} />
            <Input label="주차 요금" value={stadium.parking_fee || ""} onChange={(v) => handleStadium("parking_fee", v)} />
            <Toggle label="샤워장" checked={!!stadium.shower_available} onChange={(v) => handleStadium("shower_available", v)} />
            <Input label="샤워 메모" value={stadium.shower_memo || ""} onChange={(v) => handleStadium("shower_memo", v)} />
            <Toggle label="풋살화 대여" checked={!!stadium.shoes_available} onChange={(v) => handleStadium("shoes_available", v)} />
            <Input label="풋살화 메모" value={stadium.shoes_memo || ""} onChange={(v) => handleStadium("shoes_memo", v)} />
            <Toggle label="화장실" checked={!!stadium.toilet_available} onChange={(v) => handleStadium("toilet_available", v)} />
            <Input label="화장실 메모" value={stadium.toilet_memo || ""} onChange={(v) => handleStadium("toilet_memo", v)} />
            <Toggle label="음료" checked={!!stadium.drinks_available} onChange={(v) => handleStadium("drinks_available", v)} />
            <Input label="음료 메모" value={stadium.drinks_memo || ""} onChange={(v) => handleStadium("drinks_memo", v)} />
          </div>
        </section>

        <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#111827]">소셜 매치 정보</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <Input label="소셜매치 특이사항" value={stadium.social_special || ""} onChange={(v) => handleStadium("social_special", v)} />
            <Input label="소셜매치 알림톡" value={stadium.social_message || ""} onChange={(v) => handleStadium("social_message", v)} />
            <Input label="매니저 특이사항" value={stadium.manager_note || ""} onChange={(v) => handleStadium("manager_note", v)} />
          </div>
        </section>

        <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#111827]">구장 예약 정보</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <Input label="대관 특이사항" value={stadium.rental_note || ""} onChange={(v) => handleStadium("rental_note", v)} />
            <Input label="꼭 지켜주세요" value={stadium.rental_warning || ""} onChange={(v) => handleStadium("rental_warning", v)} />
            <Input label="구장 예약 알림톡" value={stadium.rental_message || ""} onChange={(v) => handleStadium("rental_message", v)} />
            <Toggle label="조끼 제공" checked={!!stadium.vest_available} onChange={(v) => handleStadium("vest_available", v)} />
            <Input label="조끼 메모" value={stadium.vest_memo || ""} onChange={(v) => handleStadium("vest_memo", v)} />
            <Toggle label="공 제공" checked={!!stadium.ball_available} onChange={(v) => handleStadium("ball_available", v)} />
            <Input label="공 메모" value={stadium.ball_memo || ""} onChange={(v) => handleStadium("ball_memo", v)} />
          </div>
        </section>

        <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#111827]">면 정보</h2>
          <p className="text-sm text-[#6b7280]">최소 1개 이상 등록을 권장합니다.</p>
          <div className="space-y-3">
            {courts.map((c, idx) => (
              <div key={idx} className="border border-[#E3E6EC] rounded-lg p-4 space-y-2 bg-[#F9FAFB]">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">면 {idx + 1}</span>
                  {courts.length > 1 && (
                    <button onClick={() => removeCourt(idx)} className="text-red-500 text-xs font-semibold">
                      삭제
                    </button>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <Input label="면 이름" value={c.court_name || ""} onChange={(v) => updateCourt(idx, "court_name", v)} />
                  <Input label="면 가로 길이 (예: 40m)" value={c.size_x ?? ""} onChange={(v) => updateCourt(idx, "size_x", Number(v) || null)} />
                  <Input label="면 세로 길이 (예: 20m)" value={c.size_y ?? ""} onChange={(v) => updateCourt(idx, "size_y", Number(v) || null)} />
                  <Input label="구장유형(예: 잔디, 인도어)" value={c.floor_type || ""} onChange={(v) => updateCourt(idx, "floor_type", v)} />
                  <Input label="실내/실외" value={c.indoor_outdoor || ""} onChange={(v) => updateCourt(idx, "indoor_outdoor", v)} />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addCourt}
            className="px-3 py-2 rounded border border-[#1C5DFF] text-[#1C5DFF] text-sm font-semibold"
          >
            면 추가
          </button>
        </section>

        <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6 space-y-3">
          <h2 className="text-lg font-semibold text-[#111827]">희망 운영 시간</h2>
          <p className="text-sm text-[#6b7280]">요일/시간대를 자유롭게 적어주세요. 예) 평일 18~22시 운영 가능</p>
          <textarea
            value={stadium.hoped_times_note || ""}
            onChange={(e) => handleStadium("hoped_times_note", e.target.value)}
            className="w-full min-h-[120px] border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm"
            placeholder="예: 월~금 18~22시, 토/일 14~20시 운영 가능"
          />
        </section>

        {banner && <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg text-sm">{banner}</div>}
        {error && <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => save(false)}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-[#1C5DFF] text-[#1C5DFF] font-semibold"
          >
            임시 저장
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-white font-semibold"
            style={{ background: "#1C5DFF" }}
          >
            {saving ? "제출 중..." : "제출하기"}
          </button>
        </div>

        <nav className="flex items-center justify-between">
          <Link
            href={id ? `/onboarding/${id}/step1` : "/onboarding"}
            className="px-4 py-2 rounded-lg border border-[#E3E6EC] text-[#6b7280]"
          >
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

function Input({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: any;
  onChange: (v: any) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-[#1C1E26]">
      <span>
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm"
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-[#1C1E26]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
