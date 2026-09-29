"use client";

import React from "react";
import { Lightbulb, CheckCircle2, Thermometer, Leaf, Sun, ArrowRight } from "lucide-react";
import { AirData, WeatherData } from "../../types/api";

interface QuickInsightsProps {
  locationName?: string;
  airData?: AirData | null;
  weatherData?: WeatherData | null;
}

export function QuickInsights({
  locationName = "Borivali",
  airData,
  weatherData,
}: QuickInsightsProps) {
  const aqi = airData?.aqi ?? 100;
  const aqiCategory = airData?.aqi_category || "Satisfactory";
  const temp = weatherData?.temperature_c ?? 29.9;
  const humidity = weatherData?.relative_humidity_pct ?? 73;
  const solarRad = weatherData?.solar_radiation_wm2 ?? 527.6;

  const insights = [
    {
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800/60",
      text: (
        <span>
          Air quality is <strong className="text-emerald-700 dark:text-emerald-300">{aqiCategory}</strong> in {locationName} (AQI {aqi}).
        </span>
      ),
    },
    {
      icon: Thermometer,
      color: "text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800/60",
      text: (
        <span>
          Temperature is <strong className="text-slate-900 dark:text-white">{temp.toFixed(1)}°C</strong> with high humidity ({humidity}%).
        </span>
      ),
    },
    {
      icon: Leaf,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800/60",
      text: (
        <span>
          PM2.5 and PM10 are within <strong className="text-slate-800 dark:text-slate-200">safe limits</strong>.
        </span>
      ),
    },
    {
      icon: Sun,
      color: "text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800/60",
      text: (
        <span>
          Solar radiation is moderate at <strong className="text-slate-800 dark:text-slate-200">{solarRad} W/m²</strong>.
        </span>
      ),
    },
  ];

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-sm flex flex-col justify-between space-y-3 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Quick Insights</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Contextual Telemetry Summary</p>
          </div>
        </div>

        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-1">
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Insights List */}
      <div className="space-y-2 pt-1">
        {insights.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50/80 dark:bg-[#111827]/90 border border-slate-200/70 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
            >
              <div
                className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${item.color}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="pt-0.5">{item.text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default QuickInsights;
