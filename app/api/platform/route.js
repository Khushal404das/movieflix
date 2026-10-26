import { NextResponse } from "next/server";
import { getDiscover } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId") || "";
    const mediaType  = searchParams.get("media") === "tv" ? "tv" : "movie";
    const genre      = searchParams.get("genre") || "";
    const sort       = searchParams.get("sort") || "popularity.desc";
    const page       = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

    const data = await getDiscover(
      mediaType,
      genre,
      page,
      sort,
      "",
      providerId
    );

    return NextResponse.json({
      success: true,
      results: data.results || [],
      totalPages: Math.min(data.total_pages || 1, 500),
      page: data.page || page,
    });
  } catch (err) {
    console.error("API /api/platform error:", err);
    return NextResponse.json(
      { success: false, error: err.message, results: [] },
      { status: 500 }
    );
  }
}
