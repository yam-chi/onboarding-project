import { NextRequest, NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabaseClient";

const uuidRegex = /^[0-9a-fA-F-]{36}$/;

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");
    const { id } = await context.params;
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }
    const { data, error } = await supabaseClient
      .from("onboarding_requests")
      .select(
        `
        id,
        step_status,
        stadium_name,
        owner_name,
        owner_email,
        contact,
        region,
        address,
        address_detail,
        operating_status,
        facility_count,
        size_info,
        service_types,
        memo,
        manager,
        venue_type,
        settlement_rate,
        settlement_rate_data,
        sections,
        completed_sections,
        parking_available,
        parking_free,
        parking_count,
        parking_contact,
        parking_fee,
        shower_available,
        shower_memo,
        shoes_available,
        shoes_memo,
        toilet_type,
        toilet_available,
        toilet_memo,
        drinks_available,
        drinks_memo,
        vest_available,
        vest_memo,
        ball_available,
        ball_memo,
        notice,
        social_special,
        social_message,
        manager_note,
        rental_note,
        rental_warning,
        rental_message,
        hoped_times_note,
        settlement_decision,
        document_urls,
        photo_urls,
        decline_reason,
        decline_reason_detail,
        updated_at
      `,
      )
      .eq("id", id)
      .single();
    if (error) throw error;
    return NextResponse.json({ onboarding: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "server_error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");
    const { id } = await context.params;
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }
    const body = await req.json().catch(() => ({}));
    const { final_account, final_password } = body || {};
    const payload: Record<string, string | null> = {};
    if (typeof final_account === "string") {
      payload.final_account = final_account.trim() || null;
    }
    if (typeof final_password === "string") {
      payload.final_password = final_password.trim() || null;
    }
    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ ok: true });
    }
    const { error } = await supabaseClient.from("onboarding_requests").update(payload).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "server_error" }, { status: 500 });
  }
}
