import { NextResponse } from "next/server";
import { getTitle, norm } from "@/lib/tmdb";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "movie";
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing title ID" }, { status: 400 });
  }

  try {
    const raw = await getTitle(type, id);
    if (!raw) {
      return NextResponse.json({ error: "Title not found" }, { status: 404 });
    }
    const normalized = norm(raw, type);
    return NextResponse.json({
      raw,
      normalized
    });
  } catch (err) {
    console.error("Error fetching title details:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
