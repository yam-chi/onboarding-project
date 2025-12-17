"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!id || !pw) {
      setError("아이디와 비밀번호를 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      // 나중에 Supabase Auth 등으로 교체 가능. 지금은 데모용 아이디/비번 체크만.
      // 환경변수 혹은 하드코딩된 데모 계정
      const demoId = process.env.NEXT_PUBLIC_ADMIN_ID || "admin";
      const demoPw = process.env.NEXT_PUBLIC_ADMIN_PW || "plab1234";
      if (id === demoId && pw === demoPw) {
        router.push("/admin/onboarding");
      } else {
        setError("로그인 정보가 올바르지 않습니다.");
      }
    } catch (e: any) {
      setError(e.message ?? "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F9FC] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-[#E3E6EC] rounded-2xl shadow-sm p-8 space-y-6">
        <header className="text-center space-y-1">
          <div className="text-xs text-[#6b7280] font-semibold uppercase tracking-wider">PLAB Admin</div>
          <h1 className="text-2xl font-semibold text-[#111827]">담당자 로그인</h1>
          <p className="text-sm text-[#4b5563]">관리자 계정으로 온보딩 요청을 관리하세요.</p>
        </header>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-[#6b7280]">아이디</label>
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm"
              placeholder="admin"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[#6b7280]">비밀번호</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full border border-[#E3E6EC] rounded-lg px-3 py-2 text-sm"
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="w-full inline-flex items-center justify-center rounded-lg text-white font-semibold py-2"
          style={{ background: "#1C5DFF" }}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </div>
    </main>
  );
}
