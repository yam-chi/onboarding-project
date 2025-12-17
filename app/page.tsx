"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
      <div className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm px-8 py-10 w-full max-w-3xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-[#111827]">PLAB 제휴 신청</h1>
          <p className="text-sm text-[#4b5563]">새 온보딩 서비스 작업 공간입니다.</p>
          <p className="text-xs text-[#6b7280]">이 화면이 보이면 무치노트와 분리된 새 프로젝트를 보고 있는 것입니다.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <section className="border border-[#E3E6EC] rounded-lg p-4 space-y-3 text-left">
            <div className="text-lg font-semibold text-[#111827]">1) 진행 중 신청 이어하기</div>
            <p className="text-xs text-[#6b7280]">STEP0에서 설정한 임시 ID/PW로 접속해 진행 중인 온보딩을 이어서 할 수 있습니다.</p>
            <HomeLoginForm />
          </section>

          <section className="border border-[#E3E6EC] rounded-lg p-4 space-y-3 text-left">
            <div className="text-lg font-semibold text-[#111827]">2) 처음 신청하기</div>
            <p className="text-xs text-[#6b7280]">제휴 요청을 새로 시작합니다. STEP0에서 임시 ID/PW를 설정하면 나중에 이어하기가 편해요.</p>
            <Link
              href="/onboarding/step0/new"
              className="inline-flex items-center justify-center rounded-lg border border-[#E3E6EC] bg-[#1C5DFF] text-white px-4 py-2 text-sm font-semibold"
            >
              제휴 요청 시작 (STEP0)
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}

function HomeLoginForm() {
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!code || !pw) {
      setError("임시 ID와 PW를 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temp_code: code, temp_password: pw }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "접속 실패");
      window.location.href = json.path;
    } catch (e: any) {
      setError(e.message ?? "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm"
        placeholder="임시 ID"
      />
      <input
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        className="w-full border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm"
        placeholder="임시 PW"
        type="password"
      />
      {error && <div className="text-xs text-red-600">{error}</div>}
      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="w-full inline-flex items-center justify-center rounded-lg border border-[#E3E6EC] bg-white text-sm font-semibold text-[#1C5DFF] py-2"
      >
        {loading ? "접속 중..." : "접속하기"}
      </button>
    </div>
  );
}
