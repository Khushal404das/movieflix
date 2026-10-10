"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "2"}>
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      )
    },
    {
      label: "Movies",
      href: "/browse/movie",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "2"}>
          <rect width="18" height="18" x="3" y="3" rx="2"/>
          <path d="M7 3v18"/>
          <path d="M3 7.5h4"/>
          <path d="M3 12h18"/>
          <path d="M3 16.5h4"/>
          <path d="M17 3v18"/>
          <path d="M17 7.5h4"/>
          <path d="M17 16.5h4"/>
        </svg>
      )
    },
    {
      label: "Series",
      href: "/browse/tv",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "2"}>
          <rect width="20" height="15" x="2" y="7" rx="2" ry="2"/>
          <polyline points="17 2 12 7 7 2"/>
        </svg>
      )
    },
    {
      label: "Classics",
      href: "/classics",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "2"}>
          <circle cx="12" cy="12" r="10"/>
          <polygon points="10 8 16 12 10 16 10 8"/>
        </svg>
      )
    },
    {
      label: "My List",
      href: "/list",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "2"}>
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      )
    }
  ];

  return (
    <nav className="netflix-mobile-bottom-bar" aria-label="Mobile Navigation">
      {navItems.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className={`mobile-tab-btn ${isActive ? "active" : ""}`}
          >
            <div className="tab-icon-wrap">
              {item.icon(isActive)}
            </div>
            <span className="tab-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
