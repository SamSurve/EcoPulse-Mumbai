# EcoPulse Mumbai — Backend & Frontend Integration Guide

This guide provides frontend engineers with the exact technical specifications, API contracts, provenance definitions, and failure handling policies for the EcoPulse Mumbai platform.

---

## 1. Backend Startup & Connection

### Local Development Startup
```bash
# From repository root or backend/ directory:
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
# or if running inside backend/:
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### URLs & Ports
* **API Base URL:** `http://localhost:8000/api`
* **Interactive OpenAPI Swagger Docs:** `http://localhost:8000/docs`
* **Built-in Web Dashboard UI:** `http://localhost:8000/dashboard` (or `http://localhost:8000/` in any web browser)

### CORS Policy
The backend dynamically configures CORS origins from `CORS_ORIGINS` in `.env` (default: `http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000`):
* Allowed origins: Configurable comma-separated origins.
* Allowed methods: `GET`, `OPTIONS`, `POST`, `PUT`, `DELETE`.
* Allowed headers: `*`.
* Supports `allow_credentials=True` when specific origins are declared.

---

## 2. Supported Mumbai Locations (14 Micro-Locations)

Always fetch the authoritative list of supported locations dynamically:
```http
GET /api/locations
```

**Supported Location Slugs:**
`borivali`, `kandivali`, `malad`, `andheri`, `bandra`, `bkc`, `dadar`, `worli`, `colaba`, `sion`, `kurla`, `powai`, `chembur`, `mulund`.

---

## 3. Core API Endpoint Catalog

| Endpoint | Method | Response Schema | Description |
| :--- | :---: | :--- | :--- |
| `/api/locations` | `GET` | `Location[]` | List all 14 supported Mumbai areas with coordinates and wards |
| `/api/locations/{id}` | `GET` | `Location` | Metadata for a specific location |
| `/api/environment/{id}` | `GET` | `UnifiedEnvironmentResponse` | **Main Dashboard Endpoint**: Returns location, air, weather, greenery, heat, risk, forecast, metadata |
| `/api/air-quality/{id}` | `GET` | `AirData` | Feature 1: CPCB NAQI, dominant pollutant, PM2.5, PM10, NO2, SO2, CO, O3 |
| `/api/microclimate/{id}` | `GET` | `WeatherData` | Feature 1: Temperature, apparent heat index, humidity, wind, pressure |
| `/api/greenery/{id}` | `GET` | `GreeneryData` | Feature 2: Sentinel-2 NDVI (10m), tree canopy %, built-up ratio, trend |
| `/api/heat/{id}` | `GET` | `HeatData` | Feature 2: Landsat TIRS surface heat index (1–10), thermal comfort |
| `/api/environment/compare` | `GET` | `AreaComparisonResponse` | Feature 2: Compare two areas (e.g. `?location_a=borivali&location_b=andheri`) |
| `/api/greenery-heat/map` | `GET` | `MumbaiMapDataResponse` | Feature 2: Spatial GIS overlay data for all 14 locations across Mumbai |
| `/api/risk/{id}` | `GET` | `RiskData` | Feature 3: EcoPulse Risk Score (0–100), reasoning, anomalies, alerts |
| `/api/forecast/{id}` | `GET` | `ForecastData` | Feature 3: 72-hour practical forecast (hourly, daily, trend summary) |
| `/api/risk/{id}/summary` | `GET` | Compact JSON | Feature 3: High-level summary of risk, alerts count, and outlook |

*Query Parameter:* Append `?force_refresh=true` to any environment or forecast endpoint to bypass the 15-minute in-memory TTL cache and trigger a fresh external query.

---

## 4. Primary Data Models

