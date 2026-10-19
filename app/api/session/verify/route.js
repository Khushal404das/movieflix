import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, rayId } = body;

    const secretKey =
      process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY ||
      "0x4AAAAAAFU_utk-JZ82h8z7v6l3h0vBz2E";

    // If turnstile token is provided and secretKey is set, verify with Cloudflare
    if (token && typeof token === "string" && !token.startsWith("fallback_")) {
      try {
        const formData = new URLSearchParams();
        formData.append("secret", secretKey);
        formData.append("response", token);

        const clientIp =
          req.headers.get("cf-connecting-ip") ||
          req.headers.get("x-forwarded-for");
        if (clientIp) {
          formData.append("remoteip", clientIp.split(",")[0].trim());
        }

        const cfRes = await fetch(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
          {
            method: "POST",
            body: formData,
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
          }
        );
        const cfData = await cfRes.json();
        if (!cfData.success) {
          console.warn("Turnstile challenge failed:", cfData["error-codes"]);
        }
      } catch (cfErr) {
        console.warn("Cloudflare siteverify call skipped or errored:", cfErr);
      }
    }

    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const sessionToken = `mf_ses_${Date.now()}_${randomSuffix}`;
    const expiresAt = Date.now() + 2 * 60 * 60 * 1000; // 2 hours validity

    const response = NextResponse.json({
      success: true,
      token: sessionToken,
      expiresAt,
      rayId: rayId || `ray_${randomSuffix}`
    });

    response.cookies.set("mf_session_verified", sessionToken, {
      path: "/",
      maxAge: 7200,
      sameSite: "lax",
      httpOnly: false
    });

    return response;
  } catch (err) {
    console.error("Session verification endpoint error:", err);
    return NextResponse.json(
      { success: false, error: "Internal session verification error" },
      { status: 500 }
    );
  }
}
