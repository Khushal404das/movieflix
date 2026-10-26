"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const PLATFORMS = [
  {
    name: "Netflix",
    label: "Browse Netflix",
    logo: "/platform/Logonetflix.svg",
    bg: "rgb(184, 29, 36)",
    bgDark: "rgb(5,5,5)",
    logoFilter: "",
    href: "/browse/movie",
  },
  {
    name: "Amazon Prime Video",
    label: "Browse Amazon Prime Video",
    logo: "/platform/Amazon_Prime_Video_logo.svg",
    bg: "rgb(15, 61, 92)",
    bgDark: "rgb(5,5,5)",
    logoFilter: "",
    href: "/browse/tv",
  },
  {
    name: "AMC+",
    label: "Browse AMC+",
    logo: "/platform/amc.svg",
    bg: "rgb(58, 44, 22)",
    bgDark: "rgb(5,5,5)",
    logoFilter: "",
    href: "/browse/tv",
  },
  {
    name: "Apple TV+",
    label: "Browse Apple TV+",
    logo: "/platform/Apple_TV_logo.svg",
    bg: "rgb(28, 28, 30)",
    bgDark: "rgb(5,5,5)",
    logoFilter: "brightness(0) invert(1)",
    href: "/browse/movie",
  },
  {
    name: "Crunchyroll",
    label: "Browse Crunchyroll",
    logo: "/platform/crunchyroll.svg",
    bg: "rgb(122, 52, 16)",
    bgDark: "rgb(5,5,5)",
    logoFilter: "",
    href: "/browse/tv",
  },
  {
    name: "Disney+",
    label: "Browse Disney Plus",
    logo: "/platform/Disney_logo.svg",
    bg: "rgb(26, 77, 184)",
    bgDark: "rgb(5,5,5)",
    logoFilter: "",
    href: "/browse/movie",
  },
  {
    name: "Hulu",
    label: "Browse Hulu",
    logo: "/platform/Hulu_logo_(2018).svg",
    bg: "rgb(12, 61, 44)",
    bgDark: "rgb(5,5,5)",
    logoFilter: "",
    href: "/browse/tv",
  },
  {
    name: "HBO Max",
    label: "Browse HBO Max",
    logo: "/platform/hbo-logo.svg",
    bg: "rgb(74, 26, 120)",
    bgDark: "rgb(5,5,5)",
    logoFilter: "",
    href: "/browse/tv",
  },
  {
    name: "MGM+",
    label: "Browse MGM Plus",
    logo: "/platform/mgm-logo.svg",
    bg: "rgb(61, 50, 20)",
    bgDark: "rgb(5,5,5)",
    logoFilter: "",
    href: "/browse/movie",
  },
  {
    name: "Paramount+",
    label: "Browse Paramount Plus Premium",
    logo: "/platform/Paramount-_logo.svg",
    bg: "rgb(10, 58, 122)",
    bgDark: "rgb(5,5,5)",
    logoFilter: "",
    href: "/browse/movie",
  },
  {
    name: "Peacock",
    label: "Browse Peacock Premium Plus",
    logo: "/platform/peacock.svg",
    bg: "rgb(18, 38, 28)",
    bgDark: "rgb(5,5,5)",
    logoFilter: "",
    href: "/browse/tv",
  },
  {
    name: "Shudder",
    label: "Browse Shudder",
    logo: "/platform/shudder.svg",
    bg: "rgb(92, 16, 20)",
    bgDark: "rgb(5,5,5)",
    logoFilter: "",
    href: "/browse/tv",
  },
];

export default function StudiosPlatformsRow() {
  const rowRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scroll = (dir) => {
    if (!rowRef.current) return;
    const amt = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({ left: dir === "right" ? amt : -amt, behavior: "smooth" });
    setTimeout(sync, 400);
  };

  const sync = () => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setCanScrollLeft(scrollLeft > 20);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 20);
  };

  return (
    <section id="watch-by-platform" className="platforms-section" aria-labelledby="platforms-row-heading">
      <div className="platforms-heading-wrap">
        <h2 id="platforms-row-heading" className="row-title">Studios &amp; Platforms</h2>
      </div>

      <div className="platforms-row-outer">
        <div className="platforms-group">
          {/* Scroll track */}
          <div
            className="platforms-scroll-track"
            ref={rowRef}
            onScroll={sync}
          >
            {PLATFORMS.map((p) => (
              <Link
                key={p.name}
                href={p.href}
                className="platform-card-link"
                aria-label={p.label}
                title={p.name}
              >
                {/* Gradient background */}
                <div
                  className="platform-card-bg"
                  style={{
                    background: `linear-gradient(145deg, ${p.bg} 0%, color-mix(in srgb, ${p.bg} 58%, ${p.bgDark} 42%) 100%)`,
                  }}
                />
                {/* Shine overlay */}
                <span className="platform-card-shine" aria-hidden="true" />
                {/* Logo */}
                <Image
                  src={p.logo}
                  alt=""
                  aria-hidden="true"
                  width={220}
                  height={110}
                  loading="lazy"
                  className="platform-card-logo"
                  style={{ filter: p.logoFilter || undefined }}
                  unoptimized
                />
              </Link>
            ))}
          </div>

          {/* Edge fades */}
          <div className="platform-edge-fade platform-edge-fade--left" aria-hidden="true" />
          <div className="platform-edge-fade platform-edge-fade--right" aria-hidden="true" />

          {/* Scroll buttons */}
          {canScrollLeft && (
            <button
              type="button"
              className="platform-scroll-btn platform-scroll-btn--left"
              onClick={() => scroll("left")}
              aria-label="Scroll Studios and Platforms left"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
          )}
          {canScrollRight && (
            <button
              type="button"
              className="platform-scroll-btn platform-scroll-btn--right"
              onClick={() => scroll("right")}
              aria-label="Scroll Studios and Platforms right"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
