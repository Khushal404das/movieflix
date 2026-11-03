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

        {/* AdGuard Popup Blocker & Scriptlet Engine (Official Open Source) */}
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

                // 1. Intercept and block window.open popups & popunders when ads are disabled
                var rawOpen = window.open;
                window.open = function (url, target, features) {
                  if (isAdsDisabled()) {
                    console.warn("[AdBlocker] Blocked popup/popunder:", url);
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
                    "amuyontraiked.com",
                    "push-sdk.com",
                    "googlesyndication.com",
                    "doubleclick.net",
                    "adsterra.com",
                    "popcash.net",
                    "propellerads.com",
                    "alwingulla.com",
                    "histats.com"
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
