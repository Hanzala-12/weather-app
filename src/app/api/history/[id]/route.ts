import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  const { id } = await params;
  const { error } = await supabase.from("weather_searches").delete().eq("id", parseInt(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  try {
    const { id } = await params;
    const body = await request.json();
    const { notes } = body;

    const { error } = await supabase
      .from("weather_searches")
      .update({ notes: notes || null })
      .eq("id", parseInt(id));

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
