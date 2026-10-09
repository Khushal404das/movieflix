"use client";

import { useEffect, useState } from "react";

export default function WatchlistButton({ item, className = "" }) {
  const [on, setOn] = useState(false);

  const read = () => {
    try {
      return JSON.parse(localStorage.getItem("rh-list") || "[]");
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (!item?.href) return;
    setOn(read().some((x) => x.href === item.href));
  }, [item?.href]);

  const toggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const list = read();
    const exists = list.some((x) => x.href === item.href);
    const next = exists ? list.filter((x) => x.href !== item.href) : [item, ...list];
    try {
      localStorage.setItem("rh-list", JSON.stringify(next));
    } catch {}
    setOn(!exists);
  };

  return (
    <button
      type="button"
      className={`watchlist-btn ${on ? "in-list" : ""} ${className}`}
      onClick={toggle}
      title={on ? "Remove from Watchlist" : "Add to Watchlist"}
    >
      {on ? (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span>In Watchlist</span>
        </>
      ) : (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Add to Watchlist</span>
        </>
      )}
    </button>
  );
}
