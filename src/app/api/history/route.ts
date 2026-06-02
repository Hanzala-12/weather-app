import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  if (!supabase) return NextResponse.json([]);
  const { data } = await supabase
    .from("weather_searches")
    .select("*")
    .order("searched_at", { ascending: false })
    .limit(50);
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  try {
    const body = await request.json();
    const { city, country, temperature, condition, humidity, wind_speed, icon, date_from, date_to, notes } = body;

    if (!city) return NextResponse.json({ error: "City is required" }, { status: 400 });

    if (date_from && date_to) {
      const from = new Date(date_from);
      const to = new Date(date_to);
      if (isNaN(from.getTime()) || isNaN(to.getTime()))
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
      if (to < from)
        return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("weather_searches")
      .insert({ city, country, temperature, condition, humidity, wind_speed, icon, date_from, date_to, notes })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
