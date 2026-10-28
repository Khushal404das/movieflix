"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import AuthModal from "@/components/AuthModal";
import SessionGuard from "@/components/SessionGuard";
import TitlePreviewModal from "@/components/TitlePreviewModal";
import MiniPreviewModal from "@/components/MiniPreviewModal";
import { useAuth } from "@/lib/AuthContext";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isVerifyRoute = pathname?.startsWith("/verify");
  const { user, loading, openAuthModal } = useAuth();
  const hasPromptedInitialRef = useRef(false);

  const isPublicRoute =
    pathname === "/" ||
    pathname === "/app" ||
    pathname === "/download" ||
    isVerifyRoute;

  // 1. Route Protection: Disallow unauthenticated visitors on /home and other content pages
  useEffect(() => {
    if (loading) return;
    if (isPublicRoute) return;

    if (!user) {
      try {
        const stored = typeof window !== "undefined" ? localStorage.getItem("movieflix_user_session") : null;
        if (!stored) {
          router.replace("/");
          openAuthModal("signin");
        }
      } catch (_) {}
    }
  }, [user, loading, pathname, isPublicRoute, router, openAuthModal]);

  // 2. First-time visit auto-prompt on landing page
  useEffect(() => {
    if (loading || isVerifyRoute) return;

    if (!user) {
      try {
        const stored = typeof window !== "undefined" ? localStorage.getItem("movieflix_user_session") : null;
        if (!stored && !hasPromptedInitialRef.current) {
          hasPromptedInitialRef.current = true;
          const timer = setTimeout(() => {
            openAuthModal("signin");
          }, 600);
          return () => clearTimeout(timer);
        }
      } catch (_) {}
    }
  }, [user, loading, isVerifyRoute, openAuthModal]);

  // 3. Global Click Interception: If not logged in, clicking on ANY link, button, or card opens login directly
  useEffect(() => {
    if (loading || user) return;

    // Check if session is already saved in localStorage
    try {
      const stored = localStorage.getItem("movieflix_user_session");
      if (stored) return;
    } catch (_) {}

    const handleGlobalClick = (e) => {
      // Allow interactions within the authentication modal itself
      if (e.target.closest(".auth-backdrop") || e.target.closest(".auth-modal-card")) {
        return;
      }

      // Allow direct APK download links
      if (e.target.closest("a[download]") || e.target.closest('a[href*="/api/download"]')) {
        return;
      }

      // Intercept any click and show login popup directly
      e.preventDefault();
      e.stopPropagation();
      openAuthModal("signin");
    };

    // Use capture phase to intercept before React router or link navigations
    document.addEventListener("click", handleGlobalClick, true);
    return () => {
      document.removeEventListener("click", handleGlobalClick, true);
    };
  }, [user, loading, openAuthModal]);

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
              Your premium cinema & web series streaming hub. Watch the latest blockbuster movies, trending TV shows, and web series in high definition.
            </p>
          </div>

          <div className="footer-links-group">
            <div className="footer-col">
              <h4>Discover</h4>
              <a href="/browse/movie">Trending Movies</a>
              <a href="/browse/tv">Web Series</a>
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
            <div className="footer-col">
              <h4>Apps & Devices</h4>
              <a href="/app">Apple iOS (iPhone/iPad)</a>
              <a href="/app">Android Native (.APK)</a>
              <a href="/home">Web Browser Player</a>
              <a href="/download">All Platforms</a>
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
