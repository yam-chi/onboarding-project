import { NextRequest, NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabaseClient";

export const runtime = "nodejs";

const uuidRegex = /^[0-9a-fA-F-]{36}$/;

type SectionKey = "terms" | "settlement" | "venue_basic" | "venue_detail" | "documents" | "photos";

const ALLOWED_SECTIONS: SectionKey[] = ["terms", "settlement", "venue_basic", "venue_detail", "documents", "photos"];

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");
    const { id } = await context.params;
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { section, decision, decline_reason, decline_reason_detail, ...sectionData } = body;

    if (!ALLOWED_SECTIONS.includes(section)) {
      return NextResponse.json({ error: "invalid_section" }, { status: 400 });
    }

    // 현재 completed_sections 가져오기
    const { data: current, error: fetchError } = await supabaseClient
      .from("onboarding_requests")
      .select("completed_sections")
      .eq("id", id)
      .single();
    if (fetchError) throw fetchError;

    const completed: SectionKey[] = current?.completed_sections || [];
    if (!completed.includes(section)) {
      completed.push(section);
    }

    // 섹션별 추가 데이터 업데이트
    const updatePayload: Record<string, any> = { completed_sections: completed };

    if (section === "settlement") {
      updatePayload.settlement_decision = decision || null;
      if (decision === "decline") {
        updatePayload.decline_reason = decline_reason || null;
        updatePayload.decline_reason_detail = decline_reason_detail || null;
        updatePayload.step_status = "declined";
      } else if (decision === "accept") {
        updatePayload.step_status = "step0_approved";
      }
    }

    if (section === "venue_basic") {
      const { owner_name, contact, region, address, address_detail } = sectionData;
      if (owner_name) updatePayload.owner_name = owner_name;
      if (contact) updatePayload.contact = contact;
      if (region) updatePayload.region = region;
      if (address) updatePayload.address = address;
      if (address_detail) updatePayload.address_detail = address_detail;
    }

    if (section === "venue_detail") {
      const fields = [
        "operating_status", "facility_count", "size_info", "service_types",
        "parking_available", "parking_free", "parking_count", "parking_contact", "parking_fee",
        "shower_available", "shower_memo",
        "shoes_available", "shoes_memo",
        "toilet_type", "toilet_available", "toilet_memo",
        "drinks_available", "drinks_memo",
        "vest_available", "vest_memo",
        "ball_available", "ball_memo",
        "notice", "social_special", "social_message",
        "manager_note", "rental_note", "rental_warning", "rental_message",
        "hoped_times_note",
      ];
      for (const f of fields) {
        if (sectionData[f] !== undefined) updatePayload[f] = sectionData[f];
      }
    }

    const { error: updateError } = await supabaseClient
      .from("onboarding_requests")
      .update(updatePayload)
      .eq("id", id);
    if (updateError) throw updateError;

    return NextResponse.json({ completed_sections: completed });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "server_error" }, { status: 500 });
  }
}
