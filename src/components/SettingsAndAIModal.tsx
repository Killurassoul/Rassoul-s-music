import React, { useState, useEffect } from "react";
import {
  Settings,
  X,
  Mic,
  MicOff,
  Sparkles,
  Key,
  CheckCircle2,
  AlertCircle,
  Play,
  Plus,
  Compass,
  RefreshCw,
  Eye,
  EyeOff,
  Volume2,
  Sliders,
  Radio,
  Flame,
  Music2,
  Wand2,
} from "lucide-react";
import { Track, Playlist, AIRecItem } from "../types";
import { voiceDetection, VoiceDetectionState } from "../services/voiceDetection";

interface SettingsAndAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  onPlayTrack: (track: Track) => void;
  onCreatePlaylistWithTracks?: (title: string, desc: string, tracks: Track[]) => void;
  initialTab?: "voice" | "ai" | "dj";
}

export const SettingsAndAIModal: React.FC<SettingsAndAIModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
  onPlayTrack,
  onCreatePlaylistWithTracks,
  initialTab = "voice",
}) => {
  const [activeTab, setActiveTab] = useState<"voice" | "ai" | "dj">(initialTab);
  const [voiceState, setVoiceState] = useState<VoiceDetectionState>(voiceDetection.getState());

  // AI settings
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<{
    tested: boolean;
    valid: boolean;
    message: string;
  }>({ tested: false, valid: false, message: "" });

  // DJ & Playlist generation
  const [selectedMood, setSelectedMood] = useState("Adrénaline & Compétition");
  const [isGeneratingDJ, setIsGeneratingDJ] = useState(false);
  const [djMessage, setDjMessage] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecItem[]>([]);

  // Playlist generator prompt
  const [playlistPrompt, setPlaylistPrompt] = useState("");
  const [isGeneratingPlaylist, setIsGeneratingPlaylist] = useState(false);
  const [generatedPlaylist, setGeneratedPlaylist] = useState<{
    title: string;
    desc: string;
    tracks: Track[];
  } | null>(null);

  // Vibe Check
  const [vibeCheck, setVibeCheck] = useState<{
    moodName?: string;
    colorAccent?: string;
    bpmEstimate?: number;
    vibeDescription?: string;
    eqTip?: string;
  } | null>(null);
  const [isLoadingVibe, setIsLoadingVibe] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const unsub = voiceDetection.subscribe((st) => {
      setVoiceState(st);
    });

    // Load saved API key
    try {
      const savedKey = localStorage.getItem("rm_gemini_api_key") || "";
      setApiKey(savedKey);
      if (savedKey) {
        setKeyStatus({
          tested: true,
          valid: true,
          message: "Clé personnalisée enregistrée",
        });
      }
    } catch (e) {}

    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    try {
      localStorage.setItem("rm_gemini_api_key", newKey.trim());
    } catch (e) {}
    setKeyStatus({ tested: false, valid: false, message: "" });
  };

  const handleTestApiKey = async () => {
    setIsTestingKey(true);
    setKeyStatus({ tested: false, valid: false, message: "" });
    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setKeyStatus({
          tested: true,
          valid: true,
          message: "Clé API validée avec succès !",
        });
      } else {
        setKeyStatus({
          tested: true,
          valid: false,
          message: data.error || "Clé invalide ou problème réseau.",
        });
      }
    } catch (err: any) {
      setKeyStatus({
        tested: true,
        valid: false,
        message: err.message || "Impossible de contacter l'API.",
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleToggleVoiceDetection = async () => {
    if (voiceState.isListening) {
      voiceDetection.stopListening();
    } else {
      await voiceDetection.startListening();
    }
  };

  const handleAskDJ = async () => {
    setIsGeneratingDJ(true);
    setDjMessage(null);
    try {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          currentTrack: currentTrack,
          mood: selectedMood,
        }),
      });
      const data = await res.json();
      if (data.recommendations) {
        setRecommendations(data.recommendations);
        setDjMessage(data.djMessage || "Voici ma sélection pour prolonger le mix :");
      }
    } catch (e) {
      console.warn("AI recommendation failed", e);
    } finally {
      setIsGeneratingDJ(false);
    }
  };

  const handleGeneratePlaylist = async () => {
    if (!playlistPrompt.trim()) return;
    setIsGeneratingPlaylist(true);
    try {
      const res = await fetch("/api/ai/generate-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          userPrompt: playlistPrompt,
        }),
      });
      const data = await res.json();
      if (data.tracks && Array.isArray(data.tracks)) {
        const mappedTracks: Track[] = data.tracks.map((t: any, idx: number) => ({
          id: `ai-track-${Date.now()}-${idx}`,
          title: t.title,
          artist: t.artist,
          duration: t.duration || "3:20",
          coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80",
          source: "curated",
          streamUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=cyberpunk-2099-10701.mp3",
          genre: data.vibeTag || "Électro / Mix",
        }));

        setGeneratedPlaylist({
          title: data.playlistTitle || "Playlist IA Personnalisée",
          desc: data.playlistDescription || playlistPrompt,
          tracks: mappedTracks,
        });
      }
    } catch (e) {
      console.warn("AI playlist generation failed", e);
    } finally {
      setIsGeneratingPlaylist(false);
    }
  };

  const handleVibeCheck = async () => {
    if (!currentTrack) return;
    setIsLoadingVibe(true);
    try {
      const res = await fetch("/api/ai/vibe-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          track: currentTrack,
        }),
      });
      const data = await res.json();
      setVibeCheck(data);
    } catch (e) {
      console.warn("Vibe check failed", e);
    } finally {
      setIsLoadingVibe(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl animate-fade-in font-['Plus_Jakarta_Sans']">
      <div className="w-full max-w-3xl rounded-3xl bg-zinc-950 border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with SoundCloud Orange Flair */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/10">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
                Paramètres & Assistant IA
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-zinc-950">
                  SoundCloud Vibe
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Détection automatique de la voix au micro et intelligence musicale
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 px-6 bg-zinc-900/40 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab("voice")}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === "voice"
                ? "border-orange-500 text-orange-400 font-bold"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <Mic size={16} />
            <span>Détection Micro & Voix</span>
            {voiceState.isSpeaking && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("ai")}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === "ai"
                ? "border-orange-500 text-orange-400 font-bold"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <Key size={16} />
            <span>Clé API IA</span>
            {keyStatus.valid && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("dj")}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === "dj"
                ? "border-orange-500 text-orange-400 font-bold"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <Sparkles size={16} />
            <span>DJ IA & Générateur</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-zinc-200">
          {/* TAB 1: Voice & Microphone Ducking */}
          {activeTab === "voice" && (
            <div className="space-y-6">
              {/* Main Banner / Switch */}
              <div className="p-5 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        voiceState.isListening
                          ? "bg-emerald-500/20 text-emerald-400 shadow-md shadow-emerald-500/20"
                          : "bg-white/5 text-zinc-400"
                      }`}
                    >
                      {voiceState.isListening ? <Mic size={20} /> : <MicOff size={20} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        Atténuation Automatique par la Voix
                        {voiceState.isListening && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                            MICRO ACTIF
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5 max-w-md">
                        Baisse automatiquement la musique dès que vous ou vos coéquipiers parlez dans votre canal, puis la remonte en douceur.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleVoiceDetection}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shrink-0 ${
                      voiceState.isListening
                        ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30"
                        : "bg-orange-500 text-zinc-950 hover:bg-orange-400 shadow-lg shadow-orange-500/20"
                    }`}
                  >
                    {voiceState.isListening ? (
                      <>
                        <MicOff size={15} />
                        <span>Désactiver le micro</span>
                      </>
                    ) : (
                      <>
                        <Mic size={15} />
                        <span>Activer la détection</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Error Banner if mic denied */}
                {voiceState.errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{voiceState.errorMessage}</span>
                  </div>
                )}

                {/* Auto Ducking Checkbox */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <span className="text-zinc-300">
                    Activer la baisse de volume dès que la voix est détectée
                  </span>
                  <button
                    onClick={() =>
                      voiceDetection.setAutoDuckingEnabled(!voiceState.autoDuckingEnabled)
                    }
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      voiceState.autoDuckingEnabled ? "bg-orange-500" : "bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-zinc-950 absolute top-1 transition-transform ${
                        voiceState.autoDuckingEnabled ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Live VU Meter & Threshold Calibrator */}
              <div className="p-5 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 size={16} className="text-orange-400" />
                    <span className="font-bold text-sm text-white">
                      Calibrage de la Sensibilité & Seuil
                    </span>
                  </div>
                  <div className="text-xs">
                    {voiceState.isSpeaking ? (
                      <span className="px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 font-bold flex items-center gap-1.5 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        Voix Détectée • Musique Atténuée
                      </span>
                    ) : (
                      <span className="text-zinc-400 text-xs">
                        {voiceState.isListening ? "En écoute du micro..." : "Micro en pause"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Visual Real-Time Gauge Bar with threshold marker */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Niveau sonore actuel : <strong>{voiceState.currentLevel}%</strong></span>
                    <span className="text-orange-400 font-bold">
                      Seuil de déclenchement : {voiceState.threshold}%
                    </span>
                  </div>

                  <div className="relative h-6 bg-zinc-950 rounded-xl overflow-hidden border border-white/10 p-0.5">
                    {/* Background audio meter fill */}
                    <div
                      style={{ width: `${voiceState.currentLevel}%` }}
                      className={`h-full rounded-lg transition-all duration-75 ${
                        voiceState.currentLevel >= voiceState.threshold
                          ? "bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 shadow-[0_0_12px_rgba(255,85,0,0.6)]"
                          : "bg-zinc-700"
                      }`}
                    />

                    {/* Vertical threshold marker pin */}
                    <div
                      style={{ left: `${voiceState.threshold}%` }}
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_white] -translate-x-1/2 z-20 pointer-events-none"
                    />
                  </div>

                  <p className="text-[11px] text-zinc-400">
                    Parlez naturellement dans votre micro : la jauge doit dépasser le repère blanc pour activer la baisse automatique.
                  </p>
                </div>

                {/* Threshold Slider */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300">Sensibilité du seuil :</span>
                    <span className="font-mono text-orange-400 font-bold">
                      {voiceState.threshold}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    step="1"
                    value={voiceState.threshold}
                    onChange={(e) =>
                      voiceDetection.setThreshold(parseFloat(e.target.value))
                    }
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Très sensible (Chuchotement 10%)</span>
                    <span>Équilibré (25%)</span>
                    <span>Voix forte (50%+)</span>
                  </div>
                </div>

                {/* Hangover / Release Delay Slider */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300">
                      Délai de retour de la musique après le silence :
                    </span>
                    <span className="font-mono text-orange-400 font-bold">
                      {(voiceState.hangoverMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="400"
                    max="3000"
                    step="100"
                    value={voiceState.hangoverMs}
                    onChange={(e) =>
                      voiceDetection.setHangover(parseInt(e.target.value, 10))
                    }
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <p className="text-[11px] text-zinc-400">
                    Permet d'éviter que la musique ne remonte brusquement pendant les pauses normales entre deux phrases.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI API Key Configuration */}
          {activeTab === "ai" && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/15 text-orange-400 flex items-center justify-center shrink-0">
                    <Key size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      Clé API Google Gemini
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Configurez votre clé pour débloquer l'Assistant DJ IA, les recommandations en continu et la génération de playlists intelligentes.
                    </p>
                  </div>
                </div>

                {/* Key Input */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs text-zinc-300 font-medium block">
                    Votre Clé API (Gemini) :
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => handleSaveApiKey(e.target.value)}
                      placeholder="Collez votre clé API Gemini (AIza...)"
                      className="w-full px-4 py-3 pr-24 rounded-xl bg-zinc-950 border border-white/15 focus:border-orange-500 text-sm font-mono text-white outline-none transition"
                    />
                    <div className="absolute right-2 top-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="p-1.5 text-zinc-400 hover:text-white transition cursor-pointer"
                        title={showKey ? "Masquer" : "Afficher"}
                      >
                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400">
                    Votre clé est enregistrée en toute sécurité dans votre navigateur local. Si aucune clé n'est renseignée, l'application utilise la clé par défaut de l'espace.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleTestApiKey}
                    disabled={isTestingKey}
                    className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold text-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isTestingKey ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    <span>Tester la connexion</span>
                  </button>

                  {keyStatus.tested && (
                    <div
                      className={`text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${
                        keyStatus.valid
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {keyStatus.valid ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <AlertCircle size={14} />
                      )}
                      <span>{keyStatus.message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* What can the AI do */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-1">
                  <Flame size={18} className="text-orange-400" />
                  <div className="font-bold text-white pt-1">DJ IA en Direct</div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Suggère le prochain morceau idéal selon votre humeur et vos jeux.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-1">
                  <Wand2 size={18} className="text-amber-400" />
                  <div className="font-bold text-white pt-1">Générateur Thématique</div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Créez des playlists instantanées à partir d'une simple phrase d'ambiance.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-1">
                  <Compass size={18} className="text-cyan-400" />
                  <div className="font-bold text-white pt-1">Analyseur Vibe Check</div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Décrypte le tempo, l'énergie et la couleur émotionnelle du titre.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DJ IA & Creative Features */}
          {activeTab === "dj" && (
            <div className="space-y-6">
              {/* Feature A: Smart Next Track DJ */}
              <div className="p-5 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        Assistant DJ IA (Recommandations en temps réel)
                      </h4>
                      <p className="text-xs text-zinc-400">
                        {currentTrack
                          ? `En écoute: "${currentTrack.title}" (${currentTrack.artist})`
                          : "Sélectionnez un titre pour une suggestion d'enchaînement"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleAskDJ}
                    disabled={isGeneratingDJ}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-bold text-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-orange-500/20"
                  >
                    {isGeneratingDJ ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    <span>Suggérer la suite</span>
                  </button>
                </div>

                {/* Mood Pills */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    "Adrénaline & Compétition",
                    "Nocturne & Synthwave",
                    "Détente & Lo-Fi",
                    "Phonk & Puissance",
                    "Ambiance Cyberpunk",
                  ].map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedMood(m)}
                      className={`px-3 py-1 rounded-xl text-xs transition cursor-pointer ${
                        selectedMood === m
                          ? "bg-orange-500 text-zinc-950 font-bold"
                          : "bg-white/5 text-zinc-400 hover:text-white border border-white/10"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* DJ Message */}
                {djMessage && (
                  <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-medium italic">
                    "{djMessage}"
                  </div>
                )}

                {/* DJ Recommendations List */}
                {recommendations.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {recommendations.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-zinc-950/70 border border-white/5 hover:border-orange-500/40 transition flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white truncate">
                              {item.title}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-orange-400 font-semibold">
                              {item.genre}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              Match {item.matchScore}%
                            </span>
                          </div>
                          <div className="text-xs text-zinc-400 truncate mt-0.5">
                            {item.artist} • <span className="italic text-zinc-400">{item.reason}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            onPlayTrack({
                              id: `rec-${Date.now()}-${idx}`,
                              title: item.title,
                              artist: item.artist,
                              duration: "3:30",
                              coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
                              source: "curated",
                              streamUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=cyberpunk-2099-10701.mp3",
                              genre: item.genre,
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/10 text-white group-hover:bg-orange-500 group-hover:text-zinc-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Play size={12} fill="currentColor" />
                          <span>Écouter</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Feature B: AI Playlist Generator */}
              <div className="p-5 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Music2 size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      Générateur de Playlist par IA
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Décrivez l'ambiance désirée et l'IA composera une playlist SoundCloud complète
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={playlistPrompt}
                    onChange={(e) => setPlaylistPrompt(e.target.value)}
                    placeholder="Ex: Session de ranked à 3h du matin sous la pluie"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-950 border border-white/15 focus:border-orange-500 text-xs text-white outline-none transition"
                  />
                  <button
                    onClick={handleGeneratePlaylist}
                    disabled={isGeneratingPlaylist || !playlistPrompt.trim()}
                    className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-zinc-950 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    {isGeneratingPlaylist ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Wand2 size={14} />
                    )}
                    <span>Générer la playlist</span>
                  </button>
                </div>

                {/* Generated Playlist Card */}
                {generatedPlaylist && (
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-orange-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-white text-sm">
                          {generatedPlaylist.title}
                        </h5>
                        <p className="text-xs text-zinc-400">
                          {generatedPlaylist.desc} ({generatedPlaylist.tracks.length} titres)
                        </p>
                      </div>

                      {onCreatePlaylistWithTracks && (
                        <button
                          onClick={() => {
                            onCreatePlaylistWithTracks(
                              generatedPlaylist.title,
                              generatedPlaylist.desc,
                              generatedPlaylist.tracks
                            );
                            onClose();
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>Sauvegarder dans ma bibliothèque</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-1 divide-y divide-white/5 max-h-48 overflow-y-auto">
                      {generatedPlaylist.tracks.map((t, idx) => (
                        <div
                          key={idx}
                          className="py-2 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-white">
                              {idx + 1}. {t.title}
                            </span>{" "}
                            <span className="text-zinc-500">par {t.artist}</span>
                          </div>
                          <button
                            onClick={() => onPlayTrack(t)}
                            className="text-orange-400 hover:text-white transition p-1 cursor-pointer"
                          >
                            <Play size={12} fill="currentColor" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Feature C: Vibe Check on current song */}
              {currentTrack && (
                <div className="p-5 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Compass size={16} className="text-orange-400" />
                      <span className="font-bold text-sm text-white">
                        Vibe Check & Analyse Sensorielle
                      </span>
                    </div>

                    <button
                      onClick={handleVibeCheck}
                      disabled={isLoadingVibe}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                    >
                      {isLoadingVibe ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Compass size={13} />
                      )}
                      <span>Analyser "{currentTrack.title}"</span>
                    </button>
                  </div>

                  {vibeCheck && (
                    <div className="p-4 rounded-xl bg-zinc-950 border border-white/5 space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          style={{ backgroundColor: vibeCheck.colorAccent || "#ff5500" }}
                          className="w-3 h-3 rounded-full"
                        />
                        <span className="font-bold text-white text-sm">
                          {vibeCheck.moodName}
                        </span>
                        {vibeCheck.bpmEstimate && (
                          <span className="text-zinc-400 font-mono">
                            ~{vibeCheck.bpmEstimate} BPM
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-300 leading-relaxed italic">
                        "{vibeCheck.vibeDescription}"
                      </p>
                      {vibeCheck.eqTip && (
                        <div className="text-orange-400 font-medium">
                          💡 Conseil d'écoute : {vibeCheck.eqTip}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-zinc-950 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>Rassoul's music • Audio & IA</span>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
