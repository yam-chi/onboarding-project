import { NextRequest, NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabaseClient";
import { OnboardingState } from "@/lib/onboarding";

const uuidRegex = /^[0-9a-fA-F-]{36}$/;

async function fetchRequest(id: string) {
  if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");
  const { data, error } = await supabaseClient
    .from("onboarding_requests")
    .select("id, step_status, final_account, final_password")
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
    const { data: times, error: tErr } = await supabaseClient
      .from("onboarding_available_times")
      .select("*")
      .eq("onboarding_request_id", id)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });
    if (tErr) throw tErr;

    return NextResponse.json({
      step_status: reqRow.step_status,
      times: times || [],
      final_account: (reqRow as any).final_account ?? null,
      final_password: (reqRow as any).final_password ?? null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "server_error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");
    const { id } = await context.params;
    if (!id || !uuidRegex.test(id)) return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    const { times, submit } = body || {};
    if (!Array.isArray(times)) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

    // replace times
    await supabaseClient.from("onboarding_available_times").delete().eq("onboarding_request_id", id);
    if (times.length) {
      const rows = times.map((t: any) => ({
        onboarding_request_id: id,
        day_of_week: t.day_of_week,
        start_time: t.start_time,
        end_time: t.end_time,
        note: t.note ?? null,
      }));
      const { error: insErr } = await supabaseClient.from("onboarding_available_times").insert(rows);
      if (insErr) throw insErr;
    }

    let nextStatus: OnboardingState | undefined;
    if (submit) {
      const reqRow = await fetchRequest(id);
      const current = reqRow.step_status as OnboardingState;
      // 새 흐름: 세팅 가능 시간은 STEP4(서류 완료) 이후
      const allowed = ["step4_submitted", "step4_complete", "step5_submitted"];
      if (allowed.includes(current)) {
        const { error: stErr } = await supabaseClient
          .from("onboarding_requests")
          .update({ step_status: "step5_submitted" })
          .eq("id", id);
        if (stErr) throw stErr;
        nextStatus = "step5_submitted";
      } else {
        nextStatus = current;
      }
    }

    if (!nextStatus) {
      const reqRow = await fetchRequest(id);
      nextStatus = reqRow.step_status as OnboardingState;
    }

    return NextResponse.json({ ok: true, submitted: !!submit, step_status: nextStatus });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "server_error" }, { status: 500 });
  }
}
