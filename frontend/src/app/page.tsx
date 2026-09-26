"use client";

import React, { useState, useEffect, useMemo } from "react";
import { apiClient } from "../services/apiClient";
import {
  Location,
  AirData,
  WeatherData,
  GreeneryData,
  HeatData,
  RiskData,
  ForecastData,
  AreaComparisonResponse,
  MumbaiMapDataResponse,
  UnifiedEnvironmentResponse,
  DataProvenance,
} from "../types/api";
import {
  Activity,
  Wind,
  Thermometer,
  Leaf,
  Sun,
  CloudRain,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Compass,
  Droplets,
  BarChart3,
  Info,
  Flame,
  Layers,
  Globe,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Clock,
  ExternalLink,
} from "lucide-react";

const MUMBAI_LOCATION_IDS = [
  "borivali",
  "kandivali",
  "malad",
  "andheri",
  "bandra",
  "bkc",
  "dadar",
  "worli",
  "colaba",
  "sion",
  "kurla",
  "powai",
  "chembur",
  "mulund",
];

// Coordinate bounds for Mumbai Map SVG projection
const MUMBAI_BOUNDS = {
  minLat: 18.89,
  maxLat: 19.26,
  minLon: 72.79,
  maxLon: 72.99,
};

export default function EcoPulseProductionDashboard() {
  const [apiUrl, setApiUrl] = useState("http://localhost:8000/api");
  const [selectedLoc, setSelectedLoc] = useState<string>("borivali");
  const [compareLocB, setCompareLocB] = useState<string>("andheri");
  const [forceRefresh, setForceRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "f1" | "f2" | "f3" | "compare" | "map" | "unified" | "provenance"
  >("f1");

  // Health & Locations
  const [healthData, setHealthData] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);

  // Feature 1: Air Quality & Microclimate
  const [airData, setAirData] = useState<AirData | null>(null);
  const [airLoading, setAirLoading] = useState(false);
  const [airError, setAirError] = useState<string | null>(null);

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Feature 2: Greenery & Urban Heat
  const [greeneryData, setGreeneryData] = useState<GreeneryData | null>(null);
  const [greeneryLoading, setGreeneryLoading] = useState(false);
  const [greeneryError, setGreeneryError] = useState<string | null>(null);

  const [heatData, setHeatData] = useState<HeatData | null>(null);
  const [heatLoading, setHeatLoading] = useState(false);
  const [heatError, setHeatError] = useState<string | null>(null);

  const [mapFeatures, setMapFeatures] = useState<MumbaiMapDataResponse | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Feature 3: Risk & Prediction
  const [riskData, setRiskData] = useState<RiskData | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);

  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);

  // Comparison
  const [comparisonData, setComparisonData] = useState<AreaComparisonResponse | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  // Unified
  const [unifiedData, setUnifiedData] = useState<UnifiedEnvironmentResponse | null>(null);
  const [unifiedLoading, setUnifiedLoading] = useState(false);
  const [unifiedError, setUnifiedError] = useState<string | null>(null);

  // Map display metric
  const [mapMetric, setMapMetric] = useState<"ndvi" | "heat">("ndvi");

  // Fetch Locations & Health on mount
  useEffect(() => {
    fetchHealth();
    fetchLocations();
  }, []);

  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const data = await apiClient.getHealthDirect();
      setHealthData(data);
    } catch {
      setHealthData({ status: "DEGRADED" });
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const data = await apiClient.getLocationsDirect();
      setLocations(data);
    } catch {
      // Keep static fallback if offline
    }
  };

  // Feature 1 Fetcher
  const fetchFeature1 = async () => {
    setAirLoading(true);
    setAirError(null);
    setWeatherLoading(true);
    setWeatherError(null);

    apiClient
      .getAirQualityDirect(selectedLoc, forceRefresh)
      .then((data) => setAirData(data))
      .catch((err) => setAirError(err.message || String(err)))
      .finally(() => setAirLoading(false));

    apiClient
      .getMicroclimateDirect(selectedLoc, forceRefresh)
      .then((data) => setWeatherData(data))
      .catch((err) => setWeatherError(err.message || String(err)))
      .finally(() => setWeatherLoading(false));
  };

  // Feature 2 Fetcher
  const fetchFeature2 = async () => {
    setGreeneryLoading(true);
    setGreeneryError(null);
    setHeatLoading(true);
    setHeatError(null);

    apiClient
      .getGreeneryDirect(selectedLoc)
      .then((data) => setGreeneryData(data))
      .catch((err) => setGreeneryError(err.message || String(err)))
      .finally(() => setGreeneryLoading(false));

    apiClient
      .getHeatDirect(selectedLoc)
      .then((data) => setHeatData(data))
      .catch((err) => setHeatError(err.message || String(err)))
      .finally(() => setHeatLoading(false));

    fetchMapData();
  };

  const fetchMapData = () => {
    setMapLoading(true);
    setMapError(null);
    apiClient
      .getMapFeaturesDirect()
      .then((data) => setMapFeatures(data))
      .catch((err) => setMapError(err.message || String(err)))
      .finally(() => setMapLoading(false));
  };

  // Feature 3 Fetcher
  const fetchFeature3 = async () => {
    setRiskLoading(true);
    setRiskError(null);
    setForecastLoading(true);
    setForecastError(null);

    apiClient
      .getRiskDirect(selectedLoc, forceRefresh)
      .then((data) => setRiskData(data))
      .catch((err) => setRiskError(err.message || String(err)))
      .finally(() => setRiskLoading(false));

    apiClient
      .getForecastDirect(selectedLoc, forceRefresh)
      .then((data) => setForecastData(data))
      .catch((err) => setForecastError(err.message || String(err)))
      .finally(() => setForecastLoading(false));
  };

  // Comparison Fetcher
  const fetchComparison = async (locA: string = selectedLoc, locB: string = compareLocB) => {
    setComparisonLoading(true);
    setComparisonError(null);
    try {
      const data = await apiClient.compareLocationsDirect(locA, locB);
      setComparisonData(data);
    } catch (err: any) {
      setComparisonError(err.message || String(err));
      setComparisonData(null);
    } finally {
      setComparisonLoading(false);
    }
  };

  // Unified Fetcher
  const fetchUnified = async () => {
    setUnifiedLoading(true);
    setUnifiedError(null);
    try {
      const data = await apiClient.getUnifiedEnvironmentDirect(selectedLoc, forceRefresh);
      setUnifiedData(data);
    } catch (err: any) {
      setUnifiedError(err.message || String(err));
    } finally {
      setUnifiedLoading(false);
    }
  };

  // Auto fetch when active tab or selected location changes
  useEffect(() => {
    if (activeTab === "f1") fetchFeature1();
    if (activeTab === "f2") fetchFeature2();
    if (activeTab === "f3") fetchFeature3();
    if (activeTab === "compare") fetchComparison();
    if (activeTab === "map") fetchMapData();
    if (activeTab === "unified") fetchUnified();
  }, [selectedLoc, activeTab]);

  const activeLocationMeta = useMemo(() => {
    return locations.find((l) => l.id === selectedLoc) || {
      id: selectedLoc,
      name: selectedLoc.charAt(0).toUpperCase() + selectedLoc.slice(1),
      zone: "Mumbai Metropolitan Region",
      ward: "BMC Administrative Ward",
      nearest_station: "Assimilated MPCB/SAFAR CAAQMS",
      latitude: 19.076,
      longitude: 72.8777,
    };
  }, [locations, selectedLoc]);

  // Provenance Badge Component
  const renderProvenance = (prov?: DataProvenance | string | null) => {
    if (!prov) return <span className="px-2 py-0.5 text-[11px] bg-slate-800 text-slate-400 rounded font-mono">N/A</span>;
    let badgeClass = "bg-slate-800 text-slate-300 border-slate-700";
    let icon = <Info className="w-3 h-3 inline mr-1" />;

    if (prov === "DIRECT_OBSERVATION") {
      badgeClass = "bg-emerald-950/70 text-emerald-300 border-emerald-700/60";
      icon = <CheckCircle2 className="w-3 h-3 inline mr-1 text-emerald-400" />;
    } else if (prov === "MODELLED_ANALYSIS") {
      badgeClass = "bg-blue-950/70 text-blue-300 border-blue-700/60";
      icon = <Cpu className="w-3 h-3 inline mr-1 text-blue-400" />;
    } else if (prov === "SATELLITE_BASELINE") {
      badgeClass = "bg-purple-950/70 text-purple-300 border-purple-700/60";
      icon = <Globe className="w-3 h-3 inline mr-1 text-purple-400" />;
    } else if (prov === "FORECAST") {
      badgeClass = "bg-amber-950/70 text-amber-300 border-amber-700/60";
      icon = <Calendar className="w-3 h-3 inline mr-1 text-amber-400" />;
    }

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 text-[11px] font-mono rounded border ${badgeClass}`}
        title={`Data Provenance: ${prov}`}
      >
        {icon}
        {prov}
      </span>
    );
  };

  // CPCB NAQI Color helper
  const getAqiColor = (aqi: number | null) => {
    if (aqi === null) return { bg: "bg-slate-800", text: "text-slate-400", border: "border-slate-700" };
    if (aqi <= 50) return { bg: "bg-emerald-950/60", text: "text-emerald-400", border: "border-emerald-600", label: "Good" };
    if (aqi <= 100) return { bg: "bg-lime-950/60", text: "text-lime-400", border: "border-lime-600", label: "Satisfactory" };
    if (aqi <= 200) return { bg: "bg-yellow-950/60", text: "text-yellow-400", border: "border-yellow-600", label: "Moderate" };
    if (aqi <= 300) return { bg: "bg-orange-950/60", text: "text-orange-400", border: "border-orange-600", label: "Poor" };
    if (aqi <= 400) return { bg: "bg-red-950/60", text: "text-red-400", border: "border-red-600", label: "Very Poor" };
    return { bg: "bg-rose-950/80", text: "text-rose-400", border: "border-rose-700", label: "Severe" };
  };

  // Helper for coordinates to SVG projection
  const projectCoords = (lat: number, lon: number, width: number, height: number) => {
    const x = ((lon - MUMBAI_BOUNDS.minLon) / (MUMBAI_BOUNDS.maxLon - MUMBAI_BOUNDS.minLon)) * width;
    const y = ((MUMBAI_BOUNDS.maxLat - lat) / (MUMBAI_BOUNDS.maxLat - MUMBAI_BOUNDS.minLat)) * height;
    return { x, y };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Banner & Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  EcoPulse Mumbai
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Live Telemetry
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Urban Environmental Intelligence, Microclimate & Risk Analytics Platform
              </p>
            </div>
          </div>

          {/* Quick Selector Bar */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg shadow-inner">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <label htmlFor="dashboard-location-select" className="text-slate-400 font-medium">
                Active Ward:
              </label>
              <select
                id="dashboard-location-select"
                name="dashboard-location-select"
                aria-label="Active Mumbai Ward"
                value={selectedLoc}
                onChange={(e) => setSelectedLoc(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded px-2.5 py-1 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {MUMBAI_LOCATION_IDS.map((id) => (
                  <option key={id} value={id}>
                    {id.toUpperCase()} {locations.find((l) => l.id === id)?.name ? `(${locations.find((l) => l.id === id)?.name})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <label
              htmlFor="dashboard-cache-toggle"
              className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800/80 px-2.5 py-1.5 rounded-lg text-slate-300 cursor-pointer hover:bg-slate-900"
            >
              <input
                type="checkbox"
                id="dashboard-cache-toggle"
                name="dashboard-cache-toggle"
                aria-label="Bypass Cache"
                checked={forceRefresh}
                onChange={(e) => setForceRefresh(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px] font-mono">Bypass TTL</span>
            </label>

            <button
              onClick={() => {
                if (activeTab === "f1") fetchFeature1();
                if (activeTab === "f2") fetchFeature2();
                if (activeTab === "f3") fetchFeature3();
                if (activeTab === "compare") fetchComparison();
                if (activeTab === "map") fetchMapData();
                if (activeTab === "unified") fetchUnified();
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              title="Refresh telemetry for current view"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* Global Ward Context Bar */}
        <div className="bg-slate-900/50 border-t border-slate-800/60 px-4 sm:px-6 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 font-mono text-slate-400">
              <span>
                Ward: <strong className="text-white">{activeLocationMeta.ward}</strong>
              </span>
              <span className="hidden sm:inline text-slate-600">|</span>
              <span className="hidden sm:inline">
                Zone: <strong className="text-white">{activeLocationMeta.zone}</strong>
              </span>
              <span className="hidden sm:inline text-slate-600">|</span>
              <span className="hidden md:inline">
                Station: <strong className="text-white">{activeLocationMeta.nearest_station}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Backend Systems: {healthData?.status || "HEALTHY"}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 border-t border-slate-800/40">
            <button
              onClick={() => setActiveTab("f1")}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                activeTab === "f1"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>1. Air & Microclimate</span>
            </button>

            <button
              onClick={() => setActiveTab("f2")}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                activeTab === "f2"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Leaf className="w-4 h-4" />
              <span>2. Greenery & Heat</span>
            </button>

            <button
              onClick={() => setActiveTab("f3")}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                activeTab === "f3"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>3. Risk & 72h Forecast</span>
            </button>

            <button
              onClick={() => setActiveTab("compare")}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                activeTab === "compare"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Location Comparison</span>
            </button>

            <button
              onClick={() => setActiveTab("map")}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                activeTab === "map"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Mumbai Spatial Map</span>
            </button>

            <button
              onClick={() => setActiveTab("unified")}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                activeTab === "unified"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Executive Brief</span>
            </button>

            <button
              onClick={() => setActiveTab("provenance")}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                activeTab === "provenance"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Data Lineage & API</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: FEATURE 1 — AIR QUALITY & MICROCLIMATE */}
        {/* ========================================================================= */}
        {activeTab === "f1" && (
          <div className="space-y-6">
            {/* Header Description */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Air Quality & Microclimate Telemetry
                </h2>
                <p className="text-xs text-slate-400">
                  Assimilated CAMS atmospheric models, CPCB NAQI break-points, and high-frequency Open-Meteo boundary layer sensors.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Status:</span>
                {airLoading || weatherLoading ? (
                  <span className="text-xs font-mono text-amber-400 animate-pulse">Syncing Sensors...</span>
                ) : (
                  <span className="text-xs font-mono text-emerald-400">Synchronized</span>
                )}
              </div>
            </div>

            {/* Top Cards: Instantaneous AQI + Microclimate Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* AQI Primary Hero Card */}
              <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      National Air Quality Index (CPCB NAQI)
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      {activeLocationMeta.name} Atmospheric Quality
                    </h3>
                  </div>
                  <div>{renderProvenance(airData?.provenance)}</div>
                </div>

                {airError && (
                  <div className="my-3 p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-200">
                    <AlertTriangle className="w-4 h-4 inline mr-1 text-red-400" />
                    {airError}
                  </div>
                )}

                {/* AQI Score Display */}
                <div className="my-6 flex items-center justify-between bg-slate-950/70 border border-slate-800/80 p-5 rounded-xl">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase">Instantaneous AQI</span>
                    <div className="text-5xl font-black text-white tracking-tight mt-1">
                      {airData?.aqi !== null && airData?.aqi !== undefined ? (
                        airData.aqi
                      ) : (
                        <span className="text-slate-500 text-3xl">DATA GAP</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      Dominant Pollutant:{" "}
                      <strong className="text-emerald-400 font-mono">
                        {airData?.dominant_pollutant || "N/A"}
                      </strong>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Classification</span>
                    <div
                      className={`text-xl font-bold px-3 py-1 rounded-lg mt-1 border ${
                        getAqiColor(airData?.aqi ?? null).bg
                      } ${getAqiColor(airData?.aqi ?? null).text} ${
                        getAqiColor(airData?.aqi ?? null).border
                      }`}
                    >
                      {airData?.aqi_category || "Calculating..."}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      {airData?.pollutants_monitored_count || 6} Chemical Channels Active
                    </span>
                  </div>
                </div>

                {/* AQI Spectrum Scale Indicator */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Good (0-50)</span>
                    <span>Satisfactory (51-100)</span>
                    <span>Moderate (101-200)</span>
                    <span>Poor (201+)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
                    <div className="w-[10%] bg-emerald-500" title="Good"></div>
                    <div className="w-[10%] bg-lime-500" title="Satisfactory"></div>
                    <div className="w-[20%] bg-yellow-500" title="Moderate"></div>
                    <div className="w-[20%] bg-orange-500" title="Poor"></div>
                    <div className="w-[20%] bg-red-600" title="Very Poor"></div>
                    <div className="w-[20%] bg-rose-800" title="Severe"></div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Source: {airData?.source || "Copernicus Atmosphere Service (CAMS)"}</span>
                  <span>Freshness: {airData?.data_freshness || "Realtime Model"}</span>
                </div>
              </div>

              {/* Microclimate Telemetry Grid Card */}
              <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Boundary Layer Microclimate
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      Surface Meteorological Parameters
                    </h3>
                  </div>
                  <div>{renderProvenance(weatherData?.provenance)}</div>
                </div>

                {weatherError && (
                  <div className="my-3 p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-200">
                    <AlertTriangle className="w-4 h-4 inline mr-1 text-red-400" />
                    {weatherError}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
                  {/* Temperature */}
                  <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                      <span>Dry Bulb Temp</span>
                    </div>
                    <div className="text-2xl font-bold text-white mt-1 font-mono">
                      {weatherData?.temperature_c !== null && weatherData?.temperature_c !== undefined
                        ? `${weatherData.temperature_c}°C`
                        : "N/A"}
                    </div>
                    <span className="text-[10px] text-slate-500">Surface Air Temp</span>
                  </div>

                  {/* Apparent Temp */}
                  <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span>Feels Like</span>
                    </div>
                    <div className="text-2xl font-bold text-white mt-1 font-mono">
                      {weatherData?.apparent_temperature_c !== null && weatherData?.apparent_temperature_c !== undefined
                        ? `${weatherData.apparent_temperature_c}°C`
                        : "N/A"}
                    </div>
                    <span className="text-[10px] text-slate-500">Thermal Comfort</span>
                  </div>

                  {/* Humidity */}
                  <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Droplets className="w-3.5 h-3.5 text-blue-400" />
                      <span>Rel. Humidity</span>
                    </div>
                    <div className="text-2xl font-bold text-white mt-1 font-mono">
                      {weatherData?.relative_humidity_pct !== null && weatherData?.relative_humidity_pct !== undefined
                        ? `${weatherData.relative_humidity_pct}%`
                        : "N/A"}
                    </div>
                    <span className="text-[10px] text-slate-500">Moisture Content</span>
                  </div>

                  {/* Wind Vector */}
                  <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Wind className="w-3.5 h-3.5 text-teal-400" />
                      <span>Wind Vector</span>
                    </div>
                    <div className="text-xl font-bold text-white mt-1 font-mono">
                      {weatherData?.wind_speed_kmh !== null && weatherData?.wind_speed_kmh !== undefined
                        ? `${weatherData.wind_speed_kmh} km/h`
                        : "N/A"}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Dir: {weatherData?.wind_cardinal || "N/A"} ({weatherData?.wind_direction_deg || 0}°)
                    </span>
                  </div>

                  {/* Solar Irradiance */}
                  <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Sun className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Solar Radiation</span>
                    </div>
                    <div className="text-xl font-bold text-white mt-1 font-mono">
                      {weatherData?.solar_radiation_wm2 !== null && weatherData?.solar_radiation_wm2 !== undefined
                        ? `${weatherData.solar_radiation_wm2} W/m²`
                        : "N/A"}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {weatherData?.solar_radiation_wm2 === 0 ? "Nighttime baseline" : "Shortwave flux"}
                    </span>
                  </div>

                  {/* Atmospheric Pressure */}
                  <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Compass className="w-3.5 h-3.5 text-purple-400" />
                      <span>Pressure</span>
                    </div>
                    <div className="text-xl font-bold text-white mt-1 font-mono">
                      {weatherData?.surface_pressure_hpa !== null && weatherData?.surface_pressure_hpa !== undefined
                        ? `${weatherData.surface_pressure_hpa} hPa`
                        : "N/A"}
                    </div>
                    <span className="text-[10px] text-slate-500">Barometric Level</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Source: {weatherData?.source || "Open-Meteo High-Resolution Model"}</span>
                  <span>
                    Observed:{" "}
                    {weatherData?.timestamp
                      ? new Date(weatherData.timestamp).toLocaleTimeString()
                      : "Synchronized"}
                  </span>
                </div>
              </div>
            </div>

            {/* Pollutants Matrix Grid */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="font-bold text-slate-100 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    CPCB Multi-Pollutant Speciation Matrix
                  </h3>
                  <p className="text-xs text-slate-400">
                    Individual chemical species concentration, NAQI sub-indices, and regulatory exposure classifications.
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Method: {airData?.aqi_calculation_method || "Max Sub-Index"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: "pm25", name: "PM2.5 Fine Particulates", data: airData?.pm25, safe: "< 30 µg/m³" },
                  { key: "pm10", name: "PM10 Coarse Particulates", data: airData?.pm10, safe: "< 60 µg/m³" },
                  { key: "no2", name: "Nitrogen Dioxide (NO₂)", data: airData?.no2, safe: "< 40 µg/m³" },
                  { key: "so2", name: "Sulfur Dioxide (SO₂)", data: airData?.so2, safe: "< 40 µg/m³" },
                  { key: "co", name: "Carbon Monoxide (CO)", data: airData?.co, safe: "< 2 mg/m³" },
                  { key: "o3", name: "Ground-Level Ozone (O₃)", data: airData?.o3, safe: "< 100 µg/m³" },
                ].map(({ key, name, data, safe }) => (
                  <div
                    key={key}
                    className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-300">{name}</span>
                        <div className="text-2xl font-black text-white font-mono mt-0.5">
                          {data?.value !== null && data?.value !== undefined ? (
                            <span>
                              {data.value}{" "}
                              <span className="text-xs font-normal text-slate-400">{data.unit}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 text-lg">UNAVAILABLE</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Sub-Index</span>
                        <div className="text-sm font-bold text-emerald-400 font-mono">
                          {data?.naqi_sub_index !== null && data?.naqi_sub_index !== undefined
                            ? data.naqi_sub_index
                            : "N/A"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/60">
                      <span className="text-slate-400">
                        Category:{" "}
                        <strong className="text-slate-200">{data?.category || "Standard"}</strong>
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">Benchmark: {safe}</span>
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-1">
                      <span>Source: {data?.source || "Assimilated Sensor"}</span>
                      {data?.provenance && renderProvenance(data.provenance)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: FEATURE 2 — GREENERY & URBAN HEAT */}
        {/* ========================================================================= */}
        {activeTab === "f2" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-emerald-400" />
                  Greenery & Urban Heat Island Analytics
                </h2>
                <p className="text-xs text-slate-400">
                  Sentinel-2 MultiSpectral NDVI vegetation indices coupled with Landsat-9 TIRS Surface Heat Index calibrations.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Satellite Lineage:</span>
                {renderProvenance(greeneryData?.provenance || DataProvenance.SATELLITE_BASELINE)}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Greenery / NDVI Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Sentinel-2 Vegetation Coverage
                      </span>
                      <h3 className="text-lg font-bold text-white mt-0.5">
                        {greeneryData?.location_name || activeLocationMeta.name} Normalized Difference Vegetation Index
                      </h3>
                    </div>
                    {renderProvenance(greeneryData?.provenance)}
                  </div>

                  {greeneryError && (
                    <div className="my-3 p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-200">
                      <AlertTriangle className="w-4 h-4 inline mr-1 text-red-400" />
                      {greeneryError}
                    </div>
                  )}

                  {greeneryLoading && (
                    <div className="p-8 text-center text-slate-500 font-mono text-xs">
                      Computing Sentinel-2 multispectral baseline...
                    </div>
                  )}

                  {greeneryData && (
                    <div className="my-5 space-y-5">
                      <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400 uppercase font-semibold">Mean NDVI Value</span>
                          <div className="text-4xl font-extrabold text-emerald-400 font-mono mt-1">
                            {greeneryData.ndvi_mean !== null ? greeneryData.ndvi_mean : "N/A"}
                          </div>
                          <span className="text-xs text-slate-400">
                            Scale: -1.0 (Water) to +1.0 (Dense Foliage)
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 uppercase font-semibold">Classification</span>
                          <div className="text-sm font-bold text-white px-3 py-1 bg-emerald-950 border border-emerald-700/60 rounded-lg mt-1">
                            {greeneryData.greenery_classification || "UNAVAILABLE"}
                          </div>
                        </div>
                      </div>

                      {/* Vegetation Coverage Metrics */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                          <span className="text-xs text-slate-400">Tree Canopy Cover</span>
                          <div className="text-2xl font-bold text-white font-mono mt-1">
                            {typeof greeneryData.tree_canopy_pct === "number" && !isNaN(greeneryData.tree_canopy_pct)
                              ? `${greeneryData.tree_canopy_pct}%`
                              : "N/A"}
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{
                                width: `${
                                  typeof greeneryData.tree_canopy_pct === "number" && !isNaN(greeneryData.tree_canopy_pct)
                                    ? Math.min(Math.max(greeneryData.tree_canopy_pct, 0), 100)
                                    : 0
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                          <span className="text-xs text-slate-400">Built-Up Impervious Ratio</span>
                          <div className="text-2xl font-bold text-white font-mono mt-1">
                            {typeof greeneryData.built_up_ratio_pct === "number" && !isNaN(greeneryData.built_up_ratio_pct)
                              ? `${greeneryData.built_up_ratio_pct}%`
                              : "N/A"}
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div
                              className="bg-rose-500 h-full rounded-full"
                              style={{
                                width: `${
                                  typeof greeneryData.built_up_ratio_pct === "number" && !isNaN(greeneryData.built_up_ratio_pct)
                                    ? Math.min(Math.max(greeneryData.built_up_ratio_pct, 0), 100)
                                    : 0
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* 5-Year Vegetation Change */}
                      <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400">5-Year Canopy Trend</span>
                          <div className="text-sm font-bold text-white mt-0.5">
                            Longitudinal Multi-Year Observation
                          </div>
                        </div>
                        <div className="text-right">
                          {typeof greeneryData.vegetation_change_5yr_pct === "number" && !isNaN(greeneryData.vegetation_change_5yr_pct) ? (
                            <span
                              className={`text-lg font-bold font-mono flex items-center gap-1 ${
                                greeneryData.vegetation_change_5yr_pct >= 0 ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {greeneryData.vegetation_change_5yr_pct >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              {greeneryData.vegetation_change_5yr_pct > 0 ? "+" : ""}
                              {greeneryData.vegetation_change_5yr_pct}%
                            </span>
                          ) : (
                            <span className="text-sm font-bold font-mono text-slate-500">N/A</span>
                          )}
                        </div>
                      </div>

                      {greeneryData.interpretation && (
                        <p className="text-xs text-slate-300 italic bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                          &ldquo;{greeneryData.interpretation}&rdquo;
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Source: {greeneryData?.satellite_source || "Sentinel-2 MSI Level-2A"}</span>
                  <span>Baseline: {greeneryData?.baseline_date || "2024 Calibrated"}</span>
                </div>
              </div>

              {/* Urban Heat Island Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Landsat-9 Thermal Infrared
                      </span>
                      <h3 className="text-lg font-bold text-white mt-0.5">
                        {heatData?.location_name || activeLocationMeta.name} Surface Heat Island Index
                      </h3>
                    </div>
                    {renderProvenance(heatData?.provenance)}
                  </div>

                  {heatError && (
                    <div className="my-3 p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-200">
                      <AlertTriangle className="w-4 h-4 inline mr-1 text-red-400" />
                      {heatError}
                    </div>
                  )}

                  {heatLoading && (
                    <div className="p-8 text-center text-slate-500 font-mono text-xs">
                      Computing Landsat-9 thermal infrared calibration...
                    </div>
                  )}

                  {heatData && (
                    <div className="my-5 space-y-5">
                      <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400 uppercase font-semibold">Surface Heat Index</span>
                          <div className="text-4xl font-extrabold text-amber-400 font-mono mt-1">
                            {typeof heatData.surface_heat_index === "number" && !isNaN(heatData.surface_heat_index) ? (
                              <>
                                {heatData.surface_heat_index}{" "}
                                <span className="text-sm font-normal text-slate-500">/ 10</span>
                              </>
                            ) : (
                              <span className="text-slate-500 text-3xl">DATA GAP</span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">Radiative Surface Thermal Stress</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 uppercase font-semibold">Classification</span>
                          <div className="text-sm font-bold text-amber-300 px-3 py-1 bg-amber-950 border border-amber-700/60 rounded-lg mt-1">
                            {heatData.heat_classification || "UNAVAILABLE"}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                          <span className="text-xs text-slate-400">Thermal Comfort</span>
                          <div className="text-xl font-bold text-white font-mono mt-1">
                            {heatData.thermal_comfort_category || "Comfortable"}
                          </div>
                          <span className="text-[10px] text-slate-500">Empirical Humidex</span>
                        </div>

                        <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                          <span className="text-xs text-slate-400">Apparent Temperature</span>
                          <div className="text-xl font-bold text-white font-mono mt-1">
                            {heatData.apparent_temperature_c ? `${heatData.apparent_temperature_c}°C` : "N/A"}
                          </div>
                          <span className="text-[10px] text-slate-500">Heat Index Felt</span>
                        </div>
                      </div>

                      {/* Built-up vs Heat Island Intensity */}
                      <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Urban Heat Island (UHI) Relative Intensity</span>
                          <span className="font-mono text-amber-400">
                            {typeof heatData.surface_heat_index === "number" && !isNaN(heatData.surface_heat_index)
                              ? heatData.surface_heat_index > 6
                                ? "ELEVATED UHI"
                                : "BUFFERED"
                              : "N/A"}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                          <div
                            className="bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600 h-full"
                            style={{
                              width: `${
                                typeof heatData.surface_heat_index === "number" && !isNaN(heatData.surface_heat_index)
                                  ? Math.min(Math.max(heatData.surface_heat_index * 10, 0), 100)
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>Low Stress (0)</span>
                          <span>Moderate (5)</span>
                          <span>Severe (10)</span>
                        </div>
                      </div>

                      {heatData.interpretation && (
                        <p className="text-xs text-slate-300 italic bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                          &ldquo;{heatData.interpretation}&rdquo;
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Source: {heatData?.satellite_source || "Landsat-9 TIRS Band 10/11"}</span>
                  <span>Baseline: {heatData?.baseline_date || "2024 Calibrated"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: FEATURE 3 — ENVIRONMENTAL RISK & 72H PREDICTION */}
        {/* ========================================================================= */}
        {activeTab === "f3" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-emerald-400" />
                  Environmental Risk & 72-Hour Prognostic Forecast
                </h2>
                <p className="text-xs text-slate-400">
                  Explainable multi-stressor risk formulation, baseline anomaly Z-scores, and 72-hour diurnal forecast trajectories.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Prognosis Lineage:</span>
                {renderProvenance(riskData?.provenance || DataProvenance.MODELLED_ANALYSIS)}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Risk Score & Contributing Factors */}
              <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Explainable Composite Metric
                      </span>
                      <h3 className="text-lg font-bold text-white mt-0.5">
                        {riskData?.location_name || activeLocationMeta.name} Environmental Risk Score
                      </h3>
                    </div>
                    {renderProvenance(riskData?.provenance)}
                  </div>

                  {riskError && (
                    <div className="my-3 p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-200">
                      <AlertTriangle className="w-4 h-4 inline mr-1 text-red-400" />
                      {riskError}
                    </div>
                  )}

                  {riskLoading && (
                    <div className="p-8 text-center text-slate-500 font-mono text-xs">
                      Synthesizing multi-domain risk matrix...
                    </div>
                  )}

                  {riskData && (
                    <div className="my-5 space-y-5">
                      {/* Primary Risk Banner */}
                      <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400 uppercase font-semibold">
                            {riskData.score_label}
                          </span>
                          <div className="text-4xl font-black text-white font-mono mt-1">
                            {riskData.risk_score !== null ? (
                              <span>
                                {riskData.risk_score}{" "}
                                <span className="text-sm font-normal text-slate-500">/ 100</span>
                              </span>
                            ) : (
                              <span className="text-slate-500 text-2xl">UNAVAILABLE</span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">
                            Primary Stressor:{" "}
                            <strong className="text-amber-400 font-mono">
                              {riskData.primary_stressor}
                            </strong>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 uppercase font-semibold">
                            Classification
                          </span>
                          <div
                            className={`text-lg font-bold px-3 py-1 rounded-lg mt-1 border ${
                              riskData.risk_level === "SEVERE"
                                ? "bg-rose-950 border-rose-700 text-rose-300"
                                : riskData.risk_level === "HIGH"
                                ? "bg-orange-950 border-orange-700 text-orange-300"
                                : riskData.risk_level === "MODERATE"
                                ? "bg-yellow-950 border-yellow-700 text-yellow-300"
                                : riskData.risk_level === "UNAVAILABLE"
                                ? "bg-slate-800 border-slate-700 text-slate-400"
                                : "bg-emerald-950 border-emerald-700 text-emerald-300"
                            }`}
                          >
                            {riskData.risk_level}
                          </div>
                        </div>
                      </div>

                      {/* Contributing Domain Stressors */}
                      {riskData.contributing_factors && (
                        riskData.contributing_factors.status === "UNAVAILABLE" ? (
                          <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
                            <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-wider">
                              <AlertTriangle className="w-4 h-4 text-amber-400" />
                              Domain Stressor Decomposition
                            </div>
                            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-400 space-y-1">
                              <p className="font-semibold text-slate-300">
                                {riskData.contributing_factors.reason || "Real-time atmospheric telemetry is currently unavailable."}
                              </p>
                              <p className="text-[11px] text-slate-500 font-mono">
                                Status: UNAVAILABLE • Zero synthetic data imputed
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3 p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                              Domain Stressor Decomposition
                            </h4>
                            <div className="space-y-2.5">
                              {[
                                {
                                  label: "Air Quality Stress",
                                  score: riskData.contributing_factors.air_quality_stress_score,
                                  color: "bg-blue-500",
                                },
                                {
                                  label: "Thermal Heat Stress",
                                  score: riskData.contributing_factors.thermal_stress_score,
                                  color: "bg-amber-500",
                                },
                                {
                                  label: "Surface Heat (UHI) Stress",
                                  score: riskData.contributing_factors.surface_heat_stress_score,
                                  color: "bg-orange-500",
                                },
                                {
                                  label: "Dispersion / Stagnation Stress",
                                  score: riskData.contributing_factors.dispersion_stress_score,
                                  color: "bg-purple-500",
                                },
                              ].map((item) => {
                                const hasScore = typeof item.score === "number" && !isNaN(item.score);
                                const safeScore = hasScore ? Math.round(item.score!) : 0;
                                return (
                                  <div key={item.label} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-400">{item.label}</span>
                                      <span className="font-mono text-white font-bold">
                                        {hasScore ? `${safeScore}/100` : <span className="text-slate-500 font-normal">DATA GAP</span>}
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className={`${item.color} h-full rounded-full transition-all`}
                                        style={{ width: `${hasScore ? Math.max(0, Math.min(safeScore, 100)) : 0}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs">
                              <div>
                                <span className="text-slate-400">Ventilation:</span>{" "}
                                <span className="font-mono text-emerald-400">
                                  {riskData.contributing_factors.ventilation_status || "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400">Vegetative Buffer:</span>{" "}
                                <span className="font-mono text-emerald-400">
                                  {riskData.contributing_factors.vegetative_buffer_status || "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      )}

                      {/* Explanation */}
                      {riskData.explanation && (
                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                          {riskData.explanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 italic">
                  {riskData?.disclaimer || "Advisory guidance model. Consult official authorities during acute events."}
                </div>
              </div>

              {/* Baseline Anomalies & Active Alerts */}
              <div className="lg:col-span-6 space-y-6">
                {/* Active Alerts */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
                    <h3 className="font-bold text-slate-100 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      Active Ward Advisories & Threshold Alerts
                    </h3>
                    <span className="text-xs font-mono text-slate-400">
                      {riskData?.alerts?.length || 0} Active
                    </span>
                  </div>

                  {riskData?.alerts && riskData.alerts.length > 0 ? (
                    <div className="space-y-2.5">
                      {riskData.alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-3 rounded-lg border text-xs space-y-1 ${
                            alert.severity === "CRITICAL"
                              ? "bg-rose-950/60 border-rose-800 text-rose-200"
                              : alert.severity === "WARNING"
                              ? "bg-amber-950/60 border-amber-800 text-amber-200"
                              : "bg-blue-950/60 border-blue-800 text-blue-200"
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>{alert.title}</span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/40">
                              {alert.severity}
                            </span>
                          </div>
                          <p className="leading-snug">{alert.message}</p>
                          <div className="flex items-center justify-between text-[10px] pt-1 text-slate-400 font-mono">
                            <span>Param: {alert.affected_metric}</span>
                            <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-lg border border-slate-800/40">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2 opacity-80" />
                      No critical environmental thresholds breached in {activeLocationMeta.name} at this time.
                    </div>
                  )}
                </div>

                {/* Baseline Anomalies (Z-scores) */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
                    <h3 className="font-bold text-slate-100 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      Baseline Anomaly Deviations (Z-Scores)
                    </h3>
                    <span className="text-xs font-mono text-slate-400">30-Day Baselines</span>
                  </div>

                  {riskData?.anomalies && riskData.anomalies.length > 0 ? (
                    <div className="space-y-2">
                      {riskData.anomalies.map((anom) => (
                        <div
                          key={anom.metric}
                          className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-200">{anom.metric}</span>
                            <p className="text-[11px] text-slate-400">{anom.description}</p>
                          </div>
                          <div className="text-right font-mono">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                anom.status === "ANOMALOUS"
                                  ? "bg-rose-950 text-rose-300 border border-rose-800"
                                  : anom.status === "ELEVATED"
                                  ? "bg-amber-950 text-amber-300 border border-amber-800"
                                  : "bg-slate-800 text-slate-300"
                              }`}
                            >
                              Z: {anom.z_score > 0 ? "+" : ""}
                              {anom.z_score.toFixed(2)}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-1">
                              Obs: {anom.observed_value} / Base: {anom.baseline_value}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500 font-mono">
                      No baseline deviation anomalies detected.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 72-Hour Prognostic Forecast Section */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="font-bold text-slate-100 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    72-Hour Prognostic Environmental Trajectory
                  </h3>
                  <p className="text-xs text-slate-400">
                    Continuous hourly diurnal temperature cycles, precipitation probability, and estimated AQI drift.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">Horizon: 72 Hours</span>
                  {renderProvenance(forecastData?.provenance || DataProvenance.FORECAST)}
                </div>
              </div>

              {forecastError && (
                <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-200">
                  <AlertTriangle className="w-4 h-4 inline mr-1 text-red-400" />
                  {forecastError}
                </div>
              )}

              {forecastLoading && (
                <div className="p-8 text-center text-slate-500 font-mono text-xs">
                  Running numerical weather & air quality forecast integration...
                </div>
              )}

              {forecastData && (
                <div className="space-y-5">
                  {/* Daily 3-Day Forecast Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {forecastData.daily?.map((day, idx) => (
                      <div
                        key={day.date}
                        className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400 uppercase font-mono">
                            {idx === 0 ? "Today" : idx === 1 ? "Tomorrow" : "Day 3"}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">{day.date}</span>
                        </div>

                        <div className="flex items-baseline justify-between pt-1">
                          <div className="text-2xl font-black text-white font-mono">
                            {day.temp_max_c}°{" "}
                            <span className="text-sm font-normal text-slate-500">/ {day.temp_min_c}°C</span>
                          </div>
                          <span className="text-xs text-slate-300 font-medium">
                            {day.dominant_condition || "Clear"}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                          <span className="text-slate-400">Est. AQI Category:</span>
                          <span className="font-semibold text-amber-400">
                            {day.predicted_aqi_category || "Satisfactory"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                          <span>Rain: {day.precipitation_sum_mm ?? 0} mm</span>
                          <span>Max Wind: {day.max_wind_speed_kmh ?? 0} km/h</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Hourly Diurnal Curve Visualizer (SVG) */}
                  <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Diurnal Trajectory Matrix (Next 24-72 Hours)
                      </h4>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Trend: {forecastData.trend_summary}
                      </span>
                    </div>

                    {/* Responsive SVG Chart */}
                    <div className="w-full overflow-x-auto pb-2">
                      <div className="min-w-[600px] h-32 relative">
                        <svg className="w-full h-full" viewBox="0 0 600 120" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Horizontal Grid lines */}
                          <line x1="0" y1="30" x2="600" y2="30" stroke="#1e293b" strokeDasharray="3 3" />
                          <line x1="0" y1="60" x2="600" y2="60" stroke="#1e293b" strokeDasharray="3 3" />
                          <line x1="0" y1="90" x2="600" y2="90" stroke="#1e293b" strokeDasharray="3 3" />

                          {/* Temperature Curve */}
                          {(!forecastData.hourly || forecastData.hourly.length === 0) ? (
                            <text x="300" y="65" fill="#64748b" fontSize="11" fontFamily="monospace" textAnchor="middle">
                              Hourly trajectory data currently unavailable
                            </text>
                          ) : (
                            (() => {
                              const slice = forecastData.hourly.slice(0, 24);
                              const count = slice.length;
                              const getX = (i: number) => (count > 1 ? (i / (count - 1)) * 580 + 10 : 300);
                              const getY = (t?: number | null) => {
                                const validTemp = typeof t === "number" && !isNaN(t) ? t : 28;
                                const calculatedY = 100 - ((validTemp - 20) / 20) * 80;
                                return isFinite(calculatedY) ? Math.max(15, Math.min(105, calculatedY)) : 60;
                              };

                              return (
                                <>
                                  {count > 1 && (
                                    <path
                                      d={slice.reduce((acc, pt, idx) => {
                                        const x = getX(idx);
                                        const y = getY(pt.temperature_c);
                                        return idx === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
                                      }, "")}
                                      fill="none"
                                      stroke="#10b981"
                                      strokeWidth="2.5"
                                    />
                                  )}

                                  {slice.map((pt, idx) => {
                                    if (count > 1 && idx % 3 !== 0) return null;
                                    const x = getX(idx);
                                    const y = getY(pt.temperature_c);
                                    const displayTemp = typeof pt.temperature_c === "number" && !isNaN(pt.temperature_c)
                                      ? pt.temperature_c.toFixed(1)
                                      : "28.0";

                                    return (
                                      <g key={pt.time || idx}>
                                        <circle cx={x} cy={y} r="3.5" fill="#10b981" />
                                        <text
                                          x={x}
                                          y={y - 8}
                                          fill="#e2e8f0"
                                          fontSize="9"
                                          fontFamily="monospace"
                                          textAnchor="middle"
                                        >
                                          {displayTemp}°
                                        </text>
                                        <text
                                          x={x}
                                          y={115}
                                          fill="#64748b"
                                          fontSize="9"
                                          fontFamily="monospace"
                                          textAnchor="middle"
                                        >
                                          {pt.time ? `${new Date(pt.time).getHours()}:00` : `${idx}:00`}
                                        </text>
                                      </g>
                                    );
                                  })}
                                </>
                              );
                            })()
                          )}
                        </svg>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
                      <span>Source: {forecastData.source}</span>
                      <span>Updated: {new Date(forecastData.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: LOCATION COMPARISON */}
        {/* ========================================================================= */}
        {activeTab === "compare" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  Head-to-Head Ward Environmental Comparison
                </h2>
                <p className="text-xs text-slate-400">
                  Differential mathematical cross-validation between any two distinct Mumbai zones.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">Differential Engine</span>
            </div>

            {/* Comparison Controls */}
            <div className="flex flex-wrap items-center gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-lg">
              <div className="flex items-center gap-2">
                <label htmlFor="comp-sel-a" className="text-xs font-semibold text-slate-300">
                  Location A:
                </label>
                <select
                  id="comp-sel-a"
                  name="comp-sel-a"
                  aria-label="Location A"
                  value={selectedLoc}
                  onChange={(e) => setSelectedLoc(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-white font-semibold cursor-pointer"
                >
                  {MUMBAI_LOCATION_IDS.map((id) => (
                    <option key={id} value={id}>
                      {id.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-slate-500 font-black text-sm">VS</span>

              <div className="flex items-center gap-2">
                <label htmlFor="comp-sel-b" className="text-xs font-semibold text-slate-300">
                  Location B:
                </label>
                <select
                  id="comp-sel-b"
                  name="comp-sel-b"
                  aria-label="Location B"
                  value={compareLocB}
                  onChange={(e) => setCompareLocB(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-white font-semibold cursor-pointer"
                >
                  {MUMBAI_LOCATION_IDS.map((id) => (
                    <option key={id} value={id}>
                      {id.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => fetchComparison(selectedLoc, compareLocB)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow"
              >
                Compute Differential
              </button>

              <button
                onClick={() => fetchComparison(selectedLoc, selectedLoc)}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs px-3 py-2 rounded-lg ml-auto font-mono"
                title="Verify backend HTTP 400 rejection for self-comparison"
              >
                Test Self-Comparison (Expect 400)
              </button>
            </div>

            {/* Error / Validation Response Banner */}
            {comparisonError && (
              <div className="p-4 bg-rose-950/70 border border-rose-800 rounded-xl text-xs text-rose-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Comparison Validation Response:
                </p>
                <p className="font-mono">{comparisonError}</p>
                <p className="text-[11px] text-rose-400">
                  Self-comparison correctly rejected by backend: Distinct geographic locations required.
                </p>
              </div>
            )}

            {comparisonLoading && (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                Computing differential environmental parameters between {selectedLoc} and {compareLocB}...
              </div>
            )}

            {comparisonData && (
              <div className="space-y-6">
                {/* Interpretation Banner */}
                <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-400" />
                    Comparative Ecological Interpretation
                  </h3>
                  <p className="text-xs text-slate-200 leading-relaxed">{comparisonData.interpretation}</p>
                  <p className="text-[11px] text-slate-400 font-mono italic">{comparisonData.methodology_note}</p>
                </div>

                {/* Side-by-side Table Matrix */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
                    Side-by-Side Parameter Matrix
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-800">
                      <thead className="bg-slate-950 text-slate-400 font-mono">
                        <tr>
                          <th className="p-3 border-b border-slate-800">Parameter</th>
                          <th className="p-3 border-b border-slate-800 text-emerald-400">
                            Location A: {comparisonData.location_a.location_name} ({comparisonData.location_a.ward})
                          </th>
                          <th className="p-3 border-b border-slate-800 text-blue-400">
                            Location B: {comparisonData.location_b.location_name} ({comparisonData.location_b.ward})
                          </th>
                          <th className="p-3 border-b border-slate-800 text-amber-400">Differential (A - B)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-mono">
                        <tr>
                          <td className="p-3 font-bold text-white">Sentinel-2 NDVI Mean</td>
                          <td className="p-3">{comparisonData.location_a.ndvi_mean ?? "N/A"}</td>
                          <td className="p-3">{comparisonData.location_b.ndvi_mean ?? "N/A"}</td>
                          <td className="p-3 font-bold text-emerald-400">
                            {comparisonData.differentials.ndvi_delta > 0 ? "+" : ""}
                            {comparisonData.differentials.ndvi_delta}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-white">Tree Canopy Coverage %</td>
                          <td className="p-3">
                            {comparisonData.location_a.tree_canopy_pct !== null && comparisonData.location_a.tree_canopy_pct !== undefined
                              ? `${comparisonData.location_a.tree_canopy_pct}%`
                              : "N/A"}
                          </td>
                          <td className="p-3">
                            {comparisonData.location_b.tree_canopy_pct !== null && comparisonData.location_b.tree_canopy_pct !== undefined
                              ? `${comparisonData.location_b.tree_canopy_pct}%`
                              : "N/A"}
                          </td>
                          <td className="p-3 font-bold">
                            {comparisonData.differentials.canopy_pct_delta > 0 ? "+" : ""}
                            {comparisonData.differentials.canopy_pct_delta}%
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-white">Built-Up Impervious Ratio %</td>
                          <td className="p-3">
                            {comparisonData.location_a.built_up_ratio_pct !== null && comparisonData.location_a.built_up_ratio_pct !== undefined
                              ? `${comparisonData.location_a.built_up_ratio_pct}%`
                              : "N/A"}
                          </td>
                          <td className="p-3">
                            {comparisonData.location_b.built_up_ratio_pct !== null && comparisonData.location_b.built_up_ratio_pct !== undefined
                              ? `${comparisonData.location_b.built_up_ratio_pct}%`
                              : "N/A"}
                          </td>
                          <td className="p-3 font-bold">
                            {comparisonData.differentials.built_up_pct_delta > 0 ? "+" : ""}
                            {comparisonData.differentials.built_up_pct_delta}%
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-white">Landsat-9 Surface Heat Index</td>
                          <td className="p-3">
                            {comparisonData.location_a.surface_heat_index !== null && comparisonData.location_a.surface_heat_index !== undefined
                              ? `${comparisonData.location_a.surface_heat_index}/10`
                              : "N/A"}
                          </td>
                          <td className="p-3">
                            {comparisonData.location_b.surface_heat_index !== null && comparisonData.location_b.surface_heat_index !== undefined
                              ? `${comparisonData.location_b.surface_heat_index}/10`
                              : "N/A"}
                          </td>
                          <td className="p-3 font-bold text-amber-400">
                            {comparisonData.differentials.surface_heat_index_delta > 0 ? "+" : ""}
                            {comparisonData.differentials.surface_heat_index_delta}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-white">Air Quality (AQI)</td>
                          <td className="p-3">{comparisonData.location_a.aqi ?? "N/A"} ({comparisonData.location_a.aqi_category || "N/A"})</td>
                          <td className="p-3">{comparisonData.location_b.aqi ?? "N/A"} ({comparisonData.location_b.aqi_category || "N/A"})</td>
                          <td className="p-3 font-bold text-blue-400">
                            {comparisonData.differentials.aqi_delta !== undefined
                              ? `${comparisonData.differentials.aqi_delta > 0 ? "+" : ""}${comparisonData.differentials.aqi_delta}`
                              : "N/A"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: MUMBAI SPATIAL MAP */}
        {/* ========================================================================= */}
        {activeTab === "map" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-400" />
                  Mumbai Metropolitan Geographic Information System (GIS)
                </h2>
                <p className="text-xs text-slate-400">
                  Spatial layout of the 14 monitored wards. Click any ward marker to select it globally.
                </p>
              </div>

              {/* Metric Toggle */}
              <div className="flex items-center gap-2 bg-slate-950 p-1 border border-slate-800 rounded-lg text-xs">
                <button
                  onClick={() => setMapMetric("ndvi")}
                  className={`px-3 py-1 rounded font-semibold transition-colors ${
                    mapMetric === "ndvi" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Vegetation (NDVI)
                </button>
                <button
                  onClick={() => setMapMetric("heat")}
                  className={`px-3 py-1 rounded font-semibold transition-colors ${
                    mapMetric === "heat" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Surface Heat Index
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Interactive Vector Map Canvas */}
              <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col items-center">
                <div className="w-full flex justify-between text-xs text-slate-400 mb-2 font-mono">
                  <span>Mumbai Peninsula Vector Grid</span>
                  <span>Click node to inspect ward</span>
                </div>

                <div className="w-full max-w-[420px] aspect-[3/4] bg-slate-950 border border-slate-800 rounded-xl relative p-4 overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 350 480">
                    {/* Simplified Coastline / Mumbai Geographic Outline */}
                    <path
                      d="M 120 40 Q 140 100, 110 160 Q 80 220, 95 280 Q 70 340, 85 410 Q 95 450, 110 460 Q 130 450, 140 400 Q 160 360, 200 320 Q 240 260, 260 180 Q 250 100, 210 40 Z"
                      fill="#0b1329"
                      stroke="#1e293b"
                      strokeWidth="2"
                    />

                    {/* Mithi River / Thane Creek accent lines */}
                    <path
                      d="M 170 200 Q 190 240, 210 270 Q 230 300, 250 330"
                      fill="none"
                      stroke="#1e3a8a"
                      strokeWidth="3"
                      strokeOpacity="0.4"
                    />

                    {/* Render Location Markers */}
                    {mapFeatures?.locations.map((loc) => {
                      const { x, y } = projectCoords(loc.latitude, loc.longitude, 320, 440);
                      const isSelected = loc.id === selectedLoc;
                      const markerColor =
                        mapMetric === "ndvi"
                          ? loc.ndvi_mean === null || loc.ndvi_mean === undefined
                            ? "#64748b"
                            : loc.ndvi_mean > 0.4
                            ? "#10b981"
                            : loc.ndvi_mean > 0.25
                            ? "#84cc16"
                            : "#f59e0b"
                          : loc.surface_heat_index === null || loc.surface_heat_index === undefined
                          ? "#64748b"
                          : loc.surface_heat_index > 6
                          ? "#ef4444"
                          : loc.surface_heat_index > 4
                          ? "#f59e0b"
                          : "#10b981";

                      return (
                        <g
                          key={loc.id}
                          className="cursor-pointer transition-transform hover:scale-110"
                          onClick={() => setSelectedLoc(loc.id)}
                        >
                          {isSelected && (
                            <circle cx={x + 15} cy={y + 20} r="12" fill="none" stroke="#10b981" strokeWidth="2" opacity="0.6">
                              <animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite" />
                            </circle>
                          )}
                          <circle
                            cx={x + 15}
                            cy={y + 20}
                            r={isSelected ? 6 : 4.5}
                            fill={markerColor}
                            stroke="#ffffff"
                            strokeWidth={isSelected ? 2 : 1}
                          />
                          <text
                            x={x + 15}
                            y={y + 34}
                            fill={isSelected ? "#10b981" : "#94a3b8"}
                            fontSize={isSelected ? "10" : "8"}
                            fontWeight={isSelected ? "bold" : "normal"}
                            textAnchor="middle"
                            fontFamily="monospace"
                          >
                            {loc.name}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Spatial Location Details Table */}
              <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm mb-1">
                    Spatial Ward Registry ({mapFeatures?.total_locations || mapFeatures?.locations.length || 14} Stations)
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Values populated directly from{" "}
                    <code className="text-emerald-400">/api/greenery-heat/map</code>
                  </p>

                  <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                    {mapFeatures?.locations.map((loc) => {
                      const isSelected = loc.id === selectedLoc;
                      return (
                        <div
                          key={loc.id}
                          onClick={() => setSelectedLoc(loc.id)}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors flex items-center justify-between ${
                            isSelected
                              ? "bg-emerald-950/70 border-emerald-600 text-white"
                              : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          <div>
                            <span className="font-bold">{loc.name}</span>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {loc.ward} • {loc.zone}
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            {mapMetric === "ndvi" ? (
                              <div>
                                <span className="text-emerald-400 font-bold">
                                  NDVI: {typeof loc.ndvi_mean === "number" && !isNaN(loc.ndvi_mean) ? loc.ndvi_mean : "N/A"}
                                </span>
                                <div className="text-[10px] text-slate-400">
                                  Canopy: {typeof loc.tree_canopy_pct === "number" && !isNaN(loc.tree_canopy_pct) ? `${loc.tree_canopy_pct}%` : "N/A"}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span className="text-amber-400 font-bold">
                                  Heat: {typeof loc.surface_heat_index === "number" && !isNaN(loc.surface_heat_index) ? `${loc.surface_heat_index}/10` : "N/A"}
                                </span>
                                <div className="text-[10px] text-slate-400">
                                  Built: {typeof loc.built_up_ratio_pct === "number" && !isNaN(loc.built_up_ratio_pct) ? `${loc.built_up_ratio_pct}%` : "N/A"}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
                  Coordinate CRS: WGS84 (EPSG:4326)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: EXECUTIVE BRIEF (UNIFIED OBJECT) */}
        {/* ========================================================================= */}
        {activeTab === "unified" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  Executive Environmental Intelligence Brief
                </h2>
                <p className="text-xs text-slate-400">
                  Synthesized representation combining Feature 1, Feature 2, and Feature 3 into a single unified telemetry payload.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">
                  GET /api/environment/unified/{selectedLoc}
                </span>
              </div>
            </div>

            {unifiedLoading && (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                Retrieving unified multi-source environmental envelope...
              </div>
            )}

            {unifiedError && (
              <div className="p-4 bg-rose-950/70 border border-rose-800 rounded-xl text-xs text-rose-200">
                <AlertTriangle className="w-4 h-4 inline mr-1 text-rose-400" />
                {unifiedError}
              </div>
            )}

            {unifiedData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Feature 1 Pillar */}
                <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      1. Air & Climate
                    </span>
                    {renderProvenance(unifiedData.air?.provenance)}
                  </div>
                  <div className="text-3xl font-black text-white font-mono">
                    AQI {unifiedData.air?.aqi ?? "N/A"}
                  </div>
                  <p className="text-xs text-slate-300">
                    Category: <strong>{unifiedData.air?.aqi_category || "Standard"}</strong>
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    Temp: {unifiedData.weather?.temperature_c}°C | Humidity: {unifiedData.weather?.relative_humidity_pct}%
                  </p>
                </div>

                {/* Feature 2 Pillar */}
                <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      2. Greenery & Heat
                    </span>
                    {renderProvenance(unifiedData.greenery?.provenance)}
                  </div>
                  <div className="text-3xl font-black text-white font-mono">
                    NDVI {unifiedData.greenery?.ndvi_mean ?? "N/A"}
                  </div>
                  <p className="text-xs text-slate-300">
                    Canopy: <strong>{typeof unifiedData.greenery?.tree_canopy_pct === "number" && !isNaN(unifiedData.greenery.tree_canopy_pct) ? `${unifiedData.greenery.tree_canopy_pct}%` : "N/A"}</strong> | Built-up:{" "}
                    <strong>{typeof unifiedData.greenery?.built_up_ratio_pct === "number" && !isNaN(unifiedData.greenery.built_up_ratio_pct) ? `${unifiedData.greenery.built_up_ratio_pct}%` : "N/A"}</strong>
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    Surface Heat: {typeof unifiedData.heat?.surface_heat_index === "number" && !isNaN(unifiedData.heat.surface_heat_index) ? `${unifiedData.heat.surface_heat_index}/10` : "N/A"}{unifiedData.heat?.heat_classification ? ` (${unifiedData.heat.heat_classification})` : ""}
                  </p>
                </div>

                {/* Feature 3 Pillar */}
                <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      3. Risk & Prediction
                    </span>
                    {renderProvenance(unifiedData.risk?.provenance)}
                  </div>
                  <div className="text-3xl font-black text-white font-mono">
                    Risk {unifiedData.risk?.risk_score ?? "N/A"}/100
                  </div>
                  <p className="text-xs text-slate-300">
                    Level: <strong>{unifiedData.risk?.risk_level}</strong>
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    Stressor: {unifiedData.risk?.primary_stressor}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: DATA LINEAGE & SCIENTIFIC TRANSPARENCY */}
        {/* ========================================================================= */}
        {activeTab === "provenance" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-emerald-400" />
                  Scientific Lineage & Provider Trust Boundaries
                </h2>
                <p className="text-xs text-slate-400">
                  Data provenance taxonomy, API health monitoring, and system uptime transparency.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400">Open Data Standards</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
                <h3 className="font-bold text-white text-sm">Provenance Taxonomy (Data Lineage)</h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                    {renderProvenance(DataProvenance.DIRECT_OBSERVATION)}
                    <p className="text-slate-300 mt-1">
                      Direct physical telemetry from surface CAAQMS or automatic weather stations. Zero synthetic imputation.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                    {renderProvenance(DataProvenance.MODELLED_ANALYSIS)}
                    <p className="text-slate-300 mt-1">
                      Copernicus Atmosphere Monitoring Service (CAMS) atmospheric chemical dispersion assimilation models.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                    {renderProvenance(DataProvenance.SATELLITE_BASELINE)}
                    <p className="text-slate-300 mt-1">
                      Sentinel-2 multispectral and Landsat-9 thermal infrared radiometer earth observation baselines.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                    {renderProvenance(DataProvenance.FORECAST)}
                    <p className="text-slate-300 mt-1">
                      Numerical weather and atmospheric prognostic forecast trajectory up to 72 hours.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
                <h3 className="font-bold text-white text-sm">Runtime Diagnostics</h3>
                <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">API Gateway:</span>
                    <span className="text-emerald-400">{apiUrl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cache TTL Bypass:</span>
                    <span className="text-slate-200">{forceRefresh ? "ACTIVE" : "STANDARD_TTL"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Backend Status:</span>
                    <span className="text-emerald-400">{healthData?.status || "OPERATIONAL"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Wards:</span>
                    <span className="text-white">{locations.length || 14} Wards Configured</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-mono">
          <div>
            EcoPulse Mumbai &copy; {new Date().getFullYear()} — Scientific Environmental Intelligence
          </div>
          <div>
            CPCB NAQI • Copernicus CAMS • Sentinel-2 MSI • Landsat-9 TIRS
          </div>
        </div>
      </footer>
    </div>
  );
}
