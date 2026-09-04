export type TrackSource = "youtube" | "soundcloud" | "apple" | "curated" | "scraped";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: string;
  durationSec?: number;
  coverUrl: string;
  source: TrackSource;
  sourceUrl?: string;
  streamUrl?: string;
  youtubeId?: string;
  scraplingEngine?: boolean;
  waveform?: number[];
  likesCount?: number;
  genre?: string;
}

export interface VoiceDetectionConfig {
  isListening: boolean;
  isSpeaking: boolean;
  currentLevel: number;
  threshold: number;
  hangoverMs: number;
  hasPermission: boolean | null;
  errorMessage: string | null;
  autoDuckingEnabled: boolean;
}

export interface AISettings {
  apiKey: string;
  hasCustomKey: boolean;
  selectedMood: string;
  autoDJSuggestions: boolean;
}

export interface AIRecItem {
  title: string;
  artist: string;
  genre: string;
  reason: string;
  matchScore: number;
}

export interface ScraplingStatus {
  engine: string;
  github: string;
  version: string;
  available: boolean;
  antiBot: string;
  adaptiveParser: string;
  fetchers: string[];
  timestamp?: number;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  coverUrl: string;
  tracks: Track[];
  isCustom?: boolean;
  platform?: "youtube" | "soundcloud" | "apple" | "custom" | "curated";
  createdAt?: string;
}

export type EQProfile = "balanced" | "fps-footsteps" | "bass-phonk" | "lofi-calm" | "rpg-ambient";

export type CrossfadeCurve = "equal-power" | "smooth-blend" | "linear";

export interface CrossfadeStatus {
  isCrossfading: boolean;
  deckAPercent: number; // 0 to 100
  deckBPercent: number; // 0 to 100
  activeDeck: "A" | "B";
}

export interface AIDjState {
  isActive: boolean; // Master DJ switch (default true)
  hasAI: boolean; // Is Gemini AI responding / available
  isThinking: boolean; // Calculating next mix
  currentVibe: string; // Active vibe (e.g., "Adrénaline Phonk", "Chill Lo-Fi", "Focus Gaming", "Synthwave Night")
  statusText: string; // e.g. "DJ IA en direct", "Mix Automatique Actif"
  djSpeech: string; // Live DJ commentary/announcement
  nextPreppedTrack: Track | null; // Next track prepped on the virtual turntable Deck B
  isMixing: boolean; // In crossfade transition right now
  energyLevel: "chill" | "medium" | "high" | "intense";
}

export interface GamingOverlayConfig {
  isOpen: boolean;
  dockPosition: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center";
  opacity: number; // 0.3 to 1.0
  compactMode: boolean;
  pinned: boolean;
  audioDucking: boolean;
  eqProfile: EQProfile;
  spatialAudio: boolean;
  crossfadeDuration: number; // 0 to 5 seconds (0 = disabled/cut)
  crossfadeCurve: CrossfadeCurve; // DJ curve
  autoMixOnEnd: boolean; // Auto-trigger DJ crossfade before track ends
  aiDjEnabled: boolean; // AI Resident DJ mode
  simulatedGame: "cyberpunk" | "valorant" | "cs2" | "minecraft" | "league" | "clean";
  keybindings: {
    toggleHud: string;
    playPause: string;
    nextTrack: string;
    prevTrack: string;
    audioDucking: string;
    volumeUp: string;
    volumeDown: string;
  };
}

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  queue: Track[];
  queueIndex: number;
  repeat: "off" | "all" | "one";
  shuffle: boolean;
}
