"use client";

// "Continue Watching" history, kept in this browser (localStorage "rh-history").
//
// The play page records how far the viewer got. When a movie is finished it
// is removed, so the row only shows titles still in progress. When a TV
// episode is finished, the show moves on to the next episode.

export const HISTORY_KEY = "rh-history";
const MAX_ITEMS = 20;

// Finished = 92% watched, or less than 4 minutes left (end credits).
const DONE_FRACTION = 0.92;
const DONE_REMAINING_SEC = 4 * 60;

export function isFinished(time, duration) {
  if (!(duration > 0) || !(time >= 0)) return false;
  return time / duration >= DONE_FRACTION || duration - time <= DONE_REMAINING_SEC;
}

export function readHistory() {
  try {
    const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    if (!Array.isArray(list)) return [];
    // Hide anything already finished (including entries saved before this rule).
    return list.filter((item) => item && !item.finished && !isFinished(item.time, item.duration));
  } catch {
    return [];
  }
}

function writeHistory(list) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
  } catch {}
}

function rawHistory() {
  try {
    const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

const sameTitle = (item, id) => String(item?.id) === String(id);

function playHref(type, id, season, episode) {
  const base = `/play?id=${encodeURIComponent(id)}&type=${type}`;
  return type === "tv" ? `${base}&season=${season}&episode=${episode}` : base;
}

// Save where the viewer is. Moves the title to the front of the row.
export function saveProgress({ id, type, title, poster, season, episode, time, duration }) {
  if (!id) return;
  const list = rawHistory();
  const prev = list.find((item) => sameTitle(item, id)) || {};
  const isTv = type === "tv";

  if (isFinished(time, duration)) {
    if (!isTv) {
      // Movie finished: take it out of Continue Watching.
      writeHistory(list.filter((item) => !sameTitle(item, id)));
      return;
    }
    // Episode finished: point the show at the next episode, from the start.
    const nextEpisode = Number(episode) + 1;
    writeHistory([
      {
        ...prev,
        id,
        type,
        title: title || prev.title || "",
        poster: poster || prev.poster || "",
        season: Number(season),
        episode: nextEpisode,
        time: 0,
        duration: 0,
        href: playHref(type, id, season, nextEpisode),
        timestamp: Date.now(),
      },
      ...list.filter((item) => !sameTitle(item, id)),
    ]);
    return;
  }

  writeHistory([
    {
      ...prev,
      id,
      type,
      title: title || prev.title || "",
      poster: poster || prev.poster || "",
      season: isTv ? Number(season) : undefined,
      episode: isTv ? Number(episode) : undefined,
      time: Number.isFinite(time) ? Math.floor(time) : prev.time || 0,
      duration: Number.isFinite(duration) && duration > 0 ? Math.floor(duration) : prev.duration || 0,
      finished: false,
      href: playHref(type, id, season, episode),
      timestamp: Date.now(),
    },
    ...list.filter((item) => !sameTitle(item, id)),
  ]);
}

export function removeFromHistory(id) {
  writeHistory(rawHistory().filter((item) => !sameTitle(item, id)));
}

// Reads a player's progress message. The players use different formats;
// returns { time?, duration?, ended? } or null.
export function parsePlayerProgress(data) {
  let d = data;
  if (typeof d === "string") {
    try {
      d = JSON.parse(d);
    } catch {
      return null;
    }
  }
  if (!d || typeof d !== "object") return null;

  // VidBolt (Bolt / Bolt 2)
  if (d.type === "timeupdate" && typeof d.time === "number") return { time: d.time };
  if (d.type === "durationchange" && typeof d.duration === "number") return { duration: d.duration };
  if (d.type === "ended") return { ended: true };

  // Cinezo, Orion, Premium and others: { type: "PLAYER_EVENT", data: { event, currentTime, duration } }
  if (d.type === "PLAYER_EVENT" && d.data) {
    const e = d.data;
    if (e.event === "ended" || e.event === "complete") return { ended: true };
    const t = Number(e.currentTime);
    const dur = Number(e.duration);
    if (Number.isFinite(t) || Number.isFinite(dur)) {
      return {
        ...(Number.isFinite(t) ? { time: t } : {}),
        ...(Number.isFinite(dur) && dur > 0 ? { duration: dur } : {}),
      };
    }
  }

  // { type: "MEDIA_DATA", data: { progress: { watched, duration } } }
  if (d.type === "MEDIA_DATA" && d.data?.progress) {
    const t = Number(d.data.progress.watched);
    const dur = Number(d.data.progress.duration);
    if (Number.isFinite(t) && Number.isFinite(dur) && dur > 0) return { time: t, duration: dur };
  }

  return null;
}
