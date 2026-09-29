"use client";

import React from "react";
import { RiskData } from "../types/api";

interface RiskSectionProps {
  risk: RiskData | null;
  locationName: string;
}

export const RiskSection: React.FC<RiskSectionProps> = ({ risk, locationName }) => {
  if (!risk) return null;

  const score = risk.risk_score || 50;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;

  const getRiskColor = (level: string) => {
    if (level === "LOW") return { text: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", stroke: "text-emerald-500" };
    if (level === "MODERATE") return { text: "text-amber-400", badge: "bg-amber-500/20 text-amber-400 border border-amber-500/30", stroke: "text-amber-400" };
    if (level === "HIGH") return { text: "text-orange-400", badge: "bg-orange-500/20 text-orange-400 border border-orange-500/30", stroke: "text-orange-500" };
    return { text: "text-rose-400", badge: "bg-rose-500/20 text-rose-400 border border-rose-500/30", stroke: "text-rose-500" };
  };

  const style = getRiskColor(risk.risk_level);
  const factors = risk.contributing_factors || {
    air_quality_stress_score: 50,
    thermal_stress_score: 40,
    surface_heat_stress_score: 60,
    dispersion_stress_score: 35,
    vegetative_buffer_status: "MODERATE"
  };

  return (
    <section className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">🛡️</span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">EcoPulse Environmental Risk Engine</h3>
        </div>
        <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">
          Multi-Factor Analysis
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center flex-1">
        {/* Radial Meter & Score */}
        <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" className="text-slate-800" fill="transparent" />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className={`${style.stroke} transition-all duration-1000 ease-out`}
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold text-white tracking-tight">{score}</span>
              <span className="text-[10px] font-bold uppercase text-slate-400">Out of 100</span>
            </div>
          </div>

          <div className="mt-2.5">
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${style.badge}`}>
              {risk.risk_level} RISK
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Primary Stressor: <br />
            <span className="text-slate-200 font-semibold">{risk.primary_stressor}</span>
          </div>
        </div>

        {/* Contributing Factors */}
        <div className="md:col-span-7 space-y-3">
          <div className="text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
            <span>Contributing Physical Stressors</span>
            <span className="text-[10px] text-slate-400">Component Weight</span>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Air Pollution (PM2.5, AQI)</span>
              <span className="font-mono text-slate-300">{factors.air_quality_stress_score != null ? `${factors.air_quality_stress_score.toFixed(0)}/100` : "N/A"}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${factors.air_quality_stress_score ?? 0}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Thermal Heat Load</span>
              <span className="font-mono text-slate-300">{factors.thermal_stress_score != null ? `${factors.thermal_stress_score.toFixed(0)}/100` : "N/A"}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-rose-400 h-full rounded-full transition-all duration-500" style={{ width: `${factors.thermal_stress_score ?? 0}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Built-Up Surface Heat Retention</span>
              <span className="font-mono text-slate-300">{factors.surface_heat_stress_score != null ? `${factors.surface_heat_stress_score.toFixed(0)}/100` : "N/A"}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-orange-400 h-full rounded-full transition-all duration-500" style={{ width: `${factors.surface_heat_stress_score ?? 0}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Atmospheric Stagnation Penalty</span>
              <span className="font-mono text-slate-300">{factors.dispersion_stress_score != null ? `${factors.dispersion_stress_score.toFixed(0)}/100` : "N/A"}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-cyan-400 h-full rounded-full transition-all duration-500" style={{ width: `${factors.dispersion_stress_score ?? 0}%` }}></div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800/80">
            <span className="text-slate-400">Vegetative Cooling Offset:</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              {factors.vegetative_buffer_status || "MODERATE"}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Explanation */}
      <div className="mt-4 pt-4 border-t border-slate-800/80">
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs leading-relaxed text-slate-300">
          <span className="font-semibold text-emerald-400 block mb-1">Explainable Reasoning:</span>
          <p>{risk.explanation}</p>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 italic">
          Disclaimer: Application-level environmental risk indicator. Not an official CPCB/BMC or medical risk classification.
        </p>
      </div>
    </section>
  );
};
