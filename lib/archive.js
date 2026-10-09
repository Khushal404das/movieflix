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

export async function film(id) {
  try {
    const r = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}`, { next: { revalidate: 86400 } });
    const j = await r.json();
    if (!j.metadata) return null;
    const m = j.metadata;
    return { id, title: clean(m.title), year: first(m.year), description: clean(m.description), license: first(m.licenseurl) };
  } catch { return null; }
}
export const poster = (id) => `https://archive.org/services/img/${id}`;
