import { NextRequest, NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabaseClient";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");
    const { id } = await context.params;
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });

    // 현재 이름 조회
    const { data: current, error: fetchError } = await supabaseClient
      .from("managers")
      .select("name")
      .eq("id", id)
      .single();
    if (fetchError) throw fetchError;

    const oldName = current.name;
    const newName = name.trim();

    // managers 테이블 업데이트
    const { error: updateError } = await supabaseClient
      .from("managers")
      .update({ name: newName })
      .eq("id", id);
    if (updateError) throw updateError;

    // onboarding_requests 일괄 업데이트
    await supabaseClient
      .from("onboarding_requests")
      .update({ manager: newName })
      .eq("manager", oldName);

    return NextResponse.json({ ok: true, name: newName });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");
    const { id } = await context.params;
    const { error } = await supabaseClient.from("managers").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
