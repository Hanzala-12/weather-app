import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const { id } = await params;

  const { error } = await supabase
    .from("weather_searches")
    .delete()
    .eq("id", parseInt(id));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
