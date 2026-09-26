"use client";

import React from "react";
import { ArrowRight, Compass, BarChart3, Wind, ShieldCheck, RefreshCw } from "lucide-react";

interface RisingWhitePanelProps {
  /** Progress of panel rising from 0.0 (fully hidden at bottom) to 1.0 (fully risen) */
  riseProgress: number;
  /** Progress of typography reveal from 0.0 to 1.0 (occurring from 7.2s to 8.0s) */
  revealProgress: number;
  /** Callback when user clicks 'GET STARTED' */
  onGetStarted: () => void;
  /** Callback to replay the 8s cinematic sequence */
  onReplay: () => void;
}

export const RisingWhitePanel: React.FC<RisingWhitePanelProps> = ({
  riseProgress,
  revealProgress,
  onGetStarted,
  onReplay,
}) => {
  // Smooth cubic bezier easing for physical panel rise
  const easeRise = (t: number) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const eased = easeRise(Math.min(Math.max(riseProgress, 0), 1));
  // At eased = 0, panel is 100% translated down (off screen)
  // At eased = 1, panel settles at top-offset, leaving sky peek at the top
  const translateYPercent = (1 - eased) * 105;

  // Reveal progress easing for typography
  const textOpacity = Math.min(Math.max(revealProgress, 0), 1);
  const textTranslateY = (1 - textOpacity) * 24;

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-20 pointer-events-auto flex flex-col justify-end"
      style={{
        transform: `translateY(${translateYPercent}%)`,
        transition: riseProgress === 1 ? "none" : undefined,
        willChange: "transform",
      }}
    >
      {/* Physical Off-White Panel Container */}
      <div className="relative w-full bg-[#FAFBFD] text-slate-900 rounded-t-[32px] sm:rounded-t-[40px] shadow-[0_-25px_60px_-12px_rgba(15,23,42,0.35)] border-t border-slate-200/90 overflow-hidden">
        {/* Fine Architectural Emerald Accent Line on the Top Ridge */}
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-emerald-600/90 to-transparent" />

        {/* Ambient Top Pull Handle / Indicator */}
        <div className="pt-3.5 pb-1 flex justify-center">
          <div className="w-12 h-1 rounded-full bg-slate-300/80" />
        </div>

        {/* Inner Content Area */}
        <div
          className="max-w-7xl mx-auto px-6 lg:px-12 pt-4 pb-10 sm:pb-14 transition-opacity duration-300"
          style={{
            opacity: textOpacity,
            transform: `translateY(${textTranslateY}px)`,
          }}
        >
          {/* Top Brand Bar & Secondary Replay Action */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-200/70">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                MUMBAI ENVIRONMENTAL INTELLIGENCE ENGINE
              </span>
            </div>

            <button
              onClick={onReplay}
              title="Replay cinematic intro"
              className="group inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-emerald-700 transition px-2.5 py-1 rounded-md hover:bg-slate-100"
            >
              <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
              <span>Replay Intro</span>
            </button>
          </div>

          {/* Master Hero Typography: ECOPULSE */}
          <div className="mt-8 sm:mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8 space-y-4">
              <div className="space-y-1">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-950 font-sans">
                  ECOPULSE
                </h1>
                <p className="text-lg sm:text-2xl font-light text-slate-700 tracking-tight">
                  Environmental Intelligence for{" "}
                  <span className="font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-4">
                    Mumbai
                  </span>
                </p>
              </div>

              <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                A living observational platform unifying CAMS atmospheric modeling,
                Sentinel-2 satellite vegetative vigor, microclimate heat anomalies, and 72-hour
                explainable environmental risk across 14 Mumbai micro-neighborhoods.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3.5">
                {/* Signature GET STARTED Button */}
                <button
                  onClick={onGetStarted}
                  className="group relative inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-slate-950 hover:bg-emerald-700 shadow-md hover:shadow-xl hover:shadow-emerald-900/20 active:scale-98 transition-all duration-200"
                >
                  <span>GET STARTED</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>

                {/* Secondary Fast Action Buttons */}
                <a
                  href="#map-section"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-medium text-xs text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition"
                >
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>Interactive Map</span>
                </a>

                <a
                  href="#comparison-section"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-medium text-xs text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition"
                >
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>Compare Areas</span>
                </a>
              </div>
            </div>

            {/* Environmental Intelligence Pulse Micro-Cards */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3 pt-4 lg:pt-0">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <Wind className="w-4 h-4 text-emerald-600" />
                  <span className="text-[10px] font-mono text-slate-400">AIR DISPERSION</span>
                </div>
                <div className="mt-2">
                  <div className="text-xl font-black text-slate-900">SW 14 km/h</div>
                  <div className="text-[11px] text-emerald-700 font-medium">Arabian Sea Inflow</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-[10px] font-mono text-slate-400">COVERAGE</span>
                </div>
                <div className="mt-2">
                  <div className="text-xl font-black text-slate-900">14 Wards</div>
                  <div className="text-[11px] text-slate-600 font-medium">MMR Full Grid</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust & Provenance Micro Ticker */}
          <div className="mt-8 pt-5 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500 font-mono">
            <div className="flex items-center gap-4">
              <span>● COPERNICUS SENTINEL-2</span>
              <span>● LANDSAT-8/9 TIRS</span>
              <span>● CPCB NAQI STANDARD</span>
            </div>
            <div className="text-slate-400">
              CONTINUOUS 2.5D ENVIRONMENTAL MONITORING
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
