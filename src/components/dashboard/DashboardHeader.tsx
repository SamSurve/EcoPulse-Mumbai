"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  RefreshCw,
  Sun,
  Moon,
  User,
  ChevronDown,
  Calendar,
  Layers,
} from "lucide-react";
import { Location } from "../../types/api";

interface DashboardHeaderProps {
  locations: Location[];
  selectedLocationId: string;
  onLocationChange: (locationId: string) => void;
  onSync: () => void;
  isSyncing?: boolean;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}

export function DashboardHeader({
  locations,
  selectedLocationId,
  onLocationChange,
  onSync,
  isSyncing = false,
  theme = "light",
  onToggleTheme,
}: DashboardHeaderProps) {
  const [currentDateTime, setCurrentDateTime] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      setCurrentDateTime(now.toLocaleString("en-IN", options));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentLocation = locations.find((l) => l.id === selectedLocationId) || locations[0] || {
    id: "borivali",
    name: "Borivali",
    ward: "R/Central",
  };

  return (
    <header className="w-full bg-white dark:bg-[#08121f] border-b border-slate-200/90 dark:border-slate-800/80 px-6 py-3 flex flex-wrap items-center justify-between gap-4 select-none sticky top-0 z-20 shadow-xs transition-colors duration-200">
      {/* Platform Title */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-400">
          <Layers className="w-4 h-4" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Urban Environmental Intelligence Platform
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Air Quality &bull; Microclimate &bull; Greenery &bull; Risk Analytics
          </div>
        </div>
      </div>

      {/* Controls & Badges */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Active Ward Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-slate-50 dark:bg-[#111827] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 px-3.5 py-1.5 rounded-xl text-xs text-slate-800 dark:text-slate-100 transition-all shadow-xs cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Active Ward:</span>
            <span className="font-bold text-slate-900 dark:text-white uppercase">
              {currentLocation.name} ({currentLocation.ward || currentLocation.name})
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 max-h-72 overflow-y-auto rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 shadow-xl z-50 p-1.5 space-y-0.5 animate-fadeIn">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                14 Mumbai Locations
              </div>
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => {
                    onLocationChange(loc.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left transition-colors ${
                    loc.id === selectedLocationId
                      ? "bg-emerald-600 text-white font-bold"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{loc.name}</span>
                  <span className="text-[10px] font-mono opacity-70">
                    {loc.ward || loc.zone}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live Data Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Live Data</span>
        </div>

        {/* Live Timestamp Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono">
          <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>{currentDateTime || "Tue, 29 Sep 2026 03:30:00 PM"}</span>
        </div>

        {/* Sync Button */}
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          <span>Sync</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* User Profile Avatar */}
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
