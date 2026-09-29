"use client";

import React, { useRef, useEffect } from "react";
import { ArrowLeft, Users, Sparkles, Shield, Cpu, Leaf } from "lucide-react";

export interface AboutUsProps {
  onBack: () => void;
}

export function AboutUs({ onBack }: AboutUsProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    window.addEventListener("resize", resize);
    resize();

    // 8x8 Bayer Matrix for smooth ordered dither
    const bayer = [
      [0, 32, 8, 40, 2, 34, 10, 42],
      [48, 16, 56, 24, 50, 18, 58, 26],
      [12, 44, 4, 36, 14, 46, 6, 38],
      [60, 28, 52, 20, 62, 30, 54, 22],
      [3, 35, 11, 43, 1, 33, 9, 41],
      [51, 19, 59, 27, 49, 17, 57, 25],
      [15, 47, 7, 39, 13, 45, 5, 37],
      [63, 31, 55, 23, 61, 29, 53, 21],
    ];

    const render = () => {
      time += 0.04;
      const w = canvas.width;
      const h = canvas.height;

      // Dark emerald background
      ctx.fillStyle = "#030e0b";
      ctx.fillRect(0, 0, w, h);

      const cellSize = 6;
      const cols = Math.ceil(w / cellSize);
      const rows = Math.ceil(h / cellSize);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const cx = x * cellSize;
          const cy = y * cellSize;

          // Generative atmospheric wave pattern
          const nx = x / cols - 0.5;
          const ny = y / rows - 0.5;
          const dist = Math.sqrt(nx * nx + ny * ny);

          const wave1 = Math.sin(x * 0.08 + time + y * 0.04);
          const wave2 = Math.cos(y * 0.08 - time * 0.8 + x * 0.03);
          const wave3 = Math.sin((dist * 8) - time * 1.5);

          let luminance = (wave1 + wave2 + wave3 + 3) / 6 * 255;
          luminance += Math.sin(time + x * 0.1) * 30;
          luminance = Math.max(0, Math.min(255, luminance));

          const bayerThreshold = (bayer[y % 8][x % 8] / 64) * 255;

          if (luminance > bayerThreshold) {
            const intensity = luminance / 255;
            const r = Math.floor(16 + intensity * 20);
            const g = Math.floor(185 * intensity + 40);
            const b = Math.floor(129 * intensity + 20);

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(cx, cy, cellSize - 1, cellSize - 1);
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full bg-[#030712] text-white font-sans overflow-hidden flex flex-col justify-between"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-0" />

      {/* Top Navigation */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2.5 text-slate-200 hover:text-emerald-300 bg-slate-900/80 backdrop-blur-md px-5 py-2.5 rounded-full border border-slate-700/80 hover:border-emerald-500/50 transition-all shadow-lg hover:shadow-emerald-950/40 cursor-pointer text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2 text-emerald-400 font-semibold tracking-wider text-xs uppercase bg-emerald-950/80 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-700/50">
          <Users className="w-3.5 h-3.5" />
          <span>EcoPulse Mumbai Research Team</span>
        </div>
      </header>

      {/* Center Content */}
      <main className="relative z-20 max-w-5xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Engineering & Environmental Science
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
          Engineering the Pulse of <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Mumbai's Urban Biosphere
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed mb-12">
          EcoPulse Mumbai is a software-driven environmental intelligence platform bridging high-frequency ground CAAQMS stations, numerical Copernicus CAMS atmospheric models, and Sentinel-2 / Landsat-9 multispectral Earth observations to protect Mumbai's coastal communities.
        </p>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md hover:border-emerald-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">Zero-Fabrication Rigor</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every metric carries transparent mathematical lineage. When ground stations experience telemetry downtime, we declare data gaps explicitly rather than synthesizing ungrounded numbers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md hover:border-emerald-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">Explainable Risk Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Synthesizing air quality, thermal load, urban heat island intensity, wind ventilation, and green buffers using OECD Composite Indicator guidelines with full natural-language causality.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md hover:border-emerald-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 mb-4">
              <Leaf className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">Hyper-Local MMR Coverage</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detailed tracking across 14 municipal micro-locations spanning Western Suburbs, South Mumbai, Central Traffic Basins, and Eastern Corridors with 10m Sentinel-2 NDVI resolution.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-mono">
        <div>EcoPulse Mumbai • Built for environmental resilience & transparency</div>
        <button
          onClick={onBack}
          className="text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Return to Launch Screen &rarr;
        </button>
      </footer>
    </div>
  );
}

export default AboutUs;
