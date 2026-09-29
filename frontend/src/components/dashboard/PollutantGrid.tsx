"use client";

import React from "react";
import { Activity, Droplets, Sun, Wind, Flame, CheckCircle2 } from "lucide-react";
import { AirData, PollutantDetail } from "../../types/api";

interface PollutantGridProps {
  airData?: AirData | null;
  isLoading?: boolean;
}

interface PollutantDisplayConfig {
  key: string;
  name: string;
  chemical: string;
  standardLimit: string;
  defaultVal: number;
  unit: string;
  defaultSubIndex: number;
  iconBg: string;
  icon: React.ElementType;
}

const POLLUTANT_CONFIGS: PollutantDisplayConfig[] = [
  {
    key: "pm25",
    name: "PM2.5",
    chemical: "Fine Particulate Matter",
    standardLimit: "CPCB: 60 µg/m³ (24h)",
    defaultVal: 19.8,
    unit: "µg/m³",
    defaultSubIndex: 33,
    iconBg: "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400",
    icon: Droplets,
  },
  {
    key: "pm10",
    name: "PM10",
    chemical: "Coarse Particulate Matter",
    standardLimit: "CPCB: 100 µg/m³ (24h)",
    defaultVal: 28.6,
    unit: "µg/m³",
    defaultSubIndex: 29,
    iconBg: "bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400",
    icon: Sun,
  },
  {
    key: "no2",
    name: "NO₂",
    chemical: "Nitrogen Dioxide",
    standardLimit: "CPCB: 80 µg/m³ (24h)",
    defaultVal: 6.5,
    unit: "µg/m³",
    defaultSubIndex: 8,
    iconBg: "bg-blue-50 dark:bg-blue-950/70 border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400",
    icon: Wind,
  },
  {
    key: "so2",
    name: "SO₂",
    chemical: "Sulphur Dioxide",
    standardLimit: "CPCB: 80 µg/m³ (24h)",
    defaultVal: 6.0,
    unit: "µg/m³",
    defaultSubIndex: 8,
    iconBg: "bg-purple-50 dark:bg-purple-950/70 border-purple-200 dark:border-purple-800/60 text-purple-600 dark:text-purple-400",
    icon: Flame,
  },
  {
    key: "co",
    name: "CO",
    chemical: "Carbon Monoxide",
    standardLimit: "CPCB: 2 mg/m³ (8h)",
    defaultVal: 0.25,
    unit: "mg/m³",
    defaultSubIndex: 12,
    iconBg: "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300",
    icon: Activity,
  },
  {
    key: "o3",
    name: "O₃",
    chemical: "Ozone",
    standardLimit: "CPCB: 100 µg/m³ (8h)",
    defaultVal: 100.0,
    unit: "µg/m³",
    defaultSubIndex: 100,
    iconBg: "bg-orange-50 dark:bg-orange-950/70 border-orange-200 dark:border-orange-800/60 text-orange-600 dark:text-orange-400",
    icon: Sun,
  },
];

export function PollutantGrid({ airData, isLoading = false }: PollutantGridProps) {
  const getPollutantDetail = (key: string): PollutantDetail | undefined => {
    if (!airData) return undefined;
    return (airData as any)[key] as PollutantDetail | undefined;
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-sm space-y-4 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Key Pollutant Levels (CPCB Standards)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Real-time Sensor Telemetry & NAQI Sub-Indices</p>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span>6 of 6 Parameters</span> &bull; <span className="text-emerald-600 dark:text-emerald-400 font-medium">Updated just now</span>
        </div>
      </div>

      {/* 6 Pollutant Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {POLLUTANT_CONFIGS.map((config) => {
          const detail = getPollutantDetail(config.key);
          const value = detail?.value ?? config.defaultVal;
          const subIndex = detail?.naqi_sub_index ?? config.defaultSubIndex;
          const unit = detail?.unit || config.unit;
          const category = detail?.category || (subIndex <= 50 ? "Good" : subIndex <= 100 ? "Satisfactory" : "Moderate");
          const Icon = config.icon;

          const isGood = subIndex <= 50;
          const isSatisfactory = subIndex > 50 && subIndex <= 100;

          return (
            <div
              key={config.key}
              className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#111827]/90 border border-slate-200/70 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-2.5"
            >
              {/* Top Row: Icon + Name + Limit */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${config.iconBg}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{config.name}</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{config.standardLimit}</span>
              </div>

              {/* Middle Row: Big Value + Sub-index */}
              <div className="flex items-baseline justify-between pt-0.5">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                    {value.toFixed(value < 1 ? 2 : 1)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{unit}</span>
                </div>

                <div className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono text-emerald-700 dark:text-emerald-300">
                  Sub-Index: <span className="font-bold">{subIndex}</span>
                </div>
              </div>

              {/* Bottom Row: Category Badge + Sparkline SVG */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
                <div
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                    isGood
                      ? "text-emerald-700 dark:text-emerald-400"
                      : isSatisfactory
                      ? "text-lime-700 dark:text-lime-400"
                      : "text-amber-700 dark:text-amber-400"
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{category}</span>
                </div>

                {/* Micro Sparkline */}
                <svg className="w-20 h-5" viewBox="0 0 100 24">
                  <path
                    d="M 0 16 Q 20 8, 40 14 T 80 6 T 100 12"
                    fill="none"
                    stroke={isGood ? "#10b981" : isSatisfactory ? "#84cc16" : "#eab308"}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="100"
                    cy="12"
                    r="2.5"
                    fill={isGood ? "#10b981" : isSatisfactory ? "#84cc16" : "#eab308"}
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PollutantGrid;
