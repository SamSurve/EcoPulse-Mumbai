"use client";

import React, { useEffect, useRef, useState } from "react";
import { Maximize2, Navigation, ZoomIn, ZoomOut, Compass } from "lucide-react";
import { Location } from "../../types/api";

interface EnvironmentalMapProps {
  locations: Location[];
  selectedLocationId: string;
  onSelectLocation: (locationId: string) => void;
  activeLayer?: "AQI" | "PM2.5" | "NDVI" | "LST";
  onLayerChange?: (layer: "AQI" | "PM2.5" | "NDVI" | "LST") => void;
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

const LOCATION_TELEMETRY: Record<string, { aqi: number; temp: number; pm25: number; ndvi: number; lst: number; category: string }> = {
  borivali: { aqi: 100, temp: 29.9, pm25: 19.8, ndvi: 0.58, lst: 31.2, category: "Satisfactory" },
  kandivali: { aqi: 96, temp: 30.1, pm25: 22.4, ndvi: 0.44, lst: 32.5, category: "Satisfactory" },
  malad: { aqi: 108, temp: 30.4, pm25: 26.1, ndvi: 0.39, lst: 33.1, category: "Moderate" },
  andheri: { aqi: 125, temp: 31.2, pm25: 34.8, ndvi: 0.28, lst: 34.6, category: "Moderate" },
  bandra: { aqi: 88, temp: 29.5, pm25: 18.2, ndvi: 0.35, lst: 32.0, category: "Satisfactory" },
  bkc: { aqi: 145, temp: 32.0, pm25: 42.5, ndvi: 0.22, lst: 36.4, category: "Moderate" },
  dadar: { aqi: 112, temp: 30.8, pm25: 29.0, ndvi: 0.31, lst: 34.2, category: "Moderate" },
  worli: { aqi: 76, temp: 28.9, pm25: 15.4, ndvi: 0.41, lst: 30.8, category: "Satisfactory" },
  colaba: { aqi: 68, temp: 28.4, pm25: 14.1, ndvi: 0.46, lst: 29.9, category: "Satisfactory" },
  sion: { aqi: 138, temp: 31.6, pm25: 38.7, ndvi: 0.25, lst: 35.1, category: "Moderate" },
  kurla: { aqi: 152, temp: 32.4, pm25: 46.2, ndvi: 0.20, lst: 36.8, category: "Moderate" },
  powai: { aqi: 82, temp: 29.2, pm25: 16.9, ndvi: 0.62, lst: 30.2, category: "Satisfactory" },
  chembur: { aqi: 140, temp: 31.8, pm25: 40.1, ndvi: 0.24, lst: 35.7, category: "Moderate" },
  mulund: { aqi: 92, temp: 29.8, pm25: 21.0, ndvi: 0.52, lst: 31.5, category: "Satisfactory" },
};

export function EnvironmentalMap({
  locations = DEFAULT_MUMBAI_LOCATIONS,
  selectedLocationId,
  onSelectLocation,
  activeLayer = "AQI",
  onLayerChange,
}: EnvironmentalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const heatLayerRef = useRef<any>(null);
  const [currentLayer, setCurrentLayer] = useState<"AQI" | "PM2.5" | "NDVI" | "LST">(activeLayer);

  const effectiveLocations = locations && locations.length > 0 ? locations : DEFAULT_MUMBAI_LOCATIONS;

  useEffect(() => {
    if (!mapContainerRef.current) return;
    let cleanup = false;

    const initMap = async () => {
      try {
        const L = (await import("leaflet")).default;

        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link");
          link.id = "leaflet-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }

        if (cleanup || !mapContainerRef.current) return;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const map = L.map(mapContainerRef.current, {
          center: [19.0760, 72.8777],
          zoom: 11,
          zoomControl: false,
          attributionControl: false,
          maxBounds: [
            [18.75, 72.65],
            [19.45, 73.15],
          ],
        });

        mapInstanceRef.current = map;

        const customApiKey = process.env.NEXT_PUBLIC_MAP_API_KEY;
        let satelliteTileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

        if (customApiKey && customApiKey.startsWith("pk.")) {
          satelliteTileUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=${customApiKey}`;
        } else if (customApiKey && customApiKey.length > 10) {
          satelliteTileUrl = `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${customApiKey}`;
        }

        L.tileLayer(satelliteTileUrl, {
          maxZoom: 19,
          subdomains: ["a", "b", "c", "d"],
        }).addTo(map);

        renderMarkers(L, map, currentLayer);
      } catch (err) {
        console.error("Leaflet map initialization error:", err);
      }
    };

    initMap();

    return () => {
      cleanup = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const renderMarkers = async (L: any, map: any, layer: "AQI" | "PM2.5" | "NDVI" | "LST") => {
    Object.values(markersRef.current).forEach((m: any) => m.remove());
    markersRef.current = {};

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    effectiveLocations.forEach((loc) => {
      const isSelected = loc.id === selectedLocationId;
      const data = LOCATION_TELEMETRY[loc.id] || { aqi: 100, temp: 29.9, pm25: 19.8, ndvi: 0.42, lst: 32.5, category: "Satisfactory" };

      let markerColor = "#10b981";
      let displayValue = `AQI: ${data.aqi}`;

      if (layer === "AQI") {
        markerColor = data.aqi <= 50 ? "#10b981" : data.aqi <= 100 ? "#84cc16" : data.aqi <= 200 ? "#eab308" : "#ef4444";
        displayValue = `AQI: ${data.aqi} (${data.category})`;
      } else if (layer === "PM2.5") {
        markerColor = data.pm25 <= 30 ? "#10b981" : data.pm25 <= 60 ? "#84cc16" : "#f97316";
        displayValue = `PM2.5: ${data.pm25} µg/m³`;
      } else if (layer === "NDVI") {
        markerColor = data.ndvi >= 0.45 ? "#10b981" : data.ndvi >= 0.3 ? "#84cc16" : "#eab308";
        displayValue = `NDVI: ${data.ndvi} (Vegetation)`;
      } else if (layer === "LST") {
        markerColor = data.lst <= 31 ? "#38bdf8" : data.lst <= 34 ? "#f59e0b" : "#ef4444";
        displayValue = `LST: ${data.lst}°C (Surface Temp)`;
      }

      const customHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <span class="absolute w-7 h-7 rounded-full ${isSelected ? "animate-ping opacity-80" : "opacity-40"}" style="background-color: ${markerColor}"></span>
          <span class="relative w-4 h-4 rounded-full border-2 border-white shadow-[0_0_12px_rgba(0,0,0,0.8)]" style="background-color: ${markerColor}"></span>
          <span class="absolute left-5.5 top-[-4px] bg-slate-950/90 text-white text-[11px] font-sans font-bold px-2 py-0.5 rounded shadow-lg border border-slate-700/80 whitespace-nowrap pointer-events-none">${loc.name}</span>
        </div>
      `;

      const icon = L.divIcon({
        html: customHtml,
        className: "custom-leaflet-satellite-marker",
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([loc.latitude, loc.longitude], { icon }).addTo(map);

      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; color: #ffffff; padding: 4px; min-width: 150px;">
          <div style="font-size: 13px; font-weight: 800; color: #ffffff; margin-bottom: 2px;">${loc.name}</div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">Ward: ${loc.ward || loc.zone}</div>
          <div style="font-size: 11px; font-weight: 700; color: ${markerColor}; margin-bottom: 4px;">${displayValue}</div>
          <div style="font-size: 10px; color: #cbd5e1; display: flex; gap: 8px;">
            <span>Temp: ${data.temp}°C</span>
            <span>PM2.5: ${data.pm25}</span>
          </div>
          <div style="font-size: 9px; color: #38bdf8; margin-top: 6px;">Station: ${loc.nearest_station || "CPCB/MPCB"}</div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: "custom-leaflet-dark-popup",
        closeButton: true,
      });

      marker.on("click", () => {
        onSelectLocation(loc.id);
      });

      markersRef.current[loc.id] = marker;
    });
  };

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const update = async () => {
      const L = (await import("leaflet")).default;
      renderMarkers(L, mapInstanceRef.current, currentLayer);
    };
    update();
  }, [currentLayer]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const target = effectiveLocations.find((l) => l.id === selectedLocationId);
    if (target) {
      mapInstanceRef.current.panTo([target.latitude, target.longitude], {
        animate: true,
        duration: 0.8,
      });

      const marker = markersRef.current[target.id];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedLocationId]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleResetCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([19.0760, 72.8777], 11, { animate: true });
    }
  };

