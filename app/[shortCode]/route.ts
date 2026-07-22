import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseClickInfo } from "@/lib/utils/parseClickInfo";

type Params = { params: Promise<{ shortCode: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { shortCode } = await params;
  const supabase = await createClient();

  const { data: link } = await supabase
    .from("links")
    .select("*")
    .eq("short_code", shortCode)
    .eq("is_active", true)
    .eq("is_deleted", false)
    .maybeSingle();

  if (!link) {
    return NextResponse.redirect(new URL("/not-found", request.url));
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.redirect(new URL("/expired", request.url));
  }

  if (link.max_clicks && link.clicks_count >= link.max_clicks) {
    return NextResponse.redirect(new URL("/expired", request.url));
  }

  const response = NextResponse.redirect(link.original_url, 302);

  logClick(supabase, link.id, request).catch((err) =>
    console.error("Click logging failed:", err)
  );

  return response;
}

async function logClick(
  supabase: Awaited<ReturnType<typeof createClient>>,
  linkId: string,
  request: NextRequest
) {
  const clickInfo = parseClickInfo(request);

  await supabase.from("click_events").insert({
    link_id: linkId,
    ...clickInfo,
  });

  // only count real, non-bot visits toward the click counter
  if (!clickInfo.is_bot) {
    await supabase.rpc("increment_clicks", { p_link_id: linkId });
  }
}