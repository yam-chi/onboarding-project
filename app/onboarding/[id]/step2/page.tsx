"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { OnboardingState, statusToPath } from "@/lib/onboarding";

const REGION_OPTIONS = [
  "서울 강남구",
  "서울 강동구",
  "서울 강북구",
  "서울 강서구",
  "서울 관악구",
  "서울 광진구",
  "서울 구로구",
  "서울 금천구",
  "서울 노원구",
  "서울 도봉구",
  "서울 동대문구",
  "서울 동작구",
  "서울 마포구",
  "서울 서대문구",
  "서울 서초구",
  "서울 성동구",
  "서울 성북구",
  "서울 송파구",
  "서울 양천구",
  "서울 영등포구",
  "서울 용산구",
  "서울 은평구",
  "서울 종로구",
  "서울 중구",
  "서울 중랑구",
  "경기 수원시",
  "경기 성남시",
  "경기 고양시",
  "경기 용인시",
  "경기 부천시",
  "경기 안양시",
  "경기 안산시",
  "경기 남양주시",
  "경기 화성시",
  "경기 평택시",
  "경기 의정부시",
  "경기 파주시",
  "경기 광주시",
  "경기 김포시",
  "경기 광명시",
  "경기 군포시",
  "경기 시흥시",
  "경기 오산시",
  "경기 하남시",
  "경기 이천시",
  "경기 안성시",
  "경기 구리시",
  "경기 포천시",
  "경기 양주시",
  "경기 동두천시",
  "경기 과천시",
  "경기 가평군",
  "경기 연천군",
  "경기 양평군",
  "경기 여주시",
  "인천 중구",
  "인천 동구",
  "인천 미추홀구",
  "인천 연수구",
  "인천 남동구",
  "인천 부평구",
  "인천 계양구",
  "인천 서구",
  "인천 강화군",
  "인천 옹진군",
  "부산 중구",
  "부산 서구",
  "부산 동구",
  "부산 영도구",
  "부산 부산진구",
  "부산 동래구",
  "부산 남구",
  "부산 북구",
  "부산 해운대구",
  "부산 사하구",
  "부산 금정구",
  "부산 강서구",
  "부산 연제구",
  "부산 수영구",
  "부산 사상구",
  "부산 기장군",
  "대구 중구",
  "대구 동구",
  "대구 서구",
  "대구 남구",
  "대구 북구",
  "대구 수성구",
  "대구 달서구",
  "대구 달성군",
  "광주 동구",
  "광주 서구",
  "광주 남구",
  "광주 북구",
  "광주 광산구",
  "대전 동구",
  "대전 중구",
  "대전 서구",
  "대전 유성구",
  "대전 대덕구",
  "울산 중구",
  "울산 남구",
  "울산 동구",
  "울산 북구",
  "울산 울주군",
  "세종",
  "강원 춘천시",
  "강원 원주시",
  "강원 강릉시",
  "강원 동해시",
  "강원 태백시",
  "강원 속초시",
  "강원 삼척시",
  "강원 홍천군",
  "강원 횡성군",
  "강원 영월군",
  "강원 평창군",
  "강원 정선군",
  "강원 철원군",
  "강원 화천군",
  "강원 양구군",
  "강원 인제군",
  "강원 고성군",
  "강원 양양군",
  "충북 청주시",
  "충북 충주시",
  "충북 제천시",
  "충북 보은군",
  "충북 옥천군",
  "충북 영동군",
  "충북 증평군",
  "충북 진천군",
  "충북 괴산군",
  "충북 음성군",
  "충북 단양군",
  "충남 천안시",
  "충남 공주시",
  "충남 보령시",
  "충남 아산시",
  "충남 서산시",
  "충남 논산시",
  "충남 계룡시",
  "충남 당진시",
  "충남 금산군",
  "충남 부여군",
  "충남 서천군",
  "충남 청양군",
  "충남 홍성군",
  "충남 예산군",
  "충남 태안군",
  "전북 전주시",
  "전북 군산시",
  "전북 익산시",
  "전북 정읍시",
  "전북 남원시",
  "전북 김제시",
  "전북 완주군",
  "전북 진안군",
  "전북 무주군",
  "전북 장수군",
  "전북 임실군",
  "전북 순창군",
  "전북 고창군",
  "전북 부안군",
  "전남 목포시",
  "전남 여수시",
  "전남 순천시",
  "전남 나주시",
  "전남 광양시",
  "전남 담양군",
  "전남 곡성군",
  "전남 구례군",
  "전남 고흥군",
  "전남 보성군",
  "전남 화순군",
  "전남 장흥군",
  "전남 강진군",
  "전남 해남군",
  "전남 영암군",
  "전남 무안군",
  "전남 함평군",
  "전남 영광군",
  "전남 장성군",
  "전남 완도군",
  "전남 진도군",
  "전남 신안군",
  "경북 포항시",
  "경북 경주시",
  "경북 김천시",
  "경북 안동시",
  "경북 구미시",
  "경북 영주시",
  "경북 영천시",
  "경북 상주시",
  "경북 문경시",
  "경북 경산시",
  "경북 군위군",
  "경북 의성군",
  "경북 청송군",
  "경북 영양군",
  "경북 영덕군",
  "경북 청도군",
  "경북 고령군",
  "경북 성주군",
  "경북 칠곡군",
  "경북 예천군",
  "경북 봉화군",
  "경북 울진군",
  "경북 울릉군",
  "경남 창원시",
  "경남 진주시",
  "경남 통영시",
  "경남 사천시",
  "경남 김해시",
  "경남 밀양시",
  "경남 거제시",
  "경남 양산시",
  "경남 의령군",
  "경남 함안군",
  "경남 창녕군",
  "경남 고성군",
  "경남 남해군",
  "경남 하동군",
  "경남 산청군",
  "경남 함양군",
  "경남 거창군",
  "경남 합천군",
  "제주 제주시",
  "제주 서귀포시",
];

