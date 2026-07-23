import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { feedbackSchema } from "@/lib/validators/links.schems";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "You need to be signed in to send feedback." },
      { status: 401 }
    );
  }

  const body = await request.json()
  const result = feedbackSchema.safeParse(body);

   if (!result.success) {
    return NextResponse.json(
      {
        message: "Validation failed.",
        errors: result.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }
  
  const { data, error } = await supabase
    .from("feedback")
    .insert({
      user_id: user.id,
      type: result.data.type,
      title: result.data.title,
      message: result.data.message,
      rating: result.data.rating,
      page_url: result.data.pageUrl,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      {
        message: "Failed to submit feedback.",
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      message: "Thank you for your feedback!",
      data,
    },
    { status: 201 }
  );
  
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { message: "You need to be signed in to view feedback." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);

  const status = searchParams.get("status");
  const limit = Number(searchParams.get("limit") ?? 20);
  const offset = Number(searchParams.get("offset") ?? 0);

  let query = supabase
    .from("feedback")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to fetch feedback.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      feedback: data,
      count,
    },
    { status: 200 }
  );
}