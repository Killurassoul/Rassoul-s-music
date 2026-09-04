import React, { useState, useRef, useMemo } from "react";
import { getTrackWaveform } from "../utils/waveform";

interface SoundCloudWaveformProps {
  trackId: string;
  currentTime: number;
  duration: number;
  isPlaying?: boolean;
  onSeek: (seconds: number) => void;
  height?: number;
  barsCount?: number;
  className?: string;
  showHoverTime?: boolean;
}

export const SoundCloudWaveform: React.FC<SoundCloudWaveformProps> = ({
  trackId,
  currentTime,
  duration,
  isPlaying = false,
  onSeek,
  height = 36,
  barsCount = 65,
  className = "",
  showHoverTime = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);

  const bars = useMemo(() => {
    return getTrackWaveform(trackId, barsCount);
  }, [trackId, barsCount]);

  const progressPercent = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || duration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHoverPercent(Math.max(0, Math.min(1, x / rect.width)));
  };

  const handleMouseLeave = () => {
    setHoverPercent(null);
  };

  const formatSecs = (s: number) => {
    if (isNaN(s) || s < 0) return "0:00";
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ height: `${height}px` }}
      className={`relative w-full flex items-center justify-between gap-[2px] cursor-pointer select-none group py-1 ${className}`}
      title="Cliquer pour naviguer dans le morceau"
    >
      {bars.map((barHeight, idx) => {
        const barRatio = idx / bars.length;
        const isPassed = barRatio <= progressPercent;
        const isHovered = hoverPercent !== null && barRatio <= hoverPercent;

        // SoundCloud dynamic height
        const actualHeight = Math.max(15, barHeight);

        return (
          <div
            key={idx}
            className="flex-1 flex items-center justify-center h-full relative"
          >
            <div
              style={{
                height: `${actualHeight}%`,
              }}
              className={`w-full max-w-[3px] rounded-full transition-all duration-75 ${
                isPassed
                  ? "bg-gradient-to-t from-orange-600 to-orange-400 shadow-[0_0_8px_rgba(255,85,0,0.5)]"
                  : isHovered
                  ? "bg-orange-400/60"
                  : "bg-zinc-700/80 group-hover:bg-zinc-600"
              }`}
            />
          </div>
        );
      })}

      {/* Hover timestamp popup like SoundCloud */}
      {showHoverTime && hoverPercent !== null && duration > 0 && (
        <div
          style={{ left: `${hoverPercent * 100}%` }}
          className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded bg-zinc-900 border border-orange-500/40 text-[11px] font-mono text-orange-400 shadow-xl pointer-events-none z-30"
        >
          {formatSecs(hoverPercent * duration)}
        </div>
      )}

      {/* Animated playhead pulse when playing */}
      {isPlaying && (
        <div
          style={{ left: `${progressPercent * 100}%` }}
          className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_#ff5500] pointer-events-none -translate-x-1/2"
        />
      )}
    </div>
  );
};
