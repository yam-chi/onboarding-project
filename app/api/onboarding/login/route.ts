import { NextRequest, NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabaseClient";
import { statusToPath, OnboardingState } from "@/lib/onboarding";

export async function POST(req: NextRequest) {
  try {
    if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");
    const body = await req.json().catch(() => ({}));
    const { temp_code, temp_password } = body || {};
    if (!temp_code || !temp_password) {
      return NextResponse.json({ error: "missing_credentials" }, { status: 400 });
    }
    const { data, error } = await supabaseClient
      .from("onboarding_requests")
      .select("id, step_status")
      .eq("temp_code", temp_code)
      .eq("temp_password", temp_password)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const path = statusToPath(data.id, data.step_status as OnboardingState);
    return NextResponse.json({ id: data.id, step_status: data.step_status, path });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "server_error" }, { status: 500 });
  }
}
