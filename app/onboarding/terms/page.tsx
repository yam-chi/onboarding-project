"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const TERMS_LIST = [
  { key: "service", label: "구장 제휴 서비스 이용 약관 (필수)" },
  { key: "privacy", label: "개인정보 수집 및 이용 동의 (필수)" },
  { key: "thirdparty", label: "개인정보 제3자 제공 동의 (필수)" },
];

export default function TermsPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState<Record<string, boolean>>({});
  const [allAgreed, setAllAgreed] = useState(false);

  const toggleAll = (val: boolean) => {
    setAllAgreed(val);
    const next: Record<string, boolean> = {};
    TERMS_LIST.forEach((t) => (next[t.key] = val));
    setAgreed(next);
  };

  const toggleOne = (key: string, val: boolean) => {
    const next = { ...agreed, [key]: val };
    setAgreed(next);
    setAllAgreed(TERMS_LIST.every((t) => next[t.key]));
  };

  const allChecked = TERMS_LIST.every((t) => agreed[t.key]);

  return (
    <main className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-1">
          <Image src="/plab-logo3.png" alt="PLAB" width={120} height={44} priority />
          <p className="text-xs text-[#9CA3AF]">구장 제휴 요청</p>
        </div>

        <div className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6 space-y-5">
          <h1 className="text-lg font-semibold text-[#111827]">약관 동의</h1>

          {/* 전체 동의 */}
          <label className="flex items-center gap-3 p-3 bg-[#F0F4FF] rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={allAgreed}
              onChange={(e) => toggleAll(e.target.checked)}
              className="w-4 h-4 accent-[#1C5DFF]"
            />
            <span className="text-sm font-semibold text-[#111827]">전체 동의</span>
          </label>

          <div className="border-t border-[#E3E6EC]" />

          {/* 개별 약관 */}
          <div className="space-y-3">
            {TERMS_LIST.map((term) => (
              <div key={term.key} className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!agreed[term.key]}
                    onChange={(e) => toggleOne(term.key, e.target.checked)}
                    className="w-4 h-4 accent-[#1C5DFF]"
                  />
                  <span className="text-sm text-[#374151]">{term.label}</span>
                </label>
                <button
                  type="button"
                  className="text-xs text-[#6b7280] underline shrink-0"
                  onClick={() => alert("약관 PDF가 준비 중입니다.")}
                >
                  보기
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            disabled={!allChecked}
            onClick={() => router.push("/onboarding/apply")}
            className="w-full inline-flex items-center justify-center rounded-lg text-sm font-semibold py-2.5 text-white disabled:opacity-40"
            style={{ background: "#1C5DFF" }}
          >
            동의하고 구장 정보 등록하기
          </button>
        </div>
      </div>
    </main>
  );
}
