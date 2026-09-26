"use client";

import React from "react";
import { Play, SkipForward, Wind, Droplets, Sun, Sparkles } from "lucide-react";

interface EnvironmentalHudProps {
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  onSkip: () => void;
}

export const EnvironmentalHud: React.FC<EnvironmentalHudProps> = ({
  currentTime,
  totalDuration,
  isPlaying,
  onSkip,
}) => {
  // Only show intro HUD while intro is actively playing before the white panel fully covers
  if (currentTime >= 6.8 || !isPlaying) return null;

  const progressPct = Math.min((currentTime / totalDuration) * 100, 100);

  // Subtle telemetry pill appears during 3.0s - 4.5s intelligence sensing phase
  const showTelemetry = currentTime >= 2.8 && currentTime <= 5.8;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6 sm:p-8 select-none">
      {/* Top Header during Cinematic Intro */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3 bg-slate-900/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-white/90">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-mono tracking-wider">ECOPULSE // OBSERVATION ACTIVE</span>
        </div>

        {/* Skip Intro Button */}
        <button
          onClick={onSkip}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/50 hover:bg-slate-900/80 text-white/80 hover:text-white border border-white/15 backdrop-blur-md text-xs font-medium transition cursor-pointer active:scale-95 shadow-lg"
        >
          <span>Skip Intro</span>
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center: Environmental Intelligence HUD Telemetry (Phase 3.0s - 4.5s) */}
      {showTelemetry && (
        <div className="self-center animate-fade-in transition-all duration-700 flex flex-col items-center gap-3">
          <div className="bg-slate-950/60 backdrop-blur-lg border border-emerald-500/30 rounded-2xl p-4 shadow-2xl text-white max-w-sm text-center">
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-mono mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>READING MUMBAI COASTAL BIOSPHERE</span>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10 text-left font-mono">
              <div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Wind className="w-3 h-3 text-teal-400" />
                  <span>DISPERSION</span>
                </div>
                <div className="text-xs font-bold text-white mt-0.5">14 km/h WSW</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-cyan-400" />
                  <span>HUMIDITY</span>
                </div>
                <div className="text-xs font-bold text-white mt-0.5">76% Coastal</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Sun className="w-3 h-3 text-amber-400" />
                  <span>CANOPY</span>
                </div>
                <div className="text-xs font-bold text-white mt-0.5">0.62 NDVI</div>
              </div>
            </div>
          </div>
          <div className="text-[10px] font-mono tracking-widest text-white/70 uppercase drop-shadow">
            [ Continuous Microclimate Assimilation ]
          </div>
        </div>
      )}

      {/* Bottom Progress Bar Indicator during Cinematic Intro */}
      <div className="w-full max-w-md mx-auto space-y-1.5">
        <div className="flex justify-between items-center text-[10px] font-mono text-white/75 drop-shadow">
          <span>CINEMATIC INTRO</span>
          <span>{currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s</span>
        </div>
        <div className="h-1 w-full bg-white/20 backdrop-blur-sm rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-200 transition-all duration-75"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
};
