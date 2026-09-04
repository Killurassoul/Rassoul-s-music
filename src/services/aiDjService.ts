import { Track, AIDjState, EQProfile } from "../types";
import { audioEngine } from "./audioEngine";

type DJListener = (state: AIDjState) => void;

class AIDJService {
  private state: AIDjState = {
    isActive: true,
    hasAI: true,
    isThinking: false,
    currentVibe: "Adrénaline Phonk",
    statusText: "DJ IA en direct",
    djSpeech: "DJ IA en direct : Prêt à mixer votre session avec des enchaînements sans coupure !",
    nextPreppedTrack: null,
    isMixing: false,
    energyLevel: "high",
  };

  private listeners: Set<DJListener> = new Set();
  private history: Track[] = [];
  private lastMixTime = 0;

  constructor() {
    // Check if custom key exists or default is available
    try {
      const savedKey = localStorage.getItem("rm_gemini_api_key");
      this.state.hasAI = true; // Always attempt AI first, with fallback to smart algorithmic mix
    } catch (e) {}
  }

  public getState(): AIDjState {
    return { ...this.state };
  }

  public subscribe(listener: DJListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((l) => l(currentState));
  }

  public toggleActive(enabled?: boolean) {
    const nextVal = enabled !== undefined ? enabled : !this.state.isActive;
    this.state.isActive = nextVal;
    this.state.statusText = nextVal
      ? this.state.hasAI
        ? "DJ IA en direct"
        : "DJ Auto en direct"
      : "Mix DJ en pause";
    this.state.djSpeech = nextVal
      ? "DJ : C'est reparti, je reprends les platines pour le mix !"
      : "DJ : Platines en pause. Contrôle manuel actif.";
    this.notify();
  }

  public setVibe(vibe: string) {
    this.state.currentVibe = vibe;
    this.state.statusText = `Vibe : ${vibe}`;
    this.notify();
  }

  /**
   * Prepares the next track on virtual Deck B
   */
  public async prepNextTrack(
    currentTrack: Track | null,
    library: Track[],
    queue: Track[]
  ): Promise<Track | null> {
    if (!this.state.isActive) return null;
    if (library.length === 0 && queue.length === 0) return null;

    this.state.isThinking = true;
    this.notify();

    // Pool of candidates excluding current track and very recently played
    const recentIds = new Set(this.history.slice(-3).map((t) => t.id));
    if (currentTrack) recentIds.add(currentTrack.id);

    const candidates = [...queue, ...library].filter(
      (t, index, self) =>
        !recentIds.has(t.id) && self.findIndex((x) => x.id === t.id) === index
    );

    const finalCandidates = candidates.length > 0 ? candidates : library;

    // Try AI endpoint first
    let selected: Track | null = null;
    let aiSpeech = "";
    let recEQ: EQProfile = "balanced";

    try {
      const apiKey = localStorage.getItem("rm_gemini_api_key") || "";
      const res = await fetch("/api/ai/dj-mix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          currentTrack,
          requestedVibe: this.state.currentVibe,
          candidates: finalCandidates.slice(0, 10).map((t) => ({
            id: t.id,
            title: t.title,
            artist: t.artist,
            genre: t.genre,
          })),
          recentHistory: this.history.slice(-4).map((t) => t.title),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (
          data &&
          typeof data.selectedCandidateIndex === "number" &&
          finalCandidates[data.selectedCandidateIndex]
        ) {
          selected = finalCandidates[data.selectedCandidateIndex];
          aiSpeech = data.djSpeech || "";
          recEQ = data.recommendedEQ || "balanced";
          this.state.hasAI = true;
          if (data.energyLevel) {
            this.state.energyLevel = data.energyLevel;
          }
        }
      }
    } catch (e) {
      console.warn("AI DJ endpoint unavailable, using smart heuristic DJ engine:", e);
      this.state.hasAI = false;
    }

    // Heuristic DJ engine if AI was offline or returned nothing
    if (!selected && finalCandidates.length > 0) {
      // Find track matching requested vibe
      const vibeLower = this.state.currentVibe.toLowerCase();
      const match = finalCandidates.find((t) => {
        const genre = (t.genre || "").toLowerCase();
        const title = t.title.toLowerCase();
        if (vibeLower.includes("phonk")) return genre.includes("phonk") || title.includes("phonk") || title.includes("drift");
        if (vibeLower.includes("chill") || vibeLower.includes("lo-fi")) return genre.includes("lofi") || title.includes("chill");
        if (vibeLower.includes("synth")) return genre.includes("synth") || title.includes("night") || title.includes("cyber");
        return true;
      });

      selected = match || finalCandidates[Math.floor(Math.random() * finalCandidates.length)];

      const quotes = [
        `DJ : Enchaînement calé pour "${selected.title}". Les basses arrivent !`,
        `DJ : Prochain titre préchauffé : "${selected.title}" pour garder l'énergie.`,
        `DJ : Transition fluide vers "${selected.title}", zéro blanc sonore.`,
        `DJ : Je vous prépare "${selected.title}", restez concentrés sur le jeu !`,
      ];
      aiSpeech = quotes[Math.floor(Math.random() * quotes.length)];
    }

    this.state.isThinking = false;
    if (selected) {
      this.state.nextPreppedTrack = selected;
      this.state.djSpeech = aiSpeech || `DJ : Morceau calé sur "${selected.title}"`;
      this.state.statusText = this.state.hasAI ? "DJ IA : Prochain track prêt" : "DJ Auto : Prochain track prêt";
    }

    this.notify();
    return selected;
  }

