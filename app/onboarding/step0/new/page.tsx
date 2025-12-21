"use client";

import Link from "next/link";
import { useState } from "react";
import { isValidPhone } from "@/lib/onboarding";

export default function Step0New() {
  const [form, setForm] = useState({
    owner_name: "",
    contact: "",
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
      if (!form.owner_name || !form.contact || !form.region || !form.address) {
        throw new Error("필수 항목을 입력해주세요.");
      }
      if (!form.stadium_name) {
        throw new Error("구장명을 입력해주세요.");
      }
      if (!isValidPhone(form.contact)) {
        throw new Error("연락처 형식을 확인해주세요.");
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
          <Input label="성함" value={form.owner_name} onChange={(v) => setForm({ ...form, owner_name: v })} required />
          <Input label="연락처" value={form.contact} onChange={(v) => setForm({ ...form, contact: v })} placeholder="010-1234-5678" required />
          <Input label="지역" value={form.region} onChange={(v) => setForm({ ...form, region: v })} required />
          <Input label="주소" value={form.address} onChange={(v) => setForm({ ...form, address: v })} required />
          <Input label="구장명" value={form.stadium_name} onChange={(v) => setForm({ ...form, stadium_name: v })} required />
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
            placeholder="기억하기 쉬운 ID"
          />
          <Input
            label="임시 PW"
            value={form.temp_password}
            onChange={(v) => setForm({ ...form, temp_password: v })}
            placeholder="간단한 비밀번호"
          />
        </div>
        <p className="text-xs text-[#6b7280]">
          정보 입력 후 제휴 요청을 제출하고, 로그인 화면으로 돌아가 임시 ID/PW로 로그인해 주세요.
        </p>

        <div className="space-y-2">
          {error && <div className="w-full bg-red-100 text-red-800 rounded-lg px-3 py-2 text-sm">{error}</div>}
          {successId && (
            <div className="w-full bg-green-100 text-green-800 rounded-lg px-3 py-2 text-sm">
              제휴 요청이 접수되었습니다.
              <div className="text-xs text-[#166534]">
                승인되면 다음 단계로 자동 진행됩니다. (로그인 화면에서 확인 가능)
              </div>
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
