export const dynamic = "force-dynamic";

const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "movie";
    const id = searchParams.get("id");
    const season = searchParams.get("season") || searchParams.get("s");
    const episode = searchParams.get("episode") || searchParams.get("e");

    const qs = searchParams.toString();
    const upstreamResolveUrl = `https://vidbolt.pro/api/resolve?${qs}`;

    // Construct valid referer based on content type
    let referer = `https://vidbolt.pro/movie/${id || "1"}`;
    if (type === "tv" && id) {
      referer = `https://vidbolt.pro/tv/${id}/${season || "1"}/${episode || "1"}`;
    }

    const res = await fetch(upstreamResolveUrl, {
      headers: {
        "User-Agent": DESKTOP_UA,
        "Referer": referer,
        "Origin": "https://vidbolt.pro",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
        "Accept": "*/*",
      },
      next: { revalidate: 120 },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Failed to resolve stream" }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("[Vidbolt Resolve Proxy Error]:", err);
    return new Response(JSON.stringify({ error: "Internal resolve error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
