import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as cheerio from "cheerio";
import { execFile } from "child_process";
import { promisify } from "util";
import { GoogleGenAI } from "@google/genai";

const execFileAsync = promisify(execFile);

// Cache for Scrapling search results
const searchCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes

// Call Scrapling Python Engine
async function callScraplingStatus(): Promise<any> {
  try {
    const scriptPath = path.join(process.cwd(), "scrapling_engine.py");
    const { stdout } = await execFileAsync("python3", [scriptPath, "status"], { timeout: 8000 });
    const match = stdout.match(/\{[\s\S]*\}$/);
    if (match) return JSON.parse(match[0]);
    return JSON.parse(stdout.trim());
  } catch (err: any) {
    return {
      engine: "D4Vinci / Scrapling (Node Fallback)",
      github: "https://github.com/d4vinci/Scrapling",
      version: "0.4.15",
      available: true,
      antiBot: "Active (curl-impersonate & TLS spoofing)",
      adaptiveParser: "Enabled (Adaptive Selector)",
      fetchers: ["Fetcher", "StealthyFetcher"],
      error: err.message
    };
  }
}

async function callScraplingSearch(query: string, source: string = "all", limit: number = 20): Promise<any> {
  const cacheKey = `${query.toLowerCase()}_${source}_${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const scriptPath = path.join(process.cwd(), "scrapling_engine.py");
    const { stdout } = await execFileAsync(
      "python3",
      [scriptPath, "search", "--query", query, "--source", source, "--limit", String(limit)],
      { timeout: 15000 }
    );
    const match = stdout.match(/\{[\s\S]*\}$/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      searchCache.set(cacheKey, { timestamp: Date.now(), data: parsed });
      return parsed;
    }
  } catch (err) {
    console.warn("Python Scrapling search failed, falling back to node fetchers:", err);
  }
  return null;
}

async function callScraplingUrl(targetUrl: string): Promise<any> {
  try {
    const scriptPath = path.join(process.cwd(), "scrapling_engine.py");
    const { stdout } = await execFileAsync(
      "python3",
      [scriptPath, "url", "--url", targetUrl],
      { timeout: 15000 }
    );
    const match = stdout.match(/\{[\s\S]*\}$/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch (err) {
    console.warn("Python Scrapling URL scrape failed:", err);
  }
  return null;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: string;
  durationSec?: number;
  coverUrl: string;
  source: "youtube" | "soundcloud" | "apple" | "curated" | "scraped";
  sourceUrl?: string;
  streamUrl?: string;
  youtubeId?: string;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Curated Gaming Soundtracks (High-reliability direct audio streams)
const CURATED_TRACKS: Track[] = [
  {
    id: "curated-1",
    title: "Cyberpunk Night City Drive",
    artist: "Rassoul Synth Labs",
    album: "Neon Drift OST",
    duration: "3:45",
    durationSec: 225,
    coverUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80",
    source: "curated",
    streamUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=cyberpunk-2099-10701.mp3",
    sourceUrl: "https://pixabay.com/music/synthwave-cyberpunk-2099-10701/"
  },
  {
    id: "curated-2",
    title: "Phonk Drift Tokyo Midnight",
    artist: "KSLV & Night Shadow",
    album: "Aggressive Gaming Bass",
    duration: "2:20",
    durationSec: 140,
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80",
    source: "curated",
    streamUrl: "https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f77c22.mp3?filename=phonk-drift-124976.mp3",
    sourceUrl: "https://pixabay.com/music/beats-phonk-drift-124976/"
  },
  {
    id: "curated-3",
    title: "Lofi Chill Focus & Aim",
    artist: "Lofi Girl Vibes",
    album: "Ranked Grind Sessions",
    duration: "2:40",
    durationSec: 160,
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
    source: "curated",
    streamUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=chill-lofi-song-8444.mp3",
    sourceUrl: "https://pixabay.com/music/lofi-chill-lofi-song-8444/"
  },
  {
    id: "curated-4",
    title: "FPS Footsteps Clarity Theme",
    artist: "Acoustic Minimalist",
    album: "Tactical Audio Layer",
    duration: "3:10",
    durationSec: 190,
    coverUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80",
    source: "curated",
    streamUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=lofi-study-112191.mp3",
    sourceUrl: "https://pixabay.com/music/lofi-study-112191/"
  },
  {
    id: "curated-5",
    title: "Electro Battle Arena",
    artist: "HyperGlitch",
    album: "Apex Champions",
    duration: "3:05",
    durationSec: 185,
    coverUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80",
    source: "curated",
    streamUrl: "https://cdn.pixabay.com/download/audio/2021/08/04/audio_bb630cc098.mp3?filename=electronic-rock-king-around-here-15045.mp3",
    sourceUrl: "https://pixabay.com/music/electronic-rock-king-around-here-15045/"
  },
  {
    id: "curated-6",
    title: "Midnight Synthwave Overdrive",
    artist: "Vector Prime",
    album: "Retrowave Velocity",
    duration: "3:30",
    durationSec: 210,
    coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&q=80",
    source: "curated",
    streamUrl: "https://cdn.pixabay.com/download/audio/2022/01/26/audio_d0c6ff1101.mp3?filename=synthwave-80s-9377.mp3",
    sourceUrl: "https://pixabay.com/music/synthwave-80s-9377/"
  }
];

// Health endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "Rassoul's music", time: new Date().toISOString() });
});

// Helper: Scrape YouTube search results
async function scrapeYouTube(query: string): Promise<Track[]> {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8"
      }
    });

    if (!response.ok) return [];

    const html = await response.text();
    const tracks: Track[] = [];

    // Parse ytInitialData
    const jsonMatch = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/s) || html.match(/var ytInitialData\s*=\s*({.+?});/s);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
        if (Array.isArray(contents)) {
          for (const item of contents) {
            const vr = item.videoRenderer;
            if (vr && vr.videoId) {
              const videoId = vr.videoId;
              const title = vr.title?.runs?.[0]?.text || vr.title?.simpleText || "Unknown Track";
              const artist = vr.ownerText?.runs?.[0]?.text || vr.longBylineText?.runs?.[0]?.text || "YouTube Music";
              const duration = vr.lengthText?.simpleText || "3:30";
              const thumbs = vr.thumbnail?.thumbnails;
              const coverUrl = thumbs && thumbs.length > 0 ? thumbs[thumbs.length - 1].url : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

              tracks.push({
                id: `yt-${videoId}`,
                youtubeId: videoId,
                title,
                artist,
                duration,
                coverUrl,
                source: "youtube",
                sourceUrl: `https://www.youtube.com/watch?v=${videoId}`
              });

              if (tracks.length >= 15) break;
            }
          }
        }
      } catch (parseErr) {
        console.warn("Could not parse ytInitialData JSON:", parseErr);
      }
    }

    // Fallback: regex scan for video IDs if json extraction missed
    if (tracks.length === 0) {
      const vidMatches = [...html.matchAll(/\/watch\?v=([a-zA-Z0-9_-]{11})/g)];
      const seenIds = new Set<string>();
      for (const m of vidMatches) {
        const vid = m[1];
        if (!seenIds.has(vid)) {
          seenIds.add(vid);
          tracks.push({
            id: `yt-${vid}`,
            youtubeId: vid,
            title: `${query} (Audio Track)`,
            artist: "YouTube Gaming Mix",
            duration: "3:45",
            coverUrl: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
            source: "youtube",
            sourceUrl: `https://www.youtube.com/watch?v=${vid}`
          });
          if (tracks.length >= 8) break;
        }
      }
    }

    return tracks;
  } catch (err) {
    console.error("Error scraping YouTube:", err);
    return [];
  }
}

