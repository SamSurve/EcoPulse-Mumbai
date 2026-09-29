"use client";

import React from "react";
import { Thermometer, Droplets, Wind, Sun, CloudSun } from "lucide-react";
import { WeatherData } from "../../types/api";

interface WeatherMicroclimateProps {
  weatherData?: WeatherData | null;
  isLoading?: boolean;
}

export function WeatherMicroclimate({
  weatherData,
  isLoading = false,
}: WeatherMicroclimateProps) {
  const temp = weatherData?.temperature_c ?? 29.9;
  const feelsLike = weatherData?.apparent_temperature_c ?? 34.1;
  const humidity = weatherData?.relative_humidity_pct ?? 73;
  const pressure = weatherData?.surface_pressure_hpa ?? 1008.1;
  const windSpeed = weatherData?.wind_speed_kmh ?? 15;
  const windDir = weatherData?.wind_cardinal ?? "NW";
  const solarRad = weatherData?.solar_radiation_wm2 ?? 527.6;

  const weatherCards = [
    {
      label: "Temperature",
      value: `${temp.toFixed(1)}°C`,
      subtext: `Feels like ${feelsLike.toFixed(1)}°C`,
      icon: Thermometer,
      iconBg: "bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800/50 text-rose-500 dark:text-rose-400",
    },
    {
      label: "Relative Humidity",
      value: `${humidity}%`,
      subtext: `${pressure.toFixed(1)} hPa`,
      icon: Droplets,
      iconBg: "bg-blue-50 dark:bg-blue-950/70 border-blue-200 dark:border-blue-800/50 text-blue-500 dark:text-blue-400",
    },
    {
      label: "Wind Speed",
      value: `${windSpeed} km/h`,
      subtext: `${windDir} Direction`,
      icon: Wind,
      iconBg: "bg-teal-50 dark:bg-teal-950/70 border-teal-200 dark:border-teal-800/50 text-teal-500 dark:text-teal-400",
    },
    {
      label: "Solar Radiation",
      value: `${solarRad} W/m²`,
      subtext: "Solar Irradiance",
      icon: Sun,
      iconBg: "bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800/50 text-amber-500 dark:text-amber-400",
    },
  ];

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-sm flex flex-col justify-between space-y-4 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CloudSun className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Current Weather & Microclimate
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Atmospheric Sensor Lineage & ECMWF Model</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      {/* 4-Stat Grid */}
      <div className="grid grid-cols-2 gap-3">
        {weatherCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-50/80 dark:bg-[#111827]/90 border border-slate-200/70 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-start gap-3"
            >
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${card.iconBg}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono leading-tight">
                  {card.value}
                </div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight mt-0.5">
                  {card.label}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {card.subtext}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WeatherMicroclimate;
