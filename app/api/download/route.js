import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "downloads", "MovieFlix.apk");
    if (!fs.existsSync(filePath)) {
      return new NextResponse("APK file not found", { status: 404 });
    }
    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": 'attachment; filename="MovieFlix.apk"',
        "Content-Length": String(fileBuffer.length),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("Download error:", err);
    return new NextResponse("Download error", { status: 500 });
  }
}
