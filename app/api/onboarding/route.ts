import { NextRequest, NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabaseClient";

// GET: (옵션) 상태 목록 조회용 (필요하면 확장)
export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  try {
    if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");

    // 세션이 없어도 제출 가능하게 처리 (owner_id/owner_email은 없으면 null 저장)
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const user = sessionData.session?.user;

    const body = await req.json().catch(() => ({}));
    const { owner_name, region, stadium_name, address, address_detail, operating_status, facility_count, size_info, service_types, other_services, memo, source, temp_code, temp_password } = body;

    if (!owner_name || !region || !address) {
      return NextResponse.json({ error: "missing_required" }, { status: 400 });
    }
    if (!stadium_name) {
      return NextResponse.json({ error: "missing_required" }, { status: 400 });
    }
    const { data, error } = await supabaseClient
      .from("onboarding_requests")
      .insert({
        owner_id: user?.id ?? null,
        owner_email: user?.email ?? null,
        step_status: "step0_pending",
        temp_code: temp_code || null,
        temp_password: temp_password || null,
        stadium_name,
        owner_name,
        contact: null,
        region,
        address,
        address_detail,
        operating_status,
        facility_count,
        size_info,
        service_types,
        other_services,
        memo,
        source,
      })
      .select("id, step_status")
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id, step_status: data.step_status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "server_error" }, { status: 500 });
  }
}
