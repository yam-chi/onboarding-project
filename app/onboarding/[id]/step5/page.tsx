"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

// 외부 링크는 바로 하드코딩해 동작하도록 처리
const manageUrl = "https://plab.so";
const channelUrl = "https://pf.kakao.com/_xkKxbxcxb";
const guideUrl = "https://plabstadiumguide.oopy.io/";

export default function OnboardingCompletePage() {
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-12">
      <div className="max-w-4xl mx-auto bg-white border border-[#E3E6EC] rounded-2xl shadow-sm p-8 space-y-8">
        <header className="text-left space-y-2">
          <h1 className="text-2xl font-semibold text-[#111827]">초기 세팅 완료!</h1>
          <p className="text-sm text-[#4b5563] leading-6">
            축하드립니다. 플랩풋볼과의 제휴 초기 세팅이 완료되었습니다.
            <br />
            아래 정보를 확인하시고 차주부터 매치 운영을 준비해주세요.
          </p>
          <div className="text-xs text-[#6b7280]">온보딩 ID: {id}</div>
        </header>

        <section className="grid md:grid-cols-2 gap-4">
          <InfoCard
            title="구장 관리 페이지"
            items={[
              "아래 버튼으로 접속해 매치 세팅 시간과 운영 현황을 확인할 수 있습니다.",
              "로그인이 필요한 경우 담당자가 안내한 계정 정보를 사용해주세요.",
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
            title="계정 정보"
            items={[
              "온보딩 중 설정한 임시 ID/PW 또는 담당자가 전달한 계정으로 로그인해주세요.",
              "계정 분실 시 문의 채널로 연락주시면 바로 재발급해드립니다.",
            ]}
          />

          <InfoCard
            title="문의 채널 (카카오/채널톡)"
            items={[
              "정산 및 운영 관련 주요 안내는 카카오 채널(또는 채널톡)으로 전달됩니다.",
              "채널에 접속 후 “구장명”을 포함해 간단한 메시지를 남겨주세요.",
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
            title="런드리 / 장비 안내"
            items={[
              "매치 운영에 필요한 조끼·공 등은 장비팀이 매치 수에 맞춰 별도 발송 또는 안내드립니다.",
              "추후 채널을 통해 다시 연락드릴 예정입니다.",
            ]}
          />

          <InfoCard
            title="플랩 가이드"
            items={[
              "플랩풋볼 운영 및 구장 이용 관련 가이드는 아래 링크에서 확인할 수 있습니다.",
            ]}
            action={
              <Link
                href={guideUrl}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-white font-semibold bg-[#1C5DFF]"
                target="_blank"
              >
                플랩풋볼 구장 이용 가이드 보기
              </Link>
            }
          />
        </section>

        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <Link
            href="/onboarding"
            className="px-5 py-2 rounded-lg text-white font-semibold w-full sm:w-auto"
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
