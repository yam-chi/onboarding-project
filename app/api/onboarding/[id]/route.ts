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
        temp_code,
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
        other_services,
        memo,
        source,
        final_account,
        final_password,
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
