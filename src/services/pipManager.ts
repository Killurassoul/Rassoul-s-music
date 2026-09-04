import { Track } from "../types";

class PiPManager {
  private videoEl: HTMLVideoElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private animId: number | null = null;
  private isRunning = false;

  public async togglePiP(track: Track | null, isPlaying: boolean): Promise<boolean> {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      this.stop();
      return false;
    }

    if (!document.pictureInPictureEnabled) {
      throw new Error("Picture-in-Picture non supporté sur ce navigateur.");
    }

    this.initElements();
    this.startRendering(track, isPlaying);

    if (this.videoEl) {
      await this.videoEl.play();
      await this.videoEl.requestPictureInPicture();
      this.isRunning = true;
      return true;
    }

    return false;
  }

  public updateTrack(track: Track | null, isPlaying: boolean) {
    if (this.isRunning) {
      this.drawFrame(track, isPlaying);
    }
  }

  private initElements() {
    if (!this.canvasEl) {
      this.canvasEl = document.createElement("canvas");
      this.canvasEl.width = 480;
      this.canvasEl.height = 270;
    }

    if (!this.videoEl) {
      this.videoEl = document.createElement("video");
      this.videoEl.muted = true;
      this.videoEl.playsInline = true;
      const stream = (this.canvasEl as any).captureStream(30);
      this.videoEl.srcObject = stream;
    }
  }

  private startRendering(track: Track | null, isPlaying: boolean) {
    const loop = () => {
      this.drawFrame(track, isPlaying);
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  }

  private drawFrame(track: Track | null, isPlaying: boolean) {
    if (!this.canvasEl) return;
    const ctx = this.canvasEl.getContext("2d");
    if (!ctx) return;

    const w = this.canvasEl.width;
    const h = this.canvasEl.height;

    // Dark cyberpunk gamer background
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, w, h);

    // Subtle neon border
    ctx.strokeStyle = "#06b6d4";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, h - 4);

    // App header
    ctx.fillStyle = "#06b6d4";
    ctx.font = "bold 16px 'Chakra Petch', sans-serif";
    ctx.fillText("RASSOUL'S MUSIC // GAMING HUD", 24, 38);

    // Track Title
    ctx.fillStyle = "#f4f4f5";
    ctx.font = "bold 22px 'Plus Jakarta Sans', sans-serif";
    const title = (track?.title || "En attente de piste...").slice(0, 32);
    ctx.fillText(title, 24, 90);

    // Artist
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "16px 'Plus Jakarta Sans', sans-serif";
    const artist = (track?.artist || "Rassoul's music").slice(0, 36);
    ctx.fillText(artist, 24, 120);

    // Status & Hotkey Info
    ctx.fillStyle = isPlaying ? "#10b981" : "#f59e0b";
    ctx.font = "bold 14px 'JetBrains Mono', monospace";
    ctx.fillText(isPlaying ? "▶ LECTURE EN COURS" : "⏸ PAUSE", 24, 170);

    ctx.fillStyle = "#71717a";
    ctx.font = "13px 'JetBrains Mono', monospace";
    ctx.fillText("Raccourci HUD : Alt + M  |  Play/Pause : Espace", 24, 210);
    ctx.fillText("Ducking Discord : Alt + D", 24, 235);

    // Visualizer simulation bars in PiP
    if (isPlaying) {
      ctx.fillStyle = "#06b6d4";
      for (let i = 0; i < 18; i++) {
        const barH = Math.sin(Date.now() / 150 + i) * 35 + 40;
        ctx.fillRect(w - 180 + i * 8, h - 50 - barH, 5, barH);
      }
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }
}

export const pipManager = new PiPManager();