  /**
   * Triggers an immediate DJ mix into a target track (or the prepped track)
   */
  public triggerMix(
    targetTrack: Track | null,
    onExecuteTransition: (track: Track) => void
  ) {
    const trackToPlay = targetTrack || this.state.nextPreppedTrack;
    if (!trackToPlay) return;

    this.state.isMixing = true;
    this.state.statusText = "Transition en cours...";
    this.state.djSpeech = `DJ : Transition en direct vers "${trackToPlay.title}" ! Montez le volume.`;
    this.notify();

    if (this.state.nextPreppedTrack?.id === trackToPlay.id) {
      this.history.push(trackToPlay);
    }

    onExecuteTransition(trackToPlay);

    // Release mixing state after standard crossfade
    setTimeout(() => {
      this.state.isMixing = false;
      this.state.statusText = this.state.hasAI ? "DJ IA en direct" : "DJ Auto en direct";
      this.notify();
    }, 2800);
  }

  /**
   * Request a quick vibe switch
   */
  public async switchVibe(
    vibe: string,
    currentTrack: Track | null,
    library: Track[],
    queue: Track[],
    onExecuteTransition?: (track: Track) => void
  ) {
    this.setVibe(vibe);
    this.state.djSpeech = `DJ : Changement d'ambiance vers "${vibe}". Je sélectionne le son parfait...`;
    this.notify();

    const next = await this.prepNextTrack(currentTrack, library, queue);
    if (next && onExecuteTransition) {
      this.triggerMix(next, onExecuteTransition);
    }
  }

  /**
   * Surprise Drop requested by user
   */
  public surpriseDrop(
    library: Track[],
    onExecuteTransition: (track: Track) => void
  ) {
    if (library.length === 0) return;

    // Pick highest energy track (phonk, synth, cyber)
    const bangers = library.filter((t) => {
      const s = (t.title + " " + (t.genre || "")).toLowerCase();
      return s.includes("phonk") || s.includes("drift") || s.includes("cyber") || s.includes("bass");
    });
    const pool = bangers.length > 0 ? bangers : library;
    const selected = pool[Math.floor(Math.random() * pool.length)];

    this.state.djSpeech = `DJ : DROP SURPRISE IMMÉDIAT ! On envoie "${selected.title}" à plein volume !`;
    this.state.energyLevel = "intense";
    this.triggerMix(selected, onExecuteTransition);
  }
}

export const aiDjService = new AIDJService();
