// Ad network tags for movieflix.stream. Shared by server (app/layout.js) and client.

export const ADS_PREF_KEY = "movieflix_ads_enabled";
export const ADS_OFF_CLASS = "ads-off";

// Which network fills the in-page <AdBanner> slots: "adsense" or "adsterra".
export const AD_PROVIDER = "adsterra";

// Hides every Adsterra slot (banners and native ad). Adsterra stopped sending
// ads to movieflix.stream in Nov 2026: their exact tag, placed straight on the
// page, loads and draws nothing, which left an empty white box. Set back to
// false once Adsterra serves ads again.
export const ADSTERRA_SLOTS_HIDDEN = true;

// ── Google AdSense ──────────────────────────────────────────────────────────
export const ADSENSE_CLIENT = "ca-pub-2554738343060277";
export const ADSENSE_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;

// Ad units created in the AdSense dashboard (Ads → By ad unit). `variant` names
// match <AdBanner variant="…">.
export const ADSENSE_UNITS = {
  display: { slot: "9310142017", format: "auto" }, // "display" — responsive
  displayAlt: { slot: "3887683816", format: "auto" }, // "unit ads" — responsive
  inArticle: { slot: "9391079242", format: "fluid", layout: "in-article" },
  inArticleAlt: { slot: "4268128620", format: "fluid", layout: "in-article" },
  inFeed: { slot: "1511543046", format: "fluid", layoutKey: "-ef+6k-30-ac+ty" },
  multiplex: { slot: "6572298038", format: "autorelaxed" },
};

// ── Adsterra ────────────────────────────────────────────────────────────────
const BANNER_HOST = "https://bancadeltempoidea.org";

// IFRAME SYNC display banners (key → size). Only units that are Active in the
// Adsterra dashboard are listed. The 300x250, 160x600 and 160x300 units are
// Inactive there (Nov 2026) and serve nothing; add them back here once they
// are resubmitted and Active again:
//   "300x250": { key: "d4ec7142730c9af8354c2261d9ec5178", width: 300, height: 250 },
//   "160x600": { key: "28db922dc28d2cff1ff9585e3d6b0868", width: 160, height: 600 },
//   "160x300": { key: "d930293a74da3f746b507a94a10bad7c", width: 160, height: 300 },
export const BANNERS = {
  "728x90": { key: "e53e7807a20e6b0038715f4c7df9c6c5", width: 728, height: 90 },
  "468x60": { key: "20e19952987074257464ba67b02577ef", width: 468, height: 60 },
  "320x50": { key: "6b3381005a5c046ab7ef11496c2480ba", width: 320, height: 50 },
};

export const bannerScriptSrc = (key) => `${BANNER_HOST}/22/${key}`;

// NATIVE ASYNC (one per page — its container id is fixed)
export const NATIVE_KEY = "cf80adbf1b8838f692424daf4d9825bb";
export const NATIVE_SRC = `${BANNER_HOST}/21/${NATIVE_KEY}`;
export const NATIVE_CONTAINER_ID = `container-${NATIVE_KEY}`;

// No page-level tags: the Adsterra pop-under and social bar were removed after
// Google Search Console flagged the site for "Deceptive pages" (Nov 2026).
// They open new tabs on clicks and can show fake alerts and notification
// prompts. Only the in-page banners above are used.

// Runs in <head> before the page paints. Only toggles a class on <html>
// (no DOM insertion, so React hydration is unaffected) and, with ads off,
// pauses AdSense before adsbygoogle.js loads so it requests nothing (the
// script tag itself must stay on every page: Google uses it to verify the
// site).
export const ADS_BOOTSTRAP_SCRIPT = `(function(){try{if(sessionStorage.getItem(${JSON.stringify(
  ADS_PREF_KEY
)})==="0"){document.documentElement.classList.add(${JSON.stringify(
  ADS_OFF_CLASS
)});(window.adsbygoogle=window.adsbygoogle||[]).pauseAdRequests=1;}}catch(e){}})();`;
