import React, { useEffect, useRef } from "react";
import { audioEngine } from "../services/audioEngine";

interface VisualizerProps {
  isPlaying: boolean;
  barsCount?: number;
  className?: string;
  colorTheme?: "neon-cyan" | "neon-amber" | "cyber-purple" | "emerald";
}

export const Visualizer: React.FC<VisualizerProps> = ({
  isPlaying,
  barsCount = 16,
  className = "h-8",
  colorTheme = "neon-cyan"
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const themeGradients = {
    "neon-cyan": ["#06b6d4", "#3b82f6"],
    "neon-amber": ["#f59e0b", "#ef4444"],
    "cyber-purple": ["#a855f7", "#ec4899"],
    "emerald": ["#10b981", "#06b6d4"]
  };

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const freqData = audioEngine.getFrequencyData();
      const count = Math.min(barsCount, freqData.length || barsCount);
      const barWidth = (width / count) - 2;

      const colors = themeGradients[colorTheme] || themeGradients["neon-cyan"];
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[1]);

      for (let i = 0; i < count; i++) {
        let value = 4;
        if (isPlaying && freqData.length > 0) {
          const raw = freqData[i % freqData.length] || 0;
          value = Math.max(4, (raw / 255) * height);
        } else if (isPlaying) {
          value = Math.sin(Date.now() / 150 + i) * (height / 3) + (height / 2);
        }

        const x = i * (barWidth + 2);
        const y = height - value;

        ctx.fillStyle = gradient;
        // Rounded bar cap
        ctx.beginPath();
        const r = Math.min(barWidth / 2, 2);
        ctx.roundRect(x, y, Math.max(1, barWidth), Math.max(2, value), [r, r, 0, 0]);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, barsCount, colorTheme]);

  return (
    <canvas
      ref={canvasRef}
      width={barsCount * 8}
      height={36}
      className={`w-full ${className}`}
    />
  );
};