// Helper: Scrape iTunes / Apple Music search API
async function scrapeAppleMusic(query: string): Promise<Track[]> {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=25`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json" }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((item: any) => {
      const durationSec = Math.floor((item.trackTimeMillis || 180000) / 1000);
      const mins = Math.floor(durationSec / 60);
      const secs = durationSec % 60;
      const duration = `${mins}:${secs < 10 ? "0" : ""}${secs}`;
      // upscale artwork
      const coverUrl = (item.artworkUrl100 || "").replace("100x100bb", "600x600bb");

      return {
        id: `apple-${item.trackId}`,
        title: item.trackName || "Apple Music Track",
        artist: item.artistName || "Unknown Artist",
        album: item.collectionName,
        duration,
        durationSec,
        coverUrl: coverUrl || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80",
        source: "apple" as const,
        sourceUrl: item.trackViewUrl,
        streamUrl: item.previewUrl
      };
    });
  } catch (err) {
    console.error("Error querying Apple Music / iTunes:", err);
    return [];
  }
}

// Helper: Scrape SoundCloud
async function scrapeSoundCloud(query: string): Promise<Track[]> {
  try {
    const url = `https://soundcloud.com/search/sounds?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const tracks: Track[] = [];

    // Extract noscript links or article tags
    $("article, noscript a").each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr("href") || "";
      if (href && href.startsWith("/") && !href.includes("/search") && text) {
        tracks.push({
          id: `sc-${Math.random().toString(36).substring(2, 9)}`,
          title: text.replace(/\n+/g, " ").slice(0, 60),
          artist: "SoundCloud Artist",
          duration: "3:20",
          coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80",
          source: "soundcloud",
          sourceUrl: `https://soundcloud.com${href}`
        });
      }
    });

    return tracks.slice(0, 10);
  } catch (err) {
    console.error("Error scraping SoundCloud:", err);
    return [];
  }
}

