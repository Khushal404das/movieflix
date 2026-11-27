import { headers } from "next/headers";

// True when the visitor got here by clicking a link inside MovieFlix (a
// client-side navigation, or a full load with a movieflix.stream referrer).
// Those visitors go straight to the player. Visitors arriving from search
// engines, social links or typed URLs, and crawlers, get the title page.
export function cameFromInsideSite() {
  const h = headers();
  if (h.get("rsc") === "1" || h.get("next-router-prefetch")) return true;
  const referer = h.get("referer");
  if (!referer) return false;
  try {
    const refHost = new URL(referer).host;
    const host = h.get("x-forwarded-host") || h.get("host");
    return Boolean(host) && refHost === host;
  } catch {
    return false;
  }
}
