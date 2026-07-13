import { NextRequest, NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabaseClient";

export const runtime = "nodejs";

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
          manager,
          venue_type,
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

// 어드민에서 신규 온보딩 링크 생성
export async function POST(req: NextRequest) {
  try {
    if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");

    const body = await req.json().catch(() => ({}));
    const { stadium_name, manager, venue_type, region, settlement_rate, sections } = body;

    if (!stadium_name) {
      return NextResponse.json({ error: "구장명을 입력해주세요." }, { status: 400 });
    }

    const { data, error } = await supabaseClient
      .from("onboarding_requests")
      .insert({
        stadium_name,
        manager: manager || null,
        venue_type: venue_type || "신규",
        region: region || null,
        settlement_rate: settlement_rate || null,
        sections: sections || [],
        completed_sections: [],
        step_status: "step0_pending",
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "server_error" }, { status: 500 });
  }
}
