import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const TERM_KEYS = ["service", "privacy", "thirdparty", "marketing", "operation"];

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!,
  );
}

export async function GET() {
  try {
    const supabase = getServiceClient();
    const urls: Record<string, string | null> = {};
    for (const key of TERM_KEYS) {
      const path = `terms/${key}.pdf`;
      const { data } = supabase.storage.from("onboarding").getPublicUrl(path);
      // Check if file actually exists
      const { error } = await supabase.storage.from("onboarding").download(path);
      urls[key] = error ? null : data.publicUrl;
    }
    return NextResponse.json({ urls });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceClient();
    const formData = await req.formData();
    const uploaded: Record<string, string> = {};

    for (const key of TERM_KEYS) {
      const file = formData.get(key) as File | null;
      if (!file) continue;
      const path = `terms/${key}.pdf`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error } = await supabase.storage
        .from("onboarding")
        .upload(path, buffer, { contentType: "application/pdf", upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("onboarding").getPublicUrl(path);
      uploaded[key] = data.publicUrl;
    }

    return NextResponse.json({ ok: true, uploaded });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
