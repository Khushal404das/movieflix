import { NextResponse } from "next/server";

export async function GET(req) {
  const sessionCookie = req.cookies.get("mf_session_verified");
  const isValid = Boolean(sessionCookie && sessionCookie.value);

  return NextResponse.json({
    verified: isValid,
    hasCookie: isValid
  });
}
