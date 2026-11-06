import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import AppShell from "@/components/AppShell";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0c",
};

const SITE_URL = "https://movieflix.stream";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MovieFlix – Watch Free HD Movies & Web Series Online",
    template: "%s | MovieFlix",
  },
  description:
    "Stream latest HD movies, trending TV shows, and popular web series online for free. Multiple high-speed servers, 4K Ultra HD quality, with no sign-up required on Web, Android & iOS.",
  keywords: [
    "watch movies online free",
    "movieflix",
    "movieflix stream",
    "free movies hd",
    "stream web series online",
    "watch tv shows free",
    "streaming movies 4k",
    "free streaming platform",
    "watch series online hd",
    "movieflix apk download"
  ],
  authors: [{ name: "MovieFlix Team", url: SITE_URL }],
  creator: "MovieFlix",
  publisher: "MovieFlix",
  applicationName: "MovieFlix",
  category: "entertainment",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "MovieFlix – Watch Free HD Movies & Web Series Online",
    description:
      "Stream thousands of trending movies and TV series in 4K & 1080p for free. High-speed servers, no subscription needed.",
    url: SITE_URL,
    siteName: "MovieFlix",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "MovieFlix - Free HD Movies & Web Series Streaming",
        type: "image/jpeg",
      },
      {
        url: `${SITE_URL}/movieflix-logo.png`,
        width: 512,
        height: 512,
        alt: "MovieFlix Logo",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MovieFlix – Watch Free HD Movies & Web Series Online",
    description:
      "Stream thousands of trending movies and TV series in 4K & 1080p for free. Fast streaming on Web, Android & iOS.",
    images: [`${SITE_URL}/og-image.jpg`],
    creator: "@movieflix",
    site: "@movieflix",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg?v=3", type: "image/svg+xml" },
      { url: "/favicon.ico?v=3", sizes: "32x32" },
      { url: "/icon-192.png?v=3", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png?v=3", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.svg?v=3",
  },
  manifest: "/manifest.json",
  other: {
    "theme-color": "#0a0a0c",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "google-adsense-account": "ca-pub-2554738343060277",
  },
};

