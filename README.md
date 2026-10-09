# Reelhouse

Movie and series discovery built with Next.js 14 (App Router).

- **TMDB** for catalogue, detail pages, trailers, cast, seasons/episodes and per-region watch providers (`/watch/providers`).
- **Internet Archive** for a free-classics section with an in-site player (`/classics/[id]`).
- Server-side data fetching with revalidation, so the API key never reaches the browser. SEO metadata per title.

## Run
```bash
npm install
cp .env.example .env.local   # add TMDB_API_KEY, optionally TMDB_REGION (e.g. PK)
npm run dev
```
Deploy to Vercel and add the same variables in Project Settings → Environment Variables.

## Notes
- Credit TMDB and JustWatch (already in the footer); TMDB's terms require it.
- Internet Archive titles vary in rights status; the player page links each film's licence info.
