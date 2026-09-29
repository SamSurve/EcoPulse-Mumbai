"use client";

import React from "react";
import { ShieldCheck, ArrowRight, Wind, Flame, Sun, Fan, Leaf } from "lucide-react";
import { RiskData } from "../../types/api";

interface EnvironmentalRiskProps {
  riskData?: RiskData | null;
  isLoading?: boolean;
  theme?: "light" | "dark";
}

export function EnvironmentalRisk({ riskData, isLoading = false, theme = "light" }: EnvironmentalRiskProps) {
  const overallRisk = riskData?.risk_score ?? 28;
  const riskCategory =
    overallRisk <= 33 ? "Low Risk" : overallRisk <= 66 ? "Moderate Risk" : "High Risk";

  const riskFactors = [
    { label: "Air Quality", value: 30, icon: Wind, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Heat Stress", value: 25, icon: Flame, color: "text-orange-500 dark:text-orange-400" },
    { label: "Urban Heat", value: 20, icon: Sun, color: "text-amber-500 dark:text-amber-400" },
    { label: "Ventilation", value: 35, icon: Fan, color: "text-teal-600 dark:text-teal-400" },
    { label: "Green Cover", value: 15, icon: Leaf, color: "text-lime-600 dark:text-lime-400" },
  ];

  const circleCircumference = 2 * Math.PI * 45;
  const strokeDashoffset = circleCircumference - (circleCircumference * (overallRisk / 100));
  const isDark = theme === "dark";

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-sm flex flex-col justify-between space-y-4 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Environmental Risk Index
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Multi-Factor Physics-Based Risk Scoring</p>
          </div>
        </div>

        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-1">
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content: Radial Gauge + Factor Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* Radial Meter */}
        <div className="relative flex flex-col items-center justify-center">
          <svg className="w-32 h-32" viewBox="0 0 120 120">
            {/* Background Track */}
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke={isDark ? "#1e293b" : "#f1f5f9"}
              strokeWidth="10"
            />
            {/* Value Progress Arc */}
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="#10b981"
              strokeWidth="10"
              strokeDasharray={circleCircumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center Text */}
          <div className="absolute flex flex-col items-center text-center">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              {riskCategory}
            </span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono leading-none my-0.5">
              {overallRisk}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">/ 100</span>
          </div>
        </div>

        {/* Risk Factors List */}
        <div className="space-y-2 bg-slate-50 dark:bg-[#111827]/90 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
          {riskFactors.map((factor, idx) => {
            const Icon = factor.icon;
            return (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${factor.color}`} />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{factor.label}</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{factor.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default EnvironmentalRisk;
