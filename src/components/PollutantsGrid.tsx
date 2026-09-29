"use client";

import React from "react";
import { AirData } from "../types/api";

interface PollutantsGridProps {
  air: AirData | null;
}

export const PollutantsGrid: React.FC<PollutantsGridProps> = ({ air }) => {
  const pollutants = [
    { key: "pm25", name: "PM2.5", obj: air?.pm25, safe: "60 µg/m³" },
    { key: "pm10", name: "PM10", obj: air?.pm10, safe: "100 µg/m³" },
    { key: "no2", name: "NO2", obj: air?.no2, safe: "80 µg/m³" },
    { key: "so2", name: "SO2", obj: air?.so2, safe: "80 µg/m³" },
    { key: "co", name: "CO", obj: air?.co, safe: "4 mg/m³" },
    { key: "o3", name: "Ozone (O3)", obj: air?.o3, safe: "100 µg/m³" },
  ];

  return (
    <section className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400">💨</span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Pollutant Concentration Channels (CPCB Standard)</h3>
        </div>
        <span className="text-[11px] text-slate-400">Zero-Fabrication Sensor Channel Monitoring</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {pollutants.map((p) => {
          const isAvailable = p.obj && p.obj.is_available && p.obj.value !== null && p.obj.value !== undefined;
          return (
            <div key={p.key} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-slate-300">{p.name}</span>
                <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-900 text-slate-400">{p.obj?.unit || "µg/m³"}</span>
              </div>
              <div className="my-2">
                {isAvailable ? (
                  <>
                    <span className="text-xl font-black text-white">{p.obj!.value}</span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Sub-Index: <strong className="text-slate-200">{p.obj!.naqi_sub_index ?? "--"}</strong>
                    </div>
                  </>
                ) : (
                  <div className="py-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      UNAVAILABLE
                    </span>
                  </div>
                )}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {isAvailable ? `CPCB Max: ${p.safe}` : "Channel unmonitored"}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
