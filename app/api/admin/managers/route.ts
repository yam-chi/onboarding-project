import { NextRequest, NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabaseClient";

export async function GET() {
  try {
    if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");
    const { data, error } = await supabaseClient
      .from("managers")
      .select("id, name, created_at")
      .order("created_at");
    if (error) throw error;
    return NextResponse.json({ managers: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
    const { data, error } = await supabaseClient
      .from("managers")
      .insert({ name: name.trim() })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ manager: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