const jsonLdWebsite = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://movieflix.stream/#website",
      "url": "https://movieflix.stream",
      "name": "MovieFlix",
      "alternateName": ["MovieFlix Stream", "MovieFlix Movies"],
      "description": "Stream latest HD movies, TV shows, and trending web series online for free.",
      "publisher": {
        "@id": "https://movieflix.stream/#organization"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://movieflix.stream/search?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      },
      "inLanguage": "en-US"
    },
    {
      "@type": "Organization",
      "@id": "https://movieflix.stream/#organization",
      "name": "MovieFlix",
      "url": "https://movieflix.stream",
      "logo": {
        "@type": "ImageObject",
        "@id": "https://movieflix.stream/#logo",
        "url": "https://movieflix.stream/movieflix-logo.png",
        "contentUrl": "https://movieflix.stream/movieflix-logo.png",
        "width": 512,
        "height": 512,
        "caption": "MovieFlix"
      },
      "image": {
        "@id": "https://movieflix.stream/#logo"
      }
    },
    {
      "@type": "SiteNavigationElement",
      "@id": "https://movieflix.stream/#navigation",
      "name": ["Home", "Movies", "TV Shows", "Download App", "Classics"],
      "url": [
        "https://movieflix.stream/home",
        "https://movieflix.stream/browse/movie",
        "https://movieflix.stream/browse/tv",
        "https://movieflix.stream/download",
        "https://movieflix.stream/classics"
      ]
    }
  ]
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google AdSense Verification & Auto Ads */}
        <meta name="google-adsense-account" content="ca-pub-2554738343060277" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2554738343060277"
          crossOrigin="anonymous"
        />
        {/* Fallback explicit tags for WhatsApp, Telegram, Facebook scrapers */}
        <link rel="canonical" href={SITE_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:site_name" content="MovieFlix" />
        <meta property="og:title" content="MovieFlix – Watch Free HD Movies & Web Series Online" />
        <meta property="og:description" content="Stream thousands of trending movies and TV series in 4K & 1080p for free. High-speed servers, no subscription needed on Web, Android & iOS." />
        <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
        <meta property="og:image:secure_url" content={`${SITE_URL}/og-image.jpg`} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="MovieFlix - Free HD Movies and Series" />
        
        {/* Twitter Card fallback */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MovieFlix – Watch Free HD Movies & Web Series Online" />
        <meta name="twitter:description" content="Stream thousands of trending movies and TV series in 4K & 1080p for free." />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.jpg`} />

        {/* Schema Markup (JSON-LD) for Google Search Engine */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebsite) }}
        />

        {/* AdGuard Popup Blocker & Scriptlet Engine — production only */}
        <script src="/adguard-popupblocker.js" />

        {/* Favicon & Web App Icons */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=3" />
        <link rel="alternate icon" href="/favicon.ico?v=3" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=3" />
        <link rel="manifest" href="/manifest.json" />

        {/* Complete AdBlock & Popunder suppression matching Nippleflix */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {

              try {
                function isAdsDisabled() {
                  try {
                    var s = sessionStorage.getItem("nippleflix_ads_disabled");
                    if (s !== null) return s === "true";
                    var m = sessionStorage.getItem("movieflix_ads_disabled");
                    if (m !== null) return m === "true";
                    var ls = localStorage.getItem("nippleflix_ads_disabled");
                    if (ls !== null) return ls === "true";
                    var lm = localStorage.getItem("movieflix_ads_disabled");
                    if (lm !== null) return lm === "true";
                    return true; // Default: Ads are OFF!
                  } catch (e) {
                    return true;
                  }
                }

                // Default all keys to "true" (Ads OFF) on first visit
                try {
                  if (sessionStorage.getItem("nippleflix_ads_disabled") === null) {
                    sessionStorage.setItem("nippleflix_ads_disabled", "true");
                  }
                  if (sessionStorage.getItem("movieflix_ads_disabled") === null) {
                    sessionStorage.setItem("movieflix_ads_disabled", "true");
                  }
                  if (localStorage.getItem("nippleflix_ads_disabled") === null) {
                    localStorage.setItem("nippleflix_ads_disabled", "true");
                  }
                  if (localStorage.getItem("movieflix_ads_disabled") === null) {
                    localStorage.setItem("movieflix_ads_disabled", "true");
                  }
                } catch (e) {}

                window.__ADS_DISABLED__ = isAdsDisabled();

                function isAuthOrSafePopup(url) {
                  // Allow blank popups (used by Firebase Auth / Google OAuth to initialize popup synchronously)
                  if (!url || url === "" || url === "about:blank") return true;
                  try {
                    var str = String(url).toLowerCase();
                    var safeAuthDomains = [
                      "accounts.google.com",
                      "google.com",
                      "googleadservices.com",
                      "googlesyndication.com",
                      "doubleclick.net",
                      "firebaseapp.com",
                      "identitytoolkit.googleapis.com",
                      "apis.google.com",
                      "gstatic.com",
                      "appleid.apple.com",
                      "facebook.com",
                      "github.com",
                      "twitter.com",
                      "movieflix",
                      "localhost"
                    ];
                    for (var i = 0; i < safeAuthDomains.length; i++) {
                      if (str.indexOf(safeAuthDomains[i]) !== -1) return true;
                    }
                  } catch(e) {}
                  return false;
                }

                // 1. Intercept and block ad popups & popunders when ads are disabled, while preserving legitimate Auth popups
                var rawOpen = window.open;
                window.open = function (url, target, features) {
                  if (isAuthOrSafePopup(url)) {
                    return rawOpen ? rawOpen.apply(this, arguments) : null;
                  }
                  if (isAdsDisabled()) {
                    console.warn("[AdBlocker] Blocked ad popup/popunder:", url);
                    return null;
                  }
                  return rawOpen ? rawOpen.apply(this, arguments) : null;
                };

                // 2. Intercept document.createElement to block ad scripts (amuyontraiked, push-sdk, doubleclick, etc.)
                var rawCreateElement = document.createElement;
                document.createElement = function (tagName) {
                  var el = rawCreateElement.apply(document, arguments);
                  if (typeof tagName === "string" && tagName.toLowerCase() === "script") {
                    var rawSetAttribute = el.setAttribute;
                    el.setAttribute = function (name, val) {
                      if (name === "src" && isAdsDisabled() && isAdUrl(val)) {
                        console.warn("[AdBlocker] Blocked ad script:", val);
                        return;
                      }
                      return rawSetAttribute.apply(this, arguments);
                    };
                    Object.defineProperty(el, "src", {
                      set: function (val) {
                        if (isAdsDisabled() && isAdUrl(val)) {
                          console.warn("[AdBlocker] Blocked ad script:", val);
                          return;
                        }
                        this.setAttribute("src", val);
                      },
                      get: function () {
                        return this.getAttribute("src") || "";
                      }
                    });
                  }
                  return el;
                };

                function isAdUrl(url) {
                  if (!url || typeof url !== "string") return false;
                  var adDomains = [
                    // === Popunder / Popup Networks ===
                    "amuyontraiked.com",
                    "popcash.net",
                    "popads.net",
                    "popunder.net",
                    "trafficjunky.net",
                    "trafficstars.com",
                    "clickadu.com",
                    "adcash.com",
                    "clickaine.com",
                    "adskeeper.co.uk",
                    "adskeeper.com",
                    "bidvertiser.com",
                    "popads.net",
                    "hilltopads.net",
                    "zeropark.com",
                    "revcontent.com",
                    "mgid.com",
                    "taboola.com",
                    "outbrain.com",
                    "adblade.com",
                    // === Push Notification Ad Networks ===
                    "push-sdk.com",
                    "pushground.com",
                    "pushcrew.com",
                    "pushengage.com",
                    "sendpulse.com",
                    "gravitypush.com",
                    "subscribers.com",
                    "onesignal.com",
                    "pushwoosh.com",
                    "sendbird.com",
                    "web-push-notifications.com",
                    "aimtell.com",
                    "pushprime.com",
                    "pushmonkey.com",
                    "cleverpush.com",
                    // === Major Ad Networks ===
                    "adsterra.com",
                    "propellerads.com",
                    "monetag.com",
                    "hilltopads.com",
                    "exoclick.com",
                    "juicyads.com",
                    "trafficfactory.biz",
                    "adxpansion.com",
                    "ero-advertising.com",
                    "plugrush.com",
                    "adsupply.com",
                    "cpmrevenue.com",
                    "adnium.com",
                    "adspyglass.com",
                    "awaremedia.com",
                    "cpa.guru",
                    "cpahero.com",
                    "mamba.com",
                    // === Streaming Site Ad Networks ===
                    "alwingulla.com",
                    "videosframe.com",
                    "peliculas24.me",
                    "hlsplay.net",
                    "fusedns.cc",
                    "flaconet.com",
                    "streamvid.net",
                    "jplayer.net",
                    "mxembed.cc",
                    "dtacdn.com",
                    "yodex.top",
                    "crickex.com",
                    "betyetu.ug",
                    "1xbet.com",
                    "bet365.com",
                    "betwinner.com",
                    // === Trackers & Analytics Ad Networks ===
                    "histats.com",
                    "statcounter.com",
                    "clicktale.net",
                    "hotjar.com",
                    "fullstory.com",
                    "logrocket.io",
                    "mouseflow.com",
                    "smartlook.com",
                    "crazyegg.com",
                    "quantserve.com",
                    "scorecardresearch.com",
                    "comscore.com",
                    "chartbeat.com",
                    "parsely.com",
                    "chartbeat.net",
                    // === Affiliate & CPA Networks ===
                    "shareasale.com",
                    "clickbank.net",
                    "jvzoo.com",
                    "maxbounty.com",
                    "cj.com",
                    "rakuten.com",
                    "awin.com",
                    "zanox.com",
                    "pepperjam.com",
                    "linksynergy.com",
                    "partnerize.com",
                    "impact.com",
                    // === Crypto / Coin Mining Scripts ===
                    "coinhive.com",
                    "coin-hive.com",
                    "minero.cc",
                    "cryptoloot.pro",
                    "jsecoin.com",
                    "monerominer.rocks",
                    "webmine.cz",
                    "minemytraffic.com",
                    "ppoi.org",
                    "afmining.com",
                    "coinpirate.cf",
                    "coinnebula.com",
                    "cookiescript.cc",
                    // === Redirect / Clickjacking Domains ===
                    "redirect.disqus.com",
                    "adf.ly",
                    "bc.vc",
                    "linkbucks.com",
                    "revenuemantra.com",
                    "adfoc.us",
                    "sh.st",
                    "ouo.io",
                    "exe.io",
                    "cety.app",
                    "gplinks.in",
                    "shrinkme.io",
                    "clk.sh",
                    "za.gl",
                    "fc.lc",
                    "clk.asia",
                    "shortzon.com",
                    "linkvertise.com",
                    "cuty.io",
                    // === Misc Rogue/Malware Ad Domains ===
                    "adsafeprotected.com",
                    "moatads.com",
                    "flashtalking.com",
                    "mediavine.com",
                    "reklama.ru",
                    "adverticum.net",
                    "smartadserver.com",
                    "openx.net",
                    "openx.com",
                    "rubiconproject.com",
                    "pubmatic.com",
                    "appnexus.com",
                    "adsrvr.org",
                    "advertising.com",
                    "yieldmanager.com",
                    "adroll.com",
                    "criteo.com",
                    "criteo.net",
                    "turn.com",
                    "adbuffs.com",
                    "adblade.com",
                    "adbutler.com",
                    "bidswitch.net",
                    "lijit.com",
                    "sonobi.com",
                    "sharethrough.com",
                    "triplelift.com",
                    "undertone.com",
                    "xaxis.com",
                    "yieldlab.net",
                    "yieldlab.com",
                    "emxdgt.com",
                    "liveintent.com",
                    "nativeads.com",
                    "adtelligent.com",
                    "beachfront.com",
                    "springserve.com",
                    "spotx.tv",
                    "spotxchange.com",
                    "teads.tv",
                    "yume.com",
                    "innovid.com",
                    "videologygroup.com",
                    "tremormedia.com",
                    "brightroll.com"
                  ];
                  for (var i = 0; i < adDomains.length; i++) {
                    if (url.indexOf(adDomains[i]) !== -1) return true;
                  }
                  return false;
                }

                // 3. Block rogue popunder clicks
                window.addEventListener("click", function (e) {
                  if (!isAdsDisabled()) return;
                  var target = e.target;
                  while (target && target !== document.body) {
                    if (target.tagName === "A" && target.target === "_blank") {
                      var href = target.href || "";
                      if (isAdUrl(href) || href.indexOf("javascript:") === 0) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.warn("[AdBlocker] Blocked ad link click:", href);
                        return false;
                      }
                    }
                    target = target.parentElement;
                  }
                }, true);
              } catch (e) {}
            })();`
          }}
        />
        {/* AdGuard Scriptlets — JS-level ad technique neutralizers */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  try {
    var s = sessionStorage.getItem("nippleflix_ads_disabled") || sessionStorage.getItem("movieflix_ads_disabled");
    var l = localStorage.getItem("nippleflix_ads_disabled") || localStorage.getItem("movieflix_ads_disabled");
    if (s === "false" || l === "false" || window.__ADS_DISABLED__ === false) return;
  } catch(e){}

  try {
    // ── Scriptlet 1: abort-on-property-read ──────────────────────────────
    // Kills scripts that check window properties before injecting rogue ads
    var ABORT_PROPS = [
      "pbjs","apntag","_mNAds",
      "monetag","propellerAds","popunder","popad","trafficJunky",
      "ExoLoader","exoJquery","reviveBanner",
      "adroll","criteo","taboola","outbrain","mgid","revcontent",
    ];
    ABORT_PROPS.forEach(function(prop){
      try {
        Object.defineProperty(window, prop, {
          get: function(){ throw new ReferenceError("[AdGuard] Aborted: "+prop); },
          set: function(){},
          configurable: false
        });
      } catch(e){}
    });

    // ── Scriptlet 2: prevent-setTimeout (ad delay tricks) ────────────────
    var _origSetTimeout = window.setTimeout;
    window.setTimeout = function(fn, delay) {
      try {
        var src = (typeof fn === "function") ? fn.toString() : String(fn);
        var blocked = ["popunder","window.open","monetag",
                       "push-sdk","pushnotif","coinhive","cryptoloot"];
        for(var i=0;i<blocked.length;i++){
          if(src.indexOf(blocked[i])!==-1){
            console.warn("[AdGuard] Blocked setTimeout ad:",blocked[i]);
            return 0;
          }
        }
      } catch(e){}
      return _origSetTimeout.apply(this, arguments);
    };

    // ── Scriptlet 3: prevent-setInterval ─────────────────────────────────
    var _origSetInterval = window.setInterval;
    window.setInterval = function(fn, delay) {
      try {
        var src = (typeof fn === "function") ? fn.toString() : String(fn);
        var blocked = ["popunder","window.open","monetag","coinhive"];
        for(var i=0;i<blocked.length;i++){
          if(src.indexOf(blocked[i])!==-1){
            console.warn("[AdGuard] Blocked setInterval ad:",blocked[i]);
            return 0;
          }
        }
      } catch(e){}
      return _origSetInterval.apply(this, arguments);
    };

    // ── Scriptlet 4: nowebrtc (prevents IP leak via WebRTC ads) ──────────
    try {
      var _origRTC = window.RTCPeerConnection || window.webkitRTCPeerConnection;
      if(_origRTC){
        window.RTCPeerConnection = function(config){
          if(config && config.iceServers){
            config.iceServers = config.iceServers.filter(function(s){
              var url = (s.urls||s.url||"").toString();
              return url.indexOf("stun:")===0 && url.indexOf("google")===-1;
            });
          }
          return new _origRTC(config);
        };
      }
    } catch(e){}

    // ── Scriptlet 5: set-cookie (block rogue ad tracking cookies) ────────
    var _cookieDesc = Object.getOwnPropertyDescriptor(Document.prototype,"cookie")||
                      Object.getOwnPropertyDescriptor(HTMLDocument.prototype,"cookie");
    if(_cookieDesc && _cookieDesc.set){
      var _origCookieSet = _cookieDesc.set;
      var BLOCKED_COOKIE_KEYS = ["ad_session","adblock_test","coinhive","cryptoloot"];
      Object.defineProperty(document,"cookie",{
        get: _cookieDesc.get,
        set: function(val){
          var blocked = false;
          for(var i=0;i<BLOCKED_COOKIE_KEYS.length;i++){
            if(val.indexOf(BLOCKED_COOKIE_KEYS[i]+"=")===0){
              blocked=true; break;
            }
          }
          if(!blocked) _origCookieSet.call(document,val);
        },
        configurable: true
      });
    }

    // ── Scriptlet 6: MutationObserver — remove rogue injected ad iframes ───
    var _observer = new MutationObserver(function(mutations){
      mutations.forEach(function(m){
        m.addedNodes.forEach(function(node){
          if(!node || node.nodeType!==1) return;
          var tag = node.tagName&&node.tagName.toLowerCase();
          if(tag==="iframe"||tag==="script"){
            var src = node.src||node.getAttribute("src")||"";
            var adPatterns = [
              "adsterra","propellerads",
              "monetag","exoclick","popcash","popads","trafficjunky",
              "amuyontraiked","push-sdk","coinhive","adnium"
            ];
            for(var i=0;i<adPatterns.length;i++){
              if(src.indexOf(adPatterns[i])!==-1){
                node.remove();
                console.warn("[AdGuard] Removed injected ad node:",src);
                return;
              }
            }
          }
        });
      });
    });
    _observer.observe(document.documentElement,{childList:true,subtree:true});

  } catch(e){}
})();`
          }}
        />
        {/* Cloudflare Turnstile & CDN Preconnect */}
        <link rel="preconnect" href="https://challenges.cloudflare.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://vidbolt.pro" crossOrigin="anonymous" />
        
        <link rel="dns-prefetch" href="https://challenges.cloudflare.com" />
        <link rel="dns-prefetch" href="https://vidbolt.pro" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://googleads.g.doubleclick.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net" />

        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').catch(function(err) {
                      console.log('ServiceWorker registration error:', err);
                    });
                  });
                }
              `
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
