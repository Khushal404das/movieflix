import { NextResponse } from "next/server";
import { searchTitles } from "@/lib/tmdb";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchTitles(q);
    return NextResponse.json({ results: results.slice(0, 8) });
  } catch (error) {
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
