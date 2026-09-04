import React from "react";
import { GAME_PRESETS } from "../data/initialPlaylists";
import { Gamepad2, Sparkles, Monitor, Disc3 } from "lucide-react";
import { EQProfile } from "../types";

interface GameBackdropSimulatorProps {
  selectedGame: string;
  onSelectGame: (gameId: any, recommendedEQ: EQProfile) => void;
  isOverlayOpen: boolean;
  onToggleOverlay: () => void;
  shortcutBadge: string;
  isGameSessionActive: boolean;
  onToggleGameSession: () => void;
}

export const GameBackdropSimulator: React.FC<GameBackdropSimulatorProps> = ({
  selectedGame,
  onSelectGame,
  isOverlayOpen,
  onToggleOverlay,
  shortcutBadge,
  isGameSessionActive,
  onToggleGameSession
}) => {
  const currentGame = GAME_PRESETS.find((g) => g.id === selectedGame) || GAME_PRESETS[0];

  const eqFriendlyLabels: Record<EQProfile, string> = {
    "balanced": "Son Équilibré",
    "fps-footsteps": "Pas & Tirs Nets",
    "bass-phonk": "Basses Boostées",
    "lofi-calm": "Ambiance Feutrée",
    "rpg-ambient": "Immersion Totale",
  };

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans']">
      {/* Simulation Selector Bar */}
      <div className="p-4 rounded-3xl bg-zinc-900/80 border border-white/10 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-orange-500/15 text-orange-400 border border-orange-500/25">
            <Gamepad2 size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-zinc-100">
                Session de Jeu & HUD Flottant
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                DJ IA Actif
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Profitez d'un mix ininterrompu avec le HUD discret qui s'adapte à votre jeu.
            </p>
          </div>
        </div>

        {/* Action button: Launch Full Game Session Mode */}
        <div className="flex items-center gap-2">
          <button
            id="toggle-game-session-btn"
            onClick={onToggleGameSession}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer ${
              isGameSessionActive
                ? "bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-amber-500/25"
                : "bg-orange-500 text-zinc-950 hover:bg-orange-400 shadow-orange-500/25"
            }`}
          >
            <Monitor size={15} />
            <span>{isGameSessionActive ? "QUITTER LE PLEIN ÉCRAN" : "MODE IMMERSION PLEIN ÉCRAN"}</span>
          </button>
        </div>
      </div>

      {/* Preset Game Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {GAME_PRESETS.map((game) => {
          const isSelected = game.id === selectedGame;
          return (
            <button
              key={game.id}
              onClick={() => onSelectGame(game.id, game.recommendedEQ)}
              className={`p-3 rounded-2xl border text-left transition relative overflow-hidden group cursor-pointer ${
                isSelected
                  ? "bg-zinc-800/90 border-orange-500 shadow-lg shadow-orange-500/15 ring-1 ring-orange-500/30"
                  : "bg-zinc-900/50 border-white/5 hover:border-white/15"
              }`}
            >
              <div className="text-xs font-bold text-zinc-100 truncate">
                {game.name}
              </div>
              <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                {game.tagline}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[10px]">
                <span className="text-zinc-400 font-medium">
                  {eqFriendlyLabels[game.recommendedEQ] || "Optimisé"}
                </span>
                {isSelected && (
                  <span className="text-orange-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                    Actif
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
