"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const REGION_OPTIONS = [
  "서울 강남구","서울 강동구","서울 강북구","서울 강서구","서울 관악구","서울 광진구",
  "서울 구로구","서울 금천구","서울 노원구","서울 도봉구","서울 동대문구","서울 동작구",
  "서울 마포구","서울 서대문구","서울 서초구","서울 성동구","서울 성북구","서울 송파구",
  "서울 양천구","서울 영등포구","서울 용산구","서울 은평구","서울 종로구","서울 중구","서울 중랑구",
  "경기 수원시","경기 성남시","경기 고양시","경기 용인시","경기 부천시","경기 안양시",
  "경기 안산시","경기 남양주시","경기 화성시","경기 평택시","경기 의정부시","경기 시흥시",
  "경기 파주시","경기 김포시","경기 광명시","경기 군포시","경기 오산시","경기 이천시",
  "경기 양주시","경기 광주시","경기 하남시","경기 의왕시","경기 구리시","경기 포천시",
  "경기 안성시","경기 여주시",
  "부산 해운대구","부산 수영구","부산 부산진구","부산 동래구","부산 남구","부산 북구",
  "부산 사상구","부산 사하구","부산 연제구","부산 금정구","부산 중구","부산 서구",
  "부산 동구","부산 강서구","부산 기장군",
  "인천 남동구","인천 부평구","인천 서구","인천 연수구","인천 미추홀구","인천 계양구",
  "인천 중구","인천 동구","인천 강화군","인천 옹진군",
  "대구 수성구","대구 달서구","대구 동구","대구 서구","대구 남구","대구 북구","대구 중구","대구 달성군",
  "대전 서구","대전 유성구","대전 대덕구","대전 중구","대전 동구",
  "광주 서구","광주 북구","광주 남구","광주 동구","광주 광산구",
  "울산 남구","울산 동구","울산 북구","울산 중구","울산 울주군",
  "세종 세종시",
  "강원 춘천시","강원 원주시","강원 강릉시","강원 속초시","강원 동해시","강원 삼척시","강원 태백시",
  "충북 청주시","충북 충주시","충북 제천시",
  "충남 천안시","충남 아산시","충남 서산시","충남 당진시","충남 공주시","충남 논산시","충남 보령시",
  "전북 전주시","전북 익산시","전북 군산시","전북 정읍시","전북 남원시","전북 김제시",
  "전남 목포시","전남 여수시","전남 순천시","전남 나주시","전남 광양시",
  "경북 포항시","경북 구미시","경북 경주시","경북 안동시","경북 김천시","경북 영주시","경북 상주시","경북 문경시",
  "경남 창원시","경남 김해시","경남 진주시","경남 양산시","경남 통영시","경남 거제시","경남 사천시","경남 밀양시",
  "제주 제주시","제주 서귀포시",
];

type CourtInfo = {
  court_name: string;
  size_x: number | null;
  size_y: number | null;
  floor_type: string;
  indoor_outdoor: string;
};

const defaultCourt = (): CourtInfo => ({
  court_name: "",
  size_x: null,
  size_y: null,
  floor_type: "",
  indoor_outdoor: "",
});

