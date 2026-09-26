"use client";

import React, { useState, useEffect } from "react";
import { Location, AreaComparisonResponse } from "../types/api";
import { apiClient } from "../services/apiClient";

interface AreaComparisonProps {
  locations: Location[];
}

export const AreaComparison: React.FC<AreaComparisonProps> = ({ locations }) => {
  const [locA, setLocA] = useState("borivali");
  const [locB, setLocB] = useState("andheri");
  const [comparison, setComparison] = useState<AreaComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (locA && locB && locA !== locB) {
      loadComparison();
    }
  }, [locA, locB]);

  const loadComparison = async () => {
    setLoading(true);
    try {
      const data = await apiClient.compareLocations(locA, locB);
      setComparison(data);
    } catch (err) {
      console.error("Comparison load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const swap = () => {
    const temp = locA;
    setLocA(locB);
    setLocB(temp);
  };

  return (
    <section id="comparison-section" className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="text-teal-400">⚖️</span>
          <h3 className="text-base font-bold text-white tracking-tight">Cross-Area Environmental Comparison Engine</h3>
        </div>
        <span className="text-xs text-slate-400">Comparative Spatial Variance</span>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mb-6">
        <div className="md:col-span-5">
          <label className="block text-xs font-semibold text-slate-400 mb-1">Location A</label>
          <select
            value={locA}
            onChange={(e) => setLocA(e.target.value)}
            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-medium"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} (Ward {l.ward})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 text-center flex items-center justify-center">
          <button
            onClick={swap}
            title="Swap Locations"
            className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 transition"
          >
            ⇄
          </button>
        </div>

        <div className="md:col-span-5">
          <label className="block text-xs font-semibold text-slate-400 mb-1">Location B</label>
          <select
            value={locB}
            onChange={(e) => setLocB(e.target.value)}
            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-medium"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} (Ward {l.ward})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3 font-semibold">Metric</th>
                  <th className="py-2.5 px-3 font-semibold text-white">{comparison.location_a.location_name}</th>
                  <th className="py-2.5 px-3 font-semibold text-white">{comparison.location_b.location_name}</th>
                  <th className="py-2.5 px-3 font-semibold text-teal-400">Differential (A - B)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                <tr className="hover:bg-slate-900/40 transition">
                  <td className="py-2.5 px-3 font-sans text-slate-300 font-medium">Vegetative Vigor (NDVI)</td>
                  <td className="py-2.5 px-3 text-slate-100">{comparison.location_a.ndvi_mean?.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-slate-100">{comparison.location_b.ndvi_mean?.toFixed(2)}</td>
                  <td className="py-2.5 px-3 font-bold text-teal-400">
                    {comparison.differentials.ndvi_delta >= 0 ? "+" : ""}
                    {comparison.differentials.ndvi_delta.toFixed(2)}
                  </td>
                </tr>
                <tr className="hover:bg-slate-900/40 transition">
                  <td className="py-2.5 px-3 font-sans text-slate-300 font-medium">Tree Canopy Cover</td>
                  <td className="py-2.5 px-3 text-slate-100">{comparison.location_a.tree_canopy_pct?.toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-slate-100">{comparison.location_b.tree_canopy_pct?.toFixed(1)}%</td>
                  <td className="py-2.5 px-3 font-bold text-teal-400">
                    {comparison.differentials.canopy_pct_delta >= 0 ? "+" : ""}
                    {comparison.differentials.canopy_pct_delta.toFixed(1)}%
                  </td>
                </tr>
                <tr className="hover:bg-slate-900/40 transition">
                  <td className="py-2.5 px-3 font-sans text-slate-300 font-medium">Built-Up Impervious Ratio</td>
                  <td className="py-2.5 px-3 text-slate-100">{comparison.location_a.built_up_ratio_pct?.toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-slate-100">{comparison.location_b.built_up_ratio_pct?.toFixed(1)}%</td>
                  <td className="py-2.5 px-3 font-bold text-teal-400">
                    {comparison.differentials.built_up_pct_delta >= 0 ? "+" : ""}
                    {comparison.differentials.built_up_pct_delta.toFixed(1)}%
                  </td>
                </tr>
                <tr className="hover:bg-slate-900/40 transition">
                  <td className="py-2.5 px-3 font-sans text-slate-300 font-medium">Surface Heat Index</td>
                  <td className="py-2.5 px-3 text-slate-100">{comparison.location_a.surface_heat_index?.toFixed(1)}/10</td>
                  <td className="py-2.5 px-3 text-slate-100">{comparison.location_b.surface_heat_index?.toFixed(1)}/10</td>
                  <td className="py-2.5 px-3 font-bold text-teal-400">
                    {comparison.differentials.surface_heat_index_delta >= 0 ? "+" : ""}
                    {comparison.differentials.surface_heat_index_delta.toFixed(1)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-semibold text-teal-400 block mb-1">Scientifically Defensible Interpretation:</span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{comparison.interpretation}</p>
          </div>
        </div>
      )}
    </section>
  );
};
