"use client";

import React from "react";
import {
  Wind,
  CloudSun,
  Leaf,
  Sparkles,
  Database,
  Layers,
  Activity,
  Globe2,
  Cpu,
} from "lucide-react";

interface MumbaiHeroProps {
  theme?: "light" | "dark";
}

export function MumbaiHero({ theme = "light" }: MumbaiHeroProps) {
  const capabilityTags = [
    { icon: Wind, label: "Live air quality" },
    { icon: CloudSun, label: "Weather & microclimate" },
    { icon: Leaf, label: "Green cover & heat analysis" },
    { icon: Sparkles, label: "AI-powered forecasts" },
    { icon: Database, label: "Open data & satellite insights" },
  ];

  const statPills = [
    { value: "14", label: "Monitoring Locations", icon: Layers },
    { value: "Satellite", label: "Sentinel-2", icon: Globe2 },
    { value: "Real-time", label: "Open Data", icon: Activity },
    { value: "AI", label: "Forecasting", icon: Cpu },
  ];

  const isDark = theme === "dark";

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800/80 shadow-sm bg-white dark:bg-[#0b1220] transition-colors duration-200">
      {/* Authentic Mumbai Skyline Photograph with Natural Colors & Theme-Aware Gradient Mask */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-right md:bg-[center_right_5%] opacity-90 transition-opacity duration-300"
        style={{
          backgroundImage: isDark
            ? "linear-gradient(to right, #0b1220 0%, #0b1220 32%, rgba(11, 18, 32, 0.88) 46%, rgba(11, 18, 32, 0.30) 72%, rgba(11, 18, 32, 0.0) 100%), url('https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1600&q=85')"
            : "linear-gradient(to right, #ffffff 0%, #ffffff 32%, rgba(255, 255, 255, 0.88) 46%, rgba(255, 255, 255, 0.28) 72%, rgba(255, 255, 255, 0.0) 100%), url('https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1600&q=85')",
        }}
      />

      {/* Hero Content Container */}
      <div className="relative z-10 p-6 flex flex-col justify-between gap-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left: Main Title & Subtitle */}
          <div className="space-y-1.5 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              EcoPulse{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                Mumbai
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Real-time environmental intelligence for a healthier, greener Mumbai.
            </p>
          </div>

          {/* Right: Four Stat Cards with High-Contrast Emerald Icons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {statPills.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white/95 dark:bg-[#111827]/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-700/60 rounded-xl p-2.5 flex items-center gap-2.5 shadow-xs hover:border-emerald-400/60 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-700/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0 shadow-2xs">
                    <Icon className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {stat.value}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                      {stat.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom: Five Capability Feature Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {capabilityTags.map((tag, idx) => {
            const Icon = tag.icon;
            return (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 dark:bg-[#111827]/80 backdrop-blur-sm border border-slate-200/90 dark:border-slate-700/60 text-[11px] font-medium text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-white dark:hover:bg-[#111827] hover:border-emerald-300/80 transition-colors"
              >
                <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
                <span>{tag.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default MumbaiHero;
