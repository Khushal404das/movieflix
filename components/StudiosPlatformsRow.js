"use client";

import { useRef, useState } from "react";
import Link from "next/link";

const PLATFORMS = [
  { name: "Netflix",     style: "netflix",    bg: "#E50914", color: "#fff",    href: "/browse/tv?network=213"   },
  { name: "Prime Video", style: "prime",      bg: "#00A8E1", color: "#1A1A2E", href: "/browse/tv?network=1024"  },
  { name: "AMC+",        style: "amc",        bg: "#2A3A3A", color: "#00C8A0", href: "/browse/tv?network=174"   },
  { name: "Apple TV+",   style: "appletv",    bg: "#1C1C1E", color: "#fff",    href: "/browse/movie?network=2552"},
  { name: "Crunchyroll", style: "crunchyroll",bg: "#F47521", color: "#fff",    href: "/browse/tv?genre=16"      },
  { name: "Disney+",     style: "disney",     bg: "#113CCF", color: "#fff",    href: "/browse/movie?network=2739"},
  { name: "Hulu",        style: "hulu",       bg: "#1CE783", color: "#1A1A1A", href: "/browse/tv?network=453"   },
  { name: "HBO",         style: "hbo",        bg: "#5B0DBE", color: "#fff",    href: "/browse/tv?network=49"    },
  { name: "MGM+",        style: "mgm",        bg: "#7A6020", color: "#D4AF37", href: "/browse/movie?network=2692"},
  { name: "Paramount+",  style: "paramount",  bg: "#1B4B8A", color: "#fff",    href: "/browse/tv?network=4330"  },
  { name: "Peacock",     style: "peacock",    bg: "#1A3A2A", color: "#E8E8E8", href: "/browse/tv?network=3353"  },
  { name: "Shudder",     style: "shudder",    bg: "#1A0A0A", color: "#E50914", href: "/browse/tv?genre=27"      },
];

export default function StudiosPlatformsRow() {
  const rowRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft]   = useState(false);
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
    <div className="netflix-row-container studios-platforms-row">
      <div className="row-header">
        <div className="row-title-wrap">
          <h2 className="row-title">Studios &amp; Platforms</h2>
        </div>
      </div>

      <div className="row-slider-wrapper">
        {canScrollLeft && (
          <button type="button" className="row-nav-arrow left" onClick={() => scroll("left")} aria-label="Scroll left">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          </button>
        )}

        <div className="row-items-scroll studios-scroll" ref={rowRef} onScroll={sync}>
          {PLATFORMS.map((p) => (
            <Link key={p.name} href={p.href} className={`studio-card studio-${p.style}`} aria-label={`Browse ${p.name}`} title={p.name}>
              <div className="studio-card-inner" style={{ background: p.bg, color: p.color }}>
                <span className={`studio-logo studio-logo-${p.style}`}>
                  {p.style === "netflix"     && "NETFLIX"}
                  {p.style === "prime"       && <PrimeLogo />}
                  {p.style === "amc"         && <span className="amc-box">amc+</span>}
                  {p.style === "appletv"     && <AppleTVLogo />}
                  {p.style === "crunchyroll" && <CrunchyrollLogo />}
                  {p.style === "disney"      && "Disney+"}
                  {p.style === "hulu"        && "hulu"}
                  {p.style === "hbo"         && "HBO®"}
                  {p.style === "mgm"         && "MGM+"}
                  {p.style === "paramount"   && <><em>Paramount</em>+</>}
                  {p.style === "peacock"     && <>peacock<span className="peacock-dots">:</span></>}
                  {p.style === "shudder"     && "SHUDDER"}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {canScrollRight && (
          <button type="button" className="row-nav-arrow right" onClick={() => scroll("right")} aria-label="Scroll right">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}

function PrimeLogo() {
  return (
    <span className="prime-wrap">
      <span className="prime-text">prime</span>
      <span className="prime-video">video</span>
      <svg className="prime-arrow" viewBox="0 0 80 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 7 Q40 14 80 7" stroke="#00A8E1" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M70 3 L80 7 L70 11" stroke="#00A8E1" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
}

function AppleTVLogo() {
  return (
    <span className="appletv-wrap">
      <svg className="apple-icon" viewBox="0 0 814 1000" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-120.6c-42.8-72.5-68.1-155.5-68.1-236.1 0-186.9 120.3-285.7 239.9-285.7 63.8 0 116.9 40.8 157.7 40.8 38.8 0 100.3-43.3 173.9-43.3 64.7 0 131.7 23.7 183.7 58.5zM555.5 113c30.5-36.9 52.1-88.1 52.1-139.4 0-7.1-.6-14.3-1.9-20.1-49.9 1.9-110.1 33.1-145.8 75.7-27.5 31.8-51.5 83.1-51.5 133.2 0 7.5.6 15 2.5 20.7 3.2.6 8.4 1.3 13.6 1.3 45.1 0 102.7-30.5 131-71.4z"/>
      </svg>
      <span className="appletv-text">tv+</span>
    </span>
  );
}

function CrunchyrollLogo() {
  return (
    <span className="cr-wrap">
      <svg className="cr-icon" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="12"/>
        <circle cx="50" cy="50" r="22" fill="currentColor"/>
        <circle cx="50" cy="50" r="10" fill="#F47521"/>
      </svg>
      crunchyroll
    </span>
  );
}
