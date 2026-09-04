import React from "react";
import { Keyboard, X, Check, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { GamingOverlayConfig } from "../types";

interface KeybindingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GamingOverlayConfig;
  onUpdateKeybindings: (keys: GamingOverlayConfig["keybindings"]) => void;
}

export const KeybindingsModal: React.FC<KeybindingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateKeybindings,
}) => {
  if (!isOpen) return null;

  const defaultBindings = {
    toggleHud: "Alt + M",
    playPause: "Espace",
    nextTrack: "Alt + →",
    prevTrack: "Alt + ←",
    audioDucking: "Alt + D",
    volumeUp: "Alt + ↑",
    volumeDown: "Alt + ↓",
  };

  const resetToDefaults = () => {
    onUpdateKeybindings(defaultBindings);
  };

  const bindingsList = [
    {
      action: "Invoquer / Masquer le HUD Gaming",
      key: config.keybindings.toggleHud,
      desc: "Affiche ou cache instantanément le lecteur par-dessus votre jeu",
      highlight: true
    },
    {
      action: "Lecture / Pause",
      key: config.keybindings.playPause,
      desc: "Contrôle rapide du morceau en cours sans quitter la visée",
    },
    {
      action: "Piste Suivante",
      key: config.keybindings.nextTrack,
      desc: "Passe au morceau suivant dans la file ou playlist",
    },
    {
      action: "Piste Précédente",
      key: config.keybindings.prevTrack,
      desc: "Reviens au début ou au morceau précédent",
    },
    {
      action: "Audio Ducking Discord / Bruits de pas",
      key: config.keybindings.audioDucking,
      desc: "Baisse instantanément la musique à 20% pour entendre les communications ou bruits de pas",
      highlight: true
    },
    {
      action: "Augmenter le Volume",
      key: config.keybindings.volumeUp,
      desc: "+5% volume général",
    },
    {
      action: "Baisser le Volume",
      key: config.keybindings.volumeDown,
      desc: "-5% volume général",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans']">
      <div className="w-full max-w-xl rounded-2xl bg-zinc-950 border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Keyboard size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-zinc-100 font-['Chakra_Petch']">
                Raccourcis Clavier Gaming
              </h3>
              <p className="text-xs text-zinc-400">
                Invoquez et contrôlez Rassoul's music pendant vos sessions de jeu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {bindingsList.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 rounded-xl border transition ${
                item.highlight
                  ? "bg-cyan-950/20 border-cyan-500/40"
                  : "bg-zinc-900/50 border-zinc-800/80"
              }`}
            >
              <div className="pr-4 min-w-0">
                <div className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
                  <span>{item.action}</span>
                  {item.highlight && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                      ESSENTIEL
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">{item.desc}</div>
              </div>

              <kbd className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-cyan-400 font-mono text-xs font-bold shrink-0 shadow-inner">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Gaming Pro Tip */}
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-3 text-xs text-zinc-300">
          <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-zinc-100">Astuce Gaming Multi-Écran & Overlay :</span>
            <p className="text-zinc-400 leading-relaxed">
              Pour conserver le HUD par-dessus un jeu en plein écran exclusif, activez le mode <strong>Picture-in-Picture</strong> (icône écran dans le HUD) : une mini-fenêtre Windows/Bureau restera toujours au premier plan au-dessus de Counter-Strike, Valorant ou tout autre jeu !
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-cyan-400 font-mono transition"
          >
            <RotateCcw size={12} />
            <span>Réinitialiser par défaut</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs font-['Chakra_Petch'] transition"
          >
            TERMINER
          </button>
        </div>
      </div>
    </div>
  );
};
