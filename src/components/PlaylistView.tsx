import React from "react";
import { Playlist, Track } from "../types";
import {
  Play,
  Pause,
  Plus,
  Trash2,
  Music,
  ExternalLink,
  Sparkles,
  Shuffle,
  Clock,
  Radio,
  Disc3,
  Heart
} from "lucide-react";

interface PlaylistViewProps {
  playlists: Playlist[];
  selectedPlaylistId: string;
  onSelectPlaylist: (id: string) => void;
  onPlayTrack: (track: Track, playlist?: Playlist) => void;
  onPlayAll: (playlist: Playlist) => void;
  onCreateEmptyPlaylist: () => void;
  onDeletePlaylist: (id: string) => void;
  currentTrackId?: string;
  isPlaying?: boolean;
  onOpenSettings?: (tab?: "voice" | "ai" | "dj") => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
  playlists,
  selectedPlaylistId,
  onSelectPlaylist,
  onPlayTrack,
  onPlayAll,
  onCreateEmptyPlaylist,
  onDeletePlaylist,
  currentTrackId,
  isPlaying = false,
  onOpenSettings,
}) => {
  const currentPlaylist = playlists.find((p) => p.id === selectedPlaylistId) || playlists[0];

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "youtube":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">YouTube</span>;
      case "soundcloud":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">SoundCloud</span>;
      case "apple":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">Apple Music</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-300 border border-orange-500/20">Sélection</span>;
    }
  };

  const totalDurationSec = currentPlaylist?.tracks?.reduce((acc, t) => acc + (t.durationSec || 210), 0) || 0;
  const totalMins = Math.floor(totalDurationSec / 60);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-7 font-['Plus_Jakarta_Sans']">
      {/* Left Sidebar: Playlists Collection in SoundCloud Style */}
      <div className="lg:col-span-1 space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <span>Playlists ({playlists.length})</span>
          </span>
          <button
            onClick={onCreateEmptyPlaylist}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-orange-500 hover:text-zinc-950 border border-white/10 text-orange-400 transition cursor-pointer active:scale-95"
            title="Créer une nouvelle playlist"
          >
            <Plus size={15} />
          </button>
        </div>

        <div className="space-y-2">
          {playlists.map((pl) => {
            const isSelected = pl.id === currentPlaylist?.id;
            return (
              <div
                key={pl.id}
                onClick={() => onSelectPlaylist(pl.id)}
                className={`flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer border transition-all duration-200 group ${
                  isSelected
                    ? "bg-zinc-900 border-orange-500/60 shadow-xl shadow-orange-950/40 ring-1 ring-orange-500/20"
                    : "bg-zinc-900/40 border-white/5 hover:bg-zinc-850 hover:border-white/10"
                }`}
              >
                <img
                  src={pl.coverUrl}
                  alt={pl.title}
                  className="w-13 h-13 rounded-xl object-cover border border-white/10 shrink-0 shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <div className={`font-semibold text-sm truncate transition ${isSelected ? "text-white" : "text-zinc-200 group-hover:text-orange-400"}`}>
                    {pl.title}
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    {pl.tracks.length} titres
                  </div>
                </div>

                {pl.isCustom && playlists.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePlaylist(pl.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    title="Supprimer la playlist"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Content: Selected Playlist Details & Tracks */}
      <div className="lg:col-span-3 space-y-6">
        {currentPlaylist && (
          <>
            {/* Playlist Header: Rich SoundCloud Banner */}
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-white/10 shadow-2xl">
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden shadow-2xl border border-white/10 shrink-0 group">
                  <img
                    src={currentPlaylist.coverUrl}
                    alt={currentPlaylist.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-orange-500 text-zinc-950 font-bold text-[10px]">
                    SoundCloud Mix
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      Playlist
                    </span>
                    <span className="text-xs text-zinc-400">
                      {currentPlaylist.tracks.length} titres • env. {totalMins} minutes
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                    {currentPlaylist.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xl">
                    {currentPlaylist.description || "Collection taillée pour vos sessions musicales et immersives."}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => onPlayAll(currentPlaylist)}
                      disabled={currentPlaylist.tracks.length === 0}
                      className="px-6 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-orange-500/25 transition active:scale-95 cursor-pointer"
                    >
                      <Play size={16} fill="currentColor" />
                      <span>TOUT ÉCOUTER</span>
                    </button>

                    <button
                      onClick={() => {
                        if (currentPlaylist.tracks.length > 0) {
                          const shuffled = [...currentPlaylist.tracks].sort(() => Math.random() - 0.5);
                          onPlayTrack(shuffled[0], { ...currentPlaylist, tracks: shuffled });
                        }
                      }}
                      disabled={currentPlaylist.tracks.length === 0}
                      className="px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-50 border border-white/10 text-white font-medium text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer"
                    >
                      <Shuffle size={15} />
                      <span>ALÉATOIRE</span>
                    </button>

                    {onOpenSettings && (
                      <button
                        onClick={() => onOpenSettings("dj")}
                        className="px-4 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-orange-400 hover:text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer"
                      >
                        <Sparkles size={15} />
                        <span>DJ IA</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tracks List */}
            {currentPlaylist.tracks.length === 0 ? (
              <div className="p-12 text-center rounded-3xl border border-dashed border-white/10 bg-zinc-900/30 space-y-3">
                <Music size={32} className="mx-auto text-zinc-500" />
                <p className="text-sm text-zinc-300 font-medium">Cette playlist ne contient aucun morceau pour le moment.</p>
                <p className="text-xs text-zinc-400">Utilisez l'onglet <strong>Découvrir</strong> pour ajouter des musiques.</p>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl overflow-hidden divide-y divide-white/5 shadow-xl">
                {currentPlaylist.tracks.map((track, idx) => {
                  const isThisPlaying = currentTrackId === track.id && isPlaying;
                  return (
                    <div
                      key={track.id}
                      className={`group flex items-center justify-between p-3.5 transition-colors ${
                        isThisPlaying ? "bg-orange-500/10" : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        {/* Index or Live Wave */}
                        <div className="w-6 text-center text-xs text-zinc-500 font-mono shrink-0">
                          {isThisPlaying ? (
                            <div className="flex items-end justify-center gap-0.5 h-3.5">
                              <span className="w-0.5 h-full bg-orange-500 animate-pulse" />
                              <span className="w-0.5 h-2 bg-orange-500 animate-pulse delay-75" />
                              <span className="w-0.5 h-3 bg-orange-500 animate-pulse delay-150" />
                            </div>
                          ) : (
                            idx + 1
                          )}
                        </div>

                        {/* Thumbnail */}
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-white/10 shadow-sm">
                          <img
                            src={track.coverUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            onClick={() => onPlayTrack(track, currentPlaylist)}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-orange-400 cursor-pointer"
                          >
                            <Play size={18} fill="currentColor" />
                          </button>
                        </div>

                        {/* Title & Artist */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              onClick={() => onPlayTrack(track, currentPlaylist)}
                              className={`font-semibold text-sm truncate cursor-pointer hover:text-orange-400 transition ${
                                isThisPlaying ? "text-orange-400" : "text-white"
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

                      {/* Mini Waveform & Duration & Play action */}
                      <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-0.5 h-4 w-16 opacity-30 group-hover:opacity-80 transition">
                          {[40, 70, 90, 60, 45, 80, 100, 75, 50, 65, 85, 40].map((h, i) => (
                            <span
                              key={i}
                              style={{ height: `${h}%` }}
                              className={`w-1 rounded-full ${isThisPlaying ? "bg-orange-500" : "bg-zinc-600"}`}
                            />
                          ))}
                        </div>

                        <span className="text-xs text-zinc-400 font-mono">
                          {track.duration || "3:30"}
                        </span>

                        <button
                          onClick={() => onPlayTrack(track, currentPlaylist)}
                          className="p-2 rounded-xl bg-white/10 text-white group-hover:bg-orange-500 group-hover:text-zinc-950 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Écouter"
                        >
                          <Play size={14} fill="currentColor" />
                        </button>

                        {track.sourceUrl && (
                          <a
                            href={track.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-zinc-400 hover:text-white transition"
                            title="Ouvrir la source originale"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
