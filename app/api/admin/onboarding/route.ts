import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabaseClient";

// 간단 조회용 관리자 리스트 API (권한 가드는 추후 Auth 붙일 때 보완)
export async function GET() {
  try {
    if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");
    const { data, error } = await supabaseClient
      .from("onboarding_requests")
      .select(
        `
          id,
          owner_name,
          owner_email,
          region,
          step_status,
          updated_at,
          onboarding_stadium_info(stadium_name)
        `,
      )
      .order("updated_at", { ascending: false });

    if (error) throw error;

    // stadium_name은 조인 배열로 오므로 편의상 평탄화
    const rows =
      data?.map((row: any) => ({
        ...row,
        stadium_name: row.onboarding_stadium_info?.[0]?.stadium_name ?? null,
      })) ?? [];

    return NextResponse.json({ items: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "server_error" }, { status: 500 });
  }
}
