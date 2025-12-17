import { NextRequest, NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabaseClient";
import { isValidPhone, normalizePhone, OnboardingState } from "@/lib/onboarding";

const uuidRegex = /^[0-9a-fA-F-]{36}$/;

type StadiumPayload = Record<string, any>;

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
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }
    const reqRow = await fetchRequest(id);

    const { data: stadium, error: sErr } = await supabaseClient
      .from("onboarding_stadium_info")
      .select("*")
      .eq("onboarding_request_id", id)
      .maybeSingle();
    if (sErr && sErr.code !== "PGRST116") throw sErr;

    const { data: courts, error: cErr } = await supabaseClient
      .from("onboarding_court_info")
      .select("*")
      .eq("onboarding_request_id", id)
      .order("sort_order", { ascending: true });
    if (cErr) throw cErr;

    return NextResponse.json({ stadium: stadium || null, courts: courts || [], step_status: reqRow.step_status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "server_error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");
    const { id } = await context.params;
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }
    const body = await req.json().catch(() => ({}));
    const { stadium, courts, submit } = body || {};
    if (!stadium) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

    const required = ["region", "stadium_name", "address", "stadium_contact"];
    if (submit) {
      for (const key of required) {
        if (!stadium[key]) return NextResponse.json({ error: "missing_required", field: key }, { status: 400 });
      }
      if (stadium.stadium_contact && !isValidPhone(stadium.stadium_contact)) {
        return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
      }
    }

    const cleanStadium: StadiumPayload = {
      ...stadium,
      stadium_contact: stadium.stadium_contact ? normalizePhone(stadium.stadium_contact) : null,
      laundry_contact: stadium.laundry_contact ? normalizePhone(stadium.laundry_contact) : null,
      onboarding_request_id: id,
    };

    // upsert stadium_info (unique 1:1)
    const { error: upErr } = await supabaseClient
      .from("onboarding_stadium_info")
      .upsert(cleanStadium, { onConflict: "onboarding_request_id" });
    if (upErr) throw upErr;

    // replace courts
    await supabaseClient.from("onboarding_court_info").delete().eq("onboarding_request_id", id);
    if (Array.isArray(courts) && courts.length) {
      const rows = courts.map((c: any, idx: number) => ({
        onboarding_request_id: id,
        court_name: c.court_name ?? "",
        capacity: c.capacity ? Number(c.capacity) : null,
        play_time_minutes: null,
        size_x: c.size_x ? Number(c.size_x) : null,
        size_y: c.size_y ? Number(c.size_y) : null,
        floor_type: c.floor_type ?? "",
        indoor_outdoor: c.indoor_outdoor ?? "",
        sort_order: c.sort_order ?? idx,
      }));
      const { error: cInsErr } = await supabaseClient.from("onboarding_court_info").insert(rows);
      if (cInsErr) throw cInsErr;
    }

    let nextStatus: OnboardingState | undefined;
    if (submit) {
      const reqRow = await fetchRequest(id);
      const currentStatus = reqRow.step_status as OnboardingState;
      const allowedCurrent = ["step0_pending", "step0_approved", "step1_pending", "step1_need_fix", "step1_submitted", "step1_approved"];
      if (allowedCurrent.includes(currentStatus)) {
        const { error: stErr } = await supabaseClient
          .from("onboarding_requests")
          .update({ step_status: "step1_submitted" })
          .eq("id", id);
        if (stErr) throw stErr;
        nextStatus = "step1_submitted";
      } else {
        nextStatus = currentStatus;
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
