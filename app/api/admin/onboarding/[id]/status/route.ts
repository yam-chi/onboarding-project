import { NextRequest, NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabaseClient";
import { ONBOARDING_STATES, OnboardingState } from "@/lib/onboarding";

const uuidRegex = /^[0-9a-fA-F-]{36}$/;

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");
    const { id } = await context.params;
    if (!id || !uuidRegex.test(id)) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const { new_status, memo, final_account, final_password } = body || {};
    if (!new_status || !ONBOARDING_STATES.includes(new_status)) {
      return NextResponse.json({ error: "invalid_status" }, { status: 400 });
    }

    const payload: any = { step_status: new_status as OnboardingState };
    if (new_status === "step0_rejected" && memo) {
      payload.memo = memo; // 반려 사유를 memo에 기록
    }
    if (typeof final_account === "string") {
      payload.final_account = final_account.trim() || null;
    }
    if (typeof final_password === "string") {
      payload.final_password = final_password.trim() || null;
    }

    const { error } = await supabaseClient.from("onboarding_requests").update(payload).eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true, step_status: new_status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "server_error" }, { status: 500 });
  }
}
