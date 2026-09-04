import React, { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  Play,
  Pause,
  Plus,
  ExternalLink,
  Sparkles,
  Grid,
  List,
  Check,
  Flame,
  Radio,
  Music2,
  Compass,
  Headphones,
  SlidersHorizontal,
  Zap,
  TrendingUp,
  X
} from "lucide-react";
import { Track, TrackSource, ScraplingStatus } from "../types";

interface ScraperSearchProps {
  onPlayTrack: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onAddToPlaylistPrompt: (track: Track) => void;
  currentTrackId?: string;
  isPlaying?: boolean;
}

const DISCOVERY_TAGS = [
  { label: "Phonk & Drift", icon: "⚡", query: "Phonk Drift Tokyo" },
  { label: "Cyberpunk 2077", icon: "🌆", query: "Cyberpunk 2077 Night City" },
  { label: "Focus & Clutch", icon: "🎯", query: "FPS Aim Training Focus Beats" },
  { label: "Lo-Fi Chill", icon: "☕", query: "Lofi Chill Beats Gaming" },
  { label: "Synthwave 80s", icon: "🕹️", query: "Synthwave Retro 80s Outrun" },
  { label: "Rap & Drill", icon: "💎", query: "French Rap Drill 2024" },
  { label: "Épique & Orchestral", icon: "⚔️", query: "Hans Zimmer Epic Gaming Soundtrack" },
  { label: "Deep House & Club", icon: "🎛️", query: "Deep House Gaming Set" },
];

