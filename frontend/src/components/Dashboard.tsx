"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { apiClient } from "../services/apiClient";
import {
  Location,
  AirData,
  WeatherData,
  GreeneryData,
  HeatData,
  RiskData,
  ForecastData,
} from "../types/api";
import { DashboardNavTab } from "../types/dashboard";

import { DashboardSidebar } from "./dashboard/DashboardSidebar";
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { MumbaiHero } from "./dashboard/MumbaiHero";
import { AQIOverview } from "./dashboard/AQIOverview";
import { WeatherMicroclimate } from "./dashboard/WeatherMicroclimate";
import { PollutantGrid } from "./dashboard/PollutantGrid";
import { ForecastChart } from "./dashboard/ForecastChart";
import { EnvironmentalRisk } from "./dashboard/EnvironmentalRisk";
import { QuickInsights } from "./dashboard/QuickInsights";

// Dynamically import Leaflet Satellite Map to ensure zero SSR hydration issues
const EnvironmentalMap = dynamic(
  () => import("./dashboard/EnvironmentalMap").then((mod) => mod.EnvironmentalMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[520px] rounded-2xl bg-slate-100 dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-mono text-xs animate-pulse">
        Initializing Mumbai Spatial Satellite GIS...
      </div>
    ),
  }
);

export interface DashboardProps {
  onBackToLanding: () => void;
}

const DEFAULT_MUMBAI_LOCATIONS: Location[] = [
  { id: "borivali", name: "Borivali", latitude: 19.2307, longitude: 72.8567, zone: "Western Suburbs", ward: "R/Central", nearest_station: "Borivali East (MPCB)" },
  { id: "kandivali", name: "Kandivali", latitude: 19.2047, longitude: 72.8522, zone: "Western Suburbs", ward: "R/South", nearest_station: "Borivali East (MPCB)" },
  { id: "malad", name: "Malad", latitude: 19.1860, longitude: 72.8485, zone: "Western Suburbs", ward: "P/North", nearest_station: "Malad West (SAFAR)" },
  { id: "andheri", name: "Andheri", latitude: 19.1136, longitude: 72.8697, zone: "Western Suburbs", ward: "K/West & K/East", nearest_station: "Andheri (SAFAR/IITM)" },
  { id: "bandra", name: "Bandra", latitude: 19.0596, longitude: 72.8295, zone: "Western Suburbs", ward: "H/West", nearest_station: "Bandra Kherwadi (MPCB)" },
  { id: "bkc", name: "Bandra Kurla Complex", latitude: 19.0662, longitude: 72.8665, zone: "Central Suburbs", ward: "H/East", nearest_station: "Bandra Kurla Complex (MPCB)" },
  { id: "dadar", name: "Dadar", latitude: 19.0178, longitude: 72.8478, zone: "South-Central Mumbai", ward: "G/North", nearest_station: "Dadar (BMC/MPCB)" },
  { id: "worli", name: "Worli", latitude: 19.0134, longitude: 72.8154, zone: "South Mumbai", ward: "G/South", nearest_station: "Worli (SAFAR/IITM)" },
  { id: "colaba", name: "Colaba", latitude: 18.9067, longitude: 72.8147, zone: "South Mumbai", ward: "A Ward", nearest_station: "Colaba (MPCB)" },
  { id: "sion", name: "Sion", latitude: 19.0434, longitude: 72.8634, zone: "Central Mumbai", ward: "F/North", nearest_station: "Sion (MPCB)" },
  { id: "kurla", name: "Kurla", latitude: 19.0726, longitude: 72.8845, zone: "Central / Mithi Basin", ward: "L Ward", nearest_station: "Kurla (MPCB)" },
  { id: "powai", name: "Powai", latitude: 19.1176, longitude: 72.9060, zone: "Eastern Suburbs", ward: "S Ward", nearest_station: "Powai IIT Bombay (MPCB)" },
  { id: "chembur", name: "Chembur", latitude: 19.0622, longitude: 72.8975, zone: "Eastern Suburbs", ward: "M/West", nearest_station: "Chembur (MPCB)" },
  { id: "mulund", name: "Mulund", latitude: 19.1726, longitude: 72.9565, zone: "North-Eastern Suburbs", ward: "T Ward", nearest_station: "Mulund (MPCB)" },
];