type StadiumInfo = {
  region?: string;
  home_filter_region?: string;
  stadium_name?: string;
  address?: string;
  address_detail?: string;
  account_email?: string;
  stadium_type?: string;
  indoor_outdoor?: string;
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
    return "아래 정보를 모두 입력하고 제출해주세요.";
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
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold text-[#111827]">3. 구장 상세 정보 입력</h1>
            <Link
              href="/"
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-[#E3E6EC] text-sm font-semibold text-[#374151]"
            >
              로그아웃
            </Link>
          </div>
          <div className="text-xs text-[#6b7280]">
            현재 상태: <span className="text-[#1C5DFF] font-semibold">{statusLabel}</span>
          </div>
          {statusMessage && <div className="bg-blue-50 text-[#1C5DFF] text-sm px-3 py-2 rounded-lg">{statusMessage}</div>}
        </header>

        <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6 space-y-3">
          <h2 className="text-lg font-semibold text-[#111827]">계정용 이메일</h2>
          <p className="text-sm text-[#6b7280]">구장주 사이트 접속 계정 발급에 사용됩니다.</p>
          <div className="flex flex-col gap-3 max-w-[420px]">
            <Input
              label="계정 이메일"
              value={stadium.account_email || ""}
              onChange={(v) => handleStadium("account_email", v)}
              placeholder="예: owner@example.com"
            />
          </div>
        </section>

        <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6">
          <p className="text-sm text-[#4b5563] leading-6">
            아래에 입력하는 내용은 홈페이지에 노출되는 구장 정보입니다.
            <br />
            최초 등록 후에도 수정 가능합니다.
          </p>
        </section>

        <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#111827]">구장 기본 정보</h2>
          <div className="flex flex-col gap-3 max-w-[420px]">
            <Select
              label="지역(시/군)"
              value={stadium.region || ""}
              onChange={(v) => handleStadium("region", v)}
              options={REGION_OPTIONS}
              placeholder="시/군/구 선택"
              required
            />
            <Input label="구장명" value={stadium.stadium_name || ""} onChange={(v) => handleStadium("stadium_name", v)} required />
            <Input label="주소" value={stadium.address || ""} onChange={(v) => handleStadium("address", v)} required />
            <Select
              label="구장 유형"
              value={stadium.stadium_type || ""}
              onChange={(v) => handleStadium("stadium_type", v)}
              options={["인조잔디", "천연잔디", "인도어", "모래", "마루", "플라스틱"]}
              placeholder="선택하세요"
            />
            <Select
              label="실내/실외"
              value={stadium.indoor_outdoor || ""}
              onChange={(v) => handleStadium("indoor_outdoor", v)}
              options={["실외", "실내"]}
              placeholder="선택하세요"
            />
            <label className="flex flex-col gap-1 text-sm text-[#1C1E26] max-w-[420px]">
              <div className="flex items-center justify-between gap-2">
                <span>
                  구장 연락처 <span className="text-red-500">*</span>
                </span>
                <span className="text-xs text-[#6b7280]">
                  구장·매치 안내가 필요한 모든 전화번호를 기입해주세요.
                </span>
              </div>
              <input
                value={stadium.stadium_contact || ""}
                onChange={(e) => handleStadium("stadium_contact", e.target.value)}
                className="border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <Input label="런드리 연락처" value={stadium.laundry_contact || ""} onChange={(v) => handleStadium("laundry_contact", v)} />
          </div>
        </section>

        <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#111827]">공통 정보</h2>
          <div className="flex flex-col gap-3 max-w-[420px]">
            <Input
              label="공지사항"
              value={stadium.notice || ""}
              onChange={(v) => handleStadium("notice", v)}
              help={"구장 페이지 상단(구장명 아래)에만 노출됩니다.\n소셜 매치 신청 페이지에는 노출되지 않습니다."}
            />
            <Select
              label="주차 가능"
              value={
                stadium.parking_available === true
                  ? "예"
                  : stadium.parking_available === false
                    ? "아니오"
                    : ""
              }
              onChange={(v) =>
                handleStadium(
                  "parking_available",
                  v === "" ? null : v === "예",
                )
              }
              options={["예", "아니오"]}
              placeholder="선택하세요"
            />
            <Select
              label="무료 주차"
              value={stadium.parking_free === true ? "예" : stadium.parking_free === false ? "아니오" : ""}
              onChange={(v) =>
                handleStadium(
                  "parking_free",
                  v === "" ? null : v === "예",
                )
              }
              options={["예", "아니오"]}
              placeholder="선택하세요"
            />
            <Input
              label="무료 주차 대수"
              value={stadium.parking_count ?? ""}
              onChange={(v) => handleStadium("parking_count", Number(v) || null)}
              help={"주차 어려움이 없다면 0으로 적어주세요."}
            />
            <Input label="주차 등록 연락처" value={stadium.parking_contact || ""} onChange={(v) => handleStadium("parking_contact", v)} />
            <Input label="주차 요금" value={stadium.parking_fee || ""} onChange={(v) => handleStadium("parking_fee", v)} />
            <div className="grid md:grid-cols-[30%_70%] gap-3">
              <Select
                label="샤워장"
                value={stadium.shower_available === true ? "예" : stadium.shower_available === false ? "아니오" : ""}
                onChange={(v) => handleStadium("shower_available", v === "" ? null : v === "예")}
                options={["예", "아니오"]}
                placeholder="선택하세요"
              />
              <Input
                label="샤워 메모"
                value={stadium.shower_memo || ""}
                onChange={(v) => handleStadium("shower_memo", v)}
                help={"클릭 시 표시되는 짧은 안내입니다. 한 문장으로 적어주세요."}
              />
            </div>
            <div className="grid md:grid-cols-[30%_70%] gap-3">
              <Select
                label="풋살화 대여"
                value={stadium.shoes_available === true ? "예" : stadium.shoes_available === false ? "아니오" : ""}
                onChange={(v) => handleStadium("shoes_available", v === "" ? null : v === "예")}
                options={["예", "아니오"]}
                placeholder="선택하세요"
              />
              <Input
                label="풋살화 메모"
                value={stadium.shoes_memo || ""}
                onChange={(v) => handleStadium("shoes_memo", v)}
                help={"클릭 시 표시되는 짧은 안내입니다. 한 문장으로 적어주세요."}
              />
            </div>
            <div className="grid md:grid-cols-[30%_70%] gap-3">
              <Select
                label="화장실"
                value={stadium.toilet_available === true ? "예" : stadium.toilet_available === false ? "아니오" : ""}
                onChange={(v) => handleStadium("toilet_available", v === "" ? null : v === "예")}
                options={["예", "아니오"]}
                placeholder="선택하세요"
              />
              <Input
                label="화장실 메모"
                value={stadium.toilet_memo || ""}
                onChange={(v) => handleStadium("toilet_memo", v)}
                help={"클릭 시 표시되는 짧은 안내입니다. 한 문장으로 적어주세요."}
              />
            </div>
            <div className="grid md:grid-cols-[30%_70%] gap-3">
              <Select
                label="음료"
                value={stadium.drinks_available === true ? "예" : stadium.drinks_available === false ? "아니오" : ""}
                onChange={(v) => handleStadium("drinks_available", v === "" ? null : v === "예")}
                options={["예", "아니오"]}
                placeholder="선택하세요"
              />
              <Input
                label="음료 메모"
                value={stadium.drinks_memo || ""}
                onChange={(v) => handleStadium("drinks_memo", v)}
                help={"클릭 시 표시되는 짧은 안내입니다. 한 문장으로 적어주세요."}
              />
            </div>
          </div>
        </section>

        <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#111827]">소셜 매치 정보</h2>
          <div className="flex flex-col gap-3 max-w-[420px]">
            <Input
              label="소셜매치 특이사항"
              value={stadium.social_special || ""}
              onChange={(v) => handleStadium("social_special", v)}
              help={"소셜 신청 페이지에만 노출됩니다."}
            />
            <Input label="소셜매치 알림톡" value={stadium.social_message || ""} onChange={(v) => handleStadium("social_message", v)} />
            <Input label="매니저 특이사항" value={stadium.manager_note || ""} onChange={(v) => handleStadium("manager_note", v)} />
          </div>
        </section>

        <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#111827]">구장 예약 정보</h2>
          <div className="flex flex-col gap-3 max-w-[420px]">
            <Input label="대관 특이사항" value={stadium.rental_note || ""} onChange={(v) => handleStadium("rental_note", v)} />
            <Input label="꼭 지켜주세요" value={stadium.rental_warning || ""} onChange={(v) => handleStadium("rental_warning", v)} />
            <Input label="구장 예약 알림톡" value={stadium.rental_message || ""} onChange={(v) => handleStadium("rental_message", v)} />
            <div className="grid md:grid-cols-[30%_70%] gap-3">
              <Select
                label="조끼 제공"
                value={stadium.vest_available === true ? "예" : stadium.vest_available === false ? "아니오" : ""}
                onChange={(v) => handleStadium("vest_available", v === "" ? null : v === "예")}
                options={["예", "아니오"]}
                placeholder="선택하세요"
              />
              <Input
                label="조끼 메모"
                value={stadium.vest_memo || ""}
                onChange={(v) => handleStadium("vest_memo", v)}
                help={"클릭 시 표시되는 짧은 안내입니다. 한 문장으로 적어주세요."}
              />
            </div>
            <div className="grid md:grid-cols-[30%_70%] gap-3">
              <Select
                label="공 제공"
                value={stadium.ball_available === true ? "예" : stadium.ball_available === false ? "아니오" : ""}
                onChange={(v) => handleStadium("ball_available", v === "" ? null : v === "예")}
                options={["예", "아니오"]}
                placeholder="선택하세요"
              />
              <Input
                label="공 메모"
                value={stadium.ball_memo || ""}
                onChange={(v) => handleStadium("ball_memo", v)}
                help={"클릭 시 표시되는 짧은 안내입니다. 한 문장으로 적어주세요."}
              />
            </div>
          </div>
        </section>

        <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#111827]">면 정보</h2>
          <p className="text-sm text-[#6b7280]">최소 1개 이상 등록을 권장합니다.</p>
          <div className="space-y-3">
            {courts.map((c, idx) => (
              <div key={idx} className="border border-[#E3E6EC] rounded-lg p-4 space-y-2 bg-[#F9FAFB]">
                <div className="flex items-start justify-between gap-3 text-sm">
                  <Input label={`면 ${idx + 1} 이름`} value={c.court_name || ""} onChange={(v) => updateCourt(idx, "court_name", v)} />
                  {courts.length > 1 && (
                    <button onClick={() => removeCourt(idx)} className="text-red-500 text-xs font-semibold mt-6">
                      삭제
                    </button>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-3">
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

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
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
            {saving ? "제출 중..." : status === "step1_submitted" ? "수정하기" : "제출하기"}
          </button>
          </div>
          <div className="flex flex-wrap gap-2">
          <Link
            href={id ? `/onboarding/${id}/step1` : "/onboarding"}
            className="px-4 py-2 rounded-lg text-white font-semibold"
            style={{ background: "#1C5DFF" }}
          >
            이전 단계로
          </Link>
          {showNext ? (
            <Link href={nextPath || "#"} className="px-4 py-2 rounded-lg text-white font-semibold" style={{ background: "#1C5DFF" }}>
              다음 단계로 이동
            </Link>
          ) : (
            <button className="px-4 py-2 rounded-lg border border-[#E3E6EC] text-[#6b7280]" disabled>
              담당자 검토 중
            </button>
          )}
          </div>
        </div>
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
  help,
}: {
  label: string;
  value: any;
  onChange: (v: any) => void;
  required?: boolean;
  placeholder?: string;
  help?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-[#1C1E26]">
      <span className="inline-flex items-center gap-1">
        {label} {required && <span className="text-red-500">*</span>}
        {help && (
          <span className="relative inline-flex items-center text-[#9CA3AF] cursor-help group">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-[#D1D5DB] text-[10px]">?</span>
            <span className="pointer-events-none absolute left-5 top-0 translate-y-1 w-64 rounded-md border border-[#E3E6EC] bg-white px-2 py-1 text-[11px] text-[#6b7280] shadow-sm opacity-0 transition-opacity group-hover:opacity-100 whitespace-pre-line">
              {help}
            </span>
          </span>
        )}
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

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-[#1C1E26]">
      <span>
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm bg-white"
      >
        <option value="">{placeholder ?? "선택하세요"}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
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
