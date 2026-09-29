"use client";

import React from "react";
import { AirData, WeatherData, HeatData } from "../types/api";

interface OverviewCardsProps {
  air: AirData | null;
  weather: WeatherData | null;
  heat: HeatData | null;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({ air, weather, heat }) => {
  const getAqiColor = (cat: string | null | undefined) => {
    if (!cat) return "bg-slate-800 text-slate-300";
    const c = cat.toLowerCase();
    if (c.includes("good")) return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    if (c.includes("satisfactory")) return "bg-lime-500/20 text-lime-400 border border-lime-500/30";
    if (c.includes("moderate")) return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
    if (c.includes("poor") && !c.includes("very")) return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
    if (c.includes("very poor")) return "bg-rose-500/20 text-rose-400 border border-rose-500/30";
    return "bg-red-600/20 text-red-400 border border-red-500/30";
  };

  const getHeatColor = (classification: string | null | undefined) => {
    if (classification === "LOW") return "bg-emerald-500/20 text-emerald-400";
    if (classification === "EXTREME") return "bg-rose-500/20 text-rose-400";
    return "bg-amber-500/20 text-amber-400";
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400">Current Environmental Conditions</h3>
        <span className="text-[11px] text-slate-500">Auto-refreshed via Open-Meteo & CAAQM</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* AQI */}
        <div className="bg-slate-900/70 backdrop-blur-md rounded-xl p-4 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">CPCB AQI</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              {air?.provenance ? air.provenance.slice(0, 8) : "MODEL"}
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-white">{air?.aqi !== null && air?.aqi !== undefined ? air.aqi : "--"}</div>
            <div className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold ${getAqiColor(air?.aqi_category)}`}>
              {air?.aqi_category || "UNAVAILABLE"}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            Dominant: <span className="text-slate-200 font-semibold">{air?.dominant_pollutant || "--"}</span>
          </div>
        </div>

        {/* PM2.5 */}
        <div className="bg-slate-900/70 backdrop-blur-md rounded-xl p-4 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">PM2.5 Loading</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">µg/m³</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-white">{air?.pm25?.value !== null && air?.pm25?.value !== undefined ? air.pm25.value : "--"}</div>
            <div className="text-xs text-slate-400 mt-1">
              Sub-Index: <span className="text-slate-200 font-semibold">{air?.pm25?.naqi_sub_index || "--"}</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            Standard: <span className="text-slate-300 font-mono">60 µg/m³ max</span>
          </div>
        </div>

        {/* Temperature */}
        <div className="bg-slate-900/70 backdrop-blur-md rounded-xl p-4 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Temperature</span>
            <span className="text-amber-400">🌡️</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-white">{weather?.temperature_c !== null && weather?.temperature_c !== undefined ? `${weather.temperature_c.toFixed(1)}°C` : "--"}</div>
            <div className="text-xs text-slate-400 mt-1">
              Heat Index: <span className="text-amber-300 font-semibold">{weather?.apparent_temperature_c !== null && weather?.apparent_temperature_c !== undefined ? `${weather.apparent_temperature_c.toFixed(1)}°C` : "--"}</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            Humidity: <span className="text-slate-200 font-mono">{weather?.relative_humidity_pct !== null && weather?.relative_humidity_pct !== undefined ? `${weather.relative_humidity_pct}%` : "--"}</span>
          </div>
        </div>

        {/* Wind */}
        <div className="bg-slate-900/70 backdrop-blur-md rounded-xl p-4 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Wind & Dispersion</span>
            <span className="text-teal-400">💨</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-white">
              {weather?.wind_speed_kmh !== null && weather?.wind_speed_kmh !== undefined ? weather.wind_speed_kmh.toFixed(1) : "--"}{" "}
              <span className="text-sm font-normal text-slate-400">km/h</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Direction: <span className="text-slate-200 font-semibold">{weather?.wind_cardinal || "--"}</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            Ventilation: <span className="text-emerald-400 font-semibold">{weather && weather.wind_speed_kmh && weather.wind_speed_kmh >= 14 ? "Favorable" : (weather && weather.wind_speed_kmh && weather.wind_speed_kmh < 8 ? "Stagnant" : "Moderate")}</span>
          </div>
        </div>

        {/* Surface Heat */}
        <div className="bg-slate-900/70 backdrop-blur-md rounded-xl p-4 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Surface Heat Index</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">LANDSAT</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-white">
              {heat?.surface_heat_index ? `${heat.surface_heat_index.toFixed(1)}/10` : "--"}
            </div>
            <div className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold ${getHeatColor(heat?.heat_classification)}`}>
              {heat?.heat_classification || "--"}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            Built-Up Density: <span className="text-slate-200 font-mono">{heat?.built_up_ratio_pct ? `${heat.built_up_ratio_pct.toFixed(1)}%` : "--"}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