export default function ApplyPage() {
  const router = useRouter();

  // 기본 정보
  const [basic, setBasic] = useState({
    stadium_name: "",
    owner_name: "",
    contact: "",
    region: "",
    address: "",
    address_detail: "",
    operating_status: "",
    service_types: [] as string[],
    other_services: "",
    source: "",
    memo: "",
  });

  // 구장 상세
  const [stadium, setStadium] = useState({
    stadium_type: "",
    indoor_outdoor: "",
    parking_available: "",
    parking_free: "",
    parking_count: "",
    parking_contact: "",
    parking_fee: "",
    shower: "",
    shower_memo: "",
    shoe_rental: "",
    shoe_memo: "",
    toilet: "",
    toilet_memo: "",
    beverage: "",
    beverage_memo: "",
    laundry_contact: "",
    notice: "",
    vest_provided: "",
    vest_memo: "",
    ball_provided: "",
    ball_memo: "",
    social_match_note: "",
    rental_note: "",
  });

  // 코트
  const [courts, setCourts] = useState<CourtInfo[]>([defaultCourt()]);

  // 서류
  const [businessFile, setBusinessFile] = useState<File | null>(null);
  const [bankbookFile, setBankbookFile] = useState<File | null>(null);
  const [leaseFile, setLeaseFile] = useState<File | null>(null);
  const [previewUrls, setPreviewUrls] = useState<{ business?: string; bankbook?: string; lease?: string }>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleService = (value: string) => {
    setBasic((prev) => {
      const set = new Set(prev.service_types);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...prev, service_types: Array.from(set) };
    });
  };

  const uploadDoc = async (id: string, docType: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/onboarding/${id}/step3/upload?doc_type=${docType}`, {
      method: "POST",
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "서류 업로드 실패");
    return json.url as string;
  };

  const submit = async () => {
    setError(null);
    if (!basic.stadium_name || !basic.owner_name || !basic.contact || !basic.region || !basic.address) {
      setError("기본 정보의 필수 항목을 모두 입력해주세요.");
      return;
    }
    if (!businessFile || !bankbookFile || !leaseFile) {
      setError("사업자등록증, 통장사본, 부동산/임대차 계약서를 모두 업로드해주세요.");
      return;
    }
    setLoading(true);
    try {
      // 1. 기본 요청 생성
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...basic,
          facility_count: courts.length,
          step_status: "submitted",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "제출 실패");
      const id = json.id;

      // 2. 구장 상세 저장
      const stadiumPayload = {
        ...stadium,
        stadium_name: basic.stadium_name,
        region: basic.region,
        address: basic.address,
        address_detail: basic.address_detail,
        stadium_contact: basic.contact,
        parking_available: stadium.parking_available === "예" ? true : stadium.parking_available === "아니오" ? false : null,
        parking_free: stadium.parking_free === "예" ? true : stadium.parking_free === "아니오" ? false : null,
        parking_count: stadium.parking_count ? Number(stadium.parking_count) : null,
        shower: stadium.shower === "예" ? true : stadium.shower === "아니오" ? false : null,
        shoe_rental: stadium.shoe_rental === "예" ? true : stadium.shoe_rental === "아니오" ? false : null,
        toilet: stadium.toilet === "예" ? true : stadium.toilet === "아니오" ? false : null,
        beverage: stadium.beverage === "예" ? true : stadium.beverage === "아니오" ? false : null,
        vest_provided: stadium.vest_provided === "예" ? true : stadium.vest_provided === "아니오" ? false : null,
        ball_provided: stadium.ball_provided === "예" ? true : stadium.ball_provided === "아니오" ? false : null,
      };

      await fetch(`/api/onboarding/${id}/step2`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stadium: stadiumPayload, courts, submit: false }),
      });

      // 3. 서류 업로드
      const [businessUrl, bankbookUrl, leaseUrl] = await Promise.all([
        uploadDoc(id, "business_registration", businessFile),
        uploadDoc(id, "bankbook", bankbookFile),
        uploadDoc(id, "lease_contract", leaseFile),
      ]);

      await fetch(`/api/onboarding/${id}/step3`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_url: businessUrl,
          bankbook_url: bankbookUrl,
          lease_contract_url: leaseUrl,
          skip_status: true,
        }),
      });

      // 4. 최종 상태 업데이트
      await fetch(`/api/onboarding/${id}/step2`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stadium: stadiumPayload, courts, submit: true }),
      });

      router.push(`/onboarding/complete/${id}`);
    } catch (e: any) {
      setError(e.message ?? "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main className="min-h-screen bg-[#F7F9FC] px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* 헤더 */}
          <div className="flex flex-col items-center gap-1 mb-2">
            <Image src="/plab-logo3.png" alt="PLAB" width={120} height={44} priority />
            <p className="text-xs text-[#9CA3AF]">구장 제휴 요청</p>
          </div>

          {/* 섹션 1: 기본 정보 */}
          <Section title="기본 정보">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="구장명" value={basic.stadium_name} onChange={(v) => setBasic({ ...basic, stadium_name: v })} required />
              <Input label="구장주 성함" value={basic.owner_name} onChange={(v) => setBasic({ ...basic, owner_name: v })} required />
              <Input label="연락처" value={basic.contact} onChange={(v) => setBasic({ ...basic, contact: v })} placeholder="010-0000-0000" required />
              <Select label="지역" value={basic.region} onChange={(v) => setBasic({ ...basic, region: v })} options={REGION_OPTIONS} placeholder="시/군/구 선택" required />
              <Input label="주소" value={basic.address} onChange={(v) => setBasic({ ...basic, address: v })} required />
              <Input label="상세 주소" value={basic.address_detail} onChange={(v) => setBasic({ ...basic, address_detail: v })} />
              <Input label="운영 상태" value={basic.operating_status} onChange={(v) => setBasic({ ...basic, operating_status: v })} placeholder="시공 예정 / 운영중 등" />
              <Input label="플랩 외 사용 중 서비스" value={basic.other_services} onChange={(v) => setBasic({ ...basic, other_services: v })} />
              <Input label="유입 경로" value={basic.source} onChange={(v) => setBasic({ ...basic, source: v })} />
            </div>
            <div className="space-y-2 mt-1">
              <p className="text-sm text-[#374151] font-medium">희망 제휴 서비스</p>
              <div className="flex gap-4">
                {[{ label: "소셜 매치", value: "social_match" }, { label: "구장 예약", value: "rental" }].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={basic.service_types.includes(opt.value)} onChange={() => toggleService(opt.value)} className="accent-[#1C5DFF]" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1 mt-1">
              <p className="text-sm text-[#374151] font-medium">기타 내용</p>
              <textarea
                value={basic.memo}
                onChange={(e) => setBasic({ ...basic, memo: e.target.value })}
                className="w-full border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm"
                rows={2}
                placeholder="없으면 비워두세요."
              />
            </div>
          </Section>

          {/* 섹션 2: 구장 상세 */}
          <Section title="구장 상세 정보">
            <div className="grid sm:grid-cols-2 gap-3">
              <Select label="구장 유형" value={stadium.stadium_type} onChange={(v) => setStadium({ ...stadium, stadium_type: v })} options={["풋살장", "축구장", "족구장", "기타"]} />
              <Select label="실내/실외" value={stadium.indoor_outdoor} onChange={(v) => setStadium({ ...stadium, indoor_outdoor: v })} options={["실내", "실외", "혼합"]} />
              <Select label="주차 가능" value={stadium.parking_available} onChange={(v) => setStadium({ ...stadium, parking_available: v })} options={["예", "아니오"]} />
              <Select label="무료 주차" value={stadium.parking_free} onChange={(v) => setStadium({ ...stadium, parking_free: v })} options={["예", "아니오"]} />
              <Input label="주차 대수" value={stadium.parking_count} onChange={(v) => setStadium({ ...stadium, parking_count: v })} placeholder="예: 10" />
              <Input label="주차 등록 연락처" value={stadium.parking_contact} onChange={(v) => setStadium({ ...stadium, parking_contact: v })} />
              <Input label="주차 요금" value={stadium.parking_fee} onChange={(v) => setStadium({ ...stadium, parking_fee: v })} />
              <Input label="런드리 연락처" value={stadium.laundry_contact} onChange={(v) => setStadium({ ...stadium, laundry_contact: v })} />
              <Select label="샤워장" value={stadium.shower} onChange={(v) => setStadium({ ...stadium, shower: v })} options={["예", "아니오"]} />
              <Input label="샤워 메모" value={stadium.shower_memo} onChange={(v) => setStadium({ ...stadium, shower_memo: v })} />
              <Select label="풋살화 대여" value={stadium.shoe_rental} onChange={(v) => setStadium({ ...stadium, shoe_rental: v })} options={["예", "아니오"]} />
              <Input label="풋살화 메모" value={stadium.shoe_memo} onChange={(v) => setStadium({ ...stadium, shoe_memo: v })} />
              <Select label="화장실" value={stadium.toilet} onChange={(v) => setStadium({ ...stadium, toilet: v })} options={["예", "아니오"]} />
              <Input label="화장실 메모" value={stadium.toilet_memo} onChange={(v) => setStadium({ ...stadium, toilet_memo: v })} />
              <Select label="음료" value={stadium.beverage} onChange={(v) => setStadium({ ...stadium, beverage: v })} options={["예", "아니오"]} />
              <Input label="음료 메모" value={stadium.beverage_memo} onChange={(v) => setStadium({ ...stadium, beverage_memo: v })} />
              <Select label="조끼 제공" value={stadium.vest_provided} onChange={(v) => setStadium({ ...stadium, vest_provided: v })} options={["예", "아니오"]} />
              <Input label="조끼 메모" value={stadium.vest_memo} onChange={(v) => setStadium({ ...stadium, vest_memo: v })} />
              <Select label="공 제공" value={stadium.ball_provided} onChange={(v) => setStadium({ ...stadium, ball_provided: v })} options={["예", "아니오"]} />
              <Input label="공 메모" value={stadium.ball_memo} onChange={(v) => setStadium({ ...stadium, ball_memo: v })} />
            </div>
            <div className="space-y-1 mt-1">
              <p className="text-sm text-[#374151] font-medium">공지사항</p>
              <textarea value={stadium.notice} onChange={(e) => setStadium({ ...stadium, notice: e.target.value })} className="w-full border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm" rows={2} />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-[#374151] font-medium">소셜매치 특이사항</p>
              <textarea value={stadium.social_match_note} onChange={(e) => setStadium({ ...stadium, social_match_note: e.target.value })} className="w-full border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm" rows={2} />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-[#374151] font-medium">대관 특이사항</p>
              <textarea value={stadium.rental_note} onChange={(e) => setStadium({ ...stadium, rental_note: e.target.value })} className="w-full border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm" rows={2} />
            </div>
          </Section>

          {/* 섹션 3: 코트 정보 */}
          <Section title="코트 정보">
            {courts.map((court, idx) => (
              <div key={idx} className="border border-[#E3E6EC] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#374151]">코트 {idx + 1}</p>
                  {courts.length > 1 && (
                    <button type="button" onClick={() => setCourts((prev) => prev.filter((_, i) => i !== idx))} className="text-xs text-red-500">삭제</button>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input label="코트 이름" value={court.court_name} onChange={(v) => setCourts((prev) => prev.map((c, i) => i === idx ? { ...c, court_name: v } : c))} placeholder="예: A구장" />
                  <Select label="실내/실외" value={court.indoor_outdoor} onChange={(v) => setCourts((prev) => prev.map((c, i) => i === idx ? { ...c, indoor_outdoor: v } : c))} options={["실내", "실외"]} />
                  <Input label="가로 길이 (m)" value={court.size_x?.toString() ?? ""} onChange={(v) => setCourts((prev) => prev.map((c, i) => i === idx ? { ...c, size_x: Number(v) || null } : c))} placeholder="예: 40" />
                  <Input label="세로 길이 (m)" value={court.size_y?.toString() ?? ""} onChange={(v) => setCourts((prev) => prev.map((c, i) => i === idx ? { ...c, size_y: Number(v) || null } : c))} placeholder="예: 20" />
                  <Input label="바닥 종류" value={court.floor_type} onChange={(v) => setCourts((prev) => prev.map((c, i) => i === idx ? { ...c, floor_type: v } : c))} placeholder="예: 잔디, 인도어, 우레탄" />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setCourts((prev) => [...prev, defaultCourt()])}
              className="text-sm text-[#1C5DFF] border border-[#1C5DFF] rounded-lg px-4 py-2"
            >
              + 코트 추가
            </button>
          </Section>

          {/* 섹션 4: 서류 업로드 */}
          <Section title="필수 서류 업로드">
            <p className="text-xs text-[#6b7280]">사업자등록증, 통장사본, 부동산/임대차 계약서를 모두 업로드해주세요. (JPG/PNG/PDF)</p>
            <div className="space-y-3">
              <DocInput
                label="사업자등록증 사본"
                required
                file={businessFile}
                previewUrl={previewUrls.business}
                onPreview={setPreviewImage}
                onChange={(file) => { setBusinessFile(file); setPreviewUrls((p) => ({ ...p, business: URL.createObjectURL(file) })); }}
                onClear={() => { setBusinessFile(null); setPreviewUrls((p) => { if (p.business) URL.revokeObjectURL(p.business); const { business, ...rest } = p; return rest; }); }}
              />
              <DocInput
                label="통장 사본"
                required
                file={bankbookFile}
                previewUrl={previewUrls.bankbook}
                onPreview={setPreviewImage}
                onChange={(file) => { setBankbookFile(file); setPreviewUrls((p) => ({ ...p, bankbook: URL.createObjectURL(file) })); }}
                onClear={() => { setBankbookFile(null); setPreviewUrls((p) => { if (p.bankbook) URL.revokeObjectURL(p.bankbook); const { bankbook, ...rest } = p; return rest; }); }}
              />
              <DocInput
                label="부동산/임대차 계약서"
                required
                file={leaseFile}
                previewUrl={previewUrls.lease}
                onPreview={setPreviewImage}
                onChange={(file) => { setLeaseFile(file); setPreviewUrls((p) => ({ ...p, lease: URL.createObjectURL(file) })); }}
                onClear={() => { setLeaseFile(null); setPreviewUrls((p) => { if (p.lease) URL.revokeObjectURL(p.lease); const { lease, ...rest } = p; return rest; }); }}
              />
            </div>
            <p className="text-xs text-[#C96A4A]">사업자등록증 상 대표자명과 동일한 통장이어야 합니다. (차명계좌 불가)</p>
          </Section>

          {/* 에러 + 제출 */}
          {error && <div className="bg-red-50 border border-red-100 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-lg text-white text-sm font-semibold py-3 disabled:opacity-50"
            style={{ background: "#1C5DFF" }}
          >
            {loading ? "제출 중..." : "제출하기"}
          </button>
        </div>
      </main>

      {/* 이미지 미리보기 */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-4 space-y-3">
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6 space-y-4">
      <h2 className="text-base font-semibold text-[#111827] border-b border-[#E3E6EC] pb-3">{title}</h2>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-[#374151]">
      <span>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm" />
    </label>
  );
}

function Select({ label, value, onChange, options, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-[#374151]">
      <span>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm bg-white">
        <option value="">{placeholder ?? "선택하세요"}</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </label>
  );
}

function DocInput({ label, required, file, previewUrl, onPreview, onChange, onClear }: { label: string; required?: boolean; file: File | null; previewUrl?: string; onPreview: (url: string) => void; onChange: (file: File) => void; onClear: () => void }) {
  const inputId = useId();
  return (
    <div className="border border-[#E3E6EC] rounded-lg p-3 space-y-2">
      <p className="text-sm text-[#374151]">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</p>
      <div className="flex items-center gap-3">
        <input id={inputId} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); }} className="sr-only" />
        <label htmlFor={inputId} className="inline-flex items-center rounded-md border border-[#E3E6EC] bg-white px-3 py-1.5 text-xs text-[#4B5563] cursor-pointer hover:bg-[#F7F9FC]">업로드</label>
        {file && <span className="text-xs text-[#6b7280] truncate">{file.name}</span>}
      </div>
      {previewUrl && (
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={label} className="h-20 w-32 rounded-lg border border-[#E3E6EC] object-cover cursor-pointer" onClick={() => onPreview(previewUrl)} />
          <button type="button" onClick={onClear} className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-white border border-[#E3E6EC] text-[10px] text-[#6b7280]">×</button>
        </div>
      )}
    </div>
  );
}
