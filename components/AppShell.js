"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import AuthModal from "@/components/AuthModal";
import SessionGuard from "@/components/SessionGuard";
import TitlePreviewModal from "@/components/TitlePreviewModal";
import MiniPreviewModal from "@/components/MiniPreviewModal";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isVerifyRoute = pathname?.startsWith("/verify");

  if (isVerifyRoute) {
    return (
      <div className="verification-isolated-viewport">
        {children}
      </div>
    );
  }

  return (
    <div className="site-wrapper">
      <Header />
      <div className="content-container">{children}</div>
      <footer className="site-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              MOVIE<span className="accent">FLIX</span>
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
              <a href="/profile">My Account</a>
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
          <span className="copy-text">&copy; {new Date().getFullYear()} MovieFlix. All rights reserved.</span>
        </div>
      </footer>
      <MobileNav />
      <AuthModal />
      <SessionGuard />
      <TitlePreviewModal />
      <MiniPreviewModal />
    </div>
  );
}
