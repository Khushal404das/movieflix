import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// The app files are assets on the GitHub release below. This route sends the
// visitor straight to GitHub's public download link for them.
//
// It used to look the file up through the GitHub API first. That API allows
// only 60 calls an hour per address, and Cloudflare's servers share addresses,
// so the limit ran out and downloads failed with a 502. It also cached
// GitHub's signed file link for 15 minutes, longer than that link stays
// valid, so slow or resumed phone downloads failed part-way.
// github.com/.../releases/download/... needs no API call: GitHub makes a
// fresh signed link on every request, and it supports resuming.
const RELEASE_TAG = "v1.0.1";
const RELEASE_BASE = `https://github.com/Khushal404das/movieflix/releases/download/${RELEASE_TAG}`;

export async function GET(request) {
  let platform = "android";
  try {
    platform = (new URL(request.url).searchParams.get("platform") || "android").toLowerCase();
  } catch {}

  const isIos = platform === "ios" || platform === "ipa" || platform === "apple";
  const file = isIos ? "MovieFlix.ipa" : "MovieFlix.apk";

  const res = NextResponse.redirect(`${RELEASE_BASE}/${file}`, 302);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
