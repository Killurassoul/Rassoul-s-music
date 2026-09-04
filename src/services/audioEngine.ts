import { EQProfile, Track, CrossfadeCurve, CrossfadeStatus } from "../types";

type PlaybackCallback = () => void;
type TimeCallback = (currentTime: number, duration: number) => void;
type ErrorCallback = (err: string) => void;
type AutoMixCallback = () => void;
type CrossfadeStatusCallback = (status: CrossfadeStatus) => void;

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

class AudioEngine {
  // Dual-deck architecture for seamless Pro DJ Crossfade
  private deckA: HTMLAudioElement | null = null;
  private deckB: HTMLAudioElement | null = null;
  private activeDeck: "A" | "B" = "A";

  private audioCtx: AudioContext | null = null;
  private sourceNodeA: MediaElementAudioSourceNode | null = null;
  private sourceNodeB: MediaElementAudioSourceNode | null = null;
  private gainDeckA: GainNode | null = null;
  private gainDeckB: GainNode | null = null;

  // Master audio pipeline
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private pannerNode: StereoPannerNode | null = null;

  // YouTube Player
  private ytPlayer: any = null;
  private ytReady = false;
  private isUsingYouTube = false;
  private ytTimer: any = null;

  // Spatial Audio 8D state
  private spatialTimer: any = null;
  private spatialAngle = 0;

  // DJ Crossfade Settings
  private crossfadeDuration = 3.0; // Default 3.0s (0 to 5s)
  private crossfadeCurve: CrossfadeCurve = "equal-power";
  private autoMixOnEnd = true;
  private isCrossfading = false;
  private crossfadeRafId: number | null = null;
  private hasTriggeredAutoMix = false;

  // Playback state
  private currentTrack: Track | null = null;
  private masterVolume = 0.8;
  private isDucked = false;
  private isMuted = false;
  private eqProfile: EQProfile = "balanced";
  private spatialAudioActive = false;

  // Callbacks
  private onEndCallbacks: PlaybackCallback[] = [];
  private onPlayCallbacks: PlaybackCallback[] = [];
  private onPauseCallbacks: PlaybackCallback[] = [];
  private onTimeCallbacks: TimeCallback[] = [];
  private onErrorCallbacks: ErrorCallback[] = [];
  private onAutoMixCallbacks: AutoMixCallback[] = [];
  private onCrossfadeStatusCallbacks: CrossfadeStatusCallback[] = [];

  constructor() {
    if (typeof window !== "undefined") {
      this.initDecks();
      this.loadYouTubeAPI();
    }
  }

  private initDecks() {
    this.deckA = new Audio();
    this.deckA.crossOrigin = "anonymous";
    this.deckA.preload = "auto";

    this.deckB = new Audio();
    this.deckB.crossOrigin = "anonymous";
    this.deckB.preload = "auto";

    this.attachDeckListeners(this.deckA, "A");
    this.attachDeckListeners(this.deckB, "B");
  }

  private attachDeckListeners(deck: HTMLAudioElement, deckId: "A" | "B") {
    deck.addEventListener("play", () => {
      if (this.activeDeck === deckId || this.isCrossfading) {
        this.onPlayCallbacks.forEach((cb) => cb());
      }
    });

    deck.addEventListener("pause", () => {
      if (this.activeDeck === deckId && !this.isCrossfading) {
        this.onPauseCallbacks.forEach((cb) => cb());
      }
    });

    deck.addEventListener("ended", () => {
      if (this.activeDeck === deckId && !this.isCrossfading) {
        this.onEndCallbacks.forEach((cb) => cb());
      }
    });

    deck.addEventListener("timeupdate", () => {
      if (this.isUsingYouTube) return;

      const cur = deck.currentTime || 0;
      const dur = deck.duration || 0;

      // Only dispatch time updates if this deck is active or we're past halfway through crossfade
      if (this.activeDeck === deckId || (this.isCrossfading && cur > 0)) {
        this.onTimeCallbacks.forEach((cb) => cb(cur, dur));
      }

      // Check for Pro DJ Automix near the end of track
      if (
        this.activeDeck === deckId &&
        this.autoMixOnEnd &&
        this.crossfadeDuration > 0.2 &&
        dur > this.crossfadeDuration * 2 &&
        !this.hasTriggeredAutoMix &&
        !this.isCrossfading
      ) {
        const remaining = dur - cur;
        if (remaining <= this.crossfadeDuration && remaining > 0.2) {
          this.hasTriggeredAutoMix = true;
          this.onAutoMixCallbacks.forEach((cb) => cb());
        }
      }
    });

    deck.addEventListener("error", (e) => {
      console.warn(`Audio element Deck ${deckId} error:`, e);
      if (this.activeDeck === deckId) {
        this.onErrorCallbacks.forEach((cb) =>
          cb(`Impossible de charger le flux audio direct (Deck ${deckId}).`)
        );
      }
    });
  }

