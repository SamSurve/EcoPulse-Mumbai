"use client";

import React from "react";
import { Activity, ArrowRight, Shield } from "lucide-react";
import { AirData } from "../../types/api";

interface AQIOverviewProps {
  airData?: AirData | null;
  isLoading?: boolean;
  theme?: "light" | "dark";
}

const CPCB_BUCKETS = [
  { range: "0-50", label: "Good", color: "#10b981", bg: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400" },
  { range: "51-100", label: "Satisfactory", color: "#84cc16", bg: "bg-lime-500", text: "text-lime-700 dark:text-lime-400" },
  { range: "101-200", label: "Moderate", color: "#eab308", bg: "bg-yellow-500", text: "text-yellow-700 dark:text-yellow-400" },
  { range: "201-300", label: "Poor", color: "#f97316", bg: "bg-orange-500", text: "text-orange-700 dark:text-orange-400" },
  { range: "301-400", label: "Very Poor", color: "#ef4444", bg: "bg-red-500", text: "text-red-700 dark:text-red-400" },
  { range: "401-500", label: "Severe", color: "#7f1d1d", bg: "bg-rose-900", text: "text-rose-700 dark:text-rose-400" },
];

export function AQIOverview({ airData, isLoading = false, theme = "light" }: AQIOverviewProps) {
  const aqi = airData?.aqi ?? 100;
  const category = airData?.aqi_category || (aqi <= 50 ? "Good" : aqi <= 100 ? "Satisfactory" : aqi <= 200 ? "Moderate" : aqi <= 300 ? "Poor" : aqi <= 400 ? "Very Poor" : "Severe");
  const dominantPollutant = airData?.dominant_pollutant || "O₃";

  const clampedAqi = Math.min(Math.max(aqi, 0), 500);
  const aqiPercentage = clampedAqi / 500;
  const strokeDashoffset = 251.2 - 251.2 * aqiPercentage;

  const getActiveBucketIndex = (val: number) => {
    if (val <= 50) return 0;
    if (val <= 100) return 1;
    if (val <= 200) return 2;
    if (val <= 300) return 3;
    if (val <= 400) return 4;
    return 5;
  };

  const activeIndex = getActiveBucketIndex(clampedAqi);
  const isDark = theme === "dark";

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-sm flex flex-col justify-between space-y-4 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">AQI Overview</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">CPCB NAQI Sub-Index &bull; 6 Pollutants &bull; Real-time</p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-1">
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Meter & Legend Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* Semi-circular gauge meter */}
        <div className="relative flex flex-col items-center justify-center">
          <svg className="w-48 h-28" viewBox="0 0 200 120">
            {/* Background Arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={isDark ? "#1e293b" : "#f1f5f9"}
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Value Arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={
                activeIndex === 0
                  ? "#10b981"
                  : activeIndex === 1
                  ? "#84cc16"
                  : activeIndex === 2
                  ? "#eab308"
                  : activeIndex === 3
                  ? "#f97316"
                  : "#ef4444"
              }
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray="251.2"
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center Value */}
          <div className="absolute top-10 flex flex-col items-center text-center">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono leading-none">
              {aqi}
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
              AQI
            </span>
            <div
              className={`mt-1.5 px-3 py-0.5 rounded-full text-xs font-bold ${
                activeIndex === 0
                  ? "bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                  : activeIndex === 1
                  ? "bg-lime-100 dark:bg-lime-950/90 text-lime-800 dark:text-lime-300 border border-lime-300 dark:border-lime-700"
                  : activeIndex === 2
                  ? "bg-yellow-100 dark:bg-yellow-950/90 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700"
                  : "bg-red-100 dark:bg-red-950/90 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700"
              }`}
            >
              {category}
            </div>
          </div>

          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            Dominant Pollutant: <span className="font-bold text-slate-800 dark:text-slate-200">{dominantPollutant}</span>
          </div>
        </div>

        {/* CPCB Scales Table */}
        <div className="space-y-1 bg-slate-50 dark:bg-[#111827]/80 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
          {CPCB_BUCKETS.map((bucket, idx) => {
            const isCurrent = idx === activeIndex;
            return (
              <div
                key={idx}
                className={`flex items-center justify-between px-2 py-1 rounded-lg transition-colors ${
                  isCurrent
                    ? isDark
                      ? "bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 font-bold"
                      : "bg-emerald-100/80 border border-emerald-300 font-bold text-emerald-800"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${bucket.bg}`} />
                  <span className="font-mono text-[10px] xl:text-[11px] whitespace-nowrap text-slate-700 dark:text-slate-300">{bucket.range}</span>
                </div>
                <span className={`whitespace-nowrap text-[10px] xl:text-[11px] text-right truncate ml-1 ${isCurrent ? (isDark ? "text-emerald-300 font-bold" : "text-emerald-800 font-bold") : "text-slate-600 dark:text-slate-400"}`}>
                  {bucket.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AQIOverview;
