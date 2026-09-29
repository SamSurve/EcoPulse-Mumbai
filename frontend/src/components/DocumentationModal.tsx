"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Activity,
  Leaf,
  ShieldAlert,
  Database,
  Cpu,
  CheckCircle2,
  Globe,
  Layers,
  Sparkles,
} from "lucide-react";

export interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchDashboard: () => void;
}

type DocSection = "overview" | "features" | "provenance" | "architecture";

export function DocumentationModal({
  isOpen,
  onClose,
  onLaunchDashboard,
}: DocumentationModalProps) {
  const [activeSection, setActiveSection] = useState<DocSection>("overview");

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Modal Container */}
      <div
        className="relative w-full max-w-4xl max-h-[85vh] bg-[#030e0b] border border-emerald-900/70 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200 font-sans"
        role="dialog"
        aria-modal="true"
        aria-labelledby="doc-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-950/80 bg-[#051712]/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 id="doc-modal-title" className="text-base font-bold text-white tracking-tight">
                EcoPulse Mumbai — Technical Documentation
              </h2>
              <p className="text-xs text-slate-400">
                Scientific methodology, sensor networks & computational architecture
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-950/60 border border-transparent hover:border-emerald-800 transition-colors"
            aria-label="Close Documentation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Sidebar Navigation */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar Nav */}
          <nav className="w-full md:w-56 p-3 border-b md:border-b-0 md:border-r border-emerald-950/80 bg-[#020b08]/80 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible shrink-0 text-xs">
            <button
              onClick={() => setActiveSection("overview")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all text-left ${
                activeSection === "overview"
                  ? "bg-emerald-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#051c15]"
              }`}
            >
              <Globe className="w-4 h-4 shrink-0" />
              <span>1. System Overview</span>
            </button>

            <button
              onClick={() => setActiveSection("features")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all text-left ${
                activeSection === "features"
                  ? "bg-emerald-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#051c15]"
              }`}
            >
              <Activity className="w-4 h-4 shrink-0" />
              <span>2. Core Intelligence</span>
            </button>

            <button
              onClick={() => setActiveSection("provenance")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all text-left ${
                activeSection === "provenance"
                  ? "bg-emerald-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#051c15]"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>3. Data Provenance</span>
            </button>

            <button
              onClick={() => setActiveSection("architecture")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all text-left ${
                activeSection === "architecture"
                  ? "bg-emerald-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#051c15]"
              }`}
            >
              <Cpu className="w-4 h-4 shrink-0" />
              <span>4. Architecture & APIs</span>
            </button>
          </nav>

          {/* Content Panel */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs leading-relaxed text-slate-300">
            {/* Section 1: Overview */}
            {activeSection === "overview" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-xs font-mono">
                  <Sparkles className="w-4 h-4" />
                  Platform Mission & Zero-Fabrication Philosophy
                </div>
                <h3 className="text-lg font-bold text-white">
                  Urban Environmental Intelligence for Mumbai Metropolitan Region
                </h3>
                <p>
                  EcoPulse Mumbai is an environmental intelligence engine engineered to analyze microclimates, atmospheric air pollution, vegetative buffers, and urban heat island dynamics across 14 municipal administrative zones in Mumbai.
                </p>
                <div className="p-4 rounded-xl bg-[#051c15] border border-emerald-900/60 space-y-2">
                  <h4 className="font-bold text-emerald-300">The Zero-Fabrication Principle</h4>
                  <p className="text-slate-400">
                    EcoPulse rejects synthetic random fallbacks. Every metric displayed in the platform originates from either direct ground CAAQMS measurements, numerical ECMWF/CAMS model assimilation, or verified Sentinel-2 / Landsat-9 satellite baselines. If a sensor station is offline, the interface explicitly marks the data point as <code className="text-emerald-300 font-mono">N/A / Unavailable</code>.
                  </p>
                </div>
              </div>
            )}

            {/* Section 2: Features */}
            {activeSection === "features" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-xs font-mono">
                  <Layers className="w-4 h-4" />
                  Three Locked Environmental Engines
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-[#051c15]/80 border border-emerald-950 space-y-1.5">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      Feature 1: Air Quality & Microclimate Analytics
                    </div>
                    <p className="text-slate-400">
                      Computes official CPCB National Air Quality Index (NAQI) sub-indices across 6 monitored pollutants (<span className="text-slate-200">\(PM_{2.5}, PM_{10}, NO_2, SO_2, CO, O_3\)</span>) and microclimate parameters (temperature, relative humidity, wind velocity, surface barometric pressure).
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#051c15]/80 border border-emerald-950 space-y-1.5">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <Leaf className="w-4 h-4 text-lime-400" />
                      Feature 2: Greenery & Urban Heat Analysis
                    </div>
                    <p className="text-slate-400">
                      Quantifies vegetative vigor from Copernicus Sentinel-2 MSI multispectral imagery (10m resolution NDVI) paired with Landsat-9 Thermal Infrared Sensor (TIRS) surface heat anomalies to evaluate municipal canopy cover and impervious built-up ratios.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#051c15]/80 border border-emerald-950 space-y-1.5">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      Feature 3: Environmental Risk & 72-Hour Predictive Simulation
                    </div>
                    <p className="text-slate-400">
                      A multi-domain composite stress engine evaluating air pollution (35%), thermal stress (20%), surface heat (20%), atmospheric stagnation (15%), and vegetative buffering (10%) paired with a 72-hour diurnal forecast.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Provenance */}
            {activeSection === "provenance" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-xs font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  Scientific Data Provenance Taxonomy
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#051c15] border border-emerald-800/60 space-y-1">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono text-[10px] font-bold">
                      DIRECT_OBSERVATION
                    </span>
                    <p className="text-slate-400 text-xs">
                      Live sensor readings directly streamed from ground CAAQMS / MPCB environmental monitoring stations.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#051c15] border border-blue-800/60 space-y-1">
                    <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700 font-mono text-[10px] font-bold">
                      MODELLED_ANALYSIS
                    </span>
                    <p className="text-slate-400 text-xs">
                      Atmospheric data assimilated from numerical forecast modeling (ECMWF IFS / Copernicus CAMS).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#051c15] border border-purple-800/60 space-y-1">
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700 font-mono text-[10px] font-bold">
                      SATELLITE_BASELINE
                    </span>
                    <p className="text-slate-400 text-xs">
                      Multi-temporal surface reflections derived from Sentinel-2 MSI and Landsat-8/9 Thermal Infrared Sensors.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#051c15] border border-amber-800/60 space-y-1">
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 font-mono text-[10px] font-bold">
                      FORECAST
                    </span>
                    <p className="text-slate-400 text-xs">
                      Forward atmospheric simulation over 72-hour diurnal forecast horizons with hourly time resolution.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: Architecture */}
            {activeSection === "architecture" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-xs font-mono">
                  <Database className="w-4 h-4" />
                  FastAPI Backend & API Endpoints
                </div>

                <p>
                  The backend is built on asynchronous Python FastAPI with Pydantic v2 schemas, in-memory TTL caching, and RFC 9110 HTTP compliance.
                </p>

                <div className="bg-[#020b08] p-3 rounded-xl border border-emerald-950 font-mono text-xs space-y-1">
                  <div className="text-emerald-400">GET /api/health <span className="text-slate-500">— Service health & cache telemetry</span></div>
                  <div className="text-emerald-400">GET /api/locations <span className="text-slate-500">— 14 MMR registered wards</span></div>
                  <div className="text-emerald-400">GET /api/air-quality/{'{id}'} <span className="text-slate-500">— CPCB NAQI speciation</span></div>
                  <div className="text-emerald-400">GET /api/greenery/{'{id}'} <span className="text-slate-500">— Sentinel-2 NDVI canopy</span></div>
                  <div className="text-emerald-400">GET /api/heat/{'{id}'} <span className="text-slate-500">— Landsat thermal indices</span></div>
                  <div className="text-emerald-400">GET /api/risk/{'{id}'} <span className="text-slate-500">— Composite risk scores</span></div>
                  <div className="text-emerald-400">GET /api/forecast/{'{id}'} <span className="text-slate-500">— 72-hour trajectory</span></div>
                  <div className="text-emerald-400">GET /api/environment/{'{id}'} <span className="text-slate-500">— Unified environmental envelope</span></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-emerald-950/80 bg-[#051712]/90">
          <span className="text-xs text-slate-400 font-mono">
            EcoPulse v1.0 • CPCB / Copernicus / Landsat Synchronized
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onLaunchDashboard();
              }}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-950/50"
            >
              Launch Live App →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
