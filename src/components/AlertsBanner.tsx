"use client";

import React from "react";
import { AlertItem } from "../types/api";

interface AlertsBannerProps {
  alerts: AlertItem[];
}

export const AlertsBanner: React.FC<AlertsBannerProps> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5">
        <span className="text-base">✓</span>
        <span>
          <strong>Nominal Conditions:</strong> No active environmental warnings or critical anomalies detected for this area.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {alerts.map((alert) => {
        const isCritical = alert.severity === "CRITICAL";
        const badgeColor = isCritical
          ? "bg-rose-500/20 border-rose-500/30 text-rose-300"
          : alert.severity === "WARNING"
          ? "bg-amber-500/20 border-amber-500/30 text-amber-300"
          : "bg-cyan-500/20 border-cyan-500/30 text-cyan-300";

        return (
          <div
            key={alert.id}
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${badgeColor}`}
          >
            <span className="text-base mt-0.5">{isCritical ? "🚨" : "⚠️"}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between font-bold text-white mb-0.5">
                <span>{alert.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 uppercase">
                  {alert.severity}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">{alert.message}</p>
              <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-3">
                <span>
                  <strong>Reason:</strong> {alert.reason}
                </span>
                <span>•</span>
                <span>
                  <strong>Affected:</strong> {alert.affected_metric}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
