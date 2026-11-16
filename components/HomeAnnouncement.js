"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DISCORD_INVITE_URL, TELEGRAM_URL, DiscordIcon, TelegramIcon } from "@/components/DiscordLink";

// Notice at the top of the home rows: where to follow MovieFlix for updates
// and requests, and where to get the app. The viewer can close it; it stays
// closed for the rest of the tab's session.
const DISMISS_KEY = "movieflix_announcement_closed";

export default function HomeAnnouncement() {
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") setClosed(true);
    } catch {}
  }, []);

  if (closed) return null;

  const close = () => {
    setClosed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  return (
    <aside className="home-announcement" aria-label="MovieFlix updates">
      <div className="home-announcement-text">
        <strong>Stay connected</strong>
        <span>
          Join our channels to request movies and series, get app and site updates, and report problems.
        </span>
      </div>

      <div className="home-announcement-actions">
        {TELEGRAM_URL && (
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="community-link home-announcement-btn home-announcement-btn--telegram"
          >
            <TelegramIcon size={16} />
            <span>Join Telegram</span>
          </a>
        )}
        <a
          href={DISCORD_INVITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="community-link home-announcement-btn home-announcement-btn--discord"
        >
          <DiscordIcon size={16} />
          <span>Join Discord</span>
        </a>
        <Link href="/app" className="home-announcement-btn">
          Get the app
        </Link>
      </div>

      <button type="button" className="home-announcement-close" onClick={close} aria-label="Close this notice">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </aside>
  );
}
