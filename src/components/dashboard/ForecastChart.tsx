"use client";

import React, { useState } from "react";
import { BarChart3, ChevronDown, Check } from "lucide-react";
import { ForecastData } from "../../types/api";

interface ForecastChartProps {
  forecastData?: ForecastData | null;
  isLoading?: boolean;
  theme?: "light" | "dark";
}

export function ForecastChart({ forecastData, isLoading = false, theme = "light" }: ForecastChartProps) {
  const [selectedWindow, setSelectedWindow] = useState<"24h" | "48h" | "72h">("72h");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isDark = theme === "dark";

  // Full 72-Hour trajectory dataset
  const allTimeLabels = [
    { time: "Now", date: "Sep 29" },
    { time: "6 PM", date: "" },
    { time: "12 AM", date: "" },
    { time: "6 AM", date: "Sep 30" },
    { time: "12 PM", date: "" },
    { time: "6 PM", date: "" },
    { time: "12 AM", date: "Oct 01" },
    { time: "6 AM", date: "" },
    { time: "12 PM", date: "" },
  ];

  const allAqiValues = [95, 110, 85, 100, 140, 105, 115, 95, 120];
  const allTempValues = [28.5, 25.2, 23.4, 27.0, 34.2, 31.0, 24.5, 29.1, 33.0];
  const allHumidityValues = [78, 85, 90, 82, 60, 68, 88, 75, 62];

  // Slice data based on selected window
  const sliceCount = selectedWindow === "24h" ? 4 : selectedWindow === "48h" ? 6 : 9;
  const timeLabels = allTimeLabels.slice(0, sliceCount);
  const aqiValues = allAqiValues.slice(0, sliceCount);
  const tempValues = allTempValues.slice(0, sliceCount);
  const humidityValues = allHumidityValues.slice(0, sliceCount);

  // SVG Chart Dimensions
  const svgWidth = 650;
  const svgHeight = 230;
  const paddingX = 42;
  const paddingY = 24;
  const bottomAxisY = svgHeight - 34;

  const getX = (idx: number) =>
    paddingX + (idx / Math.max(timeLabels.length - 1, 1)) * (svgWidth - 2 * paddingX);

  // AQI mapped to 0-300
  const getAqiY = (val: number) =>
    bottomAxisY - (val / 300) * (bottomAxisY - paddingY);

  // Temp mapped to 0-45°C
  const getTempY = (val: number) =>
    bottomAxisY - (val / 45) * (bottomAxisY - paddingY);

  // Humidity mapped to 0-100%
  const getHumY = (val: number) =>
    bottomAxisY - (val / 100) * (bottomAxisY - paddingY);

  // Smooth SVG Path Generation (Curved Line)
  const createCurvedPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx},${p0.y} ${cx},${p1.y} ${p1.x},${p1.y}`;
    }
    return d;
  };

  const aqiPoints = aqiValues.map((v, i) => ({ x: getX(i), y: getAqiY(v) }));
  const tempPoints = tempValues.map((v, i) => ({ x: getX(i), y: getTempY(v) }));
  const humPoints = humidityValues.map((v, i) => ({ x: getX(i), y: getHumY(v) }));

  const aqiLineD = createCurvedPath(aqiPoints);
  const aqiAreaD = `${aqiLineD} L ${getX(aqiValues.length - 1)},${bottomAxisY} L ${getX(0)},${bottomAxisY} Z`;
  const tempLineD = createCurvedPath(tempPoints);
  const humLineD = createCurvedPath(humPoints);

  const windowOptions = [
    { key: "24h", label: "Next 24 Hours" },
    { key: "48h", label: "Next 48 Hours" },
    { key: "72h", label: "Next 72 Hours" },
  ];

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-sm flex flex-col justify-between space-y-4 h-full transition-colors duration-200">
      {/* Header & Interactive Window Dropdown */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              72-Hour Forecast (AQI & Weather)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Diurnal Trajectory Simulation & ECMWF Reanalysis</p>
          </div>
        </div>

        {/* Dropdown Selector */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#111827] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
          >
            <span>{windowOptions.find((o) => o.key === selectedWindow)?.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-40 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 shadow-lg z-30 p-1 space-y-0.5 animate-fadeIn">
              {windowOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setSelectedWindow(opt.key as any);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                    selectedWindow === opt.key
                      ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{opt.label}</span>
                  {selectedWindow === opt.key && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend Badges */}
      <div className="flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
          <span>AQI</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800/60 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
          <span>Temperature (&deg;C)</span>
        </div>
        <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300 bg-sky-50/80 dark:bg-sky-950/60 px-2.5 py-1 rounded-lg border border-sky-200/60 dark:border-sky-800/60 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-xs" />
          <span>Humidity (%)</span>
        </div>
      </div>

      {/* Expanded SVG Responsive Multi-Series Chart */}
      <div className="relative w-full flex-grow flex items-center overflow-x-auto min-h-[190px]">
        <svg
          className="w-full h-56 min-w-[500px]"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="aqiAreaGradEnhanced" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.30" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines (Left Y-Axis: AQI 0, 100, 200, 300) */}
          {[0, 100, 200, 300].map((val) => {
            const y = getAqiY(val);
            return (
              <g key={val}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke={isDark ? "#1e293b" : "#e2e8f0"}
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3.5}
                  fill={isDark ? "#64748b" : "#94a3b8"}
                  fontSize="9.5"
                  fontFamily="monospace"
                  textAnchor="end"
                  fontWeight="600"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Right Y-Axis Labels for Temperature (10°C, 20°C, 30°C, 40°C) */}
          {[10, 20, 30, 40].map((tVal) => {
            const y = getTempY(tVal);
            return (
              <text
                key={tVal}
                x={svgWidth - paddingX + 8}
                y={y + 3.5}
                fill={isDark ? "#fbbf24" : "#d97706"}
                fontSize="9.5"
                fontFamily="monospace"
                textAnchor="start"
                fontWeight="600"
              >
                {tVal}
              </text>
            );
          })}

          {/* AQI Area Gradient */}
          <path d={aqiAreaD} fill="url(#aqiAreaGradEnhanced)" />

          {/* Humidity Line (Sky Blue - Dashed) */}
          <path
            d={humLineD}
            fill="none"
            stroke="#0284c7"
            strokeWidth="2.2"
            strokeDasharray="4 3"
          />
          {humPoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="3.5"
              fill="#0284c7"
              stroke={isDark ? "#0b1220" : "#ffffff"}
              strokeWidth="1.5"
            />
          ))}

          {/* Temperature Line (Amber/Orange - Solid) */}
          <path d={tempLineD} fill="none" stroke="#f59e0b" strokeWidth="2.4" />
          {tempPoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#f59e0b"
              stroke={isDark ? "#0b1220" : "#ffffff"}
              strokeWidth="1.5"
            />
          ))}

          {/* AQI Line (Emerald Green - Thick Solid) */}
          <path d={aqiLineD} fill="none" stroke="#10b981" strokeWidth="2.8" />
          {aqiPoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="4.5"
              fill="#10b981"
              stroke={isDark ? "#0b1220" : "#ffffff"}
              strokeWidth="2"
            />
          ))}

          {/* Timeline Bottom Axis Labels */}
          {timeLabels.map((item, idx) => {
            const x = getX(idx);
            return (
              <g key={idx} transform={`translate(${x}, ${bottomAxisY + 14})`}>
                <text
                  x="0"
                  y="0"
                  fill={isDark ? "#cbd5e1" : "#475569"}
                  fontSize="9.5"
                  fontFamily="sans-serif"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {item.time}
                </text>
                {item.date && (
                  <text
                    x="0"
                    y="11"
                    fill={isDark ? "#64748b" : "#94a3b8"}
                    fontSize="8.5"
                    fontFamily="sans-serif"
                    fontWeight="500"
                    textAnchor="middle"
                  >
                    {item.date}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default ForecastChart;
