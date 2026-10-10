"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Background opacity change on window scroll like Netflix
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results || []);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener for search container
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        if (!query.trim()) {
          setSearchOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [query]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setQuery("");
  }, [pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      setSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    if (!searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  };

  return (
    <header className={`netflix-header ${isScrolled ? "scrolled" : ""}`}>
      <div className="netflix-header-inner">
        {/* Left Side: Brand Logo + Primary Nav */}
        <div className="header-left">
          <Link href="/home" className="netflix-brand-logo">
            <span className="logo-n-mark">REEL</span>
            <span className="logo-flix-mark">STREAM</span>
          </Link>

          <nav className="netflix-desktop-nav">
            <Link href="/home" className={`netflix-nav-item ${pathname === "/home" ? "active" : ""}`}>
              Home
            </Link>
            <Link href="/browse/tv" className={`netflix-nav-item ${pathname === "/browse/tv" ? "active" : ""}`}>
              TV Shows
            </Link>
            <Link href="/browse/movie" className={`netflix-nav-item ${pathname === "/browse/movie" ? "active" : ""}`}>
              Movies
            </Link>
            <Link href="/browse/movie?genre=28" className={`netflix-nav-item ${pathname.includes("genre") ? "active" : ""}`}>
              Action & Sci-Fi
            </Link>
            <Link href="/classics" className={`netflix-nav-item ${pathname.startsWith("/classics") ? "active" : ""}`}>
              Classics
            </Link>
            <Link href="/list" className={`netflix-nav-item ${pathname === "/list" ? "active" : ""}`}>
              My List
            </Link>
            <Link href="/app" className={`netflix-nav-item ${pathname === "/app" || pathname === "/" ? "active" : ""}`}>
              Get App
            </Link>
          </nav>
        </div>

        {/* Right Side: Expanding Search, Notifications, Avatar */}
        <div className="header-right">
          {/* Expanding Search Bar */}
          <div className={`netflix-search-box ${searchOpen || query ? "open" : ""}`} ref={searchContainerRef}>
            <button
              type="button"
              className="search-toggle-btn"
              onClick={toggleSearch}
              aria-label="Search titles"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.3-4.3"/>
              </svg>
            </button>

            <form onSubmit={handleSearchSubmit} className="search-form-slide">
              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Titles, people, genres"
                className="netflix-search-input"
              />
              {query && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => { setQuery(""); setSuggestions([]); }}
                >
                  ✕
                </button>
              )}
            </form>

            {/* Instant Search Dropdown Popup */}
            {query.trim().length > 0 && (
              <div className="netflix-search-results-popup">
                {isLoading ? (
                  <div className="search-popup-loading">
                    <div className="spinner" />
                    <span>Searching Netflix catalog...</span>
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="search-popup-grid">
                    {suggestions.slice(0, 6).map((item) => (
                      <Link
                        key={(item.type || "m") + item.id}
                        href={`/${item.type || "movie"}/${item.id}`}
                        className="popup-result-item"
                        onClick={() => { setSearchOpen(false); setQuery(""); }}
                      >
                        <div className="popup-poster">
                          {item.poster ? (
                            <img src={item.poster} alt={item.title} />
                          ) : (
                            <div className="no-poster">🎬</div>
                          )}
                        </div>
                        <div className="popup-info">
                          <span className="popup-title">{item.title}</span>
                          <span className="popup-meta">{item.year} • {item.rating ? `★ ${item.rating}` : (item.type === "tv" ? "Series" : "Movie")}</span>
                        </div>
                      </Link>
                    ))}
                    <button type="button" onClick={handleSearchSubmit} className="popup-see-all">
                      See all results for &ldquo;{query}&rdquo; &rarr;
                    </button>
                  </div>
                ) : (
                  <div className="search-popup-empty">
                    <span>No matching titles found</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notifications Icon */}
          <button type="button" className="netflix-icon-btn" aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            <span className="notif-badge">1</span>
          </button>

          {/* User Profile Avatar */}
          <Link href="/list" className="netflix-profile-box" title="My Profile & List">
            <div className="profile-avatar">
              <span className="avatar-smile">ツ</span>
            </div>
            <span className="avatar-arrow">▼</span>
          </Link>

          {/* Mobile Hamburger Menu */}
          <button
            type="button"
            className="mobile-hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="netflix-mobile-nav">
          <Link href="/" className="mobile-link">Home</Link>
          <Link href="/browse/tv" className="mobile-link">TV Shows</Link>
          <Link href="/browse/movie" className="mobile-link">Movies</Link>
          <Link href="/browse/movie?genre=28" className="mobile-link">Action & Adventure</Link>
          <Link href="/browse/movie?genre=878" className="mobile-link">Sci-Fi & Fantasy</Link>
          <Link href="/classics" className="mobile-link">Free Classics</Link>
          <Link href="/list" className="mobile-link">My List</Link>
        </div>
      )}
    </header>
  );
}
