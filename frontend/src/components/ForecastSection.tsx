"use client";

import React, { useState } from "react";
import { ForecastData } from "../types/api";

interface ForecastSectionProps {
  forecast: ForecastData | null;
}

export const ForecastSection: React.FC<ForecastSectionProps> = ({ forecast }) => {
  const [activeTab, setActiveTab] = useState<"temp" | "pm25" | "wind">("temp");

  if (!forecast) return null;

  return (
    <section className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">📅</span>
            <h3 className="text-base font-bold text-white tracking-tight">72-Hour Environmental & Atmospheric Forecast</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 uppercase">
              FORECAST
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">{forecast.trend_summary}</p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("temp")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${activeTab === "temp" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            Temperature
          </button>
          <button
            onClick={() => setActiveTab("pm25")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${activeTab === "pm25" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            PM2.5
          </button>
          <button
            onClick={() => setActiveTab("wind")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${activeTab === "wind" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            Wind Speed
          </button>
        </div>
      </div>

      {/* Hourly Timeline Mini-Bar Visualization */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-end gap-1.5 h-36 min-w-[700px] border-b border-slate-800/80 px-2">
          {forecast.hourly.filter((_, idx) => idx % 2 === 0).map((pt, i) => {
            const timeStr = pt.time.split("T")[1] || pt.time;
            const dateStr = pt.time.split("T")[0];
            const isNoon = timeStr.startsWith("12");

            let heightPct = 50;
            let displayVal = `${pt.temperature_c?.toFixed(0)}°`;
            let barColor = "bg-emerald-500";

            if (activeTab === "temp") {
              const t = pt.temperature_c || 30;
              heightPct = Math.max(15, Math.min(100, (t - 22) * 6));
              displayVal = `${t.toFixed(0)}°`;
              barColor = t > 34 ? "bg-rose-500" : (t > 30 ? "bg-amber-500" : "bg-emerald-500");
            } else if (activeTab === "pm25") {
              const p = pt.pm25 || 35;
              heightPct = Math.max(15, Math.min(100, (p / 80) * 100));
              displayVal = `${p.toFixed(0)}`;
              barColor = p > 60 ? "bg-rose-500" : (p > 35 ? "bg-amber-500" : "bg-emerald-500");
            } else {
              const w = pt.wind_speed_kmh || 12;
              heightPct = Math.max(15, Math.min(100, (w / 25) * 100));
              displayVal = `${w.toFixed(0)}`;
              barColor = "bg-cyan-500";
            }

            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end group h-full">
                <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-mono">
                  {displayVal}
                </span>
                <div
                  className={`w-full rounded-t ${barColor} opacity-75 group-hover:opacity-100 transition-all`}
                  style={{ height: `${heightPct}%` }}
                ></div>
                <span className={`text-[9px] mt-1 font-mono ${isNoon ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                  {timeStr.slice(0, 2)}h
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3 Daily Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-5 pt-5 border-t border-slate-800">
        {forecast.daily.map((day, idx) => (
          <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-white">{day.date}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-emerald-300 border border-slate-700">
                {day.dominant_condition || "Normal"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300 my-1">
              <span>Temp: <strong>{day.temp_min_c?.toFixed(1)}°C - {day.temp_max_c?.toFixed(1)}°C</strong></span>
              <span>Rain: <strong>{day.precipitation_sum_mm?.toFixed(1) || 0} mm</strong></span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
              <span>Avg PM2.5: <strong className="text-slate-200">{day.avg_pm25 || "--"} µg/m³</strong></span>
              <span className="text-amber-400 font-semibold">{day.predicted_aqi_category || "Moderate"}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
