export const dynamic = "force-dynamic";

let cachedApkUrl = null;
let cachedIpaUrl = null;
let cacheExpiresAt = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = (searchParams.get("platform") || "android").toLowerCase();
    const isIos = platform === "ios" || platform === "ipa" || platform === "apple";
    const targetAssetName = isIos ? "MovieFlix.ipa" : "MovieFlix.apk";
    const now = Date.now();

    // Return cached direct download URL if valid (cache for 15 minutes)
    if (now < cacheExpiresAt) {
      const cached = isIos ? cachedIpaUrl : cachedApkUrl;
      if (cached) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: cached,
            "Cache-Control": "no-cache",
          },
        });
      }
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "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";
    let assetUrl = null;

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
        const asset = releaseData.assets?.find((a) => a.name === targetAssetName);
        if (asset?.url) {
          assetUrl = asset.url;
        }
      }
    } catch (e) {
      console.warn("Dynamic asset resolution fallback:", e.message);
    }

    if (!assetUrl) {
      const fallbackUrl = `https://github.com/Khushal404das/movieflix/releases/download/v1.0.1/${targetAssetName}`;
      return new Response(null, {
        status: 302,
        headers: {
          Location: fallbackUrl,
          "Cache-Control": "no-cache",
        },
      });
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
      if (isIos) {
        cachedIpaUrl = downloadLocation;
      } else {
        cachedApkUrl = downloadLocation;
      }
      cacheExpiresAt = now + 15 * 60 * 1000;

      return new Response(null, {
        status: 302,
        headers: {
          Location: downloadLocation,
          "Cache-Control": "no-cache",
        },
      });
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: `https://github.com/Khushal404das/movieflix/releases/download/v1.0.1/${targetAssetName}`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Download route exception:", err);
    return new Response("Download error: " + err.message, { status: 500 });
  }
}
