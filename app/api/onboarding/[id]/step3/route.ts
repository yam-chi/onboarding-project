import { NextRequest, NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabaseClient";
import { OnboardingState } from "@/lib/onboarding";

const uuidRegex = /^[0-9a-fA-F-]{36}$/;

async function fetchRequest(id: string) {
  if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");
  const { data, error } = await supabaseClient
    .from("onboarding_requests")
    .select("id, step_status")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");
    const { id } = await context.params;
    if (!id || !uuidRegex.test(id)) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

    const reqRow = await fetchRequest(id);

    const { data: docs, error: docErr } = await supabaseClient
      .from("onboarding_documents")
      .select("doc_type, file_url, uploaded_at")
      .eq("onboarding_request_id", id);
    if (docErr) throw docErr;

    const { data: stadium, error: stErr } = await supabaseClient
      .from("onboarding_stadium_info")
      .select("stadium_name, region, address, address_detail, stadium_contact")
      .eq("onboarding_request_id", id)
      .maybeSingle();
    if (stErr) throw stErr;

    const { data: courts, error: cErr } = await supabaseClient
      .from("onboarding_court_info")
      .select("court_name, capacity, size_x, size_y, floor_type, indoor_outdoor")
      .eq("onboarding_request_id", id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (cErr) throw cErr;

    return NextResponse.json({
      step_status: reqRow.step_status as OnboardingState,
      documents: docs || [],
      stadium: stadium || null,
      courts: courts || [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "server_error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");
    const { id } = await context.params;
    if (!id || !uuidRegex.test(id)) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const { business_url, bankbook_url, lease_contract_url, skip_status } = body || {};
    if (!business_url || !bankbook_url || !lease_contract_url) {
      return NextResponse.json({ error: "missing_documents" }, { status: 400 });
    }

    const reqRow = await fetchRequest(id);
    const current = reqRow.step_status as OnboardingState;
    // 구장주 단독 흐름을 위해 상태 제한을 완화
    // (단, 최종 완료인 step5_complete만 제외)
    const allowedStatuses: OnboardingState[] = [
      "step0_pending",
      "step0_approved",
      "step1_pending",
      "step1_submitted",
      "step1_need_fix",
      "step1_approved",
      "step2_done",
      "step3_proposed",
      "step3_approved",
      "step4_submitted",
      "step4_complete",
      "step5_submitted",
    ];
    if (!allowedStatuses.includes(current)) {
      return NextResponse.json({ error: "invalid_transition" }, { status: 400 });
    }

    // replace existing two docs then insert
    await supabaseClient
      .from("onboarding_documents")
      .delete()
      .eq("onboarding_request_id", id)
      .in("doc_type", ["business_registration", "bankbook", "lease_contract"]);

    const insertRows = [
      {
        onboarding_request_id: id,
        doc_type: "business_registration",
        file_url: business_url,
      },
      {
        onboarding_request_id: id,
        doc_type: "bankbook",
        file_url: bankbook_url,
      },
      {
        onboarding_request_id: id,
        doc_type: "lease_contract",
        file_url: lease_contract_url,
      },
    ];

    const { error: insErr } = await supabaseClient.from("onboarding_documents").insert(insertRows);
    if (insErr) throw insErr;

    let nextStatus: OnboardingState = current;
    if (!skip_status && !["step4_submitted", "step4_complete", "step5_submitted"].includes(current)) {
      const { error: stErr } = await supabaseClient
        .from("onboarding_requests")
        .update({ step_status: "step4_submitted" })
        .eq("id", id);
      if (stErr) throw stErr;
      nextStatus = "step4_submitted";
    }

    return NextResponse.json({ ok: true, step_status: nextStatus });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "server_error" }, { status: 500 });
  }
}
