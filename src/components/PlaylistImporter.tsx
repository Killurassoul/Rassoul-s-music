import React, { useState } from "react";
import {
  Download,
  Link as LinkIcon,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Play,
  Sparkles,
  ArrowRight,
  Music,
  Check,
  Disc3
} from "lucide-react";
import { Playlist, Track } from "../types";

interface PlaylistImporterProps {
  onImportSuccess: (playlist: Playlist) => void;
  onPlayPlaylistImmediately: (playlist: Playlist) => void;
}

const EXAMPLE_IMPORTS = [
  {
    name: "YouTube Synthwave & Gaming Mix",
    url: "https://www.youtube.com/watch?v=htnJgUdWDac",
    platform: "youtube" as const,
    badgeColor: "text-red-400 bg-red-500/10 border-red-500/20",
  },
  {
    name: "SoundCloud Drift Phonk Set",
    url: "https://soundcloud.com/search/sounds?q=drift+phonk",
    platform: "soundcloud" as const,
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    name: "Apple Music Gaming Selection",
    url: "https://music.apple.com/us/album/cyberpunk-2077-radio-vol-2-original-soundtrack/1540792622",
    platform: "apple" as const,
    badgeColor: "text-rose-300 bg-rose-500/10 border-rose-500/20",
  },
];

