"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { TmdbCard } from "@/components/Card";

export default function InfinitePlatformGrid({
  initialItems = [],
  initialPage = 1,
  totalPages = 1,
  providerId = "",
  mediaType = "movie",
  genre = "",
  sort = "popularity.desc",
  platformId = "",
}) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(initialPage);
  const [maxPages, setMaxPages] = useState(totalPages);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPage < totalPages);
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

  // Sync state if server props change (e.g. user toggles genre or media tabs)
  useEffect(() => {
    setItems(initialItems);
    setPage(initialPage);
    setMaxPages(totalPages);
    setHasMore(initialPage < totalPages);
    loadingRef.current = false;
    setLoading(false);
  }, [initialItems, initialPage, totalPages, providerId, mediaType, genre, sort]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore || page >= maxPages) return;

    loadingRef.current = true;
    setLoading(true);

    const nextPage = page + 1;
    try {
      const sp = new URLSearchParams({
        providerId: String(providerId),
        media: mediaType,
        genre: genre || "",
        sort: sort || "popularity.desc",
        page: String(nextPage),
      });

      const res = await fetch(`/api/platform?${sp.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch platform items");

      const data = await res.json();
      const newItems = data.results || [];

      setItems((prev) => {
        const existingIds = new Set(prev.map((i) => `${i.type || mediaType}-${i.id}`));
        const uniqueNew = newItems.filter((i) => !existingIds.has(`${i.type || mediaType}-${i.id}`));
        return [...prev, ...uniqueNew];
      });

      setPage(nextPage);
      if (data.totalPages) setMaxPages(data.totalPages);
      if (nextPage >= (data.totalPages || maxPages) || newItems.length === 0) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more platform items:", err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [hasMore, page, maxPages, providerId, mediaType, genre, sort]);

  // IntersectionObserver to auto-load when scrolling down
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          loadMore();
        }
      },
      { rootMargin: "600px 0px" } // Pre-fetch 600px before user reaches the very bottom for butter-smooth experience
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, hasMore]);

  return (
    <div className="infinite-platform-wrapper">
      {items.length > 0 ? (
        <div className="media-grid platform-grid">
          {items.map((x) => (
            <TmdbCard key={(x.type || mediaType) + "-" + x.id} item={x} />
          ))}
        </div>
      ) : (
        <div className="empty-state-box">
          <p>No titles found for this filter.</p>
          <Link href={`/platform/${platformId}`} className="btn-primary">
            Clear Filters
          </Link>
        </div>
      )}

      {/* Sentinel for infinite scroll triggering */}
      <div ref={sentinelRef} className="infinite-scroll-sentinel" />

      {/* Loading Spinner */}
      {loading && (
        <div className="infinite-scroll-loader" aria-live="polite" aria-busy="true">
          <div className="infinite-spinner" />
          <span className="infinite-loader-text">Loading more titles...</span>
        </div>
      )}

      {/* Reached End of Catalog */}
      {!hasMore && items.length > 0 && (
        <div className="infinite-scroll-end">
          <div className="end-divider" />
          <span>You&apos;ve reached the end of the catalog</span>
        </div>
      )}
    </div>
  );
}
