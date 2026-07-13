import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 30;

const uuidRegex = /^[0-9a-fA-F-]{36}$/;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE!;
  return createClient(url, key);
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }

    const supabase = getServiceClient();
    const formData = await req.formData();

    const docTypes = ["business_registration", "bankbook", "lease_contract"];
    const uploadedUrls: Record<string, string> = {};

    for (const docType of docTypes) {
      const file = formData.get(docType) as File | null;
      if (!file) continue;

      const ext = file.name.split(".").pop() || "jpg";
      const path = `documents/${id}/${docType}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from("onboarding")
        .upload(path, buffer, { contentType: file.type, upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("onboarding").getPublicUrl(path);
      uploadedUrls[docType] = urlData.publicUrl;
    }

    // completed_sections 업데이트
    const { data: current } = await supabase
      .from("onboarding_requests")
      .select("completed_sections")
      .eq("id", id)
      .single();

    const completed: string[] = current?.completed_sections || [];
    if (!completed.includes("documents")) completed.push("documents");

    await supabase
      .from("onboarding_requests")
      .update({ completed_sections: completed, document_urls: uploadedUrls })
      .eq("id", id);

    return NextResponse.json({ completed_sections: completed, urls: uploadedUrls });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "server_error" }, { status: 500 });
  }
}
