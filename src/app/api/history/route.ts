import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  if (!supabase) {
    return NextResponse.json([]);
  }
  const { data } = await supabase
    .from("weather_searches")
    .select("*")
    .order("searched_at", { ascending: false })
    .limit(20);
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }
  try {
    const body = await request.json();
    const { city, country, temperature, condition, humidity, wind_speed, icon } = body;

    if (!city) {
      return NextResponse.json({ error: "City is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("weather_searches")
      .insert({ city, country, temperature, condition, humidity, wind_speed, icon })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
