import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabaseClient";

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
    return NextResponse.json({ error: e.message ?? "server_error" }, { status: 500 });
  }
}
