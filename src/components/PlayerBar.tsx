import React, { useState, useEffect } from "react";
import { PlayerState, GamingOverlayConfig } from "../types";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sliders,
  Sparkles,
  Layers,
  Flame,
} from "lucide-react";
import { SoundCloudWaveform } from "./SoundCloudWaveform";
import { voiceDetection, VoiceDetectionState } from "../services/voiceDetection";

interface PlayerBarProps {
  playerState: PlayerState;
  overlayConfig: GamingOverlayConfig;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onChangeVolume: (volume: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleOverlay: () => void;
  onToggleDucking: () => void;
  onOpenEQMenu?: () => void;
  onOpenAdvancedAudio?: () => void;
  onOpenSettings?: (tab?: "voice" | "ai" | "dj") => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  playerState,
  overlayConfig,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onChangeVolume,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onToggleOverlay,
  onToggleDucking,
  onOpenEQMenu,
  onOpenAdvancedAudio,
  onOpenSettings,
}) => {
  const [voiceState, setVoiceState] = useState<VoiceDetectionState>(voiceDetection.getState());

  useEffect(() => {
    const unsub = voiceDetection.subscribe((st) => setVoiceState(st));
    return () => unsub();
  }, []);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  const isDucked = overlayConfig.audioDucking || voiceState.isSpeaking;

  return (
    <footer
      id="desktop-player-bar"
      className="fixed bottom-0 left-0 right-0 h-24 bg-zinc-950/95 border-t border-white/10 backdrop-blur-2xl z-40 px-3 sm:px-6 flex items-center justify-between gap-3 sm:gap-6 font-['Plus_Jakarta_Sans'] shadow-2xl"
    >
      {/* Left: Track Artwork & Info in SoundCloud style */}
      <div className="flex items-center gap-3 min-w-0 w-[28%] sm:w-1/4">
        <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0 shadow-lg group">
          {playerState.currentTrack?.coverUrl ? (
            <img
              src={playerState.currentTrack.coverUrl}
              alt="cover"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-orange-400 font-bold text-sm">
              RM
            </div>
          )}

          {playerState.isPlaying && (
            <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent pointer-events-none" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="font-bold text-sm text-white truncate cursor-pointer hover:text-orange-400 transition"
              title={playerState.currentTrack?.title}
            >
              {playerState.currentTrack?.title || "Sélectionnez un titre"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="truncate">{playerState.currentTrack?.artist || "Rassoul's music"}</span>
            <span className="text-zinc-600">•</span>
            <button
              onClick={() => onOpenSettings ? onOpenSettings("dj") : onOpenAdvancedAudio?.()}
              className="text-orange-400/90 hover:text-orange-300 flex items-center gap-1 shrink-0 transition text-[11px] font-medium cursor-pointer"
              title="Assistant DJ & Ambiance"
            >
              <Sparkles size={11} />
              <span>DJ IA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Center: SoundCloud Waveform & Transport Controls */}
      <div className="flex flex-col items-center gap-1 w-[44%] sm:w-1/2 max-w-2xl">
        {/* Buttons */}
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            id="player-shuffle-btn"
            onClick={onToggleShuffle}
            className={`p-2 rounded-xl transition cursor-pointer ${
              playerState.shuffle
                ? "text-orange-400 bg-orange-500/10"
                : "text-zinc-400 hover:text-white"
            }`}
            title="Lecture aléatoire"
          >
            <Shuffle size={15} />
          </button>

          <button
            id="player-prev-btn"
            onClick={onPrev}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-300 hover:text-white transition cursor-pointer active:scale-95"
            title="Précédent"
          >
            <SkipBack size={18} />
          </button>

          <button
            id="player-play-btn"
            onClick={onTogglePlay}
            className="p-3 sm:p-3.5 rounded-full bg-orange-500 text-zinc-950 hover:bg-orange-400 hover:scale-105 active:scale-95 shadow-xl shadow-orange-500/25 transition-all cursor-pointer"
            title={playerState.isPlaying ? "Pause" : "Lecture"}
          >
            {playerState.isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" className="translate-x-0.5" />
            )}
          </button>

          <button
            id="player-next-btn"
            onClick={onNext}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-300 hover:text-white transition cursor-pointer active:scale-95"
            title="Suivant"
          >
            <SkipForward size={18} />
          </button>

          <button
            id="player-repeat-btn"
            onClick={onToggleRepeat}
            className={`p-2 rounded-xl transition cursor-pointer ${
              playerState.repeat !== "off"
                ? "text-orange-400 bg-orange-500/10"
                : "text-zinc-400 hover:text-white"
            }`}
            title="Répétition"
          >
            {playerState.repeat === "one" ? <Repeat1 size={15} /> : <Repeat size={15} />}
          </button>
        </div>

        {/* SoundCloud Waveform Scrubber */}
        <div className="w-full flex items-center gap-2.5 text-[11px] font-mono text-zinc-400">
          <span className="w-8 text-right text-zinc-400 shrink-0">
            {formatTime(playerState.currentTime)}
          </span>

          <div className="flex-1">
            <SoundCloudWaveform
              trackId={playerState.currentTrack?.id || "default-track"}
              currentTime={playerState.currentTime}
              duration={playerState.duration || 1}
              isPlaying={playerState.isPlaying}
              onSeek={onSeek}
              height={26}
              barsCount={55}
            />
          </div>

          <span className="w-8 text-left text-zinc-500 shrink-0">
            {formatTime(playerState.duration)}
          </span>
        </div>
      </div>

      {/* Right: Voice Status, Volume, Settings */}
      <div className="flex items-center justify-end gap-2 sm:gap-3 w-[28%] sm:w-1/4">
        {/* Voice Auto-Ducking Indicator / Button */}
        <button
          id="player-ducking-btn"
          onClick={() => onOpenSettings ? onOpenSettings("voice") : onToggleDucking()}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
            voiceState.isSpeaking
              ? "bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_12px_rgba(255,85,0,0.4)] animate-pulse"
              : voiceState.isListening
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : isDucked
              ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
              : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
          }`}
          title={
            voiceState.isSpeaking
              ? "Voix détectée au micro : musique atténuée"
              : voiceState.isListening
              ? "Micro actif : écoute automatique de la voix"
              : "Configurer la détection vocale"
          }
        >
          {voiceState.isListening ? (
            <Mic size={14} className={voiceState.isSpeaking ? "animate-bounce" : ""} />
          ) : (
            <MicOff size={14} />
          )}
          <span className="hidden lg:inline text-[11px]">
            {voiceState.isSpeaking ? "Voix active" : voiceState.isListening ? "Micro auto" : "Voix"}
          </span>
        </button>

        {/* Volume Slider */}
        <div className="hidden sm:flex items-center gap-2 w-24">
          <button
            onClick={onToggleMute}
            className="text-zinc-400 hover:text-white transition cursor-pointer"
            title="Couper / Rétablir le volume"
          >
            {playerState.isMuted || playerState.volume === 0 ? (
              <VolumeX size={16} className="text-rose-400" />
            ) : (
              <Volume2 size={16} />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={playerState.isMuted ? 0 : playerState.volume}
            onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        {/* Audio & Immersion Settings Button */}
        <button
          onClick={onOpenAdvancedAudio || onOpenEQMenu}
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          title="Réglages d'écoute & transitions"
        >
          <Sliders size={14} className="text-orange-400" />
          <span className="hidden xl:inline text-xs">Ambiance</span>
        </button>

        {/* Immersion Mode (Overlay) */}
        <button
          onClick={onToggleOverlay}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
            overlayConfig.isOpen
              ? "bg-orange-500/20 border-orange-500 text-orange-300 shadow-lg shadow-orange-950/30"
              : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
          }`}
          title="Mode Immersion compact"
        >
          <Layers size={14} />
          <span className="hidden md:inline text-xs">Immersion</span>
        </button>
      </div>
    </footer>
  );
};

