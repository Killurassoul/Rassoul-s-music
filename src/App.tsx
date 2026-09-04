import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Track,
  Playlist,
  GamingOverlayConfig,
  PlayerState,
  EQProfile
} from "./types";
import { audioEngine } from "./services/audioEngine";
import { pipManager } from "./services/pipManager";
import { aiDjService } from "./services/aiDjService";
import { DEFAULT_TRACKS, INITIAL_PLAYLISTS, GAME_PRESETS } from "./data/initialPlaylists";
import { GamingHUD } from "./components/GamingHUD";
import { PlayerBar } from "./components/PlayerBar";
import { ScraperSearch } from "./components/ScraperSearch";
import { PlaylistImporter } from "./components/PlaylistImporter";
import { PlaylistView } from "./components/PlaylistView";
import { GameBackdropSimulator } from "./components/GameBackdropSimulator";
import { KeybindingsModal } from "./components/KeybindingsModal";
import { AddToPlaylistModal } from "./components/AddToPlaylistModal";
import { ScraplingStatusModal } from "./components/ScraplingStatusModal";
import { AdvancedAudioModal } from "./components/AdvancedAudioModal";
import { SettingsAndAIModal } from "./components/SettingsAndAIModal";
import {
  Search,
  Download,
  ListMusic,
  Gamepad2,
  Keyboard,
  Radio,
  Sliders,
  Sparkles,
  Volume2,
  Mic,
  Monitor,
  CheckCircle,
  Eye,
  Crosshair,
  Maximize2,
  Info,
  Disc3,
  Zap,
  Flame
} from "lucide-react";

