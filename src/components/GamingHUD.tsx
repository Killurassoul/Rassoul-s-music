import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Mic,
  Maximize2,
  X,
  Sparkles,
  Layers,
  MonitorPlay,
  Flame,
  Disc3,
  Sliders,
  Zap,
  Radio
} from "lucide-react";
import { GamingOverlayConfig, PlayerState, Track, AIDjState } from "../types";
import { Visualizer } from "./Visualizer";
import { pipManager } from "../services/pipManager";
import { aiDjService } from "../services/aiDjService";
import { voiceDetection, VoiceDetectionState } from "../services/voiceDetection";

interface GamingHUDProps {
  config: GamingOverlayConfig;
  playerState: PlayerState;
  onUpdateConfig: (partial: Partial<GamingOverlayConfig>) => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleDucking: () => void;
  onToggleMute: () => void;
  onChangeVolume: (val: number) => void;
  onOpenSearch: () => void;
  onOpenAdvancedAudio?: () => void;
  onOpenSettings?: (tab?: "voice" | "ai" | "dj") => void;
  onTriggerDjMix?: (targetTrack?: Track) => void;
  onSwitchVibe?: (vibe: string) => void;
  onSurpriseDrop?: () => void;
}

export const GamingHUD: React.FC<GamingHUDProps> = ({
  config,
  playerState,
  onUpdateConfig,
  onTogglePlay,
  onNext,
  onPrev,
  onToggleDucking,
  onToggleMute,
  onChangeVolume,
  onOpenSearch,
  onOpenAdvancedAudio,
  onOpenSettings,
  onTriggerDjMix,
  onSwitchVibe,
  onSurpriseDrop,
}) => {
  const [pipActive, setPipActive] = useState(false);
  const [djState, setDjState] = useState<AIDjState>(aiDjService.getState());
  const [voiceState, setVoiceState] = useState<VoiceDetectionState>(voiceDetection.getState());

  useEffect(() => {
    const unsubDJ = aiDjService.subscribe((st) => setDjState(st));
    const unsubVoice = voiceDetection.subscribe((vs) => setVoiceState(vs));
    return () => {
      unsubDJ();
      unsubVoice();
    };
  }, []);

  if (!config.isOpen) {
    return (
      <div
        id="hud-minimized-summoner"
        onClick={() => onUpdateConfig({ isOpen: true })}
        className="fixed bottom-24 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-zinc-950/95 border border-orange-500/60 text-orange-400 shadow-2xl shadow-orange-950/70 backdrop-blur-xl cursor-pointer hover:bg-zinc-900 hover:scale-105 active:scale-95 transition-all group select-none"
        title="Ouvrir le HUD Gaming Session (Alt + M)"
      >
        <div className="relative flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping absolute" />
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
        </div>
        <span className="font-['Plus_Jakarta_Sans'] text-xs font-bold tracking-wide text-zinc-100 group-hover:text-orange-400">
          DJ IA • SESSION JEU
        </span>
        <kbd className="px-2 py-0.5 text-[10px] rounded-md bg-zinc-900 border border-white/10 text-zinc-400 group-hover:text-orange-300 font-mono font-bold">
          {config.keybindings.toggleHud}
        </kbd>
      </div>
    );
  }

  // Positioning classes
  const positionClasses = {
    "top-right": "top-5 right-5",
    "top-left": "top-5 left-5",
    "bottom-right": "bottom-24 right-5",
    "bottom-left": "bottom-24 left-5",
    "top-center": "top-5 left-1/2 -translate-x-1/2",
  }[config.dockPosition];

  const handleTogglePiP = async () => {
    try {
      const active = await pipManager.togglePiP(playerState.currentTrack, playerState.isPlaying);
      setPipActive(active);
    } catch (e: any) {
      console.warn(e);
    }
  };

  const vibesList = [
    { label: "Phonk Bass", emoji: "⚡", vibe: "Adrénaline Phonk" },
    { label: "Focus Jeu", emoji: "🎯", vibe: "Focus Gaming" },
    { label: "Chill Lo-Fi", emoji: "☕", vibe: "Chill Lo-Fi" },
  ];

  return (
    <div
      id="gaming-hud-overlay"
      style={{ opacity: config.opacity }}
      className={`fixed z-50 ${positionClasses} transition-all duration-300 select-none font-['Plus_Jakarta_Sans']`}
    >
      {config.compactMode ? (
        // CAPSULE GAMING COMPACTE FLOTTANTE (Design SoundCloud épuré)
        <div className="flex items-center gap-3 px-3.5 py-2 rounded-full bg-zinc-950/90 border border-orange-500/40 backdrop-blur-2xl shadow-2xl shadow-black/80 text-zinc-100 ring-1 ring-white/10">
          {/* Mini Album Cover avec rotation vinyle */}
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-zinc-900 shrink-0 border border-orange-500/40 shadow-sm">
            {playerState.currentTrack?.coverUrl ? (
              <img
                src={playerState.currentTrack.coverUrl}
                alt="cover"
                className={`w-full h-full object-cover ${playerState.isPlaying ? "animate-spin [animation-duration:8s]" : ""}`}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-orange-400 text-xs font-bold">
                DJ
              </div>
            )}
            {/* Centre vinyle */}
            <div className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-zinc-950 border border-white/40" />
          </div>

          {/* Marquee Info */}
          <div className="max-w-[130px] truncate">
            <div className="text-xs font-bold text-zinc-100 truncate">
              {playerState.currentTrack?.title || "Aucun son"}
            </div>
            <div className="text-[10px] text-orange-400 truncate">
              {djState.isMixing ? "Mix en cours..." : (playerState.currentTrack?.artist || "Rassoul's music")}
            </div>
          </div>

          {/* Voice Indicator Badge if speaking */}
          {voiceState.isSpeaking && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold animate-pulse border border-amber-500/30">
              <Mic size={10} />
              <span>Voix</span>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-1 pl-1">
            <button
              id="hud-compact-play"
              onClick={onTogglePlay}
              className="w-7 h-7 rounded-full bg-orange-500 hover:bg-orange-400 text-zinc-950 flex items-center justify-center shadow transition active:scale-90 cursor-pointer"
              title="Lecture / Pause"
            >
              {playerState.isPlaying ? (
                <Pause size={12} fill="currentColor" />
              ) : (
                <Play size={12} fill="currentColor" className="translate-x-0.2" />
              )}
            </button>

            <button
              id="hud-compact-next"
              onClick={onNext}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer"
              title="Suivant"
            >
              <SkipForward size={14} />
            </button>

            {/* Quick Mix Trigger */}
            <button
              onClick={() => onTriggerDjMix && onTriggerDjMix()}
              className="p-1.5 rounded-lg text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 transition cursor-pointer"
              title="DJ IA : Enchaîner maintenant"
            >
              <Zap size={13} fill="currentColor" />
            </button>

            <button
              onClick={() => onUpdateConfig({ compactMode: false })}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-orange-400 transition cursor-pointer"
              title="Agrandir le HUD"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
      ) : (
        // HUD GAMING COMPLET (Glassmorphism Sombre & Élégant)
        <div className="w-84 sm:w-92 rounded-3xl bg-zinc-950/85 border border-white/10 backdrop-blur-3xl shadow-2xl shadow-black/90 text-zinc-100 overflow-hidden ring-1 ring-white/5 transition-all">
          {/* Top Bar : Statut DJ IA & Actions rapides */}
          <div className="px-4 py-3 bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-orange-950/30 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span className="font-bold text-xs text-zinc-100 tracking-wide">
                {djState.hasAI ? "DJ IA EN DIRECT" : "MIX DJ AUTO"}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-orange-500/15 text-orange-400 border border-orange-500/25">
                {config.keybindings.toggleHud}
              </span>
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-1 text-zinc-400">
              <button
                onClick={() => onUpdateConfig({ compactMode: true })}
                className="p-1.5 rounded-xl hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Mode capsule compacte"
              >
                <Layers size={13} />
              </button>

              <button
                onClick={handleTogglePiP}
                className={`p-1.5 rounded-xl transition cursor-pointer ${
                  pipActive ? "text-orange-400 bg-orange-500/20" : "hover:text-white hover:bg-white/10"
                }`}
                title="Fenêtre flottante toujours visible"
              >
                <MonitorPlay size={13} />
              </button>

              <button
                onClick={() => onUpdateConfig({ isOpen: false })}
                className="p-1.5 rounded-xl hover:text-rose-400 hover:bg-white/10 transition cursor-pointer"
                title="Masquer le HUD (Alt + M)"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 space-y-3.5">
            {/* Now Playing with Ambient Glow */}
            <div className="flex items-center gap-3.5 relative">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-zinc-900 shrink-0 border border-white/10 shadow-lg group">
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
                  <div className="absolute inset-0 bg-orange-500/10 animate-pulse" />
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-orange-500/20 text-orange-400 font-bold">
                    {djState.currentVibe}
                  </span>
                  {voiceState.isSpeaking && (
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/25 text-amber-300 font-bold flex items-center gap-1 animate-pulse">
                      <Mic size={9} /> Voix détectée
                    </span>
                  )}
                </div>

                <div
                  className="font-bold text-sm text-zinc-100 truncate hover:text-orange-400 transition cursor-pointer"
                  title={playerState.currentTrack?.title}
                >
                  {playerState.currentTrack?.title || "Aucun son sélectionné"}
                </div>

                <div className="text-xs text-zinc-400 truncate">
                  {playerState.currentTrack?.artist || "Rassoul's music"}
                </div>
              </div>
            </div>

            {/* DJ IA Live Comment / Next Track Banner */}
            <div className="p-2.5 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-orange-400 font-bold">
                  <Sparkles size={13} className="text-orange-400 animate-pulse" />
                  <span>{djState.hasAI ? "DJ IA aux platines" : "Mix DJ Automatique"}</span>
                </div>

                <button
                  onClick={() => onTriggerDjMix && onTriggerDjMix()}
                  className="px-2.5 py-1 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold text-[11px] flex items-center gap-1 transition active:scale-95 shadow-md shadow-orange-500/20 cursor-pointer"
                  title="Déclencher la transition DJ immédiatement"
                >
                  <Zap size={11} fill="currentColor" />
                  <span>MIXER ⚡</span>
                </button>
              </div>

              <p className="text-xs text-zinc-300 italic leading-snug line-clamp-2">
                "{djState.djSpeech}"
              </p>
            </div>

            {/* Mini SoundCloud Audio Spectrum */}
            <div className="px-2 py-1.5 bg-zinc-900/60 rounded-2xl border border-white/5 flex items-center gap-1">
              <Visualizer
                isPlaying={playerState.isPlaying}
                barsCount={28}
                className="h-6 w-full"
                colorTheme="cyber-amber"
              />
            </div>

            {/* Tactile Player Buttons */}
            <div className="flex items-center justify-center gap-4 pt-1">
              <button
                id="hud-prev-btn"
                onClick={onPrev}
                className="p-2.5 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-90 cursor-pointer"
                title="Précédent (Alt + ←)"
              >
                <SkipBack size={18} />
              </button>

              <button
                id="hud-play-btn"
                onClick={onTogglePlay}
                className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 flex items-center justify-center shadow-xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Lecture / Pause (Espace)"
              >
                {playerState.isPlaying ? (
                  <Pause size={20} fill="currentColor" />
                ) : (
                  <Play size={20} fill="currentColor" className="translate-x-0.5" />
                )}
              </button>

              <button
                id="hud-next-btn"
                onClick={onNext}
                className="p-2.5 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-90 cursor-pointer"
                title="Suivant (Alt + →)"
              >
                <SkipForward size={18} />
              </button>
            </div>

            {/* Volume Row */}
            <div className="flex items-center justify-between gap-3 text-xs pt-1">
              <button
                onClick={onToggleMute}
                className="text-zinc-400 hover:text-white transition cursor-pointer"
                title="Couper / Activer le son"
              >
                {playerState.isMuted || playerState.volume === 0 ? (
                  <VolumeX size={15} className="text-rose-400" />
                ) : (
                  <Volume2 size={15} />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={playerState.isMuted ? 0 : playerState.volume}
                onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />

              <span className="font-mono text-[11px] text-zinc-400 w-8 text-right">
                {playerState.isMuted ? "0%" : `${Math.round(playerState.volume * 100)}%`}
              </span>
            </div>

            {/* Micro Voix & Auto-Ducking (Épuré, clair, sans jargon) */}
            <div className="pt-2 border-t border-white/5">
              <button
                id="hud-ducking-btn"
                onClick={onToggleDucking}
                className={`w-full py-2.5 px-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                  config.audioDucking
                    ? "bg-orange-500/15 border-orange-500/40 text-orange-200 shadow-md shadow-orange-950/30"
                    : "bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-white hover:border-white/10"
                }`}
                title="Baisse automatiquement la musique quand vous parlez"
              >
                <div className="flex items-center gap-2">
                  <Mic size={14} className={voiceState.isSpeaking ? "text-amber-400 animate-pulse" : "text-orange-400"} />
                  <span>Atténuation Voix Auto</span>
                </div>
                <span className="text-[11px] font-bold text-orange-400">
                  {config.audioDucking ? (voiceState.isSpeaking ? "Voix active" : "En veille") : "Désactivé"}
                </span>
              </button>
            </div>

            {/* Quick Vibe Chips */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Changer la vibe DJ :</span>
                {onSurpriseDrop && (
                  <button
                    onClick={onSurpriseDrop}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                    title="Lancer un drop surprise immédiat"
                  >
                    <Flame size={12} />
                    <span>Drop Surprise</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {vibesList.map((item) => (
                  <button
                    key={item.vibe}
                    onClick={() => onSwitchVibe && onSwitchVibe(item.vibe)}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-medium truncate transition cursor-pointer ${
                      djState.currentVibe === item.vibe
                        ? "bg-orange-500 text-zinc-950 font-bold border-orange-500 shadow-sm"
                        : "bg-zinc-900/70 border-white/5 text-zinc-300 hover:text-white hover:border-white/15"
                    }`}
                  >
                    <span>{item.emoji} {item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Bar: Opacity & Settings */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
              <div className="flex items-center gap-2">
                <span>Opacité :</span>
                <input
                  type="range"
                  min="0.3"
                  max="1"
                  step="0.05"
                  value={config.opacity}
                  onChange={(e) => onUpdateConfig({ opacity: parseFloat(e.target.value) })}
                  className="w-16 h-1 bg-zinc-800 rounded appearance-none accent-orange-500"
                />
              </div>

              <div className="flex items-center gap-2">
                {onOpenSettings && (
                  <button
                    onClick={() => onOpenSettings("dj")}
                    className="text-orange-400 hover:text-orange-300 transition font-semibold cursor-pointer"
                  >
                    Paramètres DJ
                  </button>
                )}
                {onOpenAdvancedAudio && (
                  <button
                    onClick={onOpenAdvancedAudio}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer"
                    title="Réglages audio complets"
                  >
                    <Sliders size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
