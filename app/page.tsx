"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center px-4 space-y-4">
      <div className="w-full max-w-md flex flex-col items-center">
        <Image src="/plab-logo3.png" alt="PLAB" width={165} height={60} priority />
        <div className="text-xs text-[#9CA3AF] mt-1">구장 제휴 요청</div>
      </div>
      <section className="mx-auto max-w-md border border-[#E3E6EC] rounded-lg p-6 space-y-4 bg-white shadow-sm text-left">
        <div className="text-lg font-semibold text-[#111827]">로그인</div>
        <p className="text-xs text-[#6b7280] text-left">임시 ID/PW는 아래 ‘제휴 요청 시작’ 완료 후 발급됩니다.</p>
        <HomeLoginForm />
        <Link
          href="/onboarding/step0/new"
          className="inline-flex items-center justify-center rounded-lg border border-[#E3E6EC] bg-[#1C5DFF] text-white px-5 py-2 text-sm font-semibold w-full text-center"
        >
          제휴 요청 시작
        </Link>
      </section>
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
