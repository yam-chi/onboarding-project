"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

// 외부 링크는 바로 하드코딩해 동작하도록 처리
const manageUrl = "https://plab.so";
const channelUrl = "https://pf.kakao.com/_xkKxbxcxb";
const guideUrl = "https://plabstadiumguide.oopy.io/";

export default function OnboardingCompletePage() {
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const [account, setAccount] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/onboarding/${id}/step5`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "불러오기 실패");
        if (!mounted) return;
        setAccount(json.final_account ?? null);
        setPassword(json.final_password ?? null);
      } catch {
        // 실패 시 무시하고 기본 안내만 표시
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-12">
      <div className="max-w-4xl mx-auto bg-white border border-[#E3E6EC] rounded-2xl shadow-sm p-8 space-y-8">
        <header className="text-left space-y-2">
          <h1 className="text-2xl font-semibold text-[#111827]">초기 세팅 완료!</h1>
          <p className="text-sm text-[#4b5563] leading-6">
            플랩풋볼과의 제휴 초기 세팅이 완료되었습니다. 아래 정보를 확인하시고 매치 운영을 준비해주세요.
          </p>
        </header>

        <section className="grid gap-4">
          <InfoCard
            title="구장 관리 페이지"
            items={[
              "아래 버튼으로 접속해 매치 세팅 시간과 운영 현황을 확인할 수 있습니다.",
              "계정 분실 시 문의 채널로 연락주세요.",
              `계정 정보 ID: ${account || "담당자 입력 후 표시됩니다"} / PW: ${password || "담당자 입력 후 표시됩니다"}`,
            ]}
            action={
              <Link
                href={manageUrl}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-white font-semibold bg-[#1C5DFF]"
                target={manageUrl.startsWith("http") ? "_blank" : undefined}
              >
                구장 관리 페이지 접속
              </Link>
            }
          />

          <InfoCard
            title="문의 채널(카카오/채널톡)"
            items={[
              "채널에 접속 후 “구장명”을 남겨주세요. (문의 이력이 있다면 생략 가능)",
              "운영 관련 주요 안내는 카카오 채널(또는 채널톡)으로 전달되오니 채팅방 유지 부탁드려요.",
              "매치 운영에 필요한 조끼·공 등은 장비팀이 매치 수에 맞춰 별도 발송되며 채널톡으로 안내드립니다.",
            ]}
            action={
              <Link
                href={channelUrl}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-white font-semibold bg-[#1C5DFF]"
                target={channelUrl.startsWith("http") ? "_blank" : undefined}
              >
                구장주 채널 입장하기
              </Link>
            }
          />

          <InfoCard
            title="구장주 이용 가이드"
            items={[
              "플랩풋볼 운영 및 구장 이용 관련 가이드는 아래 링크에서 확인할 수 있습니다.",
              "꼼꼼히 확인하시는걸 권유드려요.",
            ]}
            action={
              <Link
                href={guideUrl}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-white font-semibold bg-[#1C5DFF]"
                target="_blank"
              >
                이용 가이드 둘러보기
              </Link>
            }
          />
        </section>

        <div className="flex flex-col sm:flex-row gap-3 justify-end items-center">
          <Link
            href={id ? `/onboarding/${id}/step2` : "/onboarding"}
            className="px-5 py-2 rounded-lg text-white font-semibold w-full sm:w-auto"
            style={{ background: "#1C5DFF" }}
          >
            이전 단계로
          </Link>
        </div>
      </div>
    </main>
  );
}

function InfoCard({
  title,
  items,
  action,
}: {
  title: string;
  items: string[];
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-4 space-y-3">
      <div className="text-lg font-semibold text-[#111827]">{title}</div>
      <ul className="list-disc list-inside space-y-1 text-sm text-[#4b5563]">
        {items.map((it, idx) => (
          <li key={idx}>{it}</li>
        ))}
      </ul>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
