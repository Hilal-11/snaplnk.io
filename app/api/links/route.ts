// app/api/links/route.ts
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateShortCode } from "@/lib/utils/generateShortCode";
import { generateQrCodeBuffer } from "@/lib/utils/generateQrCode";
import { uploadBufferToCloudinary } from "@/lib/utils/cloudinary";
import { getClientIp } from "@/lib/getClientIp";
import { validateDestinationUrl } from "@/lib/validators/url";
import { limitLinkCreation, rateLimitHeaders } from "@/lib/ratelimit";
import { PUBLIC_LINK_COLUMNS } from "@/config/linkColumns";

// ---------- helpers ----------

const ALIAS_REGEX = /^[A-Za-z0-9_-]{3,30}$/;
const RESERVED_ALIASES = new Set([
  "api", "auth", "dashboard", "signup", "login", "logout", "pricing", "faq",
  "docs", "blog", "about", "terms", "privacy", "contact", "admin", "settings",
  "status", "health", "bio", "qr", "robots.txt", "sitemap.xml", "favicon.ico",
]);

const MAX_CODE_ATTEMPTS = 5;
const GUEST_LINK_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.VERCEL_URL ??
    "localhost:3000";

  if (/^https?:\/\//.test(raw)) return raw.replace(/\/+$/, "");
  const proto = /^(localhost|127\.)/.test(raw) ? "http" : "https";
  return `${proto}://${raw}`.replace(/\/+$/, "");
}

function clampInt(value: string | null, fallback: number, min: number, max: number) {
  const n = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

// ---------- GET /api/links — list the current user's links ----------
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Guests can create links but can't view the dashboard/list.
  if (user.is_anonymous) {
    return Response.json({ error: "Sign in required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const archived = searchParams.get("archived"); // "true" | "false" | null
  const deleted = searchParams.get("deleted"); // "true" -> only deleted; otherwise hide deleted
  const limit = clampInt(searchParams.get("limit"), 20, 1, 100);
  const offset = clampInt(searchParams.get("offset"), 0, 0, 1_000_000);

  let query = supabase
    .from("links")
    .select(PUBLIC_LINK_COLUMNS, { count: "exact" })
    .eq("owner", user.id)
    .eq("is_deleted", deleted === "true")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (archived === "true") query = query.eq("archived_link", true);
  if (archived === "false") query = query.eq("archived_link", false);

  const { data, error, count } = await query;

  if (error) {
    console.error("[GET /api/links]", error);
    return Response.json({ error: "Failed to fetch links" }, { status: 500 });
  }

  return Response.json(
    { data, count, limit, offset },
    { headers: { "Cache-Control": "private, no-store" } }
  );
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

  const isGuest = user.is_anonymous === true;

  // 1) Rate limit FIRST — cheapest check, before any parsing or DB work
  const rl = await limitLinkCreation({
    isGuest,
    ip: getClientIp(request),
    userId: user.id,
  });
  const rlHeaders = rateLimitHeaders(rl);

  if (!rl.allowed) {
    if (rl.unavailable) {
      return Response.json(
        { error: "Service temporarily unavailable. Please try again shortly." },
        { status: 503 }
      );
    }
    return Response.json(
      {
        error: isGuest
          ? "Too many links created. Please wait a bit or sign up for higher limits."
          : "Too many links created. Please try again later.",
      },
      { status: 429, headers: rlHeaders }
    );
  }

  // 2) Parse body safely
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400, headers: rlHeaders });
  }
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body" }, { status: 400, headers: rlHeaders });
  }

  const { original_url, short_code } = body as {
    original_url?: unknown;
    short_code?: unknown;
  };

  // 3) Validate destination URL
  if (typeof original_url !== "string") {
    return Response.json({ error: "original_url is required" }, { status: 400, headers: rlHeaders });
  }

  const baseUrl = getBaseUrl();
  const baseUrlObj = new URL(baseUrl);

  const urlCheck = validateDestinationUrl(original_url, {
    blockedHosts: [baseUrlObj.hostname, "snaplnk.io"],
  });
  if (!urlCheck.ok) {
    return Response.json({ error: urlCheck.error }, { status: 400, headers: rlHeaders });
  }

  // 4) Validate custom alias (if any)
  let customAlias: string | null = null;
  if (short_code !== undefined && short_code !== null && short_code !== "") {
    if (isGuest) {
      return Response.json(
        { error: "Sign up to use custom aliases" },
        { status: 403, headers: rlHeaders }
      );
    }
    if (typeof short_code !== "string" || !ALIAS_REGEX.test(short_code.trim())) {
      return Response.json(
        { error: "Alias must be 3-30 characters: letters, numbers, - or _" },
        { status: 400, headers: rlHeaders }
      );
    }
    const alias = short_code.trim();
    if (RESERVED_ALIASES.has(alias.toLowerCase())) {
      return Response.json({ error: "That alias is reserved" }, { status: 400, headers: rlHeaders });
    }
    customAlias = alias;
  }

  const isCustomAlias = customAlias !== null;
  const expiresAt = isGuest ? new Date(Date.now() + GUEST_LINK_TTL_MS).toISOString() : null;

  // 5) Insert. Uniqueness is enforced by the UNIQUE(short_code) constraint.
  //    (A SELECT pre-check is unreliable: RLS hides other users' rows from you.)
  let link: Record<string, any> | null = null;
  const attempts = isCustomAlias ? 1 : MAX_CODE_ATTEMPTS;

  for (let i = 0; i < attempts; i++) {
    const code = isCustomAlias ? (customAlias as string) : generateShortCode();

    const { data, error } = await supabase
      .from("links")
      .insert({
        owner: user.id,
        original_url: urlCheck.url,
        short_code: code,
        domain: baseUrlObj.host,
        is_custom_alias: isCustomAlias,
        expires_at: expiresAt,
      })
      .select(PUBLIC_LINK_COLUMNS)
      .single();

    if (!error) {
      link = data as unknown as Record<string, any>;
      break;
    }

    if (error.code === "23505") {
      if (isCustomAlias) {
        return Response.json(
          { error: "This short code is already taken" },
          { status: 409, headers: rlHeaders }
        );
      }
      continue; // random code collided, try another
    }

    console.error("[POST /api/links] insert failed:", error);
    return Response.json({ error: "Failed to create link" }, { status: 500, headers: rlHeaders });
  }

  if (!link) {
    return Response.json(
      { error: "Could not generate a unique short code. Please try again." },
      { status: 503, headers: rlHeaders }
    );
  }

  const shortUrl = `${baseUrl}/${link.short_code}`;

  // 6) QR code AFTER the insert: no orphaned Cloudinary uploads if insert fails,
  //    and a QR failure never blocks link creation.
  try {
    const qrBuffer = await generateQrCodeBuffer(shortUrl);
    if (qrBuffer) {
      const upload = await uploadBufferToCloudinary(qrBuffer, "qrcodes");

      const { data: updated, error: updateError } = await supabase
        .from("links")
        .update({
          qr_code_url: upload.secure_url,
          qr_code_public_id: upload.public_id,
        })
        .eq("id", link.id)
        .eq("owner", user.id)
        .select(PUBLIC_LINK_COLUMNS)
        .single();

      if (updateError) {
        console.error("[POST /api/links] QR update failed:", updateError);
      } else if (updated) {
        link = updated as unknown as Record<string, any>;
      }
    }
  } catch (qrError) {
    console.error("[POST /api/links] QR generation/upload failed:", qrError);
  }

  return Response.json({ data: link, short_url: shortUrl }, { status: 201, headers: rlHeaders });
}