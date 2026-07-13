"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function CompletePage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [copied, setCopied] = useState(false);

  const link = typeof window !== "undefined" ? `${window.location.origin}/onboarding/${id}` : `/onboarding/${id}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-1">
          <Image src="/plab-logo3.png" alt="PLAB" width={120} height={44} priority />
        </div>

        <div className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6 space-y-5">
          {/* 완료 아이콘 */}
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="w-14 h-14 rounded-full bg-[#EEF3FF] flex items-center justify-center text-2xl">✓</div>
            <h1 className="text-lg font-semibold text-[#111827]">제휴 신청이 완료되었습니다</h1>
            <p className="text-sm text-[#6b7280] text-center">담당자 검토 후 연락드리겠습니다.<br />아래 링크를 저장해두시면 신청 현황을 확인할 수 있어요.</p>
          </div>

          {/* 링크 복사 */}
          <div className="space-y-2">
            <p className="text-xs text-[#6b7280] font-medium">내 신청 링크</p>
            <div className="flex gap-2">
              <div className="flex-1 border border-[#E3E6EC] rounded-lg px-3 py-2 text-xs text-[#374151] bg-[#F7F9FC] truncate">
                {link}
              </div>
              <button
                type="button"
                onClick={copyLink}
                className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ background: copied ? "#22c55e" : "#1C5DFF" }}
              >
                {copied ? "복사됨!" : "복사"}
              </button>
            </div>
            <p className="text-xs text-[#9CA3AF]">이 링크로 언제든지 신청 현황을 확인할 수 있습니다.</p>
          </div>

          <Link href={`/onboarding/${id}`} className="inline-flex w-full items-center justify-center rounded-lg border border-[#E3E6EC] text-sm text-[#374151] py-2.5">
            현황 확인하기
          </Link>
        </div>
      </div>
    </main>
  );
}
