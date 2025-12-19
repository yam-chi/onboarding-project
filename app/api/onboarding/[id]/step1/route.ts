import { NextRequest, NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabaseClient";
import { OnboardingState } from "@/lib/onboarding";

const uuidRegex = /^[0-9a-fA-F-]{36}$/;

async function getRequest(id: string) {
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

    const { data, error } = await supabaseClient
      .from("onboarding_settlement_proposals")
      .select("id, title, description, image_urls, created_at")
      .eq("onboarding_request_id", id)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const req = await getRequest(id);
    return NextResponse.json({ proposals: data || [], step_status: req.step_status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "server_error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");
    const { id } = await context.params;
    if (!id || !uuidRegex.test(id)) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const { title, description, image_urls } = body || {};
    if (!title || !Array.isArray(image_urls) || image_urls.length === 0) {
      return NextResponse.json({ error: "missing_required" }, { status: 400 });
    }

    const reqRow = await getRequest(id);
    const current = reqRow.step_status as OnboardingState;
    // 전화 안내 완료 이후부터 정산 확인 가능
    const allowed = ["step2_done", "step3_proposed", "step3_approved"];
    if (!allowed.includes(current)) {
      return NextResponse.json({ error: "invalid_transition" }, { status: 400 });
    }

    const { error: insErr } = await supabaseClient.from("onboarding_settlement_proposals").insert({
      onboarding_request_id: id,
      title,
      description,
      image_urls,
    });
    if (insErr) throw insErr;

    // 상태를 step3_proposed로
    if (current !== "step3_proposed" && current !== "step3_approved") {
      const { error: stErr } = await supabaseClient
        .from("onboarding_requests")
        .update({ step_status: "step3_proposed" })
        .eq("id", id);
      if (stErr) throw stErr;
    }

    return NextResponse.json({ ok: true, step_status: "step3_proposed" });
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
    const { action } = body || {};
    if (action !== "approve") return NextResponse.json({ error: "invalid_action" }, { status: 400 });

    const reqRow = await getRequest(id);
    const current = reqRow.step_status as OnboardingState;
    // 담당자 업로드 없이 진행해야 하는 경우를 위해 step2_done에서도 승인 허용
    if (!["step3_proposed", "step2_done"].includes(current)) {
      return NextResponse.json({ error: "invalid_transition" }, { status: 400 });
    }

    const { error: stErr } = await supabaseClient
      .from("onboarding_requests")
      .update({ step_status: "step3_approved" })
      .eq("id", id);
    if (stErr) throw stErr;

    return NextResponse.json({ ok: true, step_status: "step3_approved" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "server_error" }, { status: 500 });
  }
}

// 정산안 삭제 (담당자용)
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");
    const { id } = await context.params;
    if (!id || !uuidRegex.test(id)) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const { proposal_id } = body || {};
    if (!proposal_id || !uuidRegex.test(proposal_id)) {
      return NextResponse.json({ error: "invalid_proposal_id" }, { status: 400 });
    }

    // 해당 요청에 속한 제안만 삭제
    const { error: delErr } = await supabaseClient
      .from("onboarding_settlement_proposals")
      .delete()
      .eq("id", proposal_id)
      .eq("onboarding_request_id", id);
    if (delErr) throw delErr;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "server_error" }, { status: 500 });
  }
}
