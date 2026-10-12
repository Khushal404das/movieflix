import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing Turnstile verification token" },
        { status: 400 }
      );
    }

    const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Cloudflare Turnstile secret key is not configured in server environment." 
        },
        { status: 500 }
      );
    }

    // Call Cloudflare's official siteverify endpoint
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);

    const clientIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for");
    if (clientIp) {
      formData.append("remoteip", clientIp.split(",")[0].trim());
    }

    const cfRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    const cfData = await cfRes.json();

    if (!cfData.success) {
      console.warn("Cloudflare Turnstile verification failed:", cfData["error-codes"]);
      return NextResponse.json(
        { 
          success: false, 
          error: "Cloudflare bot verification failed. Please try again.",
          errorCodes: cfData["error-codes"]
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, hostname: cfData.hostname });
  } catch (err) {
    console.error("Turnstile verification error:", err);
    return NextResponse.json(
      { success: false, error: "Internal error verifying Turnstile token" },
      { status: 500 }
    );
  }
}