export function Dashboard({ onBackToLanding }: DashboardProps) {
  const [locations, setLocations] = useState<Location[]>(DEFAULT_MUMBAI_LOCATIONS);
  const [selectedLocId, setSelectedLocId] = useState<string>("borivali");
  const [compareLocId, setCompareLocId] = useState<string>("andheri");
  const [activeTab, setActiveTab] = useState<DashboardNavTab>("dashboard");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [backendConnected, setBackendConnected] = useState<boolean>(true);

  // Telemetry states
  const [airData, setAirData] = useState<AirData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [greeneryData, setGreeneryData] = useState<GreeneryData | null>(null);
  const [heatData, setHeatData] = useState<HeatData | null>(null);
  const [riskData, setRiskData] = useState<RiskData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [compareAirData, setCompareAirData] = useState<AirData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync theme with document class and localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("ecopulse-theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme);
        if (savedTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    } catch {
      // Ignore if localStorage unavailable
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("ecopulse-theme", nextTheme);
    } catch {
      // Ignore if localStorage unavailable
    }
  };

  // Load registered locations on mount
  useEffect(() => {
    let isMounted = true;
    apiClient
      .getLocationsDirect()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setLocations(data);
          setBackendConnected(true);
        }
      })
      .catch(() => {
        if (isMounted) setBackendConnected(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch telemetry for selected location from FastAPI backend
  const fetchTelemetry = useCallback(async (locId: string, force = false) => {
    setIsLoading(true);
    try {
      const [air, weather, greenery, heat, risk, forecast] = await Promise.allSettled([
        apiClient.getAirQualityDirect(locId, force),
        apiClient.getMicroclimateDirect(locId, force),
        apiClient.getGreeneryDirect(locId),
        apiClient.getHeatDirect(locId),
        apiClient.getRiskDirect(locId, force),
        apiClient.getForecastDirect(locId, force),
      ]);

      if (air.status === "fulfilled") setAirData(air.value);
      if (weather.status === "fulfilled") setWeatherData(weather.value);
      if (greenery.status === "fulfilled") setGreeneryData(greenery.value);
      if (heat.status === "fulfilled") setHeatData(heat.value);
      if (risk.status === "fulfilled") setRiskData(risk.value);
      if (forecast.status === "fulfilled") setForecastData(forecast.value);
      setBackendConnected(true);
    } catch {
      setBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry(selectedLocId);
  }, [selectedLocId, fetchTelemetry]);

  // Fetch comparison data if on comparison tab
  useEffect(() => {
    if (activeTab === "area_comparison") {
      apiClient.getAirQualityDirect(compareLocId).then(setCompareAirData).catch(() => {});
    }
  }, [activeTab, compareLocId]);

  const handleSync = async () => {
    setIsSyncing(true);
    await fetchTelemetry(selectedLocId, true);
    setIsSyncing(false);
  };

  const selectedLocation =
    locations.find((l) => l.id === selectedLocId) || DEFAULT_MUMBAI_LOCATIONS[0];
  const compareLocation =
    locations.find((l) => l.id === compareLocId) || DEFAULT_MUMBAI_LOCATIONS[3];

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="flex w-full min-h-screen font-sans bg-[#f4f6f8] dark:bg-[#020617] text-slate-900 dark:text-[#f8fafc] selection:bg-emerald-500/30 overflow-x-hidden transition-colors duration-200">
        {/* Left Sidebar */}
        <DashboardSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onBackToLanding={onBackToLanding}
          backendConnected={backendConnected}
        />

        {/* Main Dashboard Canvas (Full Width Viewport matching Reference) */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#f4f6f8] dark:bg-[#020617] transition-colors duration-200">
          {/* Top Control Bar */}
          <DashboardHeader
            locations={locations}
            selectedLocationId={selectedLocId}
            onLocationChange={setSelectedLocId}
            onSync={handleSync}
            isSyncing={isSyncing}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />

          {/* Dynamic Section Router */}
          <main className="flex-1 p-5 md:p-6 space-y-6 w-full max-w-full">
            {/* TAB 1: Main Overview Dashboard */}
            {activeTab === "dashboard" && (
              <>
                {/* Mumbai Hero Banner */}
                <MumbaiHero theme={theme} />

                {/* Primary Middle Grid: Left Telemetry (7 cols) + Right Map (5 cols) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Left 7 Columns */}
                  <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                    {/* Row 1: AQI Overview + Current Weather Side-by-Side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <AQIOverview airData={airData} isLoading={isLoading} theme={theme} />
                      <WeatherMicroclimate weatherData={weatherData} isLoading={isLoading} />
                    </div>

                    {/* Row 2: 6 Pollutant Cards Grid */}
                    <PollutantGrid airData={airData} isLoading={isLoading} />
                  </div>

                  {/* Right 5 Columns: Real Interactive Leaflet Mumbai Satellite Map */}
                  <div className="lg:col-span-5 h-full min-h-[520px]">
                    <EnvironmentalMap
                      locations={locations}
                      selectedLocationId={selectedLocId}
                      onSelectLocation={setSelectedLocId}
                    />
                  </div>
                </div>

                {/* Bottom 3-Card Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                  <ForecastChart forecastData={forecastData} isLoading={isLoading} theme={theme} />
                  <EnvironmentalRisk riskData={riskData} isLoading={isLoading} theme={theme} />
                  <QuickInsights
                    locationName={selectedLocation.name}
                    airData={airData}
                    weatherData={weatherData}
                  />
                </div>
              </>
            )}

            {/* TAB 2: Air & Microclimate Focused View */}
            {activeTab === "air_microclimate" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200/90 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Air Quality & Microclimate Domain</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">High-resolution CPCB sub-indices and thermodynamic sensor analysis for {selectedLocation.name}</p>
                  </div>
                  <div className="text-sm font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 font-bold">
                    Ward: {selectedLocation.ward || selectedLocation.zone}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AQIOverview airData={airData} isLoading={isLoading} theme={theme} />
                  <WeatherMicroclimate weatherData={weatherData} isLoading={isLoading} />
                </div>

                <PollutantGrid airData={airData} isLoading={isLoading} />
              </div>
            )}

            {/* TAB 3: Greenery & Heat Focused View */}
            {activeTab === "greenery_heat" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200/90 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Greenery & Urban Heat Island Analysis</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Copernicus Sentinel-2 MSI 10m NDVI vegetation cover & Landsat-9 TIRS thermal survey</p>
                  </div>
                  <div className="text-sm font-mono text-lime-700 dark:text-lime-300 bg-lime-50 dark:bg-lime-950/60 px-3 py-1.5 rounded-xl border border-lime-200 dark:border-lime-800/80 font-bold">
                    NDVI: {greeneryData?.ndvi_mean ?? "0.42 (Healthy Canopy)"}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200/90 dark:border-slate-800/80 shadow-sm space-y-3">
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">Mean NDVI</div>
                    <div className="text-3xl font-extrabold text-lime-600 dark:text-lime-400 font-mono">
                      {greeneryData?.ndvi_mean ?? "0.42"}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">Classification: {greeneryData?.greenery_classification || "Moderate Canopy"}</div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200/90 dark:border-slate-800/80 shadow-sm space-y-3">
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">Tree Canopy Coverage</div>
                    <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      {greeneryData?.tree_canopy_pct ?? 28.5}%
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">5-Yr Change: {greeneryData?.vegetation_change_5yr_pct ?? "+1.2%"}</div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200/90 dark:border-slate-800/80 shadow-sm space-y-3">
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">Surface Heat Index (LST)</div>
                    <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                      {heatData?.surface_heat_index ?? "34.2°C"}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">Heat Differential: +3.8°C vs Coastal Baseline</div>
                  </div>
                </div>

                <div className="h-[480px]">
                  <EnvironmentalMap
                    locations={locations}
                    selectedLocationId={selectedLocId}
                    onSelectLocation={setSelectedLocId}
                    activeLayer="NDVI"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: Forecast & Risk Focused View */}
            {activeTab === "forecast_risk" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200/90 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Predictive Forecast & Risk Modeling</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Forward 72-hour atmospheric trajectory simulation & multi-stressor risk scoring</p>
                  </div>
                  <div className="text-sm font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 font-bold">
                    Risk Index: {riskData?.overall_risk_score ?? 28} / 100
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ForecastChart forecastData={forecastData} isLoading={isLoading} theme={theme} />
                  <EnvironmentalRisk riskData={riskData} isLoading={isLoading} theme={theme} />
                </div>
              </div>
            )}

            {/* TAB 5: Area Comparison View */}
            {activeTab === "area_comparison" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200/90 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Cross-Ward Comparative Analysis</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Direct multi-parameter environmental comparison between Mumbai locations</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={selectedLocId}
                      onChange={(e) => setSelectedLocId(e.target.value)}
                      className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold"
                    >
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>

                    <span className="text-slate-400 font-mono text-xs">VS</span>

                    <select
                      value={compareLocId}
                      onChange={(e) => setCompareLocId(e.target.value)}
                      className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold"
                    >
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                      Area A: {selectedLocation.name} ({selectedLocation.ward || selectedLocation.zone})
                    </div>
                    <AQIOverview airData={airData} isLoading={isLoading} theme={theme} />
                    <PollutantGrid airData={airData} isLoading={isLoading} />
                  </div>

                  <div className="space-y-4">
                    <div className="text-sm font-bold text-blue-700 dark:text-blue-400 font-mono">
                      Area B: {compareLocation.name} ({compareLocation.ward || compareLocation.zone})
                    </div>
                    <AQIOverview airData={compareAirData} isLoading={isLoading} theme={theme} />
                    <PollutantGrid airData={compareAirData} isLoading={isLoading} />
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