### Unified Environment Payload (`/api/environment/{id}`)
```json
{
  "location": {
    "id": "borivali",
    "name": "Borivali",
    "latitude": 19.2307,
    "longitude": 72.8567,
    "zone": "Western Suburbs",
    "ward": "R/C",
    "nearest_station": "Borivali East, Mumbai - MPCB"
  },
  "air": {
    "aqi": 128,
    "aqi_category": "Moderate",
    "aqi_calculation_method": "CPCB NAQI Standard (Max Sub-Index of >=3 Pollutants with PM)",
    "dominant_pollutant": "PM2.5",
    "pollutants_monitored_count": 6,
    "pm25": { "value": 46.2, "unit": "µg/m³", "naqi_sub_index": 128, "category": "Moderate", "provenance": "MODELLED_ANALYSIS", "is_available": true },
    "pm10": { "value": 84.0, "unit": "µg/m³", "naqi_sub_index": 84, "category": "Satisfactory", "provenance": "MODELLED_ANALYSIS", "is_available": true },
    "no2": { "value": 32.1, "unit": "µg/m³", "naqi_sub_index": 40, "category": "Good", "provenance": "MODELLED_ANALYSIS", "is_available": true },
    "so2": { "value": 14.5, "unit": "µg/m³", "naqi_sub_index": 18, "category": "Good", "provenance": "MODELLED_ANALYSIS", "is_available": true },
    "co": { "value": 0.85, "unit": "mg/m³", "naqi_sub_index": 42, "category": "Good", "provenance": "MODELLED_ANALYSIS", "is_available": true },
    "o3": { "value": 44.0, "unit": "µg/m³", "naqi_sub_index": 44, "category": "Good", "provenance": "MODELLED_ANALYSIS", "is_available": true },
    "provenance": "MODELLED_ANALYSIS"
  },
  "weather": {
    "temperature_c": 31.8,
    "apparent_temperature_c": 37.2,
    "relative_humidity_pct": 74.0,
    "wind_speed_kmh": 14.8,
    "wind_cardinal": "WSW",
    "provenance": "DIRECT_OBSERVATION"
  },
  "greenery": {
    "ndvi_mean": 0.58,
    "greenery_classification": "HIGH VEGETATION",
    "tree_canopy_pct": 48.2,
    "built_up_ratio_pct": 42.5,
    "vegetation_change_5yr_pct": 1.2,
    "provenance": "SATELLITE_BASELINE"
  },
  "heat": {
    "surface_heat_index": 3.8,
    "heat_classification": "LOW",
    "thermal_comfort_category": "Comfortable",
    "provenance": "SATELLITE_BASELINE"
  },
  "risk": {
    "score_label": "EcoPulse Environmental Risk Score",
    "risk_score": 42,
    "risk_level": "MODERATE",
    "primary_stressor": "Air Quality & Particulate Loading",
    "contributing_factors": {
      "air_quality_stress_score": 51.2,
      "thermal_stress_score": 44.3,
      "surface_heat_stress_score": 38.0,
      "dispersion_stress_score": 35.0,
      "ventilation_status": "MODERATE",
      "vegetative_buffer_status": "STRONG"
    },
    "explanation": "EcoPulse Environmental Risk in Borivali is assessed as MODERATE (Score: 42/100)...",
    "anomalies": [],
    "alerts": [],
    "disclaimer": "Application-level environmental risk indicator. Not an official CPCB/BMC or medical risk classification."
  },
  "forecast": {
    "forecast_hours": 72,
    "trend_summary": "Air quality is forecast to remain broadly stable over the next 72 hours...",
    "hourly": [ ... ],
    "daily": [ ... ],
    "provenance": "FORECAST"
  },
  "metadata": {
    "cached": false,
    "data_freshness": "Real-time Observation / Modelled Forecast"
  }
}
```

---

## 5. Data Transparency & Provenance Dictionary

Every block and pollutant declares an authoritative `provenance` string. Display these badges in the UI to guarantee scientific credibility:

| Provenance Key | Meaning | Visual Badge Color | Example |
| :--- | :--- | :---: | :--- |
| `DIRECT_OBSERVATION` | Real-time physical observation or sensor downlink | Emerald / Green | Live temperature, wind, CAAQM station |
| `MODELLED_ANALYSIS` | Assimilated atmospheric numerical model | Blue / Cyan | Open-Meteo CAMS air quality grid |
| `SATELLITE_BASELINE` | Multi-temporal Copernicus or Landsat surface composite | Teal | Sentinel-2 NDVI, Landsat TIRS heat index |
| `FORECAST` | 72-hour forward-looking numerical projection | Purple / Violet | 72h hourly temperature, precipitation |
| `BASELINE_COMPARISON`| Statistical reference comparison (Z-score) | Amber / Orange | PM2.5 seasonal anomaly deviation |
| `UNAVAILABLE` | Channel is unmonitored or sensor offline | Gray / Slate | Missing SO2 sensor channel |
| `DATA_GAP` | Network or hardware failure with no valid fallback | Red | Complete provider network failure |

---

## 6. Zero-Fabrication & Unavailable-Data Rules

Frontend engineers must strictly adhere to the project's **Zero-Fabrication Mandate**:
1. **Never substitute `0` for missing data.** If a pollutant concentration is missing or `is_available: false`, display the text `UNAVAILABLE`.
2. **Never invent fake charts.** The 72-hour forecast timeline must only plot the points supplied by the `/api/forecast/{id}` payload.
3. **Never present forecasts as current observations.** Forecast points are forward projections and must be clearly demarcated under the `FORECAST` banner.
4. **Never present satellite baselines as instantaneous downlinks.** Sentinel-2 NDVI and Landsat surface heat indices are multi-temporal baseline composites (`SATELLITE_BASELINE`).

---

## 7. Error Handling & Status Codes

| HTTP Status | Trigger Scenario | Handling in Frontend |
| :---: | :--- | :--- |
| `200 OK` | Request succeeded | Render normal state |
| `400 Bad Request` | Identical location comparison (e.g. `bandra` vs `bandra`) | Display warning modal: *"Please select two distinct locations"* |
| `404 Not Found` | Location slug not in Mumbai registry | Display location not found banner with redirect to location dropdown |
| `500 Internal Error` | Unhandled backend exception | Display error banner with retry button |
