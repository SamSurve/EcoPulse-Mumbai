"use client";

import React from "react";
import { Location } from "../types/api";

interface HeaderProps {
  locations: Location[];
  currentLocationId: string;
  onSelectLocation: (locationId: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  locations,
  currentLocationId,
  onSelectLocation,
  onRefresh,
  isRefreshing,
  lastUpdated,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                EcoPulse <span className="text-emerald-400 font-light">Mumbai</span>
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v1.0 MVP
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Environmental Intelligence & Microclimate Analytics</p>
          </div>
        </div>

        {/* Location Dropdown & Controls */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-72">
            <select
              value={currentLocationId}
              onChange={(e) => onSelectLocation(e.target.value)}
              className="w-full pl-3 pr-10 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id} className="bg-slate-900 text-white">
                  {loc.name} ({loc.zone} - Ward {loc.ward})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              ▼
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Live Data"
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors active:scale-95 disabled:opacity-50"
          >
            <span className={isRefreshing ? "inline-block animate-spin" : ""}>🔄</span>
          </button>
        </div>

        {/* Status Indicators */}
        <div className="hidden lg:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium">Backend Live (FastAPI)</span>
          </div>
          {lastUpdated && (
            <div className="text-slate-400">
              Updated: <span className="text-slate-300 font-mono">{lastUpdated}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
