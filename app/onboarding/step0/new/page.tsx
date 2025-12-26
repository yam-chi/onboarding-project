"use client";

import Link from "next/link";
import { useState } from "react";

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
  "경기 시흥시",
  "경기 파주시",
  "경기 김포시",
  "경기 광명시",
  "경기 군포시",
  "경기 오산시",
  "경기 이천시",
  "경기 양주시",
  "경기 광주시",
  "경기 하남시",
  "경기 의왕시",
  "경기 구리시",
  "경기 포천시",
  "경기 안성시",
  "경기 여주시",
  "부산 해운대구",
  "부산 수영구",
  "부산 부산진구",
  "부산 동래구",
  "부산 남구",
  "부산 북구",
  "부산 사상구",
  "부산 사하구",
  "부산 연제구",
  "부산 금정구",
  "부산 중구",
  "부산 서구",
  "부산 동구",
  "부산 강서구",
  "부산 기장군",
  "인천 남동구",
  "인천 부평구",
  "인천 서구",
  "인천 연수구",
  "인천 미추홀구",
  "인천 계양구",
  "인천 중구",
  "인천 동구",
  "인천 강화군",
  "인천 옹진군",
  "대구 수성구",
  "대구 달서구",
  "대구 동구",
  "대구 서구",
  "대구 남구",
  "대구 북구",
  "대구 중구",
  "대구 달성군",
  "대전 서구",
  "대전 유성구",
  "대전 대덕구",
  "대전 중구",
  "대전 동구",
  "광주 서구",
  "광주 북구",
  "광주 남구",
  "광주 동구",
  "광주 광산구",
  "울산 남구",
  "울산 동구",
  "울산 북구",
  "울산 중구",
  "울산 울주군",
  "세종 세종시",
  "강원 춘천시",
  "강원 원주시",
  "강원 강릉시",
  "강원 속초시",
  "강원 동해시",
  "강원 삼척시",
  "강원 태백시",
  "충북 청주시",
  "충북 충주시",
  "충북 제천시",
  "충남 천안시",
  "충남 아산시",
  "충남 서산시",
  "충남 당진시",
  "충남 공주시",
  "충남 논산시",
  "충남 보령시",
  "전북 전주시",
  "전북 익산시",
  "전북 군산시",
  "전북 정읍시",
  "전북 남원시",
  "전북 김제시",
  "전남 목포시",
  "전남 여수시",
  "전남 순천시",
  "전남 나주시",
  "전남 광양시",
  "경북 포항시",
  "경북 구미시",
  "경북 경주시",
  "경북 안동시",
  "경북 김천시",
  "경북 영주시",
  "경북 상주시",
  "경북 문경시",
  "경남 창원시",
  "경남 김해시",
  "경남 진주시",
  "경남 양산시",
  "경남 통영시",
  "경남 거제시",
  "경남 사천시",
  "경남 밀양시",
  "제주 제주시",
  "제주 서귀포시",
];

