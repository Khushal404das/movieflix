"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Card from "./Card";
import useSideScroll from "@/lib/useSideScroll";

export default function NetflixRow({
  title,
  items = [],
  isTop10 = false,
  seeAllHref,
  backdropStyle = true
}) {
  const rowRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  useSideScroll(rowRef, items?.length || 0);

  if (!items || items.length === 0) return null;

  const handleScroll = (direction) => {
    if (!rowRef.current) return;
    const { scrollLeft, clientWidth } = rowRef.current;
    const scrollAmount = clientWidth * 0.75;
    const target = direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;

    rowRef.current.scrollTo({ left: target, behavior: "smooth" });
    setTimeout(updateScrollState, 400);
  };

  const updateScrollState = () => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setCanScrollLeft(scrollLeft > 20);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 20);
  };

  return (
    <div className={`netflix-row-container ${isTop10 ? "top10-row" : ""}`}>
      <div className="row-header">
        <div className="row-title-wrap">
          <h2 className="row-title">{title}</h2>
          {seeAllHref && (
            <Link href={seeAllHref} prefetch={true} className="row-explore-link">
              Explore All <span className="arrow">&gt;</span>
            </Link>
          )}
        </div>
      </div>

      <div className="row-slider-wrapper">
        {canScrollLeft && (
          <button
            type="button"
            className="row-nav-arrow left"
            onClick={() => handleScroll("left")}
            aria-label="Scroll left"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          </button>
        )}

        <div
          className="row-items-scroll"
          ref={rowRef}
          onScroll={updateScrollState}
        >
          {items.map((item, index) => {
            if (isTop10) {
              return (
                <div key={(item.type || "m") + item.id} className="top10-item-wrap">
                  <div className="top10-rank-number">
                    <span className="rank-digit">{index + 1}</span>
                  </div>
                  <div className="top10-card-box">
                    <Card
                      href={`/${item.type || "movie"}/${item.id}`}
                      title={item.title}
                      poster={item.poster}
                      backdrop={item.backdrop || item.poster}
                      rating={item.rating}
                      quality={item.quality}
                      type={item.type}
                      sub={item.year}
                      isWide={false}
                      genres={item.genres}
                      runtime={item.runtime}
                      seasons={item.seasons}
                      number_of_seasons={item.number_of_seasons}
                      item={item}
                    />
                  </div>
                </div>
              );
            }

            return (
              <div key={(item.type || "m") + item.id} className="row-item-wrapper">
                <Card
                  href={`/${item.type || "movie"}/${item.id}`}
                  title={item.title}
                  poster={backdropStyle ? (item.backdrop || item.poster) : item.poster}
                  backdrop={item.backdrop || item.poster}
                  rating={item.rating}
                  quality={item.quality}
                  type={item.type}
                  sub={item.year}
                  isWide={backdropStyle}
                  genres={item.genres}
                  runtime={item.runtime}
                  seasons={item.seasons}
                  number_of_seasons={item.number_of_seasons}
                  item={item}
                />
              </div>
            );
          })}
        </div>

        {canScrollRight && (
          <button
            type="button"
            className="row-nav-arrow right"
            onClick={() => handleScroll("right")}
            aria-label="Scroll right"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}
