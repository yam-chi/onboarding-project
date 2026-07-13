import { NextRequest, NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabaseClient";

const uuidRegex = /^[0-9a-fA-F-]{36}$/;

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");
    const { id } = await context.params;
    if (!id || !uuidRegex.test(id)) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

    // 하위 테이블부터 정리
    await supabaseClient.from("onboarding_settlement_proposals").delete().eq("onboarding_request_id", id);
    await supabaseClient.from("onboarding_documents").delete().eq("onboarding_request_id", id);
    await supabaseClient.from("onboarding_available_times").delete().eq("onboarding_request_id", id);
    await supabaseClient.from("onboarding_court_info").delete().eq("onboarding_request_id", id);
    await supabaseClient.from("onboarding_stadium_info").delete().eq("onboarding_request_id", id);

    const { error } = await supabaseClient.from("onboarding_requests").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "server_error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");
    const { id } = await context.params;
    if (!id || !uuidRegex.test(id)) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

    const body = await req.json();
    const updatePayload: Record<string, any> = {};

    if (typeof body?.manager_done === "boolean") {
      updatePayload.manager_done = body.manager_done;
    }
    if (Array.isArray(body?.sections)) {
      updatePayload.sections = body.sections;
    }
    if (body?.settlement_rate !== undefined) {
      updatePayload.settlement_rate = body.settlement_rate;
    }
    if (body?.settlement_rate_data !== undefined) {
      updatePayload.settlement_rate_data = body.settlement_rate_data;
    }

    const { data, error } = await supabaseClient
      .from("onboarding_requests")
      .update(updatePayload)
      .eq("id", id)
      .select("manager_done, sections, settlement_rate, settlement_rate_data")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, ...data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "server_error" }, { status: 500 });
  }
}