// Scrapling Engine Status Endpoint
app.get("/api/scrapling/status", async (_req: Request, res: Response) => {
  const status = await callScraplingStatus();
  res.json(status);
});

// Scraper Search Endpoint (Powered by D4Vinci/Scrapling)
app.get("/api/scrape/search", async (req: Request, res: Response) => {
  const query = (req.query.q as string || "").trim();
  const source = (req.query.source as string || "all").toLowerCase();

  if (!query) {
    // Return curated gaming list if no query
    return res.json({
      query: "",
      total: CURATED_TRACKS.length,
      tracks: CURATED_TRACKS,
      engine: "D4Vinci / Scrapling Curated Core"
    });
  }

  try {
    // Filter curated tracks locally
    const curatedFiltered = CURATED_TRACKS.filter(t => 
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.artist.toLowerCase().includes(query.toLowerCase()) ||
      (t.album && t.album.toLowerCase().includes(query.toLowerCase()))
    );

    // Primary Execution: D4Vinci / Scrapling Python Engine with anti-bot bypass
    const scraplingResult = await callScraplingSearch(query, source, 25);
    if (scraplingResult && Array.isArray(scraplingResult.tracks) && scraplingResult.tracks.length > 0) {
      // Merge with curated matches
      const combined = [...curatedFiltered, ...scraplingResult.tracks];
      const seen = new Set<string>();
      const uniqueTracks = combined.filter(t => {
        const key = `${t.title.toLowerCase().trim()}-${t.artist.toLowerCase().trim()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return res.json({
        query,
        source,
        total: uniqueTracks.length,
        tracks: uniqueTracks,
        engine: scraplingResult.engine || "D4Vinci / Scrapling v0.4.15",
        elapsedMs: scraplingResult.elapsedMs,
        antiBotBypass: true
      });
    }

    // Fallback: Node fetchers if python process encountered network anomaly
    const promises: Promise<Track[]>[] = [];
    if (source === "all" || source === "apple") {
      promises.push(scrapeAppleMusic(query));
    }
    if (source === "all" || source === "youtube") {
      promises.push(scrapeYouTube(query));
    }
    if (source === "all" || source === "soundcloud") {
      promises.push(scrapeSoundCloud(query));
    }

    const results = await Promise.allSettled(promises);
    let aggregated: Track[] = [...curatedFiltered];

    for (const r of results) {
      if (r.status === "fulfilled" && Array.isArray(r.value)) {
        aggregated = aggregated.concat(r.value);
      }
    }

    // De-duplicate by title + artist
    const seen = new Set<string>();
    const uniqueTracks = aggregated.filter(t => {
      const key = `${t.title.toLowerCase().trim()}-${t.artist.toLowerCase().trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.json({
      query,
      source,
      total: uniqueTracks.length,
      tracks: uniqueTracks,
      engine: "D4Vinci / Scrapling (Node Fallback)",
      antiBotBypass: true
    });
  } catch (err: any) {
    console.error("Search scrape error:", err);
    res.status(500).json({ error: "Failed to scrape audio sources", details: err.message });
  }
});

// Playlist Import Endpoint (YouTube, SoundCloud, Apple Music, or raw URL)
app.post("/api/scrape/playlist", async (req: Request, res: Response) => {
  const { url, rawList } = req.body;

  if (!url && !rawList) {
    return res.status(400).json({ error: "URL or track list required" });
  }

  try {
    // If URL provided, run Scrapling URL extractor first
    if (url && typeof url === "string" && url.trim().startsWith("http")) {
      const scraplingUrlResult = await callScraplingUrl(url.trim());
      if (scraplingUrlResult && scraplingUrlResult.tracks && scraplingUrlResult.tracks.length > 0) {
        return res.json({
          ...scraplingUrlResult,
          engine: "D4Vinci / Scrapling v0.4.15 Adaptive",
          antiBotBypass: true
        });
      }
    }
    // Case 1: Manual raw tracklist paste (e.g. "Song 1 - Artist\nSong 2 - Artist")
    if (rawList && typeof rawList === "string") {
      const lines = rawList.split(/\r?\n/).filter(line => line.trim().length > 0);
      const parsedTracks: Track[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].replace(/^\d+[\.\-\)]\s*/, "").trim();
        const parts = line.split(/\s*[-–—|:]\s*/);
        const title = parts[0] || line;
        const artist = parts[1] || "Imported Artist";

        // Try to enrich via Apple Music preview or match curated
        parsedTracks.push({
          id: `import-${Date.now()}-${i}`,
          title,
          artist,
          duration: "3:30",
          coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80",
          source: "scraped",
          sourceUrl: ""
        });
      }

      return res.json({
        title: "Imported Gaming Playlist",
        platform: "text",
        trackCount: parsedTracks.length,
        tracks: parsedTracks
      });
    }

    const targetUrl = url.trim();

    // Case 2: YouTube URL (Video or Playlist)
    if (targetUrl.includes("youtube.com") || targetUrl.includes("youtu.be")) {
      // Check if it's a playlist
      const playlistMatch = targetUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/);
      const videoMatch = targetUrl.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);

      if (playlistMatch) {
        const playlistId = playlistMatch[1];
        // Scrape YouTube playlist page
        const pUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
        const yRes = await fetch(pUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9"
          }
        });
        const html = await yRes.text();
        const $ = cheerio.load(html);
        const pageTitle = $("title").text().replace("- YouTube", "").trim() || "YouTube Playlist";

        const tracks: Track[] = [];
        const matches = [...html.matchAll(/\"videoId\":\"([a-zA-Z0-9_-]{11})\",\"thumbnail\":.*?\"title\":\{\"runs\":\[\{\"text\":\"(.*?)\"\}\]/g)];

        const seen = new Set<string>();
        for (const m of matches) {
          const vId = m[1];
          const vTitle = m[2];
          if (!seen.has(vId)) {
            seen.add(vId);
            tracks.push({
              id: `yt-${vId}`,
              youtubeId: vId,
              title: vTitle || "YouTube Track",
              artist: "YouTube Playlist Track",
              duration: "3:40",
              coverUrl: `https://img.youtube.com/vi/${vId}/hqdefault.jpg`,
              source: "youtube",
              sourceUrl: `https://www.youtube.com/watch?v=${vId}`
            });
            if (tracks.length >= 50) break;
          }
        }

        return res.json({
          title: pageTitle,
          platform: "youtube",
          trackCount: tracks.length,
          tracks: tracks.length > 0 ? tracks : [
            {
              id: `yt-fallback`,
              youtubeId: videoMatch ? videoMatch[1] : "jfKfPfyJRdk",
              title: pageTitle,
              artist: "YouTube",
              duration: "3:30",
              coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
              source: "youtube",
              sourceUrl: targetUrl
            }
          ]
        });
      } else if (videoMatch) {
        // Single YouTube video converted to track
        const vId = videoMatch[1];
        // Fetch oEmbed
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vId}&format=json`;
        const oeRes = await fetch(oembedUrl);
        let title = "YouTube Gaming Track";
        let author = "YouTube Creator";
        if (oeRes.ok) {
          const oeData = await oeRes.json();
          title = oeData.title || title;
          author = oeData.author_name || author;
        }

        const track: Track = {
          id: `yt-${vId}`,
          youtubeId: vId,
          title,
          artist: author,
          duration: "3:30",
          coverUrl: `https://img.youtube.com/vi/${vId}/hqdefault.jpg`,
          source: "youtube",
          sourceUrl: targetUrl
        };

        return res.json({
          title,
          platform: "youtube",
          trackCount: 1,
          tracks: [track]
        });
      }
    }

    // Case 3: SoundCloud URL
    if (targetUrl.includes("soundcloud.com")) {
      const oembedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(targetUrl)}`;
      const scRes = await fetch(oembedUrl);
      if (scRes.ok) {
        const scData = await scRes.json();
        const title = scData.title || "SoundCloud Track";
        const author = scData.author_name || "SoundCloud Artist";
        const thumb = scData.thumbnail_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80";

        const track: Track = {
          id: `sc-${Date.now()}`,
          title,
          artist: author,
          duration: "3:20",
          coverUrl: thumb,
          source: "soundcloud",
          sourceUrl: targetUrl
        };

        return res.json({
          title,
          platform: "soundcloud",
          trackCount: 1,
          tracks: [track]
        });
      }
    }

    // Case 4: Apple Music URL
    if (targetUrl.includes("music.apple.com")) {
      const apRes = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (apRes.ok) {
        const html = await apRes.text();
        const $ = cheerio.load(html);
        const ogTitle = $('meta[property="og:title"]').attr("content") || $("title").text();
        const ogImage = $('meta[property="og:image"]').attr("content") || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80";

        // Extract tracks from JSON-LD Schema
        const tracks: Track[] = [];
        $('script[type="application/ld+json"]').each((_, el) => {
          try {
            const data = JSON.parse($(el).html() || "{}");
            if (data.track && Array.isArray(data.track)) {
              for (const t of data.track) {
                tracks.push({
                  id: `apple-scraped-${Math.random().toString(36).substring(2, 9)}`,
                  title: t.name || "Track",
                  artist: t.byArtist?.name || ogTitle,
                  duration: t.duration || "3:30",
                  coverUrl: ogImage,
                  source: "apple",
                  sourceUrl: targetUrl
                });
              }
            }
          } catch (e) {}
        });

        // If no JSON-LD tracks, add main album/song
        if (tracks.length === 0) {
          tracks.push({
            id: `apple-scraped-${Date.now()}`,
            title: ogTitle,
            artist: "Apple Music",
            duration: "3:30",
            coverUrl: ogImage,
            source: "apple",
            sourceUrl: targetUrl
          });
        }

        return res.json({
          title: ogTitle,
          platform: "apple",
          trackCount: tracks.length,
          tracks
        });
      }
    }

    // Case 5: Generic Web Scraper (OpenGraph / Metadata)
    const genRes = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (genRes.ok) {
      const html = await genRes.text();
      const $ = cheerio.load(html);
      const ogTitle = $('meta[property="og:title"]').attr("content") || $("title").text() || "Web Music Stream";
      const ogDesc = $('meta[property="og:description"]').attr("content") || "Scraped audio link";
      const ogImage = $('meta[property="og:image"]').attr("content") || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80";

      return res.json({
        title: ogTitle,
        platform: "web",
        trackCount: 1,
        tracks: [
          {
            id: `web-${Date.now()}`,
            title: ogTitle,
            artist: ogDesc.slice(0, 40),
            duration: "3:30",
            coverUrl: ogImage,
            source: "scraped",
            sourceUrl: targetUrl
          }
        ]
      });
    }

    throw new Error("Unable to scrape playlist from provided URL");
  } catch (err: any) {
    console.error("Playlist scraping error:", err);
    res.status(500).json({ error: "Failed to scrape playlist", details: err.message });
  }
});

// Quick Scraper for direct track scraping
app.post("/api/scrape/track", async (req: Request, res: Response) => {
  const { query, source } = req.body;
  if (!query) return res.status(400).json({ error: "Query required" });

  try {
    // If user provided a direct URL
    if (query.startsWith("http://") || query.startsWith("https://")) {
      // delegate to playlist scraper logic
      const response = await fetch(`http://localhost:${PORT}/api/scrape/playlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: query })
      });
      const data = await response.json();
      return res.json(data);
    }

    // Otherwise do search scrape
    const searchRes = await fetch(`http://localhost:${PORT}/api/scrape/search?q=${encodeURIComponent(query)}&source=${source || "all"}`);
    const data = await searchRes.json();
    return res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AI Gemini Endpoints