export default function Step0New() {
  const [form, setForm] = useState({
    owner_name: "",
    region: "",
    stadium_name: "",
    address: "",
    address_detail: "",
    operating_status: "",
    facility_count: "",
    size_info: "",
    service_types: [] as string[],
    other_services: "",
    memo: "",
    source: "",
    temp_code: "",
    temp_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const toggleService = (value: string) => {
    setForm((prev) => {
      const set = new Set(prev.service_types);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...prev, service_types: Array.from(set) };
    });
  };

  const submit = async () => {
    setError(null);
    setLoading(true);
    setSuccessId(null);
    try {
      if (!form.owner_name || !form.region || !form.address) {
        throw new Error("필수 항목을 입력해주세요.");
      }
      if (!form.stadium_name) {
        throw new Error("구장명을 입력해주세요.");
      }
      const payload = {
        ...form,
        facility_count: form.facility_count ? Number(form.facility_count) : null,
        };
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "제출 실패");
      setSuccessId(json.id);
    } catch (e: any) {
      setError(e.message ?? "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-8">
      <div className="max-w-3xl mx-auto mb-3">
        <h1 className="text-xl font-semibold text-[#111827]">1. 제휴 요청</h1>
      </div>

      <div className="max-w-3xl mx-auto bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6 space-y-4">
        <div className="text-sm font-semibold text-[#111827]">구장 기본 정보</div>

        <div className="grid md:grid-cols-2 gap-3">
          <Input label="구장명" value={form.stadium_name} onChange={(v) => setForm({ ...form, stadium_name: v })} required />
          <Input label="성함" value={form.owner_name} onChange={(v) => setForm({ ...form, owner_name: v })} required />
          <Select
            label="지역"
            value={form.region}
            onChange={(v) => setForm({ ...form, region: v })}
            options={REGION_OPTIONS}
            placeholder="시/군/구 선택"
            required
          />
          <Input label="주소" value={form.address} onChange={(v) => setForm({ ...form, address: v })} required />
          <Input label="운영 상태" value={form.operating_status} onChange={(v) => setForm({ ...form, operating_status: v })} placeholder="시공 예정 / 운영중 등" />
          <Input label="면 개수" value={form.facility_count} onChange={(v) => setForm({ ...form, facility_count: v })} />
          <Input label="규격 및 실내외 여부" value={form.size_info} onChange={(v) => setForm({ ...form, size_info: v })} placeholder="예: 1~3구장 / 실외 / 40x20" />
          <Input label="플랩 외 사용 중 서비스" value={form.other_services} onChange={(v) => setForm({ ...form, other_services: v })} />
          <Input label="유입 경로" value={form.source} onChange={(v) => setForm({ ...form, source: v })} />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold text-[#111827]">희망 제휴 서비스</div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "소셜 매치", value: "social_match" },
              { label: "구장 예약", value: "rental" },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm text-[#1C1E26]">
                <input
                  type="checkbox"
                  checked={form.service_types.includes(opt.value)}
                  onChange={() => toggleService(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold text-[#111827]">기타 내용</div>
          <textarea
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
            className="w-full border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm"
            rows={3}
            placeholder="없으면 비워두세요."
          />
        </div>

        <hr className="border-[#E3E6EC] my-4" />

        <div className="text-sm font-semibold text-[#111827]">임시 계정 발급</div>

        <div className="grid md:grid-cols-2 gap-3">
          <Input
            label="임시 ID"
            value={form.temp_code}
            onChange={(v) => setForm({ ...form, temp_code: v })}
            placeholder="전화번호"
          />
          <Input
            label="임시 PW"
            value={form.temp_password}
            onChange={(v) => setForm({ ...form, temp_password: v })}
            placeholder="간단한 비밀번호"
          />
        </div>
        <p className="text-xs text-[#6b7280]">임시 ID 번호로 연락드리오니 연락 가능한 전화번호로 입력해 주세요.</p>

        <div className="space-y-2">
          {error && <div className="w-full bg-red-100 text-red-800 rounded-lg px-3 py-2 text-sm">{error}</div>}
          {successId && (
            <div className="w-full bg-green-100 text-green-800 rounded-lg px-3 py-2 text-sm">
              제휴 요청이 접수되었습니다.
              <div className="text-xs text-[#166534]">이후 단계는 로그인 후 진행 가능합니다.</div>
            </div>
          )}

          <div className="flex justify-between">
            <Link href="/" className="px-5 py-3 rounded-lg border border-[#1C5DFF] text-[#1C5DFF] font-semibold">
              홈(로그인)으로
            </Link>
            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="px-5 py-3 rounded-lg text-white font-semibold"
              style={{ background: "#1C5DFF" }}
            >
              {loading ? "제출 중..." : "제휴 요청 제출"}
            </button>
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
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-[#1C1E26]">
      <span>
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        value={value}
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
