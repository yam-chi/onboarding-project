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
    const { new_status } = body || {};
    if (!new_status || !ONBOARDING_STATES.includes(new_status)) {
      return NextResponse.json({ error: "invalid_status" }, { status: 400 });
    }

    const { error } = await supabaseClient.from("onboarding_requests").update({ step_status: new_status as OnboardingState }).eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true, step_status: new_status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "server_error" }, { status: 500 });
  }
}
