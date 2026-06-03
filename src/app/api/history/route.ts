import { NextResponse } from "next/server";
import { saveSearch, getSearchHistory } from "@/lib/supabase";

function mapRow(row: any) {
  return {
    id: String(row.id),
    location: row.city,
    startDate: row.date_from || "",
    endDate: row.date_to || "",
    notes: row.notes || "",
  };
}

export async function GET() {
  const data = await getSearchHistory();
  return NextResponse.json(data.map(mapRow));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { location, date_from, date_to, notes } = body;

    if (!location) return NextResponse.json({ error: "Location is required" }, { status: 400 });

    if (date_from && date_to) {
      const from = new Date(date_from);
      const to = new Date(date_to);
      if (isNaN(from.getTime()) || isNaN(to.getTime()))
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
      if (to < from)
        return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
    }

    if (date_from && !date_to) {
      const from = new Date(date_from);
      if (isNaN(from.getTime()))
        return NextResponse.json({ error: "Invalid start date format" }, { status: 400 });
    }

    if (!date_from && date_to) {
      const to = new Date(date_to);
      if (isNaN(to.getTime()))
        return NextResponse.json({ error: "Invalid end date format" }, { status: 400 });
    }

    const record = await saveSearch({
      city: location,
      date_from: date_from || undefined,
      date_to: date_to || undefined,
      notes: notes || undefined,
    });

    return NextResponse.json(mapRow(record), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
