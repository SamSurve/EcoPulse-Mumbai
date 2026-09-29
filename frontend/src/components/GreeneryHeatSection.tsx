"use client";

import React from "react";
import { GreeneryData, HeatData } from "../types/api";

interface GreeneryHeatSectionProps {
  greenery: GreeneryData | null;
  heat: HeatData | null;
}

export const GreeneryHeatSection: React.FC<GreeneryHeatSectionProps> = ({ greenery, heat }) => {
  if (!greenery || !heat) return null;

  return (
    <section className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800 flex flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">🌳</span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Greenery & Heat Analysis</h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Sentinel-2 & Landsat</span>
      </div>

      <div className="space-y-4 flex-1">
        {/* NDVI */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span>🌱</span> Vegetative Vigor (NDVI 10m)
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {greenery.greenery_classification || "Vegetated"}
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <span className="text-2xl font-black text-white">{greenery.ndvi_mean != null ? greenery.ndvi_mean.toFixed(2) : "N/A"}</span>
              <span className="text-xs text-slate-400 ml-1">mean</span>
            </div>
            <div className="text-right text-xs text-slate-400">
              Tree Canopy: <span className="text-slate-200 font-semibold">{greenery.tree_canopy_pct != null ? `${greenery.tree_canopy_pct.toFixed(1)}%` : "N/A"}</span>
            </div>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(10, (greenery.ndvi_mean ?? 0) * 150))}%` }}
            ></div>
          </div>
          <div className="text-[10px] text-slate-400 mt-1.5 flex justify-between">
            <span>Sparse Built-Up (&lt;0.20)</span>
            <span>High Forest (&gt;0.50)</span>
          </div>
        </div>

        {/* Heat */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span>🔥</span> Landsat Surface Thermal Index
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
              {heat.heat_classification || "Moderate"}
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <span className="text-2xl font-black text-white">{heat.surface_heat_index != null ? heat.surface_heat_index.toFixed(1) : "N/A"}</span>
              <span className="text-xs text-slate-400 ml-1">/ 10</span>
            </div>
            <div className="text-right text-xs text-slate-400">
              Comfort: <span className="text-slate-200 font-semibold">{heat.thermal_comfort_category || "Moderate"}</span>
            </div>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${((heat.surface_heat_index ?? 0) / 10) * 100}%` }}
            ></div>
          </div>
          <div className="text-[10px] text-slate-400 mt-1.5 flex justify-between">
            <span>Low Heat (1-4)</span>
            <span>Extreme Island (&gt;8)</span>
          </div>
        </div>

        {/* Non-Causal Explanation */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
          <div className="flex items-center gap-1.5 font-semibold text-teal-400 mb-1">
            <span>ℹ️</span> Spatial Microclimate Association
          </div>
          <p>
            {greenery.interpretation} {heat.interpretation}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>5-Yr Vegetative Trend: <strong className="text-slate-200">{greenery.vegetation_change_5yr_pct != null ? `${greenery.vegetation_change_5yr_pct >= 0 ? '+' : ''}${greenery.vegetation_change_5yr_pct.toFixed(1)}%` : "N/A"}</strong></span>
        <span className="font-mono text-[10px] text-slate-400">SATELLITE_BASELINE</span>
      </div>
    </section>
  );
};
