import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabaseClient";

export const runtime = "nodejs";

// 간단 조회용 관리자 리스트 API (권한 가드는 추후 Auth 붙일 때 보완)
export async function GET() {
  try {
    if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");
    const { data, error } = await supabaseClient
      .from("onboarding_requests")
      .select(`
          id,
          owner_name,
          owner_email,
          stadium_name,
          region,
          step_status,
          manager_done,
          updated_at
        `)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ items: data ?? [] });
  } catch (e: any) {
    const cause = e?.cause?.message || e?.cause || null;
    const message = e?.message ?? "server_error";
    const debug = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
      keyLen: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      hasFetch: typeof fetch === "function",
    };
    console.error("[admin/onboarding] fetch error:", message, cause, debug);
    return NextResponse.json({ error: message, cause, debug }, { status: 500 });
  }
}
