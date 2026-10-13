/**
 * Free, licensed art videos for the homepage hero, from the Pexels video API (https://www.pexels.com/api/).
 * Server-side only: PEXELS_API_KEY is read here and never sent to the browser.
 * Results are cached for 6 hours by Next, so the API is hit a handful of times a day at most.
 */

const QUERIES = ["abstract paint art", "ink in water", "sculpture art gallery", "painting brush strokes"];
const PER_QUERY = 4;
const MAX_VIDEOS = 6;
const MAX_SECONDS = 40; // long clips mean big downloads

type PexelsFile = { file_type?: string; width?: number; height?: number; link?: string };
type PexelsVideo = { duration?: number; video_files?: PexelsFile[] };

/** One good MP4 link from a Pexels video: landscape, ideally 1280-1920 wide, never larger than Full HD. */
export function pickFile(v: PexelsVideo): string {
  if (typeof v.duration === "number" && v.duration > MAX_SECONDS) return "";
  const files = (v.video_files ?? []).filter(
    (f): f is Required<Pick<PexelsFile, "link" | "width" | "height">> & PexelsFile =>
      f.file_type === "video/mp4" && typeof f.link === "string" && f.link.startsWith("https://") &&
      typeof f.width === "number" && typeof f.height === "number" && f.width >= f.height
  );
  if (!files.length) return "";
  const ok = files.filter((f) => f.width <= 1920);
  const pool = ok.length ? ok : files;
  const ideal = pool.filter((f) => f.width >= 1280);
  const best = ideal.length
    ? ideal.reduce((a, b) => (b.width > a.width ? b : a)) // biggest within Full HD
    : pool.reduce((a, b) => (b.width > a.width ? b : a));
  return best.link;
}

/** Takes the results of several searches and mixes them so the loop has variety (one from each, then the next round). */
export function mixVideos(results: unknown[], max = MAX_VIDEOS): string[] {
  const lists = results.map((r) => {
    const vids = r && typeof r === "object" && Array.isArray((r as { videos?: unknown }).videos) ? ((r as { videos: PexelsVideo[] }).videos) : [];
    return vids.map(pickFile).filter(Boolean);
  });
  const out: string[] = [];
  for (let round = 0; out.length < max && round < PER_QUERY; round++) {
    for (const l of lists) {
      const link = l[round];
      if (link && !out.includes(link) && out.length < max) out.push(link);
    }
  }
  return out;
}

export async function getArtVideos(): Promise<string[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  const page = (Math.floor(Date.now() / 86_400_000) % 3) + 1; // a different set every day
  try {
    const results = await Promise.all(
      QUERIES.map(async (q) => {
        const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&orientation=landscape&size=medium&per_page=${PER_QUERY + 2}&page=${page}`;
        const res = await fetch(url, { headers: { Authorization: key }, next: { revalidate: 21_600 }, signal: AbortSignal.timeout(5000) });
        return res.ok ? res.json() : null;
      })
    );
    return mixVideos(results);
  } catch {
    return []; // Pexels down or key wrong: the hero just stays dark, the site keeps working
  }
}
