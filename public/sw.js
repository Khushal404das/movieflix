// MovieFlix PWA Service Worker — AdGuard Network-Level Ad Blocker v2
// Blocks 150+ ad/tracker/miner domains at the network layer (before any script runs)
const CACHE_NAME = "movieflix-v2";
const STATIC_ASSETS = ["/", "/home", "/favicon.svg", "/favicon.ico", "/icon-192.png", "/icon-512.png", "/manifest.json"];

// ============================================================
// ADGUARD-STYLE BLOCKED DOMAINS (Network Layer)
// ============================================================
const AD_BLOCKED_DOMAINS = [
  // Popunder / Popup Networks
  "amuyontraiked.com","popcash.net","popads.net","popunder.net","trafficjunky.net",
  "trafficstars.com","clickadu.com","adcash.com","clickaine.com","adskeeper.co.uk",
  "adskeeper.com","bidvertiser.com","hilltopads.net","zeropark.com","revcontent.com",
  "mgid.com","taboola.com","outbrain.com","adblade.com",
  // Push Notification Networks
  "push-sdk.com","pushground.com","pushcrew.com","pushengage.com","sendpulse.com",
  "gravitypush.com","subscribers.com","web-push-notifications.com","aimtell.com",
  "pushprime.com","pushmonkey.com","cleverpush.com","pushwoosh.com",
  // Google Ads Ecosystem
  "googlesyndication.com","doubleclick.net","googleadservices.com",
  "pagead2.googlesyndication.com","adservice.google.com","ads.google.com",
  "googleads.g.doubleclick.net","stats.g.doubleclick.net","cm.g.doubleclick.net",
  "ad.doubleclick.net","pubads.g.doubleclick.net",
  // Major Ad Networks
  "adsterra.com","propellerads.com","monetag.com","hilltopads.com","exoclick.com",
  "juicyads.com","trafficfactory.biz","adxpansion.com","ero-advertising.com",
  "plugrush.com","adsupply.com","cpmrevenue.com","adnium.com","adspyglass.com",
  // Streaming Site Ad Networks
  "alwingulla.com","videosframe.com","fusedns.cc","flaconet.com","hlsplay.net",
  "mxembed.cc","dtacdn.com","yodex.top",
  // Trackers & Analytics
  "histats.com","statcounter.com","clicktale.net","hotjar.com","fullstory.com",
  "mouseflow.com","smartlook.com","crazyegg.com","quantserve.com",
  "scorecardresearch.com","comscore.com","chartbeat.com","parsely.com",
  // Crypto Miners
  "coinhive.com","coin-hive.com","minero.cc","cryptoloot.pro","jsecoin.com",
  "monerominer.rocks","webmine.cz","minemytraffic.com","ppoi.org","afmining.com",
  "coinpirate.cf","coinnebula.com",
  // Redirect / Link-jacking
  "adf.ly","bc.vc","linkbucks.com","revenuemantra.com","adfoc.us","sh.st",
  "ouo.io","exe.io","cety.app","gplinks.in","shrinkme.io","clk.sh","za.gl",
  "fc.lc","clk.asia","shortzon.com","linkvertise.com","cuty.io",
  // Programmatic / RTB
  "openx.net","openx.com","rubiconproject.com","pubmatic.com","appnexus.com",
  "adsrvr.org","advertising.com","yieldmanager.com","adroll.com","criteo.com",
  "criteo.net","turn.com","adbuffs.com","adbutler.com","bidswitch.net","lijit.com",
  "sonobi.com","sharethrough.com","triplelift.com","undertone.com","xaxis.com",
  "yieldlab.net","yieldlab.com","emxdgt.com","liveintent.com","nativeads.com",
  "adtelligent.com","beachfront.com","springserve.com","spotx.tv","spotxchange.com",
  "teads.tv","yume.com","innovid.com","tremormedia.com","brightroll.com",
  "moatads.com","flashtalking.com","smartadserver.com","adsafeprotected.com","mediavine.com",
  // Misc malware/rogue
  "cookiescript.cc","reklama.ru","adverticum.net","crickex.com","1xbet.com",
  "bet365.com","betwinner.com","betyetu.ug","shareasale.com","clickbank.net",
];

// URL path patterns that signal ad scripts
const BAD_PATH_PATTERNS = [
  "popunder","popad","push-notification","coinminer","cryptominer",
  "mining.js","miner.min.js","/ads.js","/ad.js","advertisement","banner-ad","popup-ad"
];

function isAdRequest(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    for (let i = 0; i < AD_BLOCKED_DOMAINS.length; i++) {
      const d = AD_BLOCKED_DOMAINS[i];
      if (hostname === d || hostname.endsWith("." + d)) return true;
    }
    const lower = url.toLowerCase();
    for (let i = 0; i < BAD_PATH_PATTERNS.length; i++) {
      if (lower.includes(BAD_PATH_PATTERNS[i])) return true;
    }
  } catch (e) {}
  return false;
}

// ============================================================
// INSTALL
// ============================================================
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch((err) => console.warn("[SW] Pre-cache error:", err))
    )
  );
  self.skipWaiting();
});

// ============================================================
// ACTIVATE — clean old caches
// ============================================================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ============================================================
// FETCH — AdGuard Network-Level Intercept
// ============================================================
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = event.request.url;

  // 🛡️ BLOCK: Return silent empty 200 for all ad/tracker requests
  if (isAdRequest(url)) {
    console.warn("[AdGuard SW] ❌ Blocked:", new URL(url).hostname);
    event.respondWith(
      new Response("", {
        status: 200,
        statusText: "OK",
        headers: { "Content-Type": "text/plain" },
      })
    );
    return;
  }

  const parsedUrl = new URL(url);

  // Skip caching cross-origin video streams/embeds and API calls
  if (
    parsedUrl.origin !== self.location.origin ||
    parsedUrl.pathname.startsWith("/api/") ||
    parsedUrl.pathname.includes("apiplayer") ||
    parsedUrl.pathname.includes("embed")
  ) {
    return;
  }

  // Network-first with Cache fallback for own assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === "navigate") return caches.match("/home") || caches.match("/");
          return new Response("Offline", { status: 503 });
        })
      )
  );
});
