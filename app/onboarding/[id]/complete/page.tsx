"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function OnboardingCompletePage() {
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-12">
      <div className="max-w-3xl mx-auto bg-white border border-[#E3E6EC] rounded-2xl shadow-sm p-8 space-y-6 text-center">
        <h1 className="text-2xl font-semibold text-[#111827]">온보딩이 모두 완료되었습니다!</h1>
        <p className="text-sm text-[#4b5563] leading-6">
          축하드립니다. 플랩풋볼과의 제휴 초기 세팅이 완료되었습니다.
          <br />
          담당자가 운영 확정 시간대와 안내를 곧 전달드릴 예정입니다.
        </p>
        <div className="text-xs text-[#6b7280]">온보딩 ID: {id}</div>
        <div className="flex flex-col gap-3 items-center">
          <Link
            href="/onboarding"
            className="px-5 py-2 rounded-lg text-white font-semibold"
            style={{ background: "#1C5DFF" }}
          >
            온보딩 홈으로 가기
          </Link>
          <Link href="/onboarding/step0/new" className="text-xs text-[#1C5DFF] underline">
            다른 구장 제휴도 시작하기
          </Link>
        </div>
      </div>
    </main>
  );
}