export default function App() {
  // Playlists State
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem("rassoul_music_playlists");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_PLAYLISTS;
  });

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(
    playlists[0]?.id || "pl-rassoul-favs"
  );

  // Active Tab
  const [activeTab, setActiveTab] = useState<"scraper" | "importer" | "library" | "gamesim">(
    "scraper"
  );

  // Gaming Overlay Configuration
  const [overlayConfig, setOverlayConfig] = useState<GamingOverlayConfig>(() => {
    const defaults: GamingOverlayConfig = {
      isOpen: true,
      dockPosition: "top-right",
      opacity: 0.95,
      compactMode: false,
      pinned: true,
      audioDucking: false,
      eqProfile: "balanced",
      spatialAudio: false,
      simulatedGame: "cyberpunk",
      crossfadeDuration: 3.0,
      crossfadeCurve: "equal-power",
      autoMixOnEnd: true,
      aiDjEnabled: true,
      keybindings: {
        toggleHud: "Alt + M",
        playPause: "Espace",
        nextTrack: "Alt + →",
        prevTrack: "Alt + ←",
        audioDucking: "Alt + D",
        volumeUp: "Alt + ↑",
        volumeDown: "Alt + ↓",
      }
    };
    try {
      const saved = localStorage.getItem("rassoul_music_overlay_config");
      if (saved) return { ...defaults, ...JSON.parse(saved) };
    } catch (e) {}
    return defaults;
  });

  // Player State
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentTrack: DEFAULT_TRACKS[0],
    isPlaying: false,
    currentTime: 0,
    duration: 225,
    volume: 0.8,
    isMuted: false,
    queue: DEFAULT_TRACKS,
    queueIndex: 0,
    repeat: "off",
    shuffle: false,
  });

  // Toast feedback for gamer hotkey summons
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle?: string } | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (title: string, subtitle?: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage({ title, subtitle });
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  // Modals
  const [showKeybindingsModal, setShowKeybindingsModal] = useState(false);
  const [showScraplingModal, setShowScraplingModal] = useState(false);
  const [showAdvancedAudioModal, setShowAdvancedAudioModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsModalTab, setSettingsModalTab] = useState<"voice" | "ai" | "dj">("voice");
  const [trackToAddToPlaylist, setTrackToAddToPlaylist] = useState<Track | null>(null);
  const [isGameSessionFullscreen, setIsGameSessionFullscreen] = useState(false);

  const handleOpenSettings = (tab: "voice" | "ai" | "dj" = "voice") => {
    setSettingsModalTab(tab);
    setShowSettingsModal(true);
  };

  // AI DJ State & Unified Library Pool
  const [djState, setDjState] = useState(aiDjService.getState());
  useEffect(() => {
    return aiDjService.subscribe((st) => setDjState(st));
  }, []);

  const allTracks = useMemo(() => {
    const list: Track[] = [...DEFAULT_TRACKS];
    playlists.forEach(pl => {
      pl.tracks.forEach(tr => {
        if (!list.some(t => t.id === tr.id)) list.push(tr);
      });
    });
    return list;
  }, [playlists]);

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem("rassoul_music_playlists", JSON.stringify(playlists));
    } catch (e) {}
  }, [playlists]);

  useEffect(() => {
    try {
      localStorage.setItem("rassoul_music_overlay_config", JSON.stringify(overlayConfig));
    } catch (e) {}
  }, [overlayConfig]);

  // Audio Engine Event Subscriptions
  useEffect(() => {
    audioEngine.onPlay(() => {
      setPlayerState((prev) => ({ ...prev, isPlaying: true }));
      pipManager.updateTrack(playerState.currentTrack, true);
    });

    audioEngine.onPause(() => {
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
      pipManager.updateTrack(playerState.currentTrack, false);
    });

    audioEngine.onTime((current, dur) => {
      setPlayerState((prev) => ({
        ...prev,
        currentTime: current,
        duration: dur > 0 ? dur : prev.duration
      }));
    });

    audioEngine.onEnded(() => {
      handleNextTrack();
    });

    audioEngine.onError((msg) => {
      showToast("Erreur Audio", msg);
    });

    audioEngine.setVolume(playerState.volume);
    audioEngine.applyEQ(overlayConfig.eqProfile);
  }, []);

  // Update EQ profile & spatial audio when config changes
  useEffect(() => {
    audioEngine.applyEQ(overlayConfig.eqProfile);
    audioEngine.toggleSpatialAudio(overlayConfig.spatialAudio);
  }, [overlayConfig.eqProfile, overlayConfig.spatialAudio]);

  // Update Ducking
  useEffect(() => {
    audioEngine.setAudioDucking(overlayConfig.audioDucking);
  }, [overlayConfig.audioDucking]);

  // Update Crossfade & DJ AutoMix
  useEffect(() => {
    audioEngine.setCrossfadeDuration(overlayConfig.crossfadeDuration ?? 3.0);
    audioEngine.setCrossfadeCurve(overlayConfig.crossfadeCurve ?? "equal-power");
    audioEngine.setAutoMix(overlayConfig.autoMixOnEnd ?? true);
  }, [overlayConfig.crossfadeDuration, overlayConfig.crossfadeCurve, overlayConfig.autoMixOnEnd]);

  // Update PiP when current track or play state changes
  useEffect(() => {
    pipManager.updateTrack(playerState.currentTrack, playerState.isPlaying);
  }, [playerState.currentTrack, playerState.isPlaying]);

  // Play a specific track
  const handlePlayTrack = useCallback((track: Track, fromPlaylist?: Playlist) => {
    const queue = fromPlaylist ? fromPlaylist.tracks : [track, ...playerState.queue.filter(t => t.id !== track.id)];
    const index = queue.findIndex(t => t.id === track.id);

    setPlayerState(prev => ({
      ...prev,
      currentTrack: track,
      queue,
      queueIndex: index >= 0 ? index : 0,
      currentTime: 0
    }));

    audioEngine.playTrack(track);
    // Let resident DJ prepare and suggest the next transition
    aiDjService.prepNextTrack(track, allTracks, queue);
    showToast(`Lecture : ${track.title}`, track.artist);
  }, [playerState.queue, allTracks]);

  // Toggle Play / Pause
  const handleTogglePlay = useCallback(async () => {
    if (!playerState.currentTrack) {
      if (playerState.queue.length > 0) {
        handlePlayTrack(playerState.queue[0]);
      } else if (allTracks.length > 0) {
        handlePlayTrack(allTracks[0]);
      }
      return;
    }

    const playing = await audioEngine.togglePlay();
    setPlayerState(prev => ({ ...prev, isPlaying: playing }));
    showToast(playing ? "Lecture en cours" : "Pause", playerState.currentTrack.title);
  }, [playerState.currentTrack, playerState.queue, allTracks, handlePlayTrack]);

  // Next Track with Continuous DJ Stream
  const handleNextTrack = useCallback(() => {
    // If AI DJ has prepped a track and DJ mode is active
    const currentDj = aiDjService.getState();
    if (currentDj.isActive && currentDj.nextPreppedTrack) {
      const nextTrack = currentDj.nextPreppedTrack;
      aiDjService.triggerMix(nextTrack, (tr) => {
        handlePlayTrack(tr);
      });
      return;
    }

    if (playerState.queue.length === 0) {
      if (allTracks.length > 0) {
        const fallback = allTracks[Math.floor(Math.random() * allTracks.length)];
        handlePlayTrack(fallback);
      }
      return;
    }

    let nextIdx = playerState.queueIndex + 1;
    if (nextIdx >= playerState.queue.length) {
      if (playerState.repeat === "all") {
        nextIdx = 0;
      } else {
        // Continuous DJ: pick another track from allTracks
        const remaining = allTracks.filter(t => t.id !== playerState.currentTrack?.id);
        const nextTrack = remaining[Math.floor(Math.random() * remaining.length)] || allTracks[0];
        handlePlayTrack(nextTrack);
        return;
      }
    }

    const nextTrack = playerState.queue[nextIdx];
    if (nextTrack) {
      handlePlayTrack(nextTrack);
    }
  }, [playerState.queue, playerState.queueIndex, playerState.repeat, allTracks, handlePlayTrack, playerState.currentTrack]);

  // DJ Mix Handlers
  const handleTriggerDjMix = useCallback((targetTrack?: Track) => {
    aiDjService.triggerMix(targetTrack || null, (track) => {
      handlePlayTrack(track);
      showToast("Mix DJ en direct ⚡", track.title);
    });
  }, [handlePlayTrack]);

  const handleSwitchVibe = useCallback(async (vibe: string) => {
    await aiDjService.switchVibe(vibe, playerState.currentTrack, allTracks, playerState.queue, (track) => {
      handlePlayTrack(track);
      showToast(`Vibe DJ : ${vibe}`, track.title);
    });
  }, [playerState.currentTrack, allTracks, playerState.queue, handlePlayTrack]);

  const handleSurpriseDrop = useCallback(() => {
    aiDjService.surpriseDrop(allTracks, (track) => {
      handlePlayTrack(track);
      showToast("🔥 DROP SURPRISE DU DJ !", track.title);
    });
  }, [allTracks, handlePlayTrack]);

  const nextTrackRef = useRef(handleNextTrack);
  nextTrackRef.current = handleNextTrack;

  // Listen to DJ Automix triggers when track nears completion
  useEffect(() => {
    audioEngine.onAutoMix(() => {
      if (nextTrackRef.current) {
        nextTrackRef.current();
      }
    });
  }, []);

  // Previous Track
  const handlePrevTrack = useCallback(() => {
    if (playerState.currentTime > 4) {
      audioEngine.seek(0);
      return;
    }

    if (playerState.queue.length === 0) return;

    let prevIdx = playerState.queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = playerState.queue.length - 1;
    }

    const prevTrack = playerState.queue[prevIdx];
    if (prevTrack) {
      setPlayerState(prev => ({
        ...prev,
        currentTrack: prevTrack,
        queueIndex: prevIdx,
        currentTime: 0
      }));
      audioEngine.playTrack(prevTrack);
      showToast("Morceau Précédent", prevTrack.title);
    }
  }, [playerState.currentTime, playerState.queue, playerState.queueIndex]);

  // Audio Ducking Toggle
  const handleToggleDucking = useCallback(() => {
    setOverlayConfig(prev => {
      const nextVal = !prev.audioDucking;
      showToast(
        nextVal ? "Audio Ducking Activé" : "Audio Ducking Désactivé",
        nextVal ? "Musique baissée à 20% pour le chat/bruits de pas" : "Volume normal restauré"
      );
      return { ...prev, audioDucking: nextVal };
    });
  }, []);

  // Overlay HUD Summon toggle
  const handleToggleHUD = useCallback(() => {
    setOverlayConfig(prev => {
      const nextState = !prev.isOpen;
      showToast(
        nextState ? "HUD Gaming Invoqué" : "HUD Gaming Masqué",
        nextState ? "Overlay visible par-dessus le jeu (Alt + M)" : "Appuyez sur Alt + M pour rouvrir"
      );
      return { ...prev, isOpen: nextState };
    });
  }, []);

  // Volume Handlers
  const handleChangeVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setPlayerState(prev => ({ ...prev, volume: clamped, isMuted: false }));
    audioEngine.setVolume(clamped);
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = audioEngine.toggleMute();
    setPlayerState(prev => ({ ...prev, isMuted: muted }));
    showToast(muted ? "Son Coupé (Mute)" : "Son Rétabli");
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in an input or textarea, only allow Alt combinations
      const isInput =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA";

      // 1. Toggle HUD: Alt + M or Shift + M
      if (e.altKey && (e.key === "m" || e.key === "M")) {
        e.preventDefault();
        handleToggleHUD();
        return;
      }

      // 2. Audio Ducking: Alt + D
      if (e.altKey && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        handleToggleDucking();
        return;
      }

      // 3. Search / Scraper Quick Summon: Ctrl + K or Alt + S
      if ((e.ctrlKey && (e.key === "k" || e.key === "K")) || (e.altKey && (e.key === "s" || e.key === "S"))) {
        e.preventDefault();
        setActiveTab("scraper");
        showToast("Scrapper Ouvert", "Recherchez de la musique pour votre session");
        return;
      }

      // 4. Play/Pause with Space (only when not in input)
      if (e.code === "Space" && !isInput) {
        e.preventDefault();
        handleTogglePlay();
        return;
      }

      // 5. Next track: Alt + ArrowRight
      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        handleNextTrack();
        return;
      }

      // 6. Prev track: Alt + ArrowLeft
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevTrack();
        return;
      }

      // 7. Volume Up: Alt + ArrowUp
      if (e.altKey && e.key === "ArrowUp") {
        e.preventDefault();
        handleChangeVolume(playerState.volume + 0.05);
        showToast(`Volume : ${Math.round((playerState.volume + 0.05) * 100)}%`);
        return;
      }

      // 8. Volume Down: Alt + ArrowDown
      if (e.altKey && e.key === "ArrowDown") {
        e.preventDefault();
        handleChangeVolume(playerState.volume - 0.05);
        showToast(`Volume : ${Math.round((playerState.volume - 0.05) * 100)}%`);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleToggleHUD,
    handleToggleDucking,
    handleTogglePlay,
    handleNextTrack,
    handlePrevTrack,
    handleChangeVolume,
    playerState.volume,
  ]);

  // Playlist Management
  const handleImportSuccess = (newPlaylist: Playlist) => {
    setPlaylists(prev => [newPlaylist, ...prev]);
    setSelectedPlaylistId(newPlaylist.id);
    setActiveTab("library");
    showToast("Playlist Importée !", `${newPlaylist.title} (${newPlaylist.tracks.length} pistes)`);
  };

  const handlePlayPlaylistImmediately = (playlist: Playlist) => {
    if (playlist.tracks.length > 0) {
      handlePlayTrack(playlist.tracks[0], playlist);
    }
  };

  const handleAddTrackToPlaylist = (playlistId: string, track: Track) => {
    setPlaylists(prev =>
      prev.map(pl => {
        if (pl.id === playlistId) {
          return {
            ...pl,
            tracks: [track, ...pl.tracks]
          };
        }
        return pl;
      })
    );
    showToast("Piste ajoutée", track.title);
  };

  const handleCreateAndAdd = (title: string, track: Track) => {
    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      title,
      description: "Playlist personnalisée créée depuis le scraper",
      coverUrl: track.coverUrl,
      tracks: [track],
      isCustom: true,
      platform: "custom",
      createdAt: new Date().toISOString().split("T")[0]
    };
    setPlaylists(prev => [newPl, ...prev]);
    setSelectedPlaylistId(newPl.id);
    showToast("Nouvelle playlist créée", title);
  };

  const handleDeletePlaylist = (id: string) => {
    setPlaylists(prev => prev.filter(pl => pl.id !== id));
    showToast("Playlist supprimée");
  };

  const handleCreateEmptyPlaylist = () => {
    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      title: `Playlist Gaming #${playlists.length + 1}`,
      description: "Mes morceaux sélectionnés",
      coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
      tracks: [],
      isCustom: true,
      platform: "custom",
      createdAt: new Date().toISOString().split("T")[0]
    };
    setPlaylists(prev => [newPl, ...prev]);
    setSelectedPlaylistId(newPl.id);
    showToast("Nouvelle playlist créée");
  };

  const currentGame = GAME_PRESETS.find(g => g.id === overlayConfig.simulatedGame) || GAME_PRESETS[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col pb-24 select-none font-['Plus_Jakarta_Sans'] relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl bg-zinc-900/95 border border-cyan-500/50 shadow-2xl shadow-cyan-950/60 backdrop-blur-md flex items-center gap-3 animate-fade-in text-xs font-['Plus_Jakarta_Sans']">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <div>
            <div className="font-bold text-zinc-100 font-['Chakra_Petch']">
              {toastMessage.title}
            </div>
            {toastMessage.subtitle && (
              <div className="text-[11px] text-zinc-400 truncate max-w-xs">
                {toastMessage.subtitle}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GAMING HUD OVERLAY (Always on Top) */}
      <GamingHUD
        config={overlayConfig}
        playerState={playerState}
        onUpdateConfig={(partial) => setOverlayConfig(prev => ({ ...prev, ...partial }))}
        onTogglePlay={handleTogglePlay}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        onToggleDucking={handleToggleDucking}
        onToggleMute={handleToggleMute}
        onChangeVolume={handleChangeVolume}
        onOpenSearch={() => {
          setActiveTab("scraper");
          if (isGameSessionFullscreen) setIsGameSessionFullscreen(false);
        }}
        onOpenAdvancedAudio={() => setShowAdvancedAudioModal(true)}
        onOpenSettings={handleOpenSettings}
        onTriggerDjMix={handleTriggerDjMix}
        onSwitchVibe={handleSwitchVibe}
        onSurpriseDrop={handleSurpriseDrop}
      />

      {/* FULLSCREEN GAME SESSION SIMULATION MODE */}
      {isGameSessionFullscreen ? (
        <div className="fixed inset-0 z-40 bg-black flex flex-col justify-between overflow-hidden">
          {/* Background Game Screenshot or Visual Atmosphere */}
          {currentGame.bgUrl ? (
            <img
              src={currentGame.bgUrl}
              alt="game"
              className="absolute inset-0 w-full h-full object-cover opacity-85"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black" />
          )}

          {/* Crosshair Simulation in Center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
            <div className="w-5 h-5 border border-orange-400 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-orange-400 rounded-full" />
            </div>
          </div>

          {/* Top Bar Game Telemetry */}
          <div className="relative z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent text-xs">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping inline-block" />
              <span className="font-bold text-white uppercase tracking-wider">
                {currentGame.name} • SESSION IMMERSION
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold">
                {djState.hasAI ? "DJ IA EN DIRECT" : "MIX DJ AUTO"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-zinc-300 text-xs">
                HUD Joueur : <kbd className="text-orange-400 font-bold font-mono">{overlayConfig.keybindings.toggleHud}</kbd>
              </div>
              <button
                onClick={() => setIsGameSessionFullscreen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 text-xs font-bold transition cursor-pointer"
              >
                Quitter le plein écran
              </button>
            </div>
          </div>

          {/* Bottom telemetry */}
          <div className="relative z-10 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-300">
            <div className="flex items-center gap-4">
              <span className="text-zinc-400">Vibe DJ : <strong className="text-orange-400 font-bold">{djState.currentVibe}</strong></span>
              <span className="text-zinc-400">Atténuation Voix : <strong className={overlayConfig.audioDucking ? "text-amber-400" : "text-zinc-500"}>{overlayConfig.audioDucking ? "Active" : "Désactivée"}</strong></span>
            </div>
            <div className="text-xs text-zinc-400 italic">
              "{djState.djSpeech}"
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD DESKTOP VIEW */
        <>
          {/* Top Navigation Header */}
          <header className="sticky top-0 z-30 bg-zinc-950/85 backdrop-blur-2xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 font-['Plus_Jakarta_Sans']">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25 text-zinc-950 font-black text-lg">
                RM
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-base sm:text-lg text-white tracking-tight">
                    Rassoul's music
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                    SoundCloud Experience
                  </span>
                </div>
                <p className="text-xs text-zinc-400 hidden sm:block">
                  Écoute immersive • Ondes sonores • Micro & IA
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1 p-1 rounded-2xl bg-zinc-900/90 border border-white/10 text-xs sm:text-sm">
              <button
                id="nav-tab-scraper"
                onClick={() => setActiveTab("scraper")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition font-medium cursor-pointer ${
                  activeTab === "scraper"
                    ? "bg-white text-zinc-950 font-bold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Search size={15} />
                <span>Découvrir</span>
              </button>

              <button
                id="nav-tab-importer"
                onClick={() => setActiveTab("importer")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition font-medium cursor-pointer ${
                  activeTab === "importer"
                    ? "bg-white text-zinc-950 font-bold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Download size={15} />
                <span>Importer</span>
              </button>

              <button
                id="nav-tab-library"
                onClick={() => setActiveTab("library")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition font-medium cursor-pointer ${
                  activeTab === "library"
                    ? "bg-white text-zinc-950 font-bold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <ListMusic size={15} />
                <span>Bibliothèque</span>
              </button>

              <button
                id="nav-tab-gamesim"
                onClick={() => setActiveTab("gamesim")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition font-medium cursor-pointer ${
                  activeTab === "gamesim"
                    ? "bg-white text-zinc-950 font-bold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Gamepad2 size={15} />
                <span className="hidden sm:inline">Mode Immersion</span>
                <span className="sm:hidden">Immersion</span>
              </button>
            </nav>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2">
              <button
                id="btn-open-settings-ai"
                onClick={() => handleOpenSettings("voice")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-400 text-xs font-semibold transition cursor-pointer"
                title="Micro & Intelligence Artificielle"
              >
                <Sparkles size={15} className="text-orange-400" />
                <span className="hidden sm:inline">Micro & IA</span>
              </button>

              <button
                id="btn-open-advanced-audio"
                onClick={() => setShowAdvancedAudioModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 hover:text-white text-xs font-medium transition cursor-pointer"
                title="Ouvrir les Réglages d'Écoute"
              >
                <Disc3 size={15} className="text-orange-400" />
                <span className="hidden sm:inline">Écoute & Mix</span>
                <span className="text-[11px] text-zinc-400">({overlayConfig.crossfadeDuration}s)</span>
              </button>

              <button
                id="btn-open-shortcuts"
                onClick={() => setShowKeybindingsModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-medium transition cursor-pointer"
                title="Raccourcis clavier"
              >
                <Keyboard size={15} className="text-zinc-400" />
                <span className="hidden md:inline">Raccourcis</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-orange-400 font-mono font-bold">
                  {overlayConfig.keybindings.toggleHud}
                </kbd>
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
            {/* Resident DJ IA Live Header Bar */}
            <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-900/80 border border-orange-500/25 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shadow-xl ring-1 ring-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-zinc-950 flex items-center justify-center font-black text-sm shadow-md shadow-orange-500/30 shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-white">
                      {djState.hasAI ? "DJ IA Résident" : "Mix DJ Automatique"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping inline-block" />
                      {djState.currentVibe}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 italic line-clamp-1 mt-0.5">
                    "{djState.djSpeech}"
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTriggerDjMix()}
                  className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition active:scale-95 cursor-pointer"
                  title="Déclencher un mix immédiat"
                >
                  <Zap size={13} fill="currentColor" />
                  <span>Mixer Maintenant ⚡</span>
                </button>

                <button
                  onClick={handleSurpriseDrop}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-amber-400 hover:text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="Drop Surprise par le DJ"
                >
                  <Flame size={13} />
                  <span className="hidden sm:inline">Drop Surprise</span>
                </button>

                <button
                  onClick={() => handleOpenSettings("dj")}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
                  title="Paramètres DJ & IA"
                >
                  <Sliders size={14} />
                </button>
              </div>
            </div>

            {activeTab === "scraper" && (
              <ScraperSearch
                onPlayTrack={handlePlayTrack}
                onAddToQueue={(track) => {
                  setPlayerState(prev => ({
                    ...prev,
                    queue: [...prev.queue, track]
                  }));
                  showToast("Ajouté à la file d'attente", track.title);
                }}
                onAddToPlaylistPrompt={(track) => setTrackToAddToPlaylist(track)}
              />
            )}

            {activeTab === "importer" && (
              <PlaylistImporter
                onImportSuccess={handleImportSuccess}
                onPlayPlaylistImmediately={handlePlayPlaylistImmediately}
              />
            )}

            {activeTab === "library" && (
              <PlaylistView
                playlists={playlists}
                selectedPlaylistId={selectedPlaylistId}
                onSelectPlaylist={setSelectedPlaylistId}
                onPlayTrack={handlePlayTrack}
                onPlayAll={handlePlayPlaylistImmediately}
                onCreateEmptyPlaylist={handleCreateEmptyPlaylist}
                onDeletePlaylist={handleDeletePlaylist}
                currentTrackId={playerState.currentTrack?.id}
                isPlaying={playerState.isPlaying}
                onOpenSettings={handleOpenSettings}
              />
            )}

            {activeTab === "gamesim" && (
              <div className="space-y-6">
                <GameBackdropSimulator
                  selectedGame={overlayConfig.simulatedGame}
                  onSelectGame={(gameId, recommendedEQ) => {
                    setOverlayConfig(prev => ({
                      ...prev,
                      simulatedGame: gameId,
                      eqProfile: recommendedEQ
                    }));
                    showToast(`Mode jeu : ${gameId}`, `EQ recommandé appliqué : ${recommendedEQ}`);
                  }}
                  isOverlayOpen={overlayConfig.isOpen}
                  onToggleOverlay={handleToggleHUD}
                  shortcutBadge={overlayConfig.keybindings.toggleHud}
                  isGameSessionActive={isGameSessionFullscreen}
                  onToggleGameSession={() => setIsGameSessionFullscreen(true)}
                />

                {/* Simulated Screen Preview Window inside desktop layout */}
                <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-zinc-950 shadow-2xl h-[420px] flex items-center justify-center group">
                  {currentGame.bgUrl ? (
                    <img
                      src={currentGame.bgUrl}
                      alt={currentGame.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black" />
                  )}

                  {/* Simulated HUD Preview Label */}
                  <div className="relative z-10 text-center space-y-3 p-6 max-w-md bg-zinc-950/80 backdrop-blur-md rounded-2xl border border-zinc-800">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/30">
                      <Crosshair size={20} />
                    </div>
                    <h3 className="font-bold text-lg font-['Chakra_Petch'] text-zinc-100">
                      Overlay Prêt pour {currentGame.name}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Votre HUD est positionné en <strong>{overlayConfig.dockPosition}</strong> avec une transparence de <strong>{Math.round(overlayConfig.opacity * 100)}%</strong>.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <button
                        onClick={handleToggleHUD}
                        className="px-4 py-2 rounded-xl bg-cyan-500 text-zinc-950 font-bold text-xs font-['Chakra_Petch'] transition hover:bg-cyan-400"
                      >
                        {overlayConfig.isOpen ? "MASQUER HUD (Alt + M)" : "AFFICHER HUD (Alt + M)"}
                      </button>
                      <button
                        onClick={() => setIsGameSessionFullscreen(true)}
                        className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-['Chakra_Petch'] transition font-bold"
                      >
                        PLEIN ÉCRAN JEU
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </>
      )}

      {/* Persistent Bottom Player Bar */}
      {!isGameSessionFullscreen && (
        <PlayerBar
          playerState={playerState}
          overlayConfig={overlayConfig}
          onTogglePlay={handleTogglePlay}
          onNext={handleNextTrack}
          onPrev={handlePrevTrack}
          onSeek={(seconds) => audioEngine.seek(seconds)}
          onChangeVolume={handleChangeVolume}
          onToggleMute={handleToggleMute}
          onToggleShuffle={() =>
            setPlayerState(prev => ({ ...prev, shuffle: !prev.shuffle }))
          }
          onToggleRepeat={() =>
            setPlayerState(prev => ({
              ...prev,
              repeat: prev.repeat === "off" ? "all" : prev.repeat === "all" ? "one" : "off"
            }))
          }
          onToggleOverlay={handleToggleHUD}
          onToggleDucking={handleToggleDucking}
          onOpenEQMenu={() => setShowAdvancedAudioModal(true)}
          onOpenAdvancedAudio={() => setShowAdvancedAudioModal(true)}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {/* Modals */}
      <AdvancedAudioModal
        isOpen={showAdvancedAudioModal}
        onClose={() => setShowAdvancedAudioModal(false)}
        config={overlayConfig}
        onUpdateConfig={(partial) =>
          setOverlayConfig(prev => ({ ...prev, ...partial }))
        }
        onTestMix={() => {
          handleNextTrack();
          showToast("Fondu Enchaîné", `Mix en cours sur ${overlayConfig.crossfadeDuration}s`);
        }}
        onOpenVoiceSettings={() => handleOpenSettings("voice")}
      />

      <SettingsAndAIModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        defaultTab={settingsModalTab}
        onPlayTrack={handlePlayTrack}
        onAddPlaylist={(newPlaylist) => {
          setPlaylists(prev => [newPlaylist, ...prev]);
          setSelectedPlaylistId(newPlaylist.id);
          setActiveTab("library");
          showToast("Playlist IA ajoutée", newPlaylist.title);
        }}
        currentTrack={playerState.currentTrack}
      />

      <KeybindingsModal
        isOpen={showKeybindingsModal}
        onClose={() => setShowKeybindingsModal(false)}
        config={overlayConfig}
        onUpdateKeybindings={(keys) =>
          setOverlayConfig(prev => ({ ...prev, keybindings: keys }))
        }
      />

      <AddToPlaylistModal
        track={trackToAddToPlaylist}
        playlists={playlists}
        onClose={() => setTrackToAddToPlaylist(null)}
        onAddTrackToPlaylist={handleAddTrackToPlaylist}
        onCreateAndAdd={handleCreateAndAdd}
      />

      <ScraplingStatusModal
        isOpen={showScraplingModal}
        onClose={() => setShowScraplingModal(false)}
      />
    </div>
  );
}