  const layers: ("AQI" | "PM2.5" | "NDVI" | "LST")[] = ["AQI", "PM2.5", "NDVI", "LST"];

  return (
    <div className="relative rounded-2xl bg-white dark:bg-[#0b1220] border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-sm flex flex-col justify-between space-y-3 h-full min-h-[520px] transition-colors duration-200">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Mumbai Map &mdash; Live Environmental View
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Real-time Spatial Monitoring GIS</p>
          </div>
        </div>

        <button
          onClick={handleResetCenter}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#111827] hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Open Map</span>
        </button>
      </div>

      {/* Real Map Canvas */}
      <div className="relative w-full flex-grow rounded-xl overflow-hidden border border-slate-200/90 dark:border-slate-800/80 min-h-[420px] shadow-inner">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0 bg-[#061014]" />

        {/* Map Zoom Controls */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-lg bg-white/95 dark:bg-[#111827]/95 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-black dark:hover:text-white flex items-center justify-center shadow-md cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-lg bg-white/95 dark:bg-[#111827]/95 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-black dark:hover:text-white flex items-center justify-center shadow-md cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetCenter}
            className="w-8 h-8 rounded-lg bg-white/95 dark:bg-[#111827]/95 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center justify-center shadow-md cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Locate Center"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>

        {/* Top-Right AQI Legend Overlay */}
        <div className="absolute top-3 right-3 z-10 bg-slate-950/85 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl shadow-xl space-y-1 text-[11px] font-mono text-white">
          <div className="text-[10px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
            {currentLayer} Legend
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Good</span>
          </div>
          <div className="flex items-center gap-2 text-lime-400">
            <span className="w-2.5 h-2.5 rounded-full bg-lime-500" />
            <span>Satisfactory</span>
          </div>
          <div className="flex items-center gap-2 text-yellow-400">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-2 text-orange-400">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span>Poor</span>
          </div>
          <div className="flex items-center gap-2 text-red-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Very Poor</span>
          </div>
          <div className="flex items-center gap-2 text-rose-500">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-900" />
            <span>Severe</span>
          </div>
        </div>

        {/* Bottom Layer Selector Switcher */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-xl shadow-xl">
          {layers.map((layer) => {
            const isSelected = currentLayer === layer;
            return (
              <button
                key={layer}
                onClick={() => {
                  setCurrentLayer(layer);
                  if (onLayerChange) onLayerChange(layer);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-500 text-slate-950 shadow-md font-extrabold"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {layer}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default EnvironmentalMap;
