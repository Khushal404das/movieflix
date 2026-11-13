// Google AdSense tags for movieflix.stream. Shared by server (app/layout.js) and client.

export const ADS_PREF_KEY = "movieflix_ads_enabled";
export const ADS_OFF_CLASS = "ads-off";

export const ADSENSE_CLIENT = "ca-pub-2554738343060277";
export const ADSENSE_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;

// Ad units created in the AdSense dashboard (Ads → By ad unit). Keys match
// <AdBanner variant="…"> / <AdSenseAd unit="…">.
export const ADSENSE_UNITS = {
  display: { slot: "9310142017", format: "auto" }, // "display" — responsive
  displayAlt: { slot: "3887683816", format: "auto" }, // "unit ads" — responsive
  inArticle: { slot: "9391079242", format: "fluid", layout: "in-article" },
  inArticleAlt: { slot: "4268128620", format: "fluid", layout: "in-article" },
  inFeed: { slot: "1511543046", format: "fluid", layoutKey: "-ef+6k-30-ac+ty" },
  multiplex: { slot: "6572298038", format: "autorelaxed" },
};

// Runs in <head> before the page paints. Only toggles a class on <html>
// (no DOM insertion, so React hydration is unaffected) and, with ads off,
// pauses AdSense before adsbygoogle.js loads so it requests nothing. The
// script tag itself stays on every page: Google uses it to verify the site.
export const ADS_BOOTSTRAP_SCRIPT = `(function(){try{if(sessionStorage.getItem(${JSON.stringify(
  ADS_PREF_KEY
)})==="0"){document.documentElement.classList.add(${JSON.stringify(
  ADS_OFF_CLASS
)});(window.adsbygoogle=window.adsbygoogle||[]).pauseAdRequests=1;}}catch(e){}})();`;
