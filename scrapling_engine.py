#!/usr/bin/env python3
"""
Scrapling Engine Bridge for Rassoul's music
Powered by D4Vinci/Scrapling (https://github.com/d4vinci/Scrapling)
Anti-bot bypass, adaptive DOM parsing & high-speed audio scraping.
"""

import sys
import json
import re
import time
import argparse
from typing import List, Dict, Any

try:
    import scrapling
    from scrapling import Fetcher, Selector
    SCRAPLING_AVAILABLE = True
    SCRAPLING_VERSION = getattr(scrapling, "__version__", "0.4.15")
except Exception as e:
    SCRAPLING_AVAILABLE = False
    SCRAPLING_VERSION = "unavailable"
    sys.stderr.write(f"Scrapling import warning: {e}\n")

# Fallback headers
DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
}

def get_engine_status() -> Dict[str, Any]:
    return {
        "engine": "D4Vinci / Scrapling",
        "github": "https://github.com/d4vinci/Scrapling",
        "version": SCRAPLING_VERSION,
        "available": SCRAPLING_AVAILABLE,
        "antiBot": "Active (curl-impersonate & TLS spoofing)",
        "adaptiveParser": "Enabled (Adaptive Selector)",
        "fetchers": ["Fetcher", "StealthyFetcher", "DynamicFetcher"],
        "timestamp": time.time()
    }

def scrape_youtube_search(query: str, limit: int = 15) -> List[Dict[str, Any]]:
    tracks = []
    url = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}&sp=EgIQAQ%253D%253D"
    
    try:
        page = Fetcher.get(url, headers=DEFAULT_HEADERS, timeout=12)
        html = page.body.decode("utf-8", errors="ignore") if hasattr(page, "body") else ""
        
        # Scrapling Adaptive Regex Extraction on ytInitialData
        m = re.search(r'ytInitialData\s*=\s*({.+?});<\/script>', html) or re.search(r'var ytInitialData\s*=\s*({.+?});', html)
        if m:
            try:
                data = json.loads(m.group(1))
                sections = data.get("contents", {}).get("twoColumnSearchResultsRenderer", {}).get("primaryContents", {}).get("sectionListRenderer", {}).get("contents", [])
                for section in sections:
                    items = section.get("itemSectionRenderer", {}).get("contents", [])
                    for item in items:
                        vr = item.get("videoRenderer")
                        if vr and "videoId" in vr:
                            v_id = vr["videoId"]
                            title_runs = vr.get("title", {}).get("runs", [])
                            title = title_runs[0].get("text") if title_runs else vr.get("title", {}).get("simpleText", "YouTube Track")
                            
                            owner_runs = vr.get("ownerText", {}).get("runs", [])
                            artist = owner_runs[0].get("text") if owner_runs else "YouTube Music"
                            
                            duration = vr.get("lengthText", {}).get("simpleText", "3:30")
                            
                            thumbs = vr.get("thumbnail", {}).get("thumbnails", [])
                            cover = thumbs[-1].get("url") if thumbs else f"https://img.youtube.com/vi/{v_id}/hqdefault.jpg"
                            
                            # Parse duration in seconds
                            dur_sec = 210
                            try:
                                dparts = [int(p) for p in duration.split(":")]
                                if len(dparts) == 2:
                                    dur_sec = dparts[0] * 60 + dparts[1]
                                elif len(dparts) == 3:
                                    dur_sec = dparts[0] * 3600 + dparts[1] * 60 + dparts[2]
                            except Exception:
                                pass

                            tracks.append({
                                "id": f"yt-{v_id}",
                                "youtubeId": v_id,
                                "title": title,
                                "artist": artist,
                                "duration": duration,
                                "durationSec": dur_sec,
                                "coverUrl": cover,
                                "source": "youtube",
                                "sourceUrl": f"https://www.youtube.com/watch?v={v_id}",
                                "scraplingEngine": True
                            })
                            if len(tracks) >= limit:
                                break
                    if len(tracks) >= limit:
                        break
            except Exception as pe:
                sys.stderr.write(f"YouTube data parse error: {pe}\n")
                
        # Scrapling Fallback: regex search on video links if json was obfuscated
        if not tracks:
            v_matches = re.findall(r'\"videoId\":\"([a-zA-Z0-9_-]{11})\"', html)
            seen = set()
            for vid in v_matches:
                if vid not in seen:
                    seen.add(vid)
                    tracks.append({
                        "id": f"yt-{vid}",
                        "youtubeId": vid,
                        "title": f"{query.title()} (Mix Audio)",
                        "artist": "YouTube Gaming Audio",
                        "duration": "3:30",
                        "durationSec": 210,
                        "coverUrl": f"https://img.youtube.com/vi/{vid}/hqdefault.jpg",
                        "source": "youtube",
                        "sourceUrl": f"https://www.youtube.com/watch?v={vid}",
                        "scraplingEngine": True
                    })
                    if len(tracks) >= 8:
                        break

    except Exception as e:
        sys.stderr.write(f"Scrapling YouTube search error: {e}\n")
        
    return tracks

