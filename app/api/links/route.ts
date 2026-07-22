// app/api/links/route.ts
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateShortCode } from "@/lib/utils/generateShortCode";
import { generateQrCodeBuffer } from "@/lib/utils/generateQrCode";
import { uploadBufferToCloudinary } from "@/lib/utils/cloudinary";

// ---------- GET /api/links — list all of the current user's links ----------
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const archived = searchParams.get("archived"); // "true" | "false" | null
  const limit = Number(searchParams.get("limit") ?? 20);
  const offset = Number(searchParams.get("offset") ?? 0);

  let query = supabase
    .from("links")
    .select("*", { count: "exact" })
    .eq("owner", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (archived === "true") query = query.eq("archived_link", true);
  if (archived === "false") query = query.eq("archived_link", false);

  const { data, error, count } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data, count });
}

// ---------- POST /api/links — create a new link ----------
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { original_url, short_code } = body; // ← just these two for now

  if (!original_url || typeof original_url !== "string") {
    return Response.json({ error: "original_url is required" }, { status: 400 });
  }

  try {
    new URL(original_url);
  } catch {
    return Response.json({ error: "original_url is not a valid URL" }, { status: 400 });
  }

  const isCustomAlias = Boolean(short_code);
  const finalShortCode: string = isCustomAlias ? short_code : generateShortCode();
  

  if (isCustomAlias) {
    const { data: existing } = await supabase
      .from("links")
      .select("id")
      .eq("short_code", finalShortCode)
      .maybeSingle();

    if (existing) {
      return Response.json({ error: "This short code is already taken" }, { status: 409 });
    }
  }

  const finalDomain =
  process.env.NODE_ENV === "production" ? "snaplnk.io" : "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const shortUrl = `${protocol}://${finalDomain}/${finalShortCode}`;
  
  let qrCodeUrl = "";
  let qrCodePublicId = "";

  const qrBuffer = await generateQrCodeBuffer(shortUrl);
  if (qrBuffer) {
    try {
      const uploadResult = await uploadBufferToCloudinary(qrBuffer, "qrcodes");
      qrCodeUrl = uploadResult.secure_url;
      qrCodePublicId = uploadResult.public_id;
    } catch (uploadError) {
      console.error("Cloudinary upload failed:", uploadError);
    }
  }

  const { data, error } = await supabase
    .from("links")
    .insert({
      owner: user.id,
      original_url,
      short_code: finalShortCode,
      domain: finalDomain,
      is_custom_alias: isCustomAlias,
      qr_code_url: qrCodeUrl,
      qr_code_public_id: qrCodePublicId,
      // everything else uses your table's own defaults (title, tags, etc.)
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "This short code is already taken" }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data }, { status: 201 });
}