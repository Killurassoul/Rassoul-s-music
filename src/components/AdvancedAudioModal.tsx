import React, { useState, useEffect } from "react";
import {
  Sliders,
  X,
  Disc3,
  Sparkles,
  Play,
  Volume2,
  Mic,
  Compass,
  CheckCircle2,
  Waves,
  Zap,
  Activity
} from "lucide-react";
import { GamingOverlayConfig, EQProfile, CrossfadeCurve } from "../types";
import { audioEngine } from "../services/audioEngine";

interface AdvancedAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GamingOverlayConfig;
  onUpdateConfig: (partial: Partial<GamingOverlayConfig>) => void;
  onTestMix?: () => void;
  onOpenVoiceSettings?: () => void;
}

export const AdvancedAudioModal: React.FC<AdvancedAudioModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onTestMix,
  onOpenVoiceSettings,
}) => {
  const [crossfadeStatus, setCrossfadeStatus] = useState(() =>
    audioEngine.getCrossfadeStatus()
  );
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCrossfadeStatus(audioEngine.getCrossfadeStatus());
    }, 120);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleCrossfadeChange = (val: number) => {
    const clamped = Math.max(0, Math.min(5, Math.round(val * 10) / 10));
    audioEngine.setCrossfadeDuration(clamped);
    onUpdateConfig({ crossfadeDuration: clamped });
  };

  const handleAutoMixToggle = () => {
    const nextVal = !config.autoMixOnEnd;
    audioEngine.setAutoMix(nextVal);
    onUpdateConfig({ autoMixOnEnd: nextVal });
  };

  const handleRunDJTest = () => {
    setIsTesting(true);
    if (onTestMix) onTestMix();
    setTimeout(() => setIsTesting(false), 2500);
  };

  if (!isOpen) return null;

  const eqProfiles: { id: EQProfile; name: string; desc: string; tag: string }[] = [
    {
      id: "balanced",
      name: "Équilibré Studio",
      desc: "Son haute-fidélité neutre et naturel pour tous genres musicaux.",
      tag: "STANDARD",
    },
    {
      id: "bass-phonk",
      name: "Basses Puissantes",
      desc: "Basses rondes et profondes pour le Phonk, l'Electro et le Hip-Hop.",
      tag: "BASS BOOST",
    },
    {
      id: "fps-footsteps",
      name: "Clarté Compétitive",
      desc: "Accentue les bruits de pas et les fréquences clés en jeu.",
      tag: "GAMING",
    },
    {
      id: "lofi-calm",
      name: "Détente & Lo-Fi",
      desc: "Son feutré et chaleureux pour le travail et la concentration.",
      tag: "RELAX",
    },
    {
      id: "rpg-ambient",
      name: "Ambiance & Immersion",
      desc: "Largeur stéréo élargie pour les bandes originales et mondes ouverts.",
      tag: "IMMERSION",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans']">
      <div className="w-full max-w-2xl rounded-3xl bg-zinc-950 border border-white/10 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/15 text-orange-400 flex items-center justify-center shadow-md">
              <Sliders size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                Réglages d'Écoute & Transitions
              </h3>
              <p className="text-xs text-zinc-400">
                Ajustez les enchaînements continus et les ambiances d'écoute
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

        {/* Section 1: Transitions & Continuous Playback */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center">
                <Disc3 size={17} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">
                  Enchaînement Continu (Fondu Musical)
                </h4>
                <p className="text-xs text-zinc-400">
                  Transition fluide d'un morceau à l'autre sans coupure
                </p>
              </div>
            </div>

            <button
              onClick={handleRunDJTest}
              disabled={isTesting || config.crossfadeDuration === 0}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Tester la transition maintenant"
            >
              <Play size={12} fill="currentColor" />
              <span>{isTesting ? "Transition..." : "Tester"}</span>
            </button>
          </div>

          {/* Slider */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Durée du fondu :</span>
              <span className="font-mono text-orange-400 font-bold">
                {config.crossfadeDuration.toFixed(1)}s
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={config.crossfadeDuration}
              onChange={(e) => handleCrossfadeChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />

            <div className="flex justify-between text-[11px] text-zinc-500">
              <span>0s (Coupure nette)</span>
              <span>1.5s</span>
              <span>3.0s (Recommandé)</span>
              <span>4.5s</span>
              <span>5.0s</span>
            </div>
          </div>

          {/* Quick Presets Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {[
              { sec: 0, label: "0s (Direct)" },
              { sec: 1.5, label: "1.5s (Rapide)" },
              { sec: 3.0, label: "3.0s (Recommandé)" },
              { sec: 4.5, label: "4.5s (Progressif)" },
              { sec: 5.0, label: "5.0s (Long)" },
            ].map((item) => (
              <button
                key={item.sec}
                onClick={() => handleCrossfadeChange(item.sec)}
                className={`px-3 py-1 rounded-xl text-xs transition cursor-pointer ${
                  Math.abs(config.crossfadeDuration - item.sec) < 0.1
                    ? "bg-orange-500 text-zinc-950 font-bold shadow-sm"
                    : "bg-white/5 text-zinc-300 hover:text-white border border-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Automix Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/70 border border-white/5">
            <div>
              <div className="text-xs font-semibold text-white">
                Enchaînement automatique avant la fin
              </div>
              <p className="text-xs text-zinc-400">
                Lance le morceau suivant {config.crossfadeDuration}s avant la fin pour un mix continu
              </p>
            </div>
            <button
              onClick={handleAutoMixToggle}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                config.autoMixOnEnd ? "bg-orange-500" : "bg-zinc-800"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-zinc-950 absolute top-1 transition-transform ${
                  config.autoMixOnEnd ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Section 2: Equalizer Profiles */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center">
                <Activity size={17} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">
                  Profils d'Ambiance Sonore
                </h4>
                <p className="text-xs text-zinc-400">
                  Harmonisez la réponse acoustique selon votre envie
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {eqProfiles.map((p) => {
              const isActive = config.eqProfile === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    audioEngine.applyEQ(p.id);
                    onUpdateConfig({ eqProfile: p.id });
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition space-y-1 cursor-pointer ${
                    isActive
                      ? "bg-orange-500/15 border-orange-500/80 text-orange-200 shadow-md"
                      : "bg-zinc-950/60 border-white/5 text-zinc-400 hover:text-white hover:border-white/15"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white">
                      {p.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-orange-400 font-medium">
                      {p.tag}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-snug">{p.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Immersion & Voice Auto-Ducking */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Spatial Audio */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                <Compass size={15} className="text-orange-400" />
                <span>Immersion Spatiale 3D</span>
              </div>
              <p className="text-xs text-zinc-400">
                Mouvement panoramique enveloppant au casque
              </p>
            </div>
            <button
              onClick={() => {
                const nextVal = !config.spatialAudio;
                audioEngine.toggleSpatialAudio(nextVal);
                onUpdateConfig({ spatialAudio: nextVal });
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                config.spatialAudio ? "bg-orange-500" : "bg-zinc-800"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-zinc-950 absolute top-1 transition-transform ${
                  config.spatialAudio ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Voice Ducking & Mic Calibration */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                <Mic size={15} className="text-orange-400" />
                <span>Atténuation Voix / Micro</span>
              </div>
              <p className="text-xs text-zinc-400">
                Baisse automatique dès que la voix est détectée
              </p>
              {onOpenVoiceSettings && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenVoiceSettings();
                  }}
                  className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold underline mt-1 block cursor-pointer"
                >
                  Régler la sensibilité du micro →
                </button>
              )}
            </div>
            <button
              onClick={() => {
                const nextVal = !config.audioDucking;
                audioEngine.setAudioDucking(nextVal);
                onUpdateConfig({ audioDucking: nextVal });
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                config.audioDucking ? "bg-orange-500" : "bg-zinc-800"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-zinc-950 absolute top-1 transition-transform ${
                  config.audioDucking ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-zinc-400">
          <span>Enchaînement : {config.crossfadeDuration}s • Profil : {config.eqProfile}</span>

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
