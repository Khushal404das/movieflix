"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import AdsToggle from "@/components/AdsToggle";
import ThemeToggle from "@/components/ThemeToggle";
import DiscordLink, { DISCORD_INVITE_URL, TELEGRAM_URL, DiscordIcon, TelegramIcon } from "@/components/DiscordLink";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logOut, openAuthModal } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const settingsRef = useRef(null);

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

  // Click outside listener for search container and profile dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        if (!query.trim()) {
          setSearchOpen(false);
        }
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [query]);

  // Close mobile drawer and menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setProfileDropdownOpen(false);
    setSettingsOpen(false);
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
          <Link href="/home" className="netflix-brand-logo" aria-label="MovieFlix Home">
            <svg
              className="brand-logo-icon"
              width="28"
              height="28"
              viewBox="0 0 512 512"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="headerRedBack" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#c4151c" />
                  <stop offset="100%" stopColor="#6e070c" />
                </linearGradient>
                <linearGradient id="headerRedDiagLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff2b33" />
                  <stop offset="100%" stopColor="#b81219" />
                </linearGradient>
                <linearGradient id="headerRedDiagRight" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#e50914" />
                  <stop offset="100%" stopColor="#96080e" />
                </linearGradient>
              </defs>
              <rect width="512" height="512" rx="116" fill="#141418" />
              <path d="M 104 116 L 168 116 L 168 396 L 104 396 Z" fill="url(#headerRedBack)" />
              <path d="M 344 116 L 408 116 L 408 396 L 344 396 Z" fill="url(#headerRedBack)" />
              <path d="M 104 116 L 180 116 L 276 324 L 236 324 Z" fill="url(#headerRedDiagLeft)" />
              <path d="M 408 116 L 332 116 L 236 324 L 276 324 Z" fill="url(#headerRedDiagRight)" />
            </svg>
            <span className="logo-text-wrap">
              <span className="logo-n-mark">MOVIE</span>
              <span className="logo-flix-mark">FLIX</span>
            </span>
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
            <Link href="/list" className={`netflix-nav-item ${pathname === "/list" ? "active" : ""}`}>
              My List
            </Link>
            <Link href="/app" className={`netflix-nav-item ${pathname === "/app" || pathname === "/" ? "active" : ""}`}>
              Get App <span className="nav-app-pill">iOS / APK</span>
            </Link>
          </nav>
        </div>

        {/* Right Side: Expanding Search, Settings, Avatar */}
        <div className="header-right">
          <div className="nav-shell gap-1" ref={searchContainerRef}>
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="search-pill-form">
                <svg className="search-pill-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.3-4.3"/>
                </svg>
                <input
                  ref={searchInputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setSearchOpen(false);
                      setQuery("");
                    }
                  }}
                  placeholder="Titles, people, genres"
                  className="search-pill-input"
                  autoFocus
                />
                {query ? (
                  <button
                    type="button"
                    className="search-pill-action-btn"
                    onClick={() => { setQuery(""); setSuggestions([]); searchInputRef.current?.focus(); }}
                    title="Clear text"
                  >
                    ✕
                  </button>
                ) : (
                  <button
                    type="button"
                    className="search-pill-action-btn"
                    onClick={() => setSearchOpen(false)}
                    title="Close search"
                  >
                    ✕
                  </button>
                )}
              </form>
            ) : (
              <button
                type="button"
                className="nav-shell-btn"
                onClick={toggleSearch}
                aria-label="Search"
                title="Search titles"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.3-4.3"/>
                </svg>
              </button>
            )}

            {/* Settings menu (gear) */}
            <div className="settings-menu-wrapper" ref={settingsRef}>
              <button
                type="button"
                className="nav-shell-btn settings-menu-trigger"
                aria-label="Settings"
                title="Settings"
                aria-haspopup="menu"
                aria-expanded={settingsOpen}
                onClick={() => { setSettingsOpen((o) => !o); setProfileDropdownOpen(false); }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>

              {settingsOpen && (
                <div className="profile-dropdown-menu settings-menu" role="menu">
                  {!user && (
                    <button
                      type="button"
                      role="menuitem"
                      className="profile-menu-item"
                      onClick={() => { setSettingsOpen(false); openAuthModal("signin"); }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                      </svg>
                      <span>Sign In</span>
                    </button>
                  )}

                  <Link
                    href="/list"
                    role="menuitem"
                    className="profile-menu-item"
                    onClick={() => setSettingsOpen(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>My Watchlist</span>
                  </Link>

                  <Link
                    href="/profile"
                    role="menuitem"
                    className="profile-menu-item"
                    onClick={() => setSettingsOpen(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                    <span>Edit Profile</span>
                  </Link>

                  <div className="profile-menu-divider" />

                  {TELEGRAM_URL && (
                    <a
                      href={TELEGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      role="menuitem"
                      className="profile-menu-item community-link community-link--telegram"
                      onClick={() => setSettingsOpen(false)}
                    >
                      <TelegramIcon size={16} />
                      <span>Join Telegram</span>
                    </a>
                  )}

                  <a
                    href={DISCORD_INVITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    role="menuitem"
                    className="profile-menu-item community-link community-link--discord"
                    onClick={() => setSettingsOpen(false)}
                  >
                    <DiscordIcon size={16} />
                    <span>Join Discord</span>
                  </a>
                </div>
              )}
            </div>

            {/* Dark / light theme */}
            <ThemeToggle />

            {/* Ads on/off switch (turns off banners, native, popunder and social bar ads) */}
            {!searchOpen && (
              <>
                <span className="nav-shell-divider ads-toggle-divider" aria-hidden="true" />
                <AdsToggle className="ads-toggle--header" />
              </>
            )}

            {/* Instant Search Dropdown Popup */}
            {searchOpen && query.trim().length > 0 && (
              <div className="netflix-search-results-popup">
                {isLoading ? (
                  <div className="search-popup-loading">
                    <div className="spinner" />
                    <span>Searching MovieFlix catalog...</span>
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

          {/* User Profile Avatar / Sign In */}
          {user ? (
            <div className="profile-dropdown-wrapper" ref={profileDropdownRef}>
              <button
                type="button"
                className="netflix-profile-box"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-label="User profile menu"
              >
                <div className="profile-avatar">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} />
                  ) : (
                    <span className="avatar-smile">ツ</span>
                  )}
                </div>
                <span className={`avatar-arrow ${profileDropdownOpen ? "open" : ""}`}>▼</span>
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="profile-dropdown-menu">
                  <div className="profile-menu-header">
                    <div className="menu-avatar">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} />
                      ) : (
                        <span>ツ</span>
                      )}
                    </div>
                    <div className="menu-user-info">
                      <span className="menu-name">{user.displayName || "Member"}</span>
                      <span className="menu-email">{user.email}</span>
                    </div>
                  </div>

                  <div className="profile-menu-divider" />

                  <Link
                    href="/profile"
                    className="profile-menu-item"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>Account & Profile</span>
                  </Link>

                  <Link
                    href="/list"
                    className="profile-menu-item"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span>My Watchlist</span>
                  </Link>

                  <div className="profile-menu-divider" />

                  <button
                    type="button"
                    className="profile-menu-item signout-btn"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logOut();
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="netflix-signin-nav-btn"
              onClick={() => openAuthModal("signin")}
            >
              Sign In
            </button>
          )}

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
        <>
          <div
            className="mobile-nav-backdrop"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="netflix-mobile-nav">
            {user ? (
              <div className="mobile-user-card">
                <div className="mobile-user-avatar">
                  {user.photoURL ? <img src={user.photoURL} alt={user.displayName} /> : <span>ツ</span>}
                </div>
                <div className="mobile-user-details">
                  <span className="mobile-user-name">{user.displayName}</span>
                  <span className="mobile-user-email">{user.email}</span>
                </div>
              </div>
            ) : (
              <div className="mobile-auth-prompt">
                <button
                  type="button"
                  className="mobile-signin-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal("signin");
                  }}
                >
                  Sign In / Join Free
                </button>
              </div>
            )}

            <div className="mobile-nav-links">
              <Link href="/home" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <Link href="/app" className="mobile-link highlight-download-link" onClick={() => setMobileMenuOpen(false)}>
                📲 Download App (APK / iOS)
              </Link>
              <Link href="/browse/tv" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>TV Shows</Link>
              <Link href="/browse/movie" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Movies</Link>
              <Link href="/browse/tv?genre=16" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>⚡ Anime Series</Link>
              <Link href="/browse/movie?genre=28" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Action & Adventure</Link>
              <Link href="/browse/movie?genre=878" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Sci-Fi & Fantasy</Link>
              <Link href="/list" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>My List</Link>
              <DiscordLink className="mobile-link discord-link--drawer" onClick={() => setMobileMenuOpen(false)} />
              <AdsToggle className="mobile-link ads-toggle--drawer" />
              {user && (
                <>
                  <Link href="/profile" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>My Profile & Settings</Link>
                  <button
                    type="button"
                    className="mobile-link signout-link"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logOut();
                    }}
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
