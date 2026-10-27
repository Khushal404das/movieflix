import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. If local APK exists and is accessible (e.g. running locally via Next.js)
    const localPath = path.join(process.cwd(), "reelhouse_flutter", "build", "app", "outputs", "flutter-apk", "app-release.apk");
    if (fs.existsSync(localPath) && process.env.NODE_ENV !== "production") {
      const fileBuffer = fs.readFileSync(localPath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/vnd.android.package-archive",
          "Content-Disposition": 'attachment; filename="MovieFlix.apk"',
          "Content-Length": String(fileBuffer.length),
        },
      });
    }

    // 2. In Cloudflare Workers / Edge / Production, redirect directly to GitHub Release pre-signed S3 download
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "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";
    const assetRes = await fetch("https://api.github.com/repos/Khushal404das/movieflix/releases/assets/681529812", {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/octet-stream",
      },
      redirect: "manual",
    });

    const downloadLocation = assetRes.headers.get("location");
    if (downloadLocation) {
      return NextResponse.redirect(downloadLocation, 302);
    }

    return new NextResponse("Download redirect unavailable", { status: 502 });
  } catch (err) {
    console.error("Download error:", err);
    return new NextResponse("Download error: " + err.message, { status: 500 });
  }
}
