"use client";

import React from "react";
import {
  LayoutDashboard,
  Wind,
  Leaf,
  ShieldAlert,
  BarChart2,
  ArrowLeft,
} from "lucide-react";
import { DashboardNavTab } from "../../types/dashboard";

interface DashboardSidebarProps {
  activeTab: DashboardNavTab;
  onTabChange: (tab: DashboardNavTab) => void;
  onBackToLanding: () => void;
  backendConnected?: boolean;
}

export function DashboardSidebar({
  activeTab,
  onTabChange,
  onBackToLanding,
  backendConnected = true,
}: DashboardSidebarProps) {
  const navItems: { id: DashboardNavTab; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "air_microclimate", label: "Air & Microclimate", icon: Wind },
    { id: "greenery_heat", label: "Greenery & Heat", icon: Leaf },
    { id: "forecast_risk", label: "Forecast & Risk", icon: ShieldAlert },
    { id: "area_comparison", label: "Area Comparison", icon: BarChart2 },
  ];

  return (
    <aside className="w-64 bg-[#0a1120] dark:bg-[#050b16] border-r border-slate-800/80 flex flex-col justify-between p-5 min-h-screen text-slate-200 select-none z-30 shrink-0 transition-colors duration-200">
      {/* Top Section: Brand & Nav */}
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
            <Leaf className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-lg font-extrabold text-white tracking-tight leading-tight flex items-center gap-1.5">
              <span>EcoPulse</span>
            </div>
            <div className="text-xs font-bold text-emerald-400 tracking-wide">
              Mumbai
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Footer Mission Card & Back */}
      <div className="space-y-3 pt-6 border-t border-slate-800/80">
        {/* Mission Card */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-900/90 dark:bg-[#0b1220] border border-slate-800 p-3.5 shadow-sm">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=400&q=80')",
            }}
          />
          <div className="relative z-10">
            <div className="text-xs font-bold text-white">Cleaner Mumbai</div>
            <div className="text-[11px] text-emerald-400 font-medium">Greener Tomorrow</div>

            <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-800">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    backendConnected ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    backendConnected ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
              </span>
              <span className="text-[10px] font-mono text-slate-300">
                {backendConnected ? "Backend Connected" : "Local Telemetry"}
              </span>
            </div>
          </div>
        </div>

        {/* Back to Home Button */}
        <button
          onClick={onBackToLanding}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors border border-slate-800 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
          <span>Back to Landing</span>
        </button>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
