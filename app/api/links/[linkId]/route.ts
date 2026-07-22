import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";
import { updateLinkSchema, linkIdSchema } from "@/lib/validators/links.schems";
import { deleteFromCloudinary } from "@/lib/utils/cloudinary";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ linkId: string }> };

export async function GET(req: Request, { params }: Params) {
  const supabase = await createClient()
  const { linkId } = await params;
  const idCheck = linkIdSchema.safeParse({ linkId });
  if (!idCheck.success) return NextResponse.json({message: "Invalid link ID"}, { status: 422 });

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const { data: link, error: dbError } = await supabase
    .from("links")
    .select("*")
    .eq("id", linkId)
    .eq("owner", user!.id)
    .maybeSingle();

  if (dbError || !link) {
    return NextResponse.json({message: "Link not found."}, { status: 404 });
  }

  return NextResponse.json({link: "Link fetched successfully", res: link}, { status: 200});
}


export async function PATCH(req: Request, { params }: Params) {
  const supabase = await createClient();
  const { linkId } = await params;

  const idCheck = linkIdSchema.safeParse({ linkId });
  if (!idCheck.success) {
    return NextResponse.json({ message: "Invalid link ID" }, { status: 422 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = updateLinkSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = result.data;
  const updateFields: Record<string, unknown> = {};

  if (data.title !== undefined) updateFields.title = data.title;
  if (data.description !== undefined) updateFields.description = data.description;
  if (data.tags !== undefined) updateFields.tags = data.tags;

  if (data.isActive !== undefined) updateFields.is_active = data.isActive;
  if (data.expiresAt !== undefined) updateFields.expires_at = data.expiresAt;
  if (data.maxClicks !== undefined) updateFields.max_clicks = data.maxClicks;

  if (data.domain !== undefined) updateFields.domain = data.domain;

  if (data.utmSource !== undefined) updateFields.utm_source = data.utmSource;
  if (data.utmMedium !== undefined) updateFields.utm_medium = data.utmMedium;
  if (data.utmCampaign !== undefined) updateFields.utm_campaign = data.utmCampaign;

  // archive toggle — keep the boolean and its timestamp in sync
  if (data.archivedLink !== undefined) {
    updateFields.archived_link = data.archivedLink;
    updateFields.archived_at = data.archivedLink ? new Date().toISOString() : null;
  }

  // soft-delete toggle — same pairing pattern
  if (data.isDeleted !== undefined) {
    updateFields.is_deleted = data.isDeleted;
    updateFields.deleted_at = data.isDeleted ? new Date().toISOString() : null;
  }

  // password protection — only hash + store if a new password was actually sent
  if (data.isPasswordProtected !== undefined) {
    updateFields.is_password_protected = data.isPasswordProtected;

    if (data.isPasswordProtected && data.password) {
      updateFields.password_hash = await bcrypt.hash(data.password, 10);
    }

    if (data.isPasswordProtected === false) {
      updateFields.password_hash = null;
    }
  }

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json(
      { message: "No valid fields provided to update." },
      { status: 400 }
    );
  }

  updateFields.updated_at = new Date().toISOString();

  const { data: link, error: dbError } = await supabase
    .from("links")
    .update(updateFields)
    .eq("id", linkId)
    .eq("owner", user.id)
    .select()
    .maybeSingle();

  if (dbError || !link) {
    return NextResponse.json({ message: "Link not found." }, { status: 404 });
  }

  return NextResponse.json(
    { data: link, message: "Link updated successfully." },
    { status: 200 }
  );
}

export async function DELETE(req: Request, { params }: Params) {
  const supabase = await createClient()
  const { linkId } = await params;
  const idCheck = linkIdSchema.safeParse({ linkId });
  if (!idCheck.success) return NextResponse.json({message:"Invalid link ID"}, { status: 422 });

 const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const { data: link, error: dbError } = await supabase
    .from("links")
    .delete()
    .eq("id", linkId)
    .eq("owner", user!.id)
    .select()
    .maybeSingle();

  if (dbError || !link) {
    return NextResponse.json({ message:"Link not found."} , { status: 422 });
  }

  if (link.qr_code_public_id) {
    await deleteFromCloudinary(link.qr_code_public_id);
  }

  return NextResponse.json({ res: {}, message: "Link deleted successfully."}, { status: 200});
}





