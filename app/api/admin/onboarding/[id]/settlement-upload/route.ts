import { NextRequest, NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabaseClient";

const uuidRegex = /^[0-9a-fA-F-]{36}$/;
// 파일을 올릴 스토리지 버킷명 (현재 documents 버킷 사용)
const bucket = "documents";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!supabaseClient) throw new Error("Supabase 설정이 필요합니다.");
    const { id } = await context.params;
    if (!id || !uuidRegex.test(id)) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "file_required" }, { status: 400 });
    }

    const ext = (file as File).name?.split(".").pop() || "bin";
    const path = `${id}/settlement-${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabaseClient.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });
    if (uploadErr) throw uploadErr;

    const { data: publicUrlData } = supabaseClient.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "upload_error" }, { status: 500 });
  }
}
