import { audioEngine } from "./audioEngine";

export interface VoiceDetectionState {
  isListening: boolean;
  isSpeaking: boolean;
  currentLevel: number; // 0 to 100
  threshold: number; // 0 to 100 (level required to consider as speaking)
  hangoverMs: number; // delay in ms before ducking turns off after silence
  hasPermission: boolean | null; // null = not requested, true = granted, false = denied
  errorMessage: string | null;
  autoDuckingEnabled: boolean;
}

type StateListener = (state: VoiceDetectionState) => void;

class VoiceDetectionService {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private animFrameId: number | null = null;
  private silenceTimer: any = null;

  private state: VoiceDetectionState = {
    isListening: false,
    isSpeaking: false,
    currentLevel: 0,
    threshold: 25, // default 25%
    hangoverMs: 1200, // 1.2s hangover
    hasPermission: null,
    errorMessage: null,
    autoDuckingEnabled: true,
  };

  private listeners: Set<StateListener> = new Set();

  constructor() {
    // Load persisted threshold & auto-ducking state
    try {
      const savedThreshold = localStorage.getItem("rm_voice_threshold");
      if (savedThreshold) {
        this.state.threshold = Math.max(5, Math.min(90, parseFloat(savedThreshold)));
      }
      const savedAuto = localStorage.getItem("rm_voice_auto_enabled");
      if (savedAuto !== null) {
        this.state.autoDuckingEnabled = savedAuto === "true";
      }
      const savedHangover = localStorage.getItem("rm_voice_hangover");
      if (savedHangover) {
        this.state.hangoverMs = parseInt(savedHangover, 10) || 1200;
      }
    } catch (e) {}
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const copy = { ...this.state };
    this.listeners.forEach((l) => l(copy));
  }

  public getState(): VoiceDetectionState {
    return { ...this.state };
  }

  public setThreshold(threshold: number) {
    this.state.threshold = Math.max(5, Math.min(90, Math.round(threshold)));
    try {
      localStorage.setItem("rm_voice_threshold", String(this.state.threshold));
    } catch (e) {}
    this.notify();
  }

  public setHangover(hangoverMs: number) {
    this.state.hangoverMs = Math.max(300, Math.min(3500, hangoverMs));
    try {
      localStorage.setItem("rm_voice_hangover", String(this.state.hangoverMs));
    } catch (e) {}
    this.notify();
  }

  public setAutoDuckingEnabled(enabled: boolean) {
    this.state.autoDuckingEnabled = enabled;
    try {
      localStorage.setItem("rm_voice_auto_enabled", String(enabled));
    } catch (e) {}

    // If disabled while speaking, reset ducking immediately
    if (!enabled && this.state.isSpeaking) {
      this.state.isSpeaking = false;
      audioEngine.setAudioDucking(false);
    }
    this.notify();
  }

  public async startListening(): Promise<boolean> {
    if (this.state.isListening && this.mediaStream) {
      return true;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("L'accès au microphone n'est pas pris en charge par ce navigateur.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.mediaStream = stream;
      this.state.hasPermission = true;
      this.state.errorMessage = null;

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      if (this.audioCtx.state === "suspended") {
        await this.audioCtx.resume();
      }

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.4;

      this.sourceNode = this.audioCtx.createMediaStreamSource(stream);
      this.sourceNode.connect(this.analyser);

      this.state.isListening = true;
      this.notify();

      this.runDetectionLoop();
      return true;
    } catch (err: any) {
      console.warn("Microphone access failed or denied:", err);
      this.state.hasPermission = false;
      this.state.isListening = false;
      this.state.errorMessage =
        err.name === "NotAllowedError"
          ? "Permission microphone refusée. Autorisez le micro dans votre navigateur."
          : err.message || "Impossible d'accéder au microphone.";
      this.notify();
      return false;
    }
  }

  public stopListening() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.audioCtx && this.audioCtx.state !== "closed") {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }

    this.state.isListening = false;
    this.state.currentLevel = 0;

    // Release ducking if it was on
    if (this.state.isSpeaking) {
      this.state.isSpeaking = false;
      audioEngine.setAudioDucking(false);
    }

    this.notify();
  }

  private runDetectionLoop = () => {
    if (!this.state.isListening || !this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate RMS volume level (0 to 100)
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);
    // Scale RMS (0 to 255) to percentage 0 - 100 with a slight boost curve
    const normalized = Math.min(100, Math.round((rms / 128) * 100));

    this.state.currentLevel = normalized;

    const isAboveThreshold = normalized >= this.state.threshold;

    if (isAboveThreshold) {
      // Voice detected!
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }

      if (!this.state.isSpeaking) {
        this.state.isSpeaking = true;
        if (this.state.autoDuckingEnabled) {
          // Instantly duck music volume so the speaker is heard clearly
          audioEngine.setAudioDucking(true);
        }
        this.notify();
      }
    } else {
      // Below threshold (silence or background hum)
      if (this.state.isSpeaking && !this.silenceTimer) {
        // Start hangover timer before restoring volume to avoid choppy sound
        this.silenceTimer = setTimeout(() => {
          this.state.isSpeaking = false;
          if (this.state.autoDuckingEnabled) {
            audioEngine.setAudioDucking(false);
          }
          this.silenceTimer = null;
          this.notify();
        }, this.state.hangoverMs);
      }
    }

    // Schedule next frame
    this.animFrameId = requestAnimationFrame(this.runDetectionLoop);
  };
}

export const voiceDetection = new VoiceDetectionService();
