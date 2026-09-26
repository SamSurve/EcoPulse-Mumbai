"use client";

import React, { useState, useEffect } from "react";
import { LocationMapFeature } from "../types/api";
import { apiClient } from "../services/apiClient";

interface MumbaiMapProps {
  currentLocationId: string;
  onSelectLocation: (locationId: string) => void;
}

export const MumbaiMap: React.FC<MumbaiMapProps> = ({
  currentLocationId,
  onSelectLocation,
}) => {
  const [mapFeatures, setMapFeatures] = useState<LocationMapFeature[]>([]);
  const [activeLayer, setActiveLayer] = useState<"ndvi" | "heat" | "aqi">("ndvi");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      const data = await apiClient.getMumbaiMapFeatures();
      setMapFeatures(data.locations);
    } catch (err) {
      console.error("Failed to load map features:", err);
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (loc: LocationMapFeature) => {
    if (activeLayer === "ndvi") {
      if (loc.ndvi_mean >= 0.40) return { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500" };
      if (loc.ndvi_mean >= 0.25) return { bg: "bg-cyan-500", text: "text-cyan-400", border: "border-cyan-500" };
      return { bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-500" };
    } else if (activeLayer === "heat") {
      if (loc.surface_heat_index >= 7.5) return { bg: "bg-rose-500", text: "text-rose-400", border: "border-rose-500" };
      if (loc.surface_heat_index >= 5.5) return { bg: "bg-orange-500", text: "text-orange-400", border: "border-orange-500" };
      return { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500" };
    } else {
      if (loc.aqi && loc.aqi > 200) return { bg: "bg-rose-500", text: "text-rose-400", border: "border-rose-500" };
      if (loc.aqi && loc.aqi > 100) return { bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-500" };
      return { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500" };
    }
  };

  return (
    <section id="map-section" className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">🗺️</span>
            <h3 className="text-base font-bold text-white tracking-tight">Mumbai Spatial Intelligence Map</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Explore all 14 registered micro-locations across MMR. Click any location card or pin to inspect live telemetry.
          </p>
        </div>

        {/* Layer Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Layer:</span>
          <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
            <button
              onClick={() => setActiveLayer("ndvi")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                activeLayer === "ndvi" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Vegetation (NDVI)
            </button>
            <button
              onClick={() => setActiveLayer("heat")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                activeLayer === "heat" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Surface Heat
            </button>
            <button
              onClick={() => setActiveLayer("aqi")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                activeLayer === "aqi" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Air Quality
            </button>
          </div>
        </div>
      </div>

      {/* Spatial Location Grid with Telemetry */}
      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
          Loading spatial overlay features...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {mapFeatures.map((loc) => {
            const isSelected = loc.id === currentLocationId;
            const colors = getMarkerColor(loc);

            let primaryDisplay = `NDVI: ${loc.ndvi_mean.toFixed(2)}`;
            if (activeLayer === "heat") primaryDisplay = `Heat: ${loc.surface_heat_index.toFixed(1)}/10`;
            if (activeLayer === "aqi") primaryDisplay = `AQI: ${loc.aqi || "--"}`;

            return (
              <button
                key={loc.id}
                onClick={() => onSelectLocation(loc.id)}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all group ${
                  isSelected
                    ? "bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-500/10 scale-[1.02]"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                    {loc.name}
                  </span>
                  <span className={`h-2.5 w-2.5 rounded-full ${colors.bg}`}></span>
                </div>

                <div className="text-[11px] font-mono font-semibold text-slate-300">
                  {primaryDisplay}
                </div>

                <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>Ward {loc.ward || "MMR"}</span>
                  <span className="text-slate-400 font-mono">
                    {loc.latitude.toFixed(2)}°
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-500"></span> High Greenery / Low Heat
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-cyan-500"></span> Moderate
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500"></span> Extreme Urban Heat
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">
          Source: Sentinel-2 10m & Landsat TIRS | Multi-location Synchronized
        </span>
      </div>
    </section>
  );
};
