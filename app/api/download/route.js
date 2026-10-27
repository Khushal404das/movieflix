export const dynamic = "force-dynamic";

let cachedDownloadUrl = null;
let cacheExpiresAt = 0;

export async function GET() {
  try {
    const now = Date.now();
    // Return cached direct download URL if valid (cache for 15 minutes)
    if (cachedDownloadUrl && now < cacheExpiresAt) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: cachedDownloadUrl,
          "Cache-Control": "no-cache",
        },
      });
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "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";
    // Resolve asset dynamically from release v1.0.1
    let assetUrl = "https://api.github.com/repos/Khushal404das/movieflix/releases/assets/682565132";
    try {
      const relRes = await fetch("https://api.github.com/repos/Khushal404das/movieflix/releases/tags/v1.0.1", {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "MovieFlix-App/1.0",
        },
      });
      if (relRes.ok) {
        const releaseData = await relRes.json();
        const asset = releaseData.assets?.find((a) => a.name === "MovieFlix.apk");
        if (asset?.url) {
          assetUrl = asset.url;
        }
      }
    } catch (e) {
      console.warn("Dynamic asset resolution fallback:", e.message);
    }

    const assetRes = await fetch(assetUrl, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/octet-stream",
        "User-Agent": "MovieFlix-App/1.0",
      },
      redirect: "manual",
    });

    const downloadLocation = assetRes.headers.get("location");
    if (downloadLocation) {
      cachedDownloadUrl = downloadLocation;
      cacheExpiresAt = now + 15 * 60 * 1000; // 15 minutes

      return new Response(null, {
        status: 302,
        headers: {
          Location: downloadLocation,
          "Cache-Control": "no-cache",
        },
      });
    }

    const errorText = await assetRes.text().catch(() => "");
    console.error("GitHub API error:", assetRes.status, errorText);

    return new Response(
      `Download temporarily unavailable (${assetRes.status}). Please try again shortly.`,
      { status: 502, headers: { "Content-Type": "text/plain" } }
    );
  } catch (err) {
    console.error("Download route exception:", err);
    return new Response("Download error: " + err.message, { status: 500 });
  }
}
