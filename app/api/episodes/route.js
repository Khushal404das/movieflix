import { NextResponse } from "next/server";
import { getSeasonEpisodes } from "@/lib/tmdb";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const season = searchParams.get("season") || "1";

  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  try {
    const data = await getSeasonEpisodes(id, season);
    return NextResponse.json(data || { episodes: [] });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch episodes" }, { status: 500 });
  }
}
