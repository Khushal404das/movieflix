const first = (v) => (Array.isArray(v) ? v[0] : v) || "";
export const clean = (v) => first(v).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export async function classics({ q = "", page = 1 } = {}) {
  const query = (q ? `title:(${q}) AND ` : "") + "collection:feature_films AND mediatype:movies";
  const u = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier&fl[]=title&fl[]=year&sort[]=downloads+desc&rows=24&page=${page}&output=json`;
  try {
    const r = await fetch(u, { next: { revalidate: 86400 } });
    const j = (await r.json()).response;
    return { docs: j.docs.map((d) => ({ id: d.identifier, title: clean(d.title), year: first(d.year) })), total: j.numFound };
  } catch { return { docs: [], total: 0 }; }
}

// Pick the most broadly-compatible playable file from an Archive item's files.
// Prefers an h.264/MPEG4 mp4; avoids tiny/highly-derived _<kb>.mp4 duplicates.
function pickPlayable(files, id) {
  const playable = (Array.isArray(files) ? files : []).filter((f) => {
    const fmt = (f.format || "").toLowerCase();
    return fmt === "mpeg4" || fmt.includes("h.264") || fmt.includes("264") || /\.mp4$/i.test(f.name || "");
  });
  if (playable.length === 0) return null;
  const main = playable.find((f) => !/_[\d.]+k[bg]?\.mp4$/i.test(f.name || ""));
  const pick = main || playable.sort((a, b) => (Number(b.size) || 0) - (Number(a.size) || 0))[0];
  if (!pick?.name) return null;
  return `https://archive.org/download/${encodeURIComponent(id)}/${encodeURIComponent(pick.name)}`;
}

export async function film(id) {
  try {
    const r = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}`, { next: { revalidate: 86400 } });
    const j = await r.json();
    if (!j.metadata) return null;
    const m = j.metadata;
    return {
      id,
      title: clean(m.title),
      year: first(m.year),
      description: clean(m.description),
      license: first(m.licenseurl),
      src: pickPlayable(j.files, id) // direct, license-permitted public-domain stream
    };
  } catch { return null; }
}
export const poster = (id) => `https://archive.org/services/img/${id}`;