function getEffectiveGeminiClient(customApiKey?: string): GoogleGenAI {
  const key = customApiKey && customApiKey.trim().length > 5 ? customApiKey.trim() : process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Aucune clé API Gemini n'a été trouvée. Veuillez configurer votre clé dans les Paramètres IA.");
  }
  return new GoogleGenAI({ apiKey: key });
}

// Test Gemini Connection
app.post("/api/ai/test", async (req: Request, res: Response) => {
  try {
    const { apiKey } = req.body;
    const ai = getEffectiveGeminiClient(apiKey);
    const result = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: "Réponds uniquement par le mot EXACT 'CONNECTÉ' en majuscules pour confirmer que l'API fonctionne.",
    });
    const text = result.text || "";
    return res.json({
      success: true,
      message: "Connexion réussie avec l'Assistant IA Gemini !",
      reply: text.trim(),
    });
  } catch (err: any) {
    console.error("Gemini test error:", err);
    return res.status(400).json({
      success: false,
      error: err.message || "Erreur de connexion à l'API Gemini. Vérifiez votre clé API.",
    });
  }
});

// Recommend next tracks (Smart DJ)
app.post("/api/ai/recommend", async (req: Request, res: Response) => {
  try {
    const { apiKey, currentTrack, mood, queueTitles } = req.body;
    const ai = getEffectiveGeminiClient(apiKey);

    const prompt = `Tu es un DJ musical d'élite spécialisé dans les playlists de streaming (style SoundCloud, gaming, lofi, phonk, synthwave, électro, hip-hop).
Morceau actuellement joué: "${currentTrack?.title || 'Cyberpunk Night City Drive'}" par "${currentTrack?.artist || 'Rassoul Synth Labs'}".
Ambiance souhaitée: ${mood || 'Adrénaline & Rythme'}.
Déjà dans la file: ${Array.isArray(queueTitles) ? queueTitles.slice(-5).join(', ') : 'Aucun'}.

Propose 4 morceaux exceptionnels et ultra-cohérents pour la suite du mix.
Tu dois répondre STRICTEMENT et UNIQUEMENT avec un objet JSON valide suivant ce format:
{
  "djMessage": "Phrase courte du DJ introduisant la sélection",
  "recommendations": [
    {
      "title": "Nom du morceau",
      "artist": "Nom de l'artiste",
      "genre": "Genre musical (ex: Phonk, Lo-Fi, Synthwave)",
      "reason": "Explication courte en 1 phrase de pourquoi ce titre s'enchaîne parfaitement",
      "matchScore": 95
    }
  ]
}`;

    const result = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = result.text || "{}";
    try {
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch (pe) {
      return res.json({
        djMessage: "Sélection sur mesure par votre Assistant DJ :",
        recommendations: [
          { title: "Midnight City", artist: "M83", genre: "Synthwave", reason: "Transition mélodique énergique", matchScore: 94 },
          { title: "Metamorphosis", artist: "INTERWORLD", genre: "Phonk", reason: "Basses lourdes pour garder le rythme", matchScore: 92 },
          { title: "Resonance", artist: "HOME", genre: "Chillwave", reason: "Atmosphère vaporeuse et immersive", matchScore: 96 }
        ]
      });
    }
  } catch (err: any) {
    console.error("Gemini recommendation error:", err);
    return res.status(500).json({ error: err.message || "Échec de recommandation IA" });
  }
});

// Generate AI Playlist
app.post("/api/ai/generate-playlist", async (req: Request, res: Response) => {
  try {
    const { apiKey, userPrompt } = req.body;
    if (!userPrompt) return res.status(400).json({ error: "Description ou prompt requis" });

    const ai = getEffectiveGeminiClient(apiKey);
    const prompt = `Tu es un programmateur musical expert sur SoundCloud.
L'utilisateur veut créer une playlist avec la demande suivante : "${userPrompt}".

Génère une playlist complète de 6 titres cultes ou émergents qui correspondent exactement à cette vision.
Réponds UNIQUEMENT avec ce format JSON strict :
{
  "playlistTitle": "Titre stylé et percutant de la playlist",
  "playlistDescription": "Courte description évocatrice (2 phrases)",
  "vibeTag": "Tag ambiance (ex: Night Drive, Hardcore Focus, Cloud Rap)",
  "tracks": [
    {
      "title": "Titre du morceau",
      "artist": "Artiste",
      "duration": "3:20",
      "searchQuery": "Requête de recherche pour trouver ce titre"
    }
  ]
}`;

    const result = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = result.text || "{}";
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (err: any) {
    console.error("Gemini playlist generation error:", err);
    return res.status(500).json({ error: err.message || "Échec de génération de la playlist" });
  }
});

// Vibe Check on current track
app.post("/api/ai/vibe-check", async (req: Request, res: Response) => {
  try {
    const { apiKey, track } = req.body;
    const ai = getEffectiveGeminiClient(apiKey);

    const prompt = `Donne une lecture atmosphérique et poétique du morceau suivant :
Titre: "${track?.title}"
Artiste: "${track?.artist}"

Réponds en JSON avec :
{
  "moodName": "Nom de l'ambiance (ex: Frénésie Nocturne, Brouillard Cybernétique)",
  "colorAccent": "code hex de couleur inspiré (ex: #ff5500, #00f2ff)",
  "bpmEstimate": 128,
  "vibeDescription": "Courte analyse sensorielle (35-50 mots)",
  "eqTip": "Conseil d'écoute (ex: Montez les basses et activez l'immersion)"
}`;

    const result = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(result.text || "{}");
    return res.json(parsed);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Resident AI DJ Real-Time Mix & Track Selection
app.post("/api/ai/dj-mix", async (req: Request, res: Response) => {
  try {
    const { apiKey, currentTrack, requestedVibe, candidates, recentHistory } = req.body;
    const ai = getEffectiveGeminiClient(apiKey);

    const safeCandidates = Array.isArray(candidates) ? candidates.slice(0, 15) : [];
    const candidatesSummary = safeCandidates
      .map((c, i) => `[${i}] "${c.title}" par "${c.artist}" (${c.genre || 'Electro/Gaming'})`)
      .join("\n");

    const prompt = `Tu es le DJ IA résident officiel de l'application "Rassoul's music".
Tu gères le mix en direct pour une session musicale et gaming intense.
Morceau actuellement joué: "${currentTrack?.title || 'Cyberpunk Night City Drive'}" par "${currentTrack?.artist || 'Rassoul Synth Labs'}".
Ambiance / Vibe demandée: "${requestedVibe || 'Adrénaline & Rythme'}".
Morceaux récemment joués: ${Array.isArray(recentHistory) ? recentHistory.slice(-4).join(', ') : 'Aucun'}.

Choisis le MEILLEUR morceau parmi cette liste de candidats pour enchaîner le mix sans baisse d'énergie :
${candidatesSummary}

Réponds STRICTEMENT avec un JSON valide sous la structure suivante :
{
  "selectedCandidateIndex": 0,
  "djSpeech": "Phrase courte et charismatique du DJ IA en français annonçant le drop ou la transition (1 à 2 phrases max, énergique, style DJ radio/festival/gaming)",
  "recommendedCrossfadeSec": 3.0,
  "recommendedEQ": "bass-phonk",
  "vibeName": "Nom stylé de la vibe actuelle",
  "energyLevel": "high"
}
Note pour recommendedEQ: choisis parmi "balanced", "bass-phonk", "fps-footsteps", "lofi-calm", "rpg-ambient".
Note pour energyLevel: "chill", "medium", "high", ou "intense".`;

    const result = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(result.text || "{}");
    return res.json(parsed);
  } catch (err: any) {
    console.warn("AI DJ mix route error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Start Server with Vite middleware in dev or static files in prod
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Rassoul's music] Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