  private initWebAudio() {
    if (this.audioCtx || !this.deckA || !this.deckB) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 128;

      this.masterGain = this.audioCtx.createGain();

      this.gainDeckA = this.audioCtx.createGain();
      this.gainDeckB = this.audioCtx.createGain();

      // Initial Deck gains: Deck A starts at 1.0, Deck B starts at 0.0
      this.gainDeckA.gain.value = this.activeDeck === "A" ? 1.0 : 0.0;
      this.gainDeckB.gain.value = this.activeDeck === "B" ? 1.0 : 0.0;

      this.bassFilter = this.audioCtx.createBiquadFilter();
      this.bassFilter.type = "lowshelf";
      this.bassFilter.frequency.value = 250;

      this.trebleFilter = this.audioCtx.createBiquadFilter();
      this.trebleFilter.type = "highshelf";
      this.trebleFilter.frequency.value = 3500;

      if (this.audioCtx.createStereoPanner) {
        this.pannerNode = this.audioCtx.createStereoPanner();
      }

      // Connect Deck A and Deck B to their individual gains
      this.sourceNodeA = this.audioCtx.createMediaElementSource(this.deckA);
      this.sourceNodeB = this.audioCtx.createMediaElementSource(this.deckB);

      this.sourceNodeA.connect(this.gainDeckA);
      this.sourceNodeB.connect(this.gainDeckB);

      // Both deck gains converge into EQ filters
      this.gainDeckA.connect(this.bassFilter);
      this.gainDeckB.connect(this.bassFilter);

      // Routing: [Decks] -> Bass -> Treble -> (Panner) -> MasterGain -> Analyser -> Output
      let lastNode: AudioNode = this.bassFilter;
      lastNode = lastNode.connect(this.trebleFilter);

      if (this.pannerNode) {
        lastNode = lastNode.connect(this.pannerNode);
      }

      lastNode = lastNode.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);

