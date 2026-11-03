export const dynamic = "force-dynamic";

const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "movie";
    const id = searchParams.get("id");
    const s = searchParams.get("s") || "1";
    const e = searchParams.get("e") || "1";

    if (!id) {
      return new Response("Missing id parameter", { status: 400 });
    }

    // Build VidBolt upstream URL
    let upstreamPath = "";
    if (type === "anime-mal") {
      upstreamPath = `/anime/mal/${id}/${e}`;
    } else if (type === "anime" || type === "anilist") {
      upstreamPath = `/anime/${id}/${e}`;
    } else if (type === "tv") {
      upstreamPath = `/tv/${id}/${s}/${e}`;
    } else {
      upstreamPath = `/movie/${id}`;
    }

    // Forward relevant query parameters
    const query = new URLSearchParams();
    searchParams.forEach((value, key) => {
      if (!["type", "id", "s", "e"].includes(key)) {
        query.set(key, value);
      }
    });
    if (!query.has("theme")) query.set("theme", "E50914");
    if (!query.has("autoPlay")) query.set("autoPlay", "true");

    const qs = query.toString();
    const upstreamUrl = `https://vidbolt.pro${upstreamPath}${qs ? `?${qs}` : ""}`;

    // Fetch upstream player HTML with whitelisted headers
    const res = await fetch(upstreamUrl, {
      headers: {
        "User-Agent": DESKTOP_UA,
        "Referer": "https://nippleflix.com/",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return new Response(`Upstream player returned ${res.status}`, {
        status: res.status,
      });
    }

    let html = await res.text();

    // 1. Set base href so VidBolt assets, icons, fonts resolve cleanly
    const securityHeadPatch = `
<head>
  <base href="https://vidbolt.pro/">
  <script>
    // Mock ancestorOrigins to a whitelisted domain
    try {
      Object.defineProperty(location, 'ancestorOrigins', {
        get: function() { return ['https://nippleflix.com']; }
      });
    } catch(e) {}
    // Trap popup attempts
    window.open = function() { return null; };
  </script>
`;
    html = html.replace("<head>", securityHeadPatch);

    // 2. Strip ad script loader array so p-hOrrD7Yy.js NEVER loads
    html = html.replace(
      '[{"src":"/player/p-hOrrD7Yy.js","cfasync":false}]',
      "[]"
    );
    html = html.replace(/\/player\/p-hOrrD7Yy\.js/g, "");

    // 3. Disable anti-debugging timer in VidBolt
    html = html.replace(
      /var a=performance\.now\(\);debugger;/g,
      "var a=performance.now();"
    );

    // 4. Route stream resolve call through our reverse-proxy
    html = html.replace(
      "fetch('/api/resolve?",
      "fetch('/api/player/vidbolt/resolve?"
    );

    // 5. Rewrite local script paths to load from vidbolt.pro
    html = html.replace(/src="\/player\//g, 'src="https://vidbolt.pro/player/');

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Frame-Options": "SAMEORIGIN",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("[Vidbolt Proxy Error]:", err);
    return new Response("Error loading player", { status: 500 });
  }
}
