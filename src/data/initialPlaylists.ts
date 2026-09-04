import { Playlist, Track } from "../types";

export const DEFAULT_TRACKS: Track[] = [
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

export const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: "pl-rassoul-favs",
    title: "Rassoul's Gaming Selection",
    description: "La sélection gaming ultime : Phonk, Synthwave, Lofi et morceaux haute énergie pour carry vos parties.",
    coverUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
    tracks: DEFAULT_TRACKS,
    platform: "custom",
    isCustom: true,
    createdAt: "2026-09-04"
  },
  {
    id: "pl-phonk-drift",
    title: "Phonk & Drift Gaming Bass",
    description: "Basses saturées et rythmes agressifs pour des sessions de jeu intenses et clutching.",
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
    tracks: [DEFAULT_TRACKS[1], DEFAULT_TRACKS[4], DEFAULT_TRACKS[0]],
    platform: "soundcloud",
    isCustom: false,
    createdAt: "2026-09-04"
  },
  {
    id: "pl-lofi-aim",
    title: "Lofi Focus & FPS Warmup",
    description: "Idéal pour l'aim training, la concentration et la décompression entre deux ranked.",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
    tracks: [DEFAULT_TRACKS[2], DEFAULT_TRACKS[3]],
    platform: "youtube",
    isCustom: false,
    createdAt: "2026-09-04"
  },
  {
    id: "pl-cyberpunk",
    title: "Night City Cyberpunk OST",
    description: "Ambiance futuriste, néon et beats sombres taillés pour les RPG et jeux d'action.",
    coverUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
    tracks: [DEFAULT_TRACKS[0], DEFAULT_TRACKS[5]],
    platform: "apple",
    isCustom: false,
    createdAt: "2026-09-04"
  }
];

export const GAME_PRESETS = [
  {
    id: "cyberpunk",
    name: "Cyberpunk 2077",
    tagline: "Action RPG & Night City",
    bgUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=80",
    recommendedEQ: "bass-phonk" as const
  },
  {
    id: "valorant",
    name: "Valorant / Tactical FPS",
    tagline: "Clutch & Footstep Clarity",
    bgUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1920&q=80",
    recommendedEQ: "fps-footsteps" as const
  },
  {
    id: "cs2",
    name: "Counter-Strike 2",
    tagline: "Tactical Ranked Match",
    bgUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1920&q=80",
    recommendedEQ: "fps-footsteps" as const
  },
  {
    id: "league",
    name: "League of Legends",
    tagline: "MOBA Summoner's Rift",
    bgUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1920&q=80",
    recommendedEQ: "rpg-ambient" as const
  },
  {
    id: "minecraft",
    name: "Minecraft / Chill RPG",
    tagline: "Exploration & Building",
    bgUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80",
    recommendedEQ: "lofi-calm" as const
  },
  {
    id: "clean",
    name: "Bureau Noir / HUD Pur",
    tagline: "Mode Bureau discret",
    bgUrl: "",
    recommendedEQ: "balanced" as const
  }
];