export const PlaylistImporter: React.FC<PlaylistImporterProps> = ({
  onImportSuccess,
  onPlayPlaylistImmediately,
}) => {
  const [importType, setImportType] = useState<"url" | "text">("url");
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewPlaylist, setPreviewPlaylist] = useState<Playlist | null>(null);

  const handleImport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setPreviewPlaylist(null);

    if (importType === "url" && !urlInput.trim()) {
      setErrorMsg("Veuillez entrer un lien de playlist valide (YouTube, SoundCloud ou Apple Music).");
      return;
    }
    if (importType === "text" && !textInput.trim()) {
      setErrorMsg("Veuillez coller une liste de titres au format texte.");
      return;
    }

    setIsLoading(true);
    setCurrentStep("Connexion et analyse de la source...");

    const stepTimer1 = setTimeout(() => {
      setCurrentStep("Extraction des titres et des morceaux...");
    }, 1200);

    const stepTimer2 = setTimeout(() => {
      setCurrentStep("Finalisation de votre playlist HD...");
    }, 2400);

    try {
      const payload =
        importType === "url"
          ? { url: urlInput.trim() }
          : { rawList: textInput.trim() };

      const res = await fetch("/api/scrape/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Impossible d'importer cette playlist");
      }

      const generatedId = `pl-imported-${Date.now()}`;
      const newPlaylist: Playlist = {
        id: generatedId,
        title: customTitle.trim() || data.title || "Ma Playlist Importée",
        description: `Importé depuis ${data.platform?.toUpperCase() || "le Web"} • ${data.trackCount} titres prêts à l'écoute`,
        coverUrl:
          data.tracks?.[0]?.coverUrl ||
          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
        tracks: data.tracks || [],
        isCustom: true,
        platform: data.platform || "custom",
        createdAt: new Date().toISOString().split("T")[0],
      };

      setPreviewPlaylist(newPlaylist);
      onImportSuccess(newPlaylist);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message ||
          "Impossible d'importer cette playlist. Vérifiez que le lien est public ou essayez l'import par texte."
      );
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsLoading(false);
      setCurrentStep("");
    }
  };

  const handleUseExample = (url: string) => {
    setUrlInput(url);
    setImportType("url");
  };

  return (
    <div className="space-y-7 font-['Plus_Jakarta_Sans'] max-w-4xl mx-auto">
      {/* Refined Luxury Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-white/10 p-6 sm:p-10 shadow-2xl">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-cyan-300">
            <Download size={13} className="text-cyan-400" />
            <span>Importation Universelle</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Importez vos playlists en un instant
          </h2>

          <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl">
            Collez simplement l'adresse d'une playlist ou d'un album <strong>YouTube</strong>, <strong>SoundCloud</strong> ou <strong>Apple Music</strong> pour l'ajouter immédiatement à votre bibliothèque.
          </p>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setImportType("url")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                importType === "url"
                  ? "bg-white text-zinc-950 shadow-md"
                  : "bg-white/5 text-zinc-400 hover:text-white border border-white/10"
              }`}
            >
              <LinkIcon size={15} />
              <span>Par lien URL</span>
            </button>

            <button
              type="button"
              onClick={() => setImportType("text")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                importType === "text"
                  ? "bg-white text-zinc-950 shadow-md"
                  : "bg-white/5 text-zinc-400 hover:text-white border border-white/10"
              }`}
            >
              <FileText size={15} />
              <span>Par liste de titres (Texte)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleImport} className="space-y-5 rounded-3xl bg-zinc-900/60 border border-white/10 p-6 sm:p-8 shadow-xl">
        {importType === "url" ? (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Lien de la playlist ou de l'album
            </label>
            <div className="relative flex items-center">
              <LinkIcon className="absolute left-4.5 text-zinc-400 pointer-events-none" size={18} />
              <input
                id="importer-url-input"
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Ex : https://www.youtube.com/playlist?list=... ou https://music.apple.com/..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-950/80 border border-white/10 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15 text-white placeholder-zinc-500 text-sm transition-all"
              />
            </div>

            {/* Quick Suggestions */}
            <div className="space-y-2 pt-2">
              <span className="text-xs text-zinc-400">Exemples prêts à essayer :</span>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_IMPORTS.map((ex) => (
                  <button
                    key={ex.name}
                    type="button"
                    onClick={() => handleUseExample(ex.url)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-medium transition flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>{ex.name}</span>
                    <ArrowRight size={12} className="text-cyan-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Collez vos titres (un par ligne)
            </label>
            <textarea
              id="importer-text-input"
              rows={5}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={`The Weeknd - Blinding Lights\nKSLV Noh - Disaster (Phonk)\nHans Zimmer - Time\nMick Gordon - The Only Thing They Fear Is You`}
              className="w-full p-4 rounded-2xl bg-zinc-950/80 border border-white/10 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15 text-white placeholder-zinc-500 text-sm font-mono transition-all"
            />
          </div>
        )}

        {/* Custom Playlist Name */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Titre personnalisé de la playlist (facultatif)
          </label>
          <input
            id="importer-custom-title-input"
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Ex : Mes Sons Ranked / Session Soirée"
            className="w-full px-4 py-3.5 rounded-xl bg-zinc-950/80 border border-white/10 focus:border-cyan-400 text-white placeholder-zinc-500 text-sm transition"
          />
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            id="importer-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-cyan-500/25 active:scale-98 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>{currentStep || "Importation en cours..."}</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Importer la Playlist</span>
              </>
            )}
          </button>
        </div>
      </form>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Success Preview Card */}
      {previewPlaylist && (
        <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/80 border border-cyan-500/30 space-y-5 animate-fade-in shadow-2xl">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase">
            <CheckCircle2 size={16} />
            <span>Playlist Importée avec Succès</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-5 border-b border-white/10">
            <div className="flex items-center gap-4">
              <img
                src={previewPlaylist.coverUrl}
                alt={previewPlaylist.title}
                className="w-20 h-20 rounded-2xl object-cover border border-white/10 shadow-xl"
                referrerPolicy="no-referrer"
              />
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">
                  {previewPlaylist.title}
                </h3>
                <p className="text-xs text-zinc-400">{previewPlaylist.description}</p>
                <div className="flex items-center gap-2 pt-1 text-xs text-cyan-400 font-medium">
                  <span>{previewPlaylist.tracks.length} titres prêts à l'écoute</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onPlayPlaylistImmediately(previewPlaylist)}
              className="px-6 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition active:scale-95 cursor-pointer"
            >
              <Play size={16} fill="currentColor" />
              <span>ÉCOUTER TOUT DE SUITE</span>
            </button>
          </div>

          {/* Extracted Tracks List */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {previewPlaylist.tracks.slice(0, 10).map((t, idx) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-white/5 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-zinc-500 w-4">{idx + 1}</span>
                  <div className="truncate">
                    <span className="font-semibold text-white">{t.title}</span>
                    <span className="text-zinc-500 mx-1.5">•</span>
                    <span className="text-zinc-400">{t.artist}</span>
                  </div>
                </div>
                <span className="text-zinc-500 shrink-0 font-mono">{t.duration || "3:30"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