def scrape_apple_music_search(query: str, limit: int = 15) -> List[Dict[str, Any]]:
    tracks = []
    url = f"https://itunes.apple.com/search?term={query.replace(' ', '+')}&entity=song&limit={limit}"
    try:
        page = Fetcher.get(url, timeout=10)
        body_text = page.body.decode("utf-8", errors="ignore") if hasattr(page, "body") else ""
        data = json.loads(body_text)
        for item in data.get("results", []):
            dur_ms = item.get("trackTimeMillis", 180000)
            dur_sec = dur_ms // 1000
            mins = dur_sec // 60
            secs = dur_sec % 60
            duration_str = f"{mins}:{secs:02d}"
            raw_art = item.get("artworkUrl100", "")
            cover = raw_art.replace("100x100bb", "600x600bb") if raw_art else "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80"
            
            tracks.append({
                "id": f"apple-{item.get('trackId')}",
                "title": item.get("trackName", "Apple Music Track"),
                "artist": item.get("artistName", "Unknown Artist"),
                "album": item.get("collectionName", "Single"),
                "duration": duration_str,
                "durationSec": dur_sec,
                "coverUrl": cover,
                "source": "apple",
                "sourceUrl": item.get("trackViewUrl", ""),
                "streamUrl": item.get("previewUrl", ""),
                "scraplingEngine": True
            })
    except Exception as e:
        sys.stderr.write(f"Scrapling Apple search error: {e}\n")
    return tracks

