import { NextRequest, NextResponse } from "next/server";
import { deleteSearch, updateSearch, getSearchHistory } from "@/lib/supabase";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id);
  if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await getSearchHistory();
  const found = existing.find(r => r.id === numId);
  if (!found) return NextResponse.json({ error: "Record not found" }, { status: 404 });

  const result = await deleteSearch(numId);
  if (!result.success) return NextResponse.json({ error: result.error || "Delete failed" }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const existing = await getSearchHistory();
    const found = existing.find(r => r.id === numId);
    if (!found) return NextResponse.json({ error: "Record not found" }, { status: 404 });

    const body = await request.json();
    const { location, date_from, date_to, notes } = body;

    const update: Record<string, any> = {};

    if (location !== undefined) {
      if (!location) return NextResponse.json({ error: "Location cannot be empty" }, { status: 400 });
      update.city = location;
    }

    if (date_from !== undefined) {
      const from = new Date(date_from);
      if (isNaN(from.getTime())) return NextResponse.json({ error: "Invalid start date format" }, { status: 400 });
      update.date_from = date_from;
    }

    if (date_to !== undefined) {
      const to = new Date(date_to);
      if (isNaN(to.getTime())) return NextResponse.json({ error: "Invalid end date format" }, { status: 400 });
      update.date_to = date_to;
    }

    const finalFrom = date_from !== undefined ? date_from : found.date_from;
    const finalTo = date_to !== undefined ? date_to : found.date_to;
    if (finalFrom && finalTo && new Date(finalTo) < new Date(finalFrom)) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
    }

    if (notes !== undefined) {
      update.notes = notes || null;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await updateSearch(numId, update);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
