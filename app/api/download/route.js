import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

let cachedApkUrl = null;
let cachedIpaUrl = null;
let cacheExpiresAt = 0;

export async function GET(request) {
  try {
    let platform = "android";
    try {
      const url = new URL(request.url, "http://localhost:3099");
      platform = (url.searchParams.get("platform") || "android").toLowerCase();
    } catch (e) {
      console.warn("URL parse fallback:", e);
    }
    const isIos = platform === "ios" || platform === "ipa" || platform === "apple";
    const targetAssetName = isIos ? "MovieFlix.ipa" : "MovieFlix.apk";
    const now = Date.now();

    // Return cached direct download URL if valid (cache for 15 minutes)
    if (now < cacheExpiresAt) {
      const cached = isIos ? cachedIpaUrl : cachedApkUrl;
      if (cached) {
        return NextResponse.redirect(cached, 302);
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
        cache: "no-store",
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

    // Direct asset URL fallback for v1.0.1
    if (!assetUrl) {
      assetUrl = isIos
        ? "https://api.github.com/repos/Khushal404das/movieflix/releases/assets/682794186"
        : "https://api.github.com/repos/Khushal404das/movieflix/releases/assets/684746398";
    }

    const assetRes = await fetch(assetUrl, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/octet-stream",
        "User-Agent": "MovieFlix-App/1.0",
      },
      redirect: "manual",
      cache: "no-store",
    });

    const downloadLocation = assetRes.headers.get("location");
    if (downloadLocation) {
      if (isIos) {
        cachedIpaUrl = downloadLocation;
      } else {
        cachedApkUrl = downloadLocation;
      }
      cacheExpiresAt = now + 15 * 60 * 1000;

      return NextResponse.redirect(downloadLocation, 302);
    }

    return new Response(
      `Asset download link temporarily unavailable (${assetRes.status}). Please try again shortly.`,
      { status: 502, headers: { "Content-Type": "text/plain" } }
    );
  } catch (err) {
    console.error("Download route exception:", err);
    return new Response("Download error: " + err.message, { status: 500 });
  }
}