export const ScraperSearch: React.FC<ScraperSearchProps> = ({
  onPlayTrack,
  onAddToQueue,
  onAddToPlaylistPrompt,
  currentTrackId,
  isPlaying = false,
}) => {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<"all" | "youtube" | "soundcloud" | "apple">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Track[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addedTrackId, setAddedTrackId] = useState<string | null>(null);

  // Initial curated tracks
  useEffect(() => {
    if (!hasSearched) {
      executeScrape("cyberpunk gaming beats", "all", false);
    }
  }, []);

  const executeScrape = async (searchTerm: string, targetSource = source, isUserSearch = true) => {
    const term = searchTerm.trim();
    if (!term) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/scrape/search?q=${encodeURIComponent(term)}&source=${targetSource}`);
      const data = await res.json();

      if (data.tracks && Array.isArray(data.tracks)) {
        setResults(data.tracks);
      } else {
        setResults([]);
      }
      if (isUserSearch) setHasSearched(true);
    } catch (err: any) {
      console.error("Scraper error:", err);
      setErrorMsg("Impossible de récupérer les morceaux pour le moment. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeScrape(query);
  };

  const handleTagClick = (tagQuery: string) => {
    setQuery(tagQuery);
    executeScrape(tagQuery);
  };

  const handleQuickAdd = (track: Track) => {
    onAddToQueue(track);
    setAddedTrackId(track.id);
    setTimeout(() => setAddedTrackId(null), 1800);
  };

  const getSourceBadge = (trackSource: TrackSource) => {
    switch (trackSource) {
      case "youtube":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            YouTube
          </span>
        );
      case "soundcloud":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            SoundCloud
          </span>
        );
      case "apple":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-300" />
            Apple Music
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1.5 shadow-sm">
            <Sparkles size={11} />
            Sélection
          </span>
        );
    }
  };

  return (
    <div className="space-y-7 font-['Plus_Jakarta_Sans']">
      {/* Visual Hero Banner: Sleek, Warm, Ambient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-white/10 p-6 sm:p-10 shadow-2xl">
        {/* Soft atmospheric gradient orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-cyan-300 backdrop-blur-md">
              <Sparkles size={13} className="text-cyan-400" />
              <span>Streaming Audio HD • Zéro Publicité</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              Trouvez votre son parfait pour jouer
            </h2>

            <p className="text-sm text-zinc-300/90 leading-relaxed max-w-xl">
              Accédez instantanément à des millions de morceaux sur <strong>YouTube</strong>, <strong>SoundCloud</strong> et <strong>Apple Music</strong> avec des transitions DJ fluides et un son calibré pour vos sessions.
            </p>
          </div>

          {/* Clean Quick Stats / Highlights */}
          <div className="flex sm:flex-col gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center">
                <Headphones size={20} />
              </div>
              <div>
                <div className="text-xs text-zinc-400">Qualité Audio</div>
                <div className="text-sm font-bold text-white">Hi-Fi Stéréo 8D</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-300 flex items-center justify-center">
                <Zap size={20} />
              </div>
              <div>
                <div className="text-xs text-zinc-400">Enchaînement</div>
                <div className="text-sm font-bold text-white">Fondu DJ sans coupure</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Modern Search Bar */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative flex items-center">
          <div className="absolute left-5 flex items-center pointer-events-none text-zinc-400">
            <Search size={20} />
          </div>

          <input
            id="scraper-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un titre, un artiste, une ambiance ou coller un lien..."
            className="w-full pl-13 pr-36 py-4.5 rounded-2xl bg-zinc-900/90 border border-white/10 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15 text-white placeholder-zinc-400 text-sm sm:text-base transition-all shadow-lg shadow-black/20"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-32 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
              title="Effacer"
            >
              <X size={16} />
            </button>
          )}

          <div className="absolute right-2.5">
            <button
              id="scraper-submit-btn"
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-cyan-500/25 active:scale-95 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Recherche...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Rechercher</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Source Selectors & View Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Platform Filters with clean styling */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-900/80 border border-white/10 text-xs">
            {[
              { id: "all", label: "Toutes les sources", icon: Radio },
              { id: "youtube", label: "YouTube", dot: "bg-red-500" },
              { id: "soundcloud", label: "SoundCloud", dot: "bg-amber-500" },
              { id: "apple", label: "Apple Music", dot: "bg-rose-500" },
            ].map((p) => {
              const active = source === p.id;
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSource(p.id as any);
                    if (query) executeScrape(query, p.id as any);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl transition font-medium flex items-center gap-2 cursor-pointer ${
                    active
                      ? "bg-white/15 text-white font-semibold shadow-sm border border-white/20"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {Icon && <Icon size={13} className={active ? "text-cyan-400" : ""} />}
                  {p.dot && <span className={`w-2 h-2 rounded-full ${p.dot}`} />}
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900/80 border border-white/10 text-zinc-400">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "grid" ? "bg-white/15 text-cyan-300" : "hover:text-white"
              }`}
              title="Vue Grille"
            >
              <Grid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "list" ? "bg-white/15 text-cyan-300" : "hover:text-white"
              }`}
              title="Vue Liste"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Discovery Mood Chips */}
        <div className="flex items-center gap-2 overflow-x-auto py-1.5 scrollbar-none">
          <span className="text-xs text-zinc-400 font-medium shrink-0 flex items-center gap-1.5 pr-1">
            <TrendingUp size={14} className="text-cyan-400" />
            Tendances :
          </span>
          {DISCOVERY_TAGS.map((tag) => (
            <button
              key={tag.label}
              type="button"
              onClick={() => handleTagClick(tag.query)}
              className="px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-white/10 hover:border-cyan-400/50 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <span>{tag.icon}</span>
              <span>{tag.label}</span>
            </button>
          ))}
        </div>
      </form>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1 text-sm border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <span className="text-zinc-400">
            Morceaux trouvés :
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20">
            {results.length} titres
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {errorMsg}
        </div>
      )}

      {/* RESULTS DISPLAY: ELEGANT CARDS (GRID) */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {results.map((track) => {
            const isThisPlaying = currentTrackId === track.id && isPlaying;
            const isJustAdded = addedTrackId === track.id;

            return (
              <div
                key={track.id}
                className={`group relative rounded-3xl p-4 bg-zinc-900/70 border transition-all duration-300 flex flex-col justify-between hover:bg-zinc-850 hover:shadow-2xl hover:shadow-cyan-950/30 hover:-translate-y-1 ${
                  isThisPlaying
                    ? "border-cyan-400/70 shadow-xl shadow-cyan-950/50 bg-zinc-900"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                {/* Artwork Thumbnail with Floating Glass Controls */}
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-950 mb-3.5 shadow-md">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />

                  {/* Dark Glass Overlay with Center Play */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => onPlayTrack(track)}
                      className="w-13 h-13 rounded-full bg-cyan-400 hover:bg-cyan-300 text-zinc-950 flex items-center justify-center shadow-xl shadow-cyan-500/50 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                      title={isThisPlaying ? "Mettre en pause" : "Écouter"}
                    >
                      {isThisPlaying ? (
                        <Pause size={22} fill="currentColor" />
                      ) : (
                        <Play size={22} fill="currentColor" className="translate-x-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Active playing badge */}
                  {isThisPlaying && (
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-cyan-500 text-zinc-950 text-[10px] font-bold flex items-center gap-1.5 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-ping" />
                      <span>EN COURS</span>
                    </div>
                  )}

                  {/* Duration pill */}
                  {track.duration && (
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-sm text-zinc-200 text-xs font-mono border border-white/10">
                      {track.duration}
                    </div>
                  )}
                </div>

                {/* Track Details */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    {getSourceBadge(track.source)}
                  </div>

                  <h3
                    className="font-semibold text-sm text-white line-clamp-1 group-hover:text-cyan-300 transition cursor-pointer"
                    onClick={() => onPlayTrack(track)}
                    title={track.title}
                  >
                    {track.title}
                  </h3>

                  <p className="text-xs text-zinc-400 line-clamp-1">{track.artist}</p>
                </div>

                {/* Quick Action Buttons */}
                <div className="pt-3.5 mt-2 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onPlayTrack(track)}
                    className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-cyan-400 hover:text-zinc-950 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Play size={13} fill="currentColor" />
                    <span>Écouter</span>
                  </button>

                  <button
                    onClick={() => handleQuickAdd(track)}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      isJustAdded
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                        : "bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10"
                    }`}
                    title="Ajouter à la file de lecture"
                  >
                    {isJustAdded ? <Check size={15} /> : <Plus size={15} />}
                  </button>

                  <button
                    onClick={() => onAddToPlaylistPrompt(track)}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-cyan-300 hover:bg-white/10 transition cursor-pointer"
                    title="Ajouter à une playlist"
                  >
                    <Music2 size={15} />
                  </button>

                  {track.sourceUrl && (
                    <a
                      href={track.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                      title="Lien source"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* RESULTS DISPLAY: SLEEK LIST TABLE */
        <div className="rounded-3xl border border-white/10 bg-zinc-900/60 overflow-hidden divide-y divide-white/5 shadow-xl">
          {results.map((track, idx) => {
            const isThisPlaying = currentTrackId === track.id && isPlaying;
            return (
              <div
                key={track.id}
                className={`group flex items-center justify-between p-3.5 sm:p-4 transition-colors ${
                  isThisPlaying ? "bg-cyan-500/10" : "hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <span className="w-6 text-center text-xs text-zinc-500 font-mono">
                    {idx + 1}
                  </span>

                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-white/10 shadow-sm">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={() => onPlayTrack(track)}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-cyan-300 cursor-pointer"
                    >
                      <Play size={18} fill="currentColor" />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        onClick={() => onPlayTrack(track)}
                        className={`font-medium text-sm truncate cursor-pointer hover:text-cyan-300 transition ${
                          isThisPlaying ? "text-cyan-300 font-bold" : "text-white"
                        }`}
                      >
                        {track.title}
                      </span>
                      {getSourceBadge(track.source)}
                    </div>
                    <div className="text-xs text-zinc-400 truncate mt-0.5">
                      {track.artist}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400 font-mono">
                    {track.duration || "3:30"}
                  </span>

                  <button
                    onClick={() => handleQuickAdd(track)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title="Ajouter à la file"
                  >
                    <Plus size={16} />
                  </button>

                  <button
                    onClick={() => onAddToPlaylistPrompt(track)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-cyan-300 hover:bg-white/10 transition cursor-pointer"
                    title="Ajouter à une playlist"
                  >
                    <Music2 size={16} />
                  </button>

                  {track.sourceUrl && (
                    <a
                      href={track.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                      title="Lien source"
                    >
                      <ExternalLink size={15} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