def scrape_soundcloud_search(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    tracks = []
    url = f"https://soundcloud.com/search/sounds?q={query.replace(' ', '+')}"
    try:
        page = Fetcher.get(url, headers=DEFAULT_HEADERS, timeout=12)
        # In Scrapling, page.css returns a list of Selector/Adaptor objects
        links = page.css("article a") or page.css("noscript a")
        
        seen_urls = set()
        for el in links:
            href = el.attrib.get("href", "") if hasattr(el, "attrib") else ""
            if href and isinstance(href, str) and href.startswith("/") and not href.startswith("/search") and href not in seen_urls:
                seen_urls.add(href)
                raw_text = el.text if hasattr(el, "text") else ""
                clean_title = raw_text.replace("\n", " ").strip() if raw_text else query
                if clean_title:
                    tracks.append({
                        "id": f"sc-{int(time.time())}-{len(tracks)}",
                        "title": clean_title[:60],
                        "artist": "SoundCloud Artist",
                        "duration": "3:25",
                        "durationSec": 205,
                        "coverUrl": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80",
                        "source": "soundcloud",
                        "sourceUrl": f"https://soundcloud.com{href}",
                        "scraplingEngine": True
                    })
                    if len(tracks) >= limit:
                        break
    except Exception as e:
        sys.stderr.write(f"Scrapling SoundCloud error: {e}\n")
    return tracks

def scrape_url(target_url: str) -> Dict[str, Any]:
    """
    Scrapes a specific URL using Scrapling's Fetcher and Adaptive Selectors.
    Supports YouTube playlists, videos, SoundCloud links, Apple Music, and web pages.
    """
    target_url = target_url.strip()
    
    # 1. YouTube
    if "youtube.com" in target_url or "youtu.be" in target_url:
        list_match = re.search(r'[?&]list=([a-zA-Z0-9_-]+)', target_url)
        video_match = re.search(r'(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})', target_url)
        
        if list_match:
            pl_id = list_match.group(1)
            p_url = f"https://www.youtube.com/playlist?list={pl_id}"
            page = Fetcher.get(p_url, headers=DEFAULT_HEADERS, timeout=12)
            html = page.body.decode("utf-8", errors="ignore") if hasattr(page, "body") else ""
            
            # Scrapling Adaptive CSS for title
            page_title = "Playlist YouTube"
            title_nodes = page.css("title")
            if title_nodes and hasattr(title_nodes[0], "text"):
                page_title = title_nodes[0].text.replace("- YouTube", "").strip()
            
            tracks = []
            matches = re.findall(r'\"videoId\":\"([a-zA-Z0-9_-]{11})\",\"thumbnail\":.*?\"title\":\{\"runs\":\[\{\"text\":\"(.*?)\"\}\]', html)
            seen = set()
            for vid, vtitle in matches:
                if vid not in seen:
                    seen.add(vid)
                    tracks.append({
                        "id": f"yt-{vid}",
                        "youtubeId": vid,
                        "title": vtitle or "Morceau YouTube",
                        "artist": page_title[:35],
                        "duration": "3:30",
                        "durationSec": 210,
                        "coverUrl": f"https://img.youtube.com/vi/{vid}/hqdefault.jpg",
                        "source": "youtube",
                        "sourceUrl": f"https://www.youtube.com/watch?v={vid}",
                        "scraplingEngine": True
                    })
                    if len(tracks) >= 50:
                        break
            
            return {
                "title": page_title,
                "platform": "youtube",
                "trackCount": len(tracks),
                "tracks": tracks,
                "engine": "Scrapling Adaptive Parser"
            }
            
        elif video_match:
            vid = video_match.group(1)
            # Scrape video info via Scrapling Fetcher oEmbed
            oe_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={vid}&format=json"
            page = Fetcher.get(oe_url, timeout=10)
            title = "Morceau YouTube"
            artist = "YouTube"
            thumb = f"https://img.youtube.com/vi/{vid}/hqdefault.jpg"
            try:
                data = json.loads(page.body.decode("utf-8", errors="ignore"))
                title = data.get("title", title)
                artist = data.get("author_name", artist)
                thumb = data.get("thumbnail_url", thumb)
            except Exception:
                pass
            
            track = {
                "id": f"yt-{vid}",
                "youtubeId": vid,
                "title": title,
                "artist": artist,
                "duration": "3:40",
                "durationSec": 220,
                "coverUrl": thumb,
                "source": "youtube",
                "sourceUrl": f"https://www.youtube.com/watch?v={vid}",
                "scraplingEngine": True
            }
            return {
                "title": title,
                "platform": "youtube",
                "trackCount": 1,
                "tracks": [track],
                "engine": "Scrapling Fetcher + oEmbed"
            }

    # 2. Apple Music
    if "music.apple.com" in target_url:
        page = Fetcher.get(target_url, headers=DEFAULT_HEADERS, timeout=12)
        og_titles = page.css('meta[property="og:title"]')
        og_images = page.css('meta[property="og:image"]')
        
        album_title = og_titles[0].attrib.get("content", "") if og_titles and hasattr(og_titles[0], "attrib") else "Album Apple Music"
        cover = og_images[0].attrib.get("content", "") if og_images and hasattr(og_images[0], "attrib") else "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80"
        
        # Look for JSON-LD tracks
        tracks = []
        html = page.body.decode("utf-8", errors="ignore") if hasattr(page, "body") else ""
        for json_match in re.finditer(r'<script type="application\/ld\+json">({.+?})<\/script>', html, re.DOTALL):
            try:
                data = json.loads(json_match.group(1))
                if "track" in data and isinstance(data["track"], list):
                    for t in data["track"]:
                        t_name = t.get("name")
                        if t_name:
                            tracks.append({
                                "id": f"apple-scraped-{len(tracks)}",
                                "title": t_name,
                                "artist": t.get("byArtist", {}).get("name", album_title),
                                "duration": "3:30",
                                "coverUrl": cover,
                                "source": "apple",
                                "sourceUrl": target_url,
                                "scraplingEngine": True
                            })
            except Exception:
                pass
                
        if not tracks:
            tracks.append({
                "id": f"apple-{int(time.time())}",
                "title": album_title,
                "artist": "Apple Music",
                "duration": "3:30",
                "coverUrl": cover,
                "source": "apple",
                "sourceUrl": target_url,
                "scraplingEngine": True
            })
            
        return {
            "title": album_title,
            "platform": "apple",
            "trackCount": len(tracks),
            "tracks": tracks,
            "engine": "Scrapling LD+JSON Parser"
        }

    # 3. Generic Web Audio or OpenGraph Scrape
    page = Fetcher.get(target_url, headers=DEFAULT_HEADERS, timeout=12)
    og_titles = page.css('meta[property="og:title"]')
    og_descs = page.css('meta[property="og:description"]')
    og_images = page.css('meta[property="og:image"]')
    audio_srcs = page.css('audio') or page.css('source')
    
    title = og_titles[0].attrib.get("content", "") if og_titles and hasattr(og_titles[0], "attrib") else "Flux Audio Web"
    artist = og_descs[0].attrib.get("content", "")[:40] if og_descs and hasattr(og_descs[0], "attrib") else "Source Scrapling"
    cover = og_images[0].attrib.get("content", "") if og_images and hasattr(og_images[0], "attrib") else "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80"
    stream_url = audio_srcs[0].attrib.get("src", "") if audio_srcs and hasattr(audio_srcs[0], "attrib") else None
    
    track = {
        "id": f"web-{int(time.time())}",
        "title": title,
        "artist": artist,
        "duration": "3:30",
        "durationSec": 210,
        "coverUrl": cover,
        "source": "scraped",
        "sourceUrl": target_url,
        "streamUrl": stream_url,
        "scraplingEngine": True
    }
    
    return {
        "title": title,
        "platform": "web",
        "trackCount": 1,
        "tracks": [track],
        "engine": "Scrapling OpenGraph & Audio Selector"
    }

def main():
    parser = argparse.ArgumentParser(description="Scrapling Music Engine")
    subparsers = parser.add_subparsers(dest="command")
    
    # Status
    subparsers.add_parser("status")
    
    # Search
    search_p = subparsers.add_parser("search")
    search_p.add_argument("--query", required=True, help="Search query")
    search_p.add_argument("--source", default="all", choices=["all", "youtube", "soundcloud", "apple", "bandcamp"])
    search_p.add_argument("--limit", type=int, default=15)
    
    # URL Scrape
    url_p = subparsers.add_parser("url")
    url_p.add_argument("--url", required=True, help="Target URL to scrape")
    
    args = parser.parse_args()
    
    if args.command == "status":
        print(json.dumps(get_engine_status(), ensure_ascii=False))
        return
        
    if args.command == "search":
        start_t = time.time()
        results = []
        source = args.source
        
        if source in ["all", "youtube"]:
            results.extend(scrape_youtube_search(args.query, limit=args.limit))
        if source in ["all", "apple"]:
            results.extend(scrape_apple_music_search(args.query, limit=args.limit))
        if source in ["all", "soundcloud"]:
            results.extend(scrape_soundcloud_search(args.query, limit=8))
            
        # Deduplicate
        seen = set()
        deduped = []
        for t in results:
            key = (t["title"].lower().strip(), t["artist"].lower().strip())
            if key not in seen:
                seen.add(key)
                deduped.append(t)
                
        elapsed_ms = int((time.time() - start_t) * 1000)
        output = {
            "query": args.query,
            "source": args.source,
            "total": len(deduped),
            "tracks": deduped,
            "engine": "D4Vinci / Scrapling v" + SCRAPLING_VERSION,
            "elapsedMs": elapsed_ms,
            "antiBotBypass": True
        }
        print(json.dumps(output, ensure_ascii=False))
        return
        
    if args.command == "url":
        start_t = time.time()
        res = scrape_url(args.url)
        res["elapsedMs"] = int((time.time() - start_t) * 1000)
        print(json.dumps(res, ensure_ascii=False))
        return
        
    parser.print_help()

if __name__ == "__main__":
    main()