      this.updateEffectiveVolume();
      this.applyEQ(this.eqProfile);
    } catch (err) {
      console.warn("Web Audio API not fully available:", err);
    }
  }

  private loadYouTubeAPI() {
    if (window.YT && window.YT.Player) {
      this.ytReady = true;
      this.mountYouTubePlayer();
      return;
    }

    window.onYouTubeIframeAPIReady = () => {
      this.ytReady = true;
      this.mountYouTubePlayer();
    };

    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }

  private mountYouTubePlayer() {
    if (!this.ytReady) return;
    let holder = document.getElementById("yt-player-hidden");
    if (!holder) {
      holder = document.createElement("div");
      holder.id = "yt-player-hidden";
      holder.style.position = "fixed";
      holder.style.bottom = "-9999px";
      holder.style.left = "-9999px";
      holder.style.width = "1px";
      holder.style.height = "1px";
      holder.style.opacity = "0";
      holder.style.pointerEvents = "none";
      document.body.appendChild(holder);
    }

    try {
      this.ytPlayer = new window.YT.Player("yt-player-hidden", {
        height: "1",
        width: "1",
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
        },
        events: {
          onReady: () => {
            if (this.isUsingYouTube && this.currentTrack?.youtubeId) {
              this.ytPlayer.loadVideoById(this.currentTrack.youtubeId);
              this.ytPlayer.setVolume(this.getEffectiveVolumePercent());
            }
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              this.onPlayCallbacks.forEach((cb) => cb());
              this.startYtTicker();
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              this.onPauseCallbacks.forEach((cb) => cb());
              this.stopYtTicker();
            } else if (event.data === window.YT.PlayerState.ENDED) {
              this.stopYtTicker();
              this.onEndCallbacks.forEach((cb) => cb());
            }
          },
          onError: () => {
            this.onErrorCallbacks.forEach((cb) =>
              cb("Erreur lors de la lecture YouTube.")
            );
          },
        },
      });
    } catch (e) {
      console.warn("YouTube Player initialization error", e);
    }
  }

  private startYtTicker() {
    this.stopYtTicker();
    this.ytTimer = setInterval(() => {
      if (this.ytPlayer && typeof this.ytPlayer.getCurrentTime === "function") {
        const cur = this.ytPlayer.getCurrentTime() || 0;
        const dur = this.ytPlayer.getDuration() || 0;
        this.onTimeCallbacks.forEach((cb) => cb(cur, dur));

        // Automix for YouTube
        if (
          this.autoMixOnEnd &&
          this.crossfadeDuration > 0.2 &&
          dur > this.crossfadeDuration * 2 &&
          !this.hasTriggeredAutoMix
        ) {
          const rem = dur - cur;
          if (rem <= this.crossfadeDuration && rem > 0.3) {
            this.hasTriggeredAutoMix = true;
            this.onAutoMixCallbacks.forEach((cb) => cb());
          }
        }
      }
    }, 500);
  }

  private stopYtTicker() {
    if (this.ytTimer) {
      clearInterval(this.ytTimer);
      this.ytTimer = null;
    }
  }

  // Calculate DJ gain values based on curve
  private computeCurveGains(progress: number): { gainOut: number; gainIn: number } {
    const t = Math.max(0, Math.min(1, progress));

    switch (this.crossfadeCurve) {
      case "equal-power": {
        // Pro DJ Club standard: cos/sin constant acoustic power curve
        // cos²(t*π/2) + sin²(t*π/2) === 1
        const gainOut = Math.cos((t * Math.PI) / 2);
        const gainIn = Math.sin((t * Math.PI) / 2);
        return { gainOut, gainIn };
      }
      case "smooth-blend": {
        // Sigmoid / Smoothstep S-curve for silky lofi transitions
        const s = t * t * (3 - 2 * t);
        return { gainOut: 1 - s, gainIn: s };
      }
      case "linear":
      default: {
        return { gainOut: 1 - t, gainIn: t };
      }
    }
  }

  private emitCrossfadeStatus(deckAPercent: number, deckBPercent: number, isCrossfading: boolean) {
    const status: CrossfadeStatus = {
      isCrossfading,
      deckAPercent: Math.round(deckAPercent * 100),
      deckBPercent: Math.round(deckBPercent * 100),
      activeDeck: this.activeDeck,
    };
    this.onCrossfadeStatusCallbacks.forEach((cb) => cb(status));
  }

  public async playTrack(track: Track, options?: { skipCrossfade?: boolean }) {
    this.currentTrack = track;
    this.hasTriggeredAutoMix = false;

    if (this.audioCtx && this.audioCtx.state === "suspended") {
      try {
        await this.audioCtx.resume();
      } catch (e) {}
    }

    // YouTube track handling
    if (track.source === "youtube" && track.youtubeId) {
      this.handleYouTubeTrack(track, options);
      return;
    }

    // Direct Web Audio Deck handling
    this.isUsingYouTube = false;
    this.stopYtTicker();

    this.initWebAudio();

    const stream =
      track.streamUrl ||
      "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3";

    const prevActiveDeck = this.activeDeck;
    const prevAudio = prevActiveDeck === "A" ? this.deckA : this.deckB;
    const isPreviousPlaying = prevAudio && !prevAudio.paused && prevAudio.currentTime > 0;

    // Check if crossfade applies
    const shouldCrossfade =
      !options?.skipCrossfade &&
      this.crossfadeDuration > 0.05 &&
      (isPreviousPlaying || (this.ytPlayer && typeof this.ytPlayer.getPlayerState === "function" && this.ytPlayer.getPlayerState() === 1));

    if (!shouldCrossfade) {
      // Instant cut / initial play
      this.cancelCrossfade();

      if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === "function") {
        try {
          this.ytPlayer.pauseVideo();
        } catch (e) {}
      }

      // Stop both decks
      if (this.deckA) {
        this.deckA.pause();
        this.deckA.currentTime = 0;
      }
      if (this.deckB) {
        this.deckB.pause();
        this.deckB.currentTime = 0;
      }

      // Set target active deck
      const targetAudio = this.deckA;
      this.activeDeck = "A";

      if (this.gainDeckA) this.gainDeckA.gain.value = 1.0;
      if (this.gainDeckB) this.gainDeckB.gain.value = 0.0;

      if (targetAudio) {
        targetAudio.src = stream;
        try {
          await targetAudio.play();
        } catch (err) {
          console.warn("Direct play failed, waiting for user click:", err);
        }
      }

      this.emitCrossfadeStatus(1, 0, false);
      return;
    }

    // PRO DJ CROSSFADE BETWEEN DECKS
    this.cancelCrossfade();

    // The incoming deck is the opposite of the current active deck
    const incomingDeckId: "A" | "B" = prevActiveDeck === "A" ? "B" : "A";
    const outgoingAudio = prevActiveDeck === "A" ? this.deckA : this.deckB;
    const incomingAudio = incomingDeckId === "A" ? this.deckA : this.deckB;
    const outgoingGain = prevActiveDeck === "A" ? this.gainDeckA : this.gainDeckB;
    const incomingGain = incomingDeckId === "A" ? this.gainDeckA : this.gainDeckB;

    if (!incomingAudio || !outgoingAudio) return;

    // Prepare incoming deck
    incomingAudio.src = stream;
    incomingAudio.currentTime = 0;

    if (incomingGain) incomingGain.gain.value = 0.0;
    if (outgoingGain) outgoingGain.gain.value = 1.0;

    try {
      await incomingAudio.play();
    } catch (e) {
      console.warn("Incoming audio play error in crossfade:", e);
    }

    // Execute DJ crossfade transition
    this.isCrossfading = true;
    const startTime = performance.now();
    const durationMs = this.crossfadeDuration * 1000;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      const { gainOut, gainIn } = this.computeCurveGains(progress);

      if (outgoingGain) outgoingGain.gain.value = gainOut;
      if (incomingGain) incomingGain.gain.value = gainIn;

      // Also lower YouTube if it was playing
      if (this.ytPlayer && typeof this.ytPlayer.setVolume === "function") {
        try {
          this.ytPlayer.setVolume(Math.round(this.getEffectiveVolumePercent() * gainOut));
        } catch (e) {}
      }

      // Calculate A/B percents for UI meters
      const percentA = incomingDeckId === "A" ? gainIn : gainOut;
      const percentB = incomingDeckId === "B" ? gainIn : gainOut;
      this.emitCrossfadeStatus(percentA, percentB, true);

      if (progress < 1) {
        this.crossfadeRafId = requestAnimationFrame(tick);
      } else {
        // Completed crossfade
        this.isCrossfading = false;
        this.crossfadeRafId = null;

        // Clean up outgoing
        outgoingAudio.pause();
        outgoingAudio.currentTime = 0;
        if (outgoingGain) outgoingGain.gain.value = 0.0;
        if (incomingGain) incomingGain.gain.value = 1.0;

        if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === "function") {
          try {
            this.ytPlayer.pauseVideo();
          } catch (e) {}
        }

        this.activeDeck = incomingDeckId;
        const finalA = incomingDeckId === "A" ? 1 : 0;
        const finalB = incomingDeckId === "B" ? 1 : 0;
        this.emitCrossfadeStatus(finalA, finalB, false);
      }
    };

    this.crossfadeRafId = requestAnimationFrame(tick);
  }

  private handleYouTubeTrack(track: Track, options?: { skipCrossfade?: boolean }) {
    this.isUsingYouTube = true;
    const shouldCrossfade = !options?.skipCrossfade && this.crossfadeDuration > 0.05;

    const currentAudio = this.activeDeck === "A" ? this.deckA : this.deckB;
    const outgoingGain = this.activeDeck === "A" ? this.gainDeckA : this.gainDeckB;

    if (!shouldCrossfade || !currentAudio || currentAudio.paused) {
      if (this.deckA) {
        this.deckA.pause();
        this.deckA.currentTime = 0;
      }
      if (this.deckB) {
        this.deckB.pause();
        this.deckB.currentTime = 0;
      }
      if (this.ytPlayer && typeof this.ytPlayer.loadVideoById === "function") {
        this.ytPlayer.loadVideoById(track.youtubeId);
        this.ytPlayer.setVolume(this.getEffectiveVolumePercent());
        this.ytPlayer.playVideo();
      }
      this.emitCrossfadeStatus(0, 0, false);
      return;
    }

    // Crossfade from direct audio deck to YouTube
    this.cancelCrossfade();
    this.isCrossfading = true;

    if (this.ytPlayer && typeof this.ytPlayer.loadVideoById === "function") {
      this.ytPlayer.loadVideoById(track.youtubeId);
      this.ytPlayer.setVolume(0);
      this.ytPlayer.playVideo();
    }

    const startTime = performance.now();
    const durationMs = this.crossfadeDuration * 1000;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const { gainOut, gainIn } = this.computeCurveGains(progress);

      if (outgoingGain) outgoingGain.gain.value = gainOut;
      if (this.ytPlayer && typeof this.ytPlayer.setVolume === "function") {
        this.ytPlayer.setVolume(Math.round(this.getEffectiveVolumePercent() * gainIn));
      }

      this.emitCrossfadeStatus(gainOut, gainIn, true);

      if (progress < 1) {
        this.crossfadeRafId = requestAnimationFrame(tick);
      } else {
        this.isCrossfading = false;
        this.crossfadeRafId = null;
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
        if (outgoingGain) outgoingGain.gain.value = 0;
        if (this.ytPlayer && typeof this.ytPlayer.setVolume === "function") {
          this.ytPlayer.setVolume(this.getEffectiveVolumePercent());
        }
        this.emitCrossfadeStatus(0, 0, false);
      }
    };

    this.crossfadeRafId = requestAnimationFrame(tick);
  }

  private cancelCrossfade() {
    if (this.crossfadeRafId) {
      cancelAnimationFrame(this.crossfadeRafId);
      this.crossfadeRafId = null;
    }
    this.isCrossfading = false;
  }

  public async togglePlay(): Promise<boolean> {
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      try {
        await this.audioCtx.resume();
      } catch (e) {}
    }

    if (this.isUsingYouTube) {
      if (!this.ytPlayer || typeof this.ytPlayer.getPlayerState !== "function") return false;
      const state = this.ytPlayer.getPlayerState();
      if (state === window.YT?.PlayerState?.PLAYING) {
        this.ytPlayer.pauseVideo();
        return false;
      } else {
        this.ytPlayer.playVideo();
        return true;
      }
    }

    const currentAudio = this.activeDeck === "A" ? this.deckA : this.deckB;
    if (!currentAudio) return false;

    if (currentAudio.paused) {
      try {
        await currentAudio.play();
        return true;
      } catch (e) {
        return false;
      }
    } else {
      currentAudio.pause();
      return false;
    }
  }

  public pause() {
    this.cancelCrossfade();
    if (this.isUsingYouTube && this.ytPlayer && typeof this.ytPlayer.pauseVideo === "function") {
      this.ytPlayer.pauseVideo();
    } else {
      if (this.deckA) this.deckA.pause();
      if (this.deckB) this.deckB.pause();
    }
  }

  public seek(seconds: number) {
    if (this.isUsingYouTube && this.ytPlayer && typeof this.ytPlayer.seekTo === "function") {
      this.ytPlayer.seekTo(seconds, true);
    } else {
      const currentAudio = this.activeDeck === "A" ? this.deckA : this.deckB;
      if (currentAudio) {
        currentAudio.currentTime = seconds;
        // Reset automix trigger if seeking backward
        if (currentAudio.duration && currentAudio.duration - seconds > this.crossfadeDuration) {
          this.hasTriggeredAutoMix = false;
        }
      }
    }
  }

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    this.updateEffectiveVolume();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.updateEffectiveVolume();
    return this.isMuted;
  }

  public setAudioDucking(ducked: boolean) {
    this.isDucked = ducked;
    this.updateEffectiveVolume();
  }

  private getEffectiveVolumePercent(): number {
    if (this.isMuted) return 0;
    const factor = this.isDucked ? 0.2 : 1.0;
    return Math.round(this.masterVolume * factor * 100);
  }

  private updateEffectiveVolume() {
    const effVol = this.isMuted ? 0 : this.masterVolume * (this.isDucked ? 0.2 : 1.0);

    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setTargetAtTime(effVol, this.audioCtx.currentTime, 0.04);
    }

    if (this.isUsingYouTube && this.ytPlayer && typeof this.ytPlayer.setVolume === "function") {
      this.ytPlayer.setVolume(this.getEffectiveVolumePercent());
    }
  }

  public applyEQ(profile: EQProfile) {
    this.eqProfile = profile;
    if (!this.bassFilter || !this.trebleFilter) return;

    switch (profile) {
      case "fps-footsteps":
        this.bassFilter.gain.value = -12;
        this.trebleFilter.gain.value = 7;
        break;
      case "bass-phonk":
        this.bassFilter.gain.value = 10;
        this.trebleFilter.gain.value = 2;
        break;
      case "lofi-calm":
        this.bassFilter.gain.value = 3;
        this.trebleFilter.gain.value = -6;
        break;
      case "rpg-ambient":
        this.bassFilter.gain.value = 2;
        this.trebleFilter.gain.value = 4;
        break;
      case "balanced":
      default:
        this.bassFilter.gain.value = 0;
        this.trebleFilter.gain.value = 0;
        break;
    }
  }

  public toggleSpatialAudio(active: boolean) {
    this.spatialAudioActive = active;
    if (!this.pannerNode) return;

    if (this.spatialTimer) {
      clearInterval(this.spatialTimer);
      this.spatialTimer = null;
    }

    if (!active) {
      this.pannerNode.pan.value = 0;
      return;
    }

    // 8D Audio subtle sinusoidal panning rotation
    this.spatialTimer = setInterval(() => {
      this.spatialAngle += 0.05;
      if (this.pannerNode) {
        this.pannerNode.pan.value = Math.sin(this.spatialAngle) * 0.75;
      }
    }, 100);
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser) {
      const fake = new Uint8Array(16);
      if (this.currentTrack && !this.isMuted) {
        for (let i = 0; i < fake.length; i++) {
          fake[i] = Math.floor(Math.sin(Date.now() / 200 + i) * 60 + 120);
        }
      }
      return fake;
    }
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  // Crossfade Configuration Setters & Getters
  public setCrossfadeDuration(seconds: number) {
    this.crossfadeDuration = Math.max(0, Math.min(5, seconds));
  }

  public getCrossfadeDuration(): number {
    return this.crossfadeDuration;
  }

  public setCrossfadeCurve(curve: CrossfadeCurve) {
    this.crossfadeCurve = curve;
  }

  public getCrossfadeCurve(): CrossfadeCurve {
    return this.crossfadeCurve;
  }

  public setAutoMix(enabled: boolean) {
    this.autoMixOnEnd = enabled;
  }

  public getAutoMix(): boolean {
    return this.autoMixOnEnd;
  }

  public getCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  public getCrossfadeStatus(): CrossfadeStatus {
    const activeIsA = this.activeDeck === "A";
    return {
      isCrossfading: this.isCrossfading,
      deckAPercent: activeIsA ? 100 : 0,
      deckBPercent: activeIsA ? 0 : 100,
      activeDeck: this.activeDeck,
    };
  }

  // Test DJ transition immediately
  public async testDJCrossfade(testTrack?: Track) {
    const sampleTrack: Track = testTrack || {
      id: "dj-test-" + Date.now(),
      title: "Phonk Night Club Mix (Test DJ)",
      artist: "Rassoul DJ Pro",
      duration: "03:45",
      coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80",
      source: "curated",
      streamUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3",
    };

    await this.playTrack(sampleTrack, { skipCrossfade: false });
  }

  // Event Subscriptions
  public onEnded(cb: PlaybackCallback) {
    this.onEndCallbacks.push(cb);
  }

  public onPlay(cb: PlaybackCallback) {
    this.onPlayCallbacks.push(cb);
  }

  public onPause(cb: PlaybackCallback) {
    this.onPauseCallbacks.push(cb);
  }

  public onTime(cb: TimeCallback) {
    this.onTimeCallbacks.push(cb);
  }

  public onError(cb: ErrorCallback) {
    this.onErrorCallbacks.push(cb);
  }

  public onAutoMix(cb: AutoMixCallback) {
    this.onAutoMixCallbacks.push(cb);
  }

  public onCrossfadeStatus(cb: CrossfadeStatusCallback) {
    this.onCrossfadeStatusCallbacks.push(cb);
  }
}

export const audioEngine = new AudioEngine();
