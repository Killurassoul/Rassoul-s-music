import React, { useState } from "react";
import { Playlist, Track } from "../types";
import { X, Plus, Check, Music } from "lucide-react";

interface AddToPlaylistModalProps {
  track: Track | null;
  playlists: Playlist[];
  onClose: () => void;
  onAddTrackToPlaylist: (playlistId: string, track: Track) => void;
  onCreateAndAdd: (name: string, track: Track) => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  track,
  playlists,
  onClose,
  onAddTrackToPlaylist,
  onCreateAndAdd,
}) => {
  const [newTitle, setNewTitle] = useState("");
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  if (!track) return null;

  const handleSelect = (playlistId: string) => {
    onAddTrackToPlaylist(playlistId, track);
    setAddedIds((prev) => ({ ...prev, [playlistId]: true }));
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateAndAdd(newTitle.trim(), track);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-['Plus_Jakarta_Sans']">
      <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-cyan-500/30 p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-zinc-100 font-['Chakra_Petch']">
              Ajouter à une playlist
            </h3>
            <p className="text-xs text-zinc-400 truncate max-w-[280px]">
              {track.title} - {track.artist}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X size={16} />
          </button>
        </div>

        {/* Existing playlists */}
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {playlists.map((pl) => {
            const isAdded = addedIds[pl.id];
            return (
              <button
                key={pl.id}
                onClick={() => handleSelect(pl.id)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 transition text-left text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={pl.coverUrl}
                    alt={pl.title}
                    className="w-8 h-8 rounded-lg object-cover border border-zinc-800 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 truncate">
                    <span className="font-bold text-zinc-200 truncate block">
                      {pl.title}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {pl.tracks.length} morceaux
                    </span>
                  </div>
                </div>

                {isAdded ? (
                  <span className="text-emerald-400 text-xs flex items-center gap-1 font-mono">
                    <Check size={14} /> Ajouté
                  </span>
                ) : (
                  <span className="text-cyan-400 text-xs font-mono">+ Choisir</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Create new playlist input */}
        <form onSubmit={handleCreate} className="pt-2 border-t border-zinc-800 flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Nouvelle playlist..."
            className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-cyan-400 text-xs text-zinc-100"
          />
          <button
            type="submit"
            disabled={!newTitle.trim()}
            className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-zinc-950 font-bold text-xs flex items-center gap-1"
          >
            <Plus size={14} />
            <span>Créer</span>
          </button>
        </form>
      </div>
    </div>
  );
};
