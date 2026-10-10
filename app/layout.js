import "./globals.css";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#07080c",
};

export const metadata = {
  title: "ReelStream – Free HD Movies & Web Series Streaming",
  description: "Watch latest HD movies, TV shows, trending web series, and public domain classics online with multiple fast streaming servers.",
  keywords: "watch movies online, stream web series, free movies hd, tv shows online, stream series",
  authors: [{ name: "ReelStream" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
    shortcut: "/favicon.svg"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Favicon & Web App Icons */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Preconnect & DNS-Prefetch for Fast CDN and Video Streams */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://apiplayer.ru" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://player.autoembed.cc" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://vidsrc.me" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://vidsrc.to" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://player.smashy.stream" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.2embed.cc" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="anonymous" />
        
        <link rel="dns-prefetch" href="https://apiplayer.ru" />
        <link rel="dns-prefetch" href="https://player.autoembed.cc" />
        <link rel="dns-prefetch" href="https://vidsrc.me" />
        <link rel="dns-prefetch" href="https://vidsrc.to" />
        <link rel="dns-prefetch" href="https://player.smashy.stream" />
        <link rel="dns-prefetch" href="https://www.2embed.cc" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />

        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="site-wrapper">
          <Header />
          <div className="content-container">{children}</div>
          <footer className="site-footer">
            <div className="footer-content">
              <div className="footer-brand">
                <div className="footer-logo">
                  REEL<span className="accent">STREAM</span>
                </div>
                <p className="footer-desc">
                  Your premium cinema & web series streaming hub. Watch the latest blockbuster movies, top-rated TV shows, and legendary classics in high definition.
                </p>
              </div>

              <div className="footer-links-group">
                <div className="footer-col">
                  <h4>Discover</h4>
                  <a href="/browse/movie">Trending Movies</a>
                  <a href="/browse/tv">Web Series</a>
                  <a href="/classics">Free Classics</a>
                  <a href="/list">My Watchlist</a>
                  <a href="/app">Get ReelStream App</a>
                </div>
                <div className="footer-col">
                  <h4>Top Genres</h4>
                  <a href="/browse/movie?genre=28">Action & Adventure</a>
                  <a href="/browse/movie?genre=878">Sci-Fi & Cyberpunk</a>
                  <a href="/browse/tv?genre=10765">Fantasy Series</a>
                  <a href="/browse/movie?genre=16">Anime & Animation</a>
                </div>
              </div>
            </div>

            <div className="footer-bottom">
              <span className="copy-text">&copy; {new Date().getFullYear()} ReelStream. All rights reserved.</span>
            </div>
          </footer>
          <MobileNav />
        </div>
      </body>
    </html>
  );
}
