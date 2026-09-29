# ECOPULSE MUMBAI — MASTER ENGINEERING SPECIFICATION
## Comprehensive Product Blueprint, Technical Architecture, and Phased Roadmap
**Document Version:** 1.0.0 (Master Engineering Baseline)  
**Governing Standard:** Prompt 3 — Master Engineering Instruction & Prompt 2 — Project-Specific Master Instruction  
**Date:** September 2026  
**Status:** Approved for Phased Execution  

---

## 1. Project Understanding & Problem Formulation

### 1.1 Project Purpose & Core Problem
Mumbai is a coastal megacity of over 21 million inhabitants with a uniquely challenging environmental profile:
* High maritime humidity coupled with seasonal temperature inversions that trap atmospheric particulates.
* Intense hyper-local microclimate variations: coastal promenades (Colaba, Worli) have marine dispersal, while inland traffic basins (Kurla, BKC, Andheri) suffer acute pollutant concentrations and urban heat islands.
* Severe green cover disparities: Dense mangrove corridors and Sanjay Gandhi National Park (Borivali) contrast sharply with impervious, high-density concrete corridors (Dadar, Kurla, Lower Parel).

Existing solutions are either **passive national dashboards** (displaying city-wide numbers without hyper-local context) or **commercial scrap/weather apps** that provide raw scientific metrics without explaining the underlying environmental risk.

**EcoPulse Mumbai** solves this by delivering an automated, software-only environmental intelligence platform that synthesizes:
1. Ground-truth monitoring stations (CPCB / MPCB / SAFAR via OpenAQ API v3).
2. Numerical atmospheric models (Copernicus CAMS via Open-Meteo Air Quality).
3. Localized microclimate data (Open-Meteo Weather).
4. Satellite-derived surface indicators (Sentinel-2 NDVI, Landsat thermal proxies, BMC ward boundaries).
5. Statistical anomaly detection and short-term forecasting.

### 1.2 Target Users & User Needs
| User Persona | Core Problem / Need | How EcoPulse Mumbai Solves It |
| :--- | :--- | :--- |
| **Citizens & Commuters** | "Is it safe to jog in Bandra this morning? Why is the air heavy in Kurla?" | Translates raw $\mu g/m^3$ readings into plain-English, actionable health risk explanations with optimal timing windows. |
| **Students & Researchers** | Need reliable, transparent environmental data with verified station names, distance, and timestamps. | Displays full data provenance (`DIRECT_OBSERVATION` vs `MODELLED_ANALYSIS`), station distances, and zero fabricated data. |
| **Urban Planners & RWAs** | "How does our neighborhood's tree canopy and heat retention compare with other wards?" | Side-by-side area comparison (e.g. Borivali vs Andheri) evaluating NDVI, tree canopy %, built-up ratio, and surface thermal retention. |

### 1.3 Scope Boundary: Exactly Three Major Features
In strict accordance with the Master Instruction, the platform has **exactly three major product features**:
* **Feature 1:** Air & Microclimate
* **Feature 2:** Greenery & Heat Analysis
* **Feature 3:** Environmental Risk & Prediction
No unrelated features (e.g. personal carbon score diaries, commercial e-commerce, sensor hardware) will be introduced.

### 1.4 Technical Assumptions & Known Constraints
1. **Software-Only Constraint:** No physical IoT sensors or proprietary hardware.
2. **Zero Fabrication Policy:** If a physical monitoring station does not report a metric (e.g., $SO_2$ sensor offline), the system reports `UNAVAILABLE` or `DATA_GAP`. It never synthesizes or mocks real-time data silently.
3. **Data Provenance Transparency:** Every metric displays its origin badge:
   * `DIRECT_OBSERVATION`: Physical ground-station sensor (shows station name & distance).
   * `MODELLED_ANALYSIS`: Assimilated numerical atmospheric model (CAMS).
   * `FORECAST`: Predictive numerical model with communicated uncertainty.
   * `ESTIMATED_INTERPOLATION`: Distance-weighted spatial interpolation.
4. **API Limits & Resiliency:** OpenAQ API v3 requires `X-API-Key` (60 req/min). Open-Meteo provides 10,000 req/day. Backend caching (TTL 15–60 mins) is mandatory to prevent throttling and guarantee sub-second frontend responses.

---

## 2. Requirements Specification

### 2.1 Functional Requirements (FR)

#### General & Navigation
* **FR-01 (Location Selection):** User must be able to select from 14 verified Mumbai locations (Borivali, Kandivali, Malad, Andheri, Bandra, BKC, Dadar, Worli, Colaba, Sion, Kurla, Powai, Chembur, Mulund) via a searchable dropdown or an interactive map.
* **FR-02 (Interactive Map):** System must provide an interactive GIS map of Mumbai rendering ward boundaries, location markers, and thematic layer toggles.
* **FR-03 (Data Provenance & Freshness):** Every environmental card must display the data source, monitoring station name, distance from selected area ($km$), timestamp, and freshness indicator.

#### Feature 1: Air & Microclimate
* **FR-04 (Pollutant Matrix):** System must display real-time concentrations for available pollutants: $PM_{2.5}, PM_{10}, NO_2, SO_2, CO, O_3$. Unavailable pollutants must be labeled as `UNAVAILABLE`.
* **FR-05 (CPCB NAQI Index):** System must calculate the official Indian National Air Quality Index (NAQI) sub-indices and overall category (Good, Satisfactory, Moderate, Poor, Very Poor, Severe) following CPCB standard breakpoint formulas.
* **FR-06 (Microclimate Metrics):** System must display ambient temperature (°C), relative humidity (%), apparent heat index (°C), wind speed ($km/h$), wind direction (degrees & cardinal), precipitation ($mm$), and solar radiation ($W/m^2$).
* **FR-07 (Historical Timeseries):** System must render interactive 24-hour and 7-day trend charts for $PM_{2.5}, PM_{10}$, and Temperature.

#### Feature 2: Greenery & Heat Analysis
* **FR-08 (Satellite Surface Indicators):** System must display mean NDVI, vegetative canopy cover %, built-up impervious surface %, and surface heat proxy (1–10 scale) for the selected area.
* **FR-09 (Thematic Map Overlays):** Interactive map must support switching between **Vegetation Density (NDVI)** and **Urban Heat Intensity** choropleth layers.
* **FR-10 (Cross-Area Comparison):** User must be able to select any two supported Mumbai areas (e.g., *Borivali vs Andheri*) and view a side-by-side comparative analysis of green canopy, built-up density, surface heat, and air pollution.

#### Feature 3: Environmental Risk & Prediction
* **FR-11 (Statistical Anomaly Detection):** System must detect unusual environmental conditions relative to a 30-day baseline using Z-Scores ($|Z| \ge 2.0$) and Interquartile Range (IQR) outlier rules.
* **FR-12 (72-Hour Forecast):** System must project hourly $PM_{2.5}$, Temperature, and AQI for the next 72 hours, rendering uncertainty bounds ($P_{10}$ to $P_{90}$) and explicit model disclaimers.
* **FR-13 (Explainable Environmental Risk):** System must compute a composite risk score (1–100) and risk level (`LOW`, `MODERATE`, `HIGH`, `SEVERE`), accompanied by a clear, natural-language breakdown explaining the primary contributing physical stressors.
* **FR-14 (Configurable Environmental Alerts):** System must generate context-aware alerts (e.g., vulnerable population warnings, morning smog inversion warnings, extreme heat caution).

### 2.2 Non-Functional Requirements (NFR)

* **NFR-01 (Performance & Latency):** Backend API response time for cached location data must be $< 250\text{ ms}$. Uncached external requests must resolve in $< 2.0\text{ s}$.
* **NFR-02 (Reliability & Fault Tolerance):** Upstream provider failure (e.g. OpenAQ timeout or rate limit) must not crash the application. System must automatically fall back to cached data or CAMS atmospheric models with clear provenance labeling.
* **NFR-03 (Security):** Zero hardcoded API keys. All third-party secrets stored exclusively in server-side environment variables. Input validation on all coordinates and location identifiers.
* **NFR-04 (Usability & Responsiveness):** Fully responsive layout optimized for desktop, tablet, and mobile screens ($360\text{px}$ to $2560\text{px}$). Clean, modern typography and WCAG AA contrast compliance.
* **NFR-05 (Maintainability & Clean Architecture):** Clean decoupling between data adapters, business logic/analytics, and API presentation. Strict Pydantic models in FastAPI and TypeScript interfaces in Next.js.

---

## 3. Acceptance Criteria

| Feature Area | Measurable Acceptance Criteria |
| :--- | :--- |
| **Location & Map** | 1. Selecting any of the 14 locations updates the active environmental view within 300ms.<br>2. Map pins and ward boundary highlights accurately align with geographic coordinates.<br>3. Invalid or unsupported location requests return a graceful 404 with a structured error payload. |
| **Air & Microclimate** | 1. Current pollutant concentrations reflect verified readings from OpenAQ v3 or Open-Meteo CAMS.<br>2. CPCB NAQI sub-index mathematically matches the CPCB breakpoint table.<br>3. If $SO_2$ is unmonitored at a station, UI displays `UNAVAILABLE` badge without throwing errors or showing synthetic zeros.<br>4. Station name, coordinates, distance ($km$), and timestamp are clearly visible. |
| **Greenery & Heat** | 1. Mean NDVI, canopy cover %, and built-up % render for all 14 locations based on satellite baselines.<br>2. Map overlay switches seamlessly between Greenery and Surface Heat views.<br>3. Cross-area comparison (e.g. Borivali vs Andheri) clearly displays relative differences (e.g., Borivali canopy > Andheri, Andheri built-up > Borivali). |
| **Risk & Prediction** | 1. Risk engine produces a level (`LOW`, `MODERATE`, `HIGH`, `SEVERE`) and an explainable reason string citing exact physical causes.<br>2. Anomaly detector accurately flags simulated or real spikes ($Z \ge 2.0$).<br>3. 72-hour forecast displays confidence intervals with clear disclaimers of numerical model uncertainty. |
| **Resilience & Fallback** | 1. When OpenAQ API returns 429 or timeout, backend seamlessly serves Open-Meteo CAMS data tagged as `MODELLED_ANALYSIS`.<br>2. The frontend displays a subtle "Serving assimilated model data" banner rather than crashing. |

---

## 4. Existing Codebase Audit

### 4.1 Workspace Inspection
* **Path:** `e:\ESE PROJECT`
* **Current Contents:**
  * `PROJECT_DISCOVERY_AND_FEASIBILITY_REPORT.md` (Research discovery document from earlier phase)
  * `ECOPULSE_MUMBAI_BLUEPRINT.md` (Preliminary architectural outline)
* **Code State:** Green-field implementation. No legacy code, technical debt, or existing broken modules to preserve or refactor. Clean slate ready for structured engineering.

---

## 5. Product Blueprint & User Flows

### 5.1 Screen & Navigation Hierarchy
```
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       ECOPULSE MUMBAI                                         │
│  [Logo] [Location Selector Dropdown ▼] [Search Bar]               [Last Updated: 12m ago] [⚡] │
├───────────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────┐ ┌──────────────────────────────────────────┐ │
│ │             INTERACTIVE GIS MAP              │ │         ENVIRONMENTAL OVERVIEW           │ │
│ │  - 14 Clickable Ward Pins (Borivali, etc.)   │ │  - Primary NAQI Badge: 142 (Moderate)    │ │
│ │  - Layer Toggles: [Air] [Greenery] [Heat]    │ │  - Temp: 31.4°C | Hum: 78% | Wind: 14km/h│ │
│ │  - Ward boundary polygons                    │ │  - Station: MPCB BKC (1.2 km away)       │ │
│ └──────────────────────────────────────────────┘ └──────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ [Tab 1: Air & Microclimate]  [Tab 2: Greenery & Heat Analysis]  [Tab 3: Risk & Prediction]│ │
│ └───────────────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ TAB 1: AIR & MICROCLIMATE VIEW                                                            │ │
│ │ • 6 Pollutant Cards (PM2.5, PM10, NO2, SO2, CO, O3) with CPCB NAQI sub-index & status    │ │
│ │ • Microclimate Metrics (Heat Index, Solar Radiation, Barometric Pressure, Wind Compass)   │ │
│ │ • 24-Hour & 7-Day Interactive Historical Trend Chart with Parameter Toggles               │ │
│ └───────────────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ TAB 2: GREENERY & HEAT VIEW                                                               │ │
│ │ • Satellite Metrics: Mean NDVI (0.42), Tree Canopy (31%), Built-Up (64%), LST Proxy (6.2) │ │
│ │ • Ecological Interpretation & 5-Year Canopy Trend                                         │ │
│ │ • Area Comparison Drawer: Compare Selected Location vs Any Other Area (e.g. Borivali)    │ │
│ └───────────────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ TAB 3: ENVIRONMENTAL RISK & PREDICTION VIEW                                               │ │
│ │ • Composite Risk Gauge (Score: 68/100 - Moderate Risk)                                    │ │
│ │ • "Why is Risk Elevated?" Plain-English Stressor Explanation Card                         │ │
│ │ • Active Anomaly Alerts (e.g. PM2.5 Z-Score = +2.4 Spike flagged)                         │ │
│ │ • 72-Hour Future Trend Projection with Uncertainty Range Shading                          │ │
│ └───────────────────────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Technical Blueprint & Architecture

### 6.1 System Architecture Diagram
```
+───────────────────────────────────────────────────────────────────────────────────────────────+
|                                        CLIENT LAYER                                           |
|                            Next.js 15 (App Router) + TypeScript                               |
|                            Tailwind CSS + Lucide Icons + Recharts                             |
|                            Leaflet / MapLibre for Mumbai GIS                                  |
+───────────────────────────────────────────────────────────────────────────────────────────────+
                                                │
                                      HTTP REST (JSON)
                                                │
+───────────────────────────────────────────────────────────────────────────────────────────────+
|                                     BACKEND API LAYER                                         |
|                                    FastAPI (Python 3.11+)                                     |
|                                                                                               |
|  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────┐ |
|  | /api/locations   |  | /api/environment |  | /api/air-quality |  | /api/greenery-heat     | |
|  | /api/compare     |  | /api/risk        |  | /api/forecast    |  | /api/history           | |
|  └──────────────────┘  └──────────────────┘  └──────────────────┘  └────────────────────────┘ |
|                                               │                                               |
|  ┌────────────────────────────────────────────┴────────────────────────────────────────────┐  |
|  │                           Business Logic & Analytics Core                                │  |
|  │  • CPCB NAQI Breakpoint Engine              • Coastal Heat Index Formulator             │  |
|  │  • Rolling 30-Day Z-Score Anomaly Detector  • Explainable Natural-Language Reasoner     │  |
|  │  • Short-term Forecast Uncertainty Builder  • In-Memory TTL Cache (15-60 min)           │  |
|  └─────────────────────────────────────────────────────────────────────────────────────────┘  |
|                                               │                                               |
|  ┌────────────────────────────────────────────┴────────────────────────────────────────────┐  |
|  │                               Provider Adapter Layer                                     │  |
|  │  ┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────────┐  │  |
|  │  │   OpenAQ v3 Adapter    │  │ Open-Meteo Air Quality │  │   Open-Meteo Weather       │  │  |
|  │  │ (Physical CAAQM Ground)│  │ (CAMS Modelled Grid)   │  │ (Microclimate & Forecast)  │  │  |
|  │  └────────────────────────┘  └────────────────────────┘  └────────────────────────────┘  │  |
|  │  ┌────────────────────────────────────────────────────────────────────────────────────┐  │  |
|  │  │  Geospatial Satellite Store (Sentinel-2 NDVI & Landsat Surface Heat Vectors)       │  │  |
|  │  └────────────────────────────────────────────────────────────────────────────────────┘  │  |
|  └──────────────────────────────────────────────────────────────────────────────────────────┘  |
+───────────────────────────────────────────────────────────────────────────────────────────────+
```

### 6.2 Directory Structure
```
e:/ESE PROJECT/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI app bootstrap, CORS, routers
│   │   ├── config.py                   # Pydantic Settings (env vars, secrets, TTLs)
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py              # Normalized Pydantic models for all data
│   │   ├── data/
│   │   │   ├── __init__.py
│   │   │   ├── locations.py            # 14 Mumbai location profiles & coordinates
│   │   │   └── satellite_baseline.py   # Sentinel-2 NDVI & Landsat LST dataset
│   │   ├── adapters/
│   │   │   ├── __init__.py
│   │   │   ├── base.py                 # Abstract Base Provider Adapter
│   │   │   ├── openaq_adapter.py       # OpenAQ v3 CPCB ground station client
│   │   │   ├── openmeteo_adapter.py    # Open-Meteo air quality & weather client
│   │   │   └── satellite_adapter.py    # Geospatial surface metrics reader
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── cache.py                # In-memory TTL caching layer
│   │   │   ├── naqi_calculator.py      # Official CPCB NAQI math engine
│   │   │   ├── anomaly_detector.py     # Statistical Z-score & IQR outlier engine
│   │   │   ├── risk_engine.py          # Explainable multi-factor risk model
│   │   │   └── environmental_service.py# Orchestrator aggregating all layers
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── locations.py            # /api/locations
│   │       ├── environment.py          # /api/environment/{id}
│   │       ├── air_quality.py          # /api/air-quality/{id}
│   │       ├── greenery_heat.py        # /api/greenery-heat/{id} & /api/compare
│   │       ├── risk.py                 # /api/risk/{id}
│   │       └── forecast.py             # /api/forecast/{id}
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_naqi.py                # Unit test for CPCB breakpoint math
│   │   ├── test_anomaly.py             # Unit test for Z-Score & IQR math
│   │   ├── test_risk.py                # Unit test for explainable risk engine
│   │   ├── test_adapters.py            # Integration test for adapters with mocks
│   │   └── test_api.py                 # End-to-end API route tests
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx              # Root Next.js layout, meta, font
│   │   │   ├── page.tsx                # Main dashboard page
│   │   │   └── globals.css             # Tailwind base & custom styles
│   │   ├── components/
│   │   │   ├── Header.tsx              # Top navigation, location selector, status
│   │   │   ├── MumbaiMap.tsx           # Interactive Leaflet GIS map with overlays
│   │   │   ├── EnvironmentalOverview.tsx# Hero cards, NAQI badge, key weather
│   │   │   ├── AirQualityView.tsx      # Pollutant cards matrix & 24h trend chart
│   │   │   ├── GreeneryHeatView.tsx    # Satellite metrics & cross-area comparison
│   │   │   └── RiskPredictionView.tsx  # Risk gauge, explanations, 72h forecast
│   │   ├── lib/
│   │   │   ├── api.ts                  # Typed client for backend REST API
│   │   │   └── types.ts                # TypeScript interface contracts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tailwind.config.ts
│   │   └── next.config.ts
├── ECOPULSE_MUMBAI_BLUEPRINT.md
├── MASTER_ENGINEERING_SPECIFICATION.md
└── PROJECT_DISCOVERY_AND_FEASIBILITY_REPORT.md
```

---

## 7. Data Models & API Contracts

### 7.1 Key Normalized Schemas (Pydantic / TypeScript)

```typescript
export type DataProvenance = 
  | 'DIRECT_OBSERVATION'
  | 'MODELLED_ANALYSIS'
  | 'FORECAST'
  | 'ESTIMATED_INTERPOLATION';

export interface PollutantItem {
  pollutant: string;              // "pm25", "pm10", "no2", "so2", "co", "o3"
  displayName: string;            // "PM2.5", "Ozone", etc.
  value: number | null;           // null if not reported
  unit: string;                   // "µg/m³", "mg/m³"
  naqiSubIndex: number | null;    // 0-500
  category: string | null;        // "Good", "Moderate", "Poor", etc.
  provenance: DataProvenance;
  stationName: string | null;
  stationDistanceKm: number | null;
  timestamp: string;
  isAvailable: boolean;
}

export interface Microclimate {
  temperatureC: number;
  relativeHumidityPct: number;
  heatIndexC: number;
  heatCategory: string;           // "Comfortable", "Caution", "Danger"
  windSpeedKmh: number;
  windDirectionDeg: number;
  windCardinal: string;           // "WSW", "NNW"
  solarRadiationWm2: number;
  precipitationMm: number;
  timestamp: string;
}

export interface GreeneryHeat {
  locationId: string;
  ndviMean: number;               // -0.1 to 1.0
  ndviCategory: string;           // "Dense Canopy", "Moderate", "Sparse"
  treeCanopyPct: number;          // 0-100%
  builtUpRatioPct: number;        // 0-100%
  surfaceHeatIndex: number;       // 1.0 to 10.0
  heatIslandIntensity: string;    // "Low", "Moderate", "High", "Extreme"
  vegetationChange5yrPct: number; // e.g. -2.4%
  satelliteSource: string;
}

export interface EnvironmentalRisk {
  riskScore: number;              // 1 to 100
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
  primaryStressor: string;        // "High Particulate Loading & Stagnant Air"
  explanation: string;            // Plain-English explanation
  anomaliesDetected: {
    metric: string;
    value: number;
    zScore: number;
    description: string;
  }[];
  activeAlerts: {
    id: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    title: string;
    message: string;
  }[];
}
```

---

## 8. Security & Risk Analysis

* **API Secrets Management:** The OpenAQ v3 API key is stored strictly in `backend/.env` under `OPENAQ_API_KEY`. It is never delivered to the client browser.
* **Input Sanitization & Spatial Validation:** Location IDs are strictly validated against the finite 14-location catalog. Query parameters (`loc1`, `loc2`, `days`) are cast to validated Pydantic types.
* **CORS & Headers:** Explicit CORS configuration allowing only authorized frontend origins in production, with standard security headers.
* **Rate-Limit Preservation:** The in-memory TTL caching layer limits external calls to OpenAQ and Open-Meteo, guaranteeing the application operates comfortably below free-tier rate limits.

---

## 9. Error Handling & Graceful Degradation Strategy

| Failure Scenario | Upstream Symptom | EcoPulse Mumbai Fallback Behavior | User Experience |
| :--- | :--- | :--- | :--- |
| **Specific Pollutant Missing** | Station doesn't monitor $SO_2$ or sensor offline. | Sets `value: null`, `isAvailable: false`, `category: null`. | UI renders a muted `UNAVAILABLE` badge. No synthetic numbers or NaN crashes. |
| **OpenAQ Ground Station Offline** | Network timeout / 5xx error from OpenAQ. | Automatically queries Open-Meteo CAMS atmospheric model; tags metrics as `MODELLED_ANALYSIS`. | UI displays valid ambient data with a clear "Assimilated Model" provenance tag. |
| **Open-Meteo Outage** | Network timeout from Open-Meteo. | Serves last known cached snapshot from memory with `STALE_DATA` status. | Subtle badge indicates: "Displaying cached data from 25 mins ago". |
| **Invalid Location ID** | User enters malformed URL `/api/environment/xyz`. | Returns `HTTP 404 Not Found` with structured JSON error. | Frontend displays a clean "Location Not Found" card with a link back to Mumbai center. |

---

## 10. Complete Implementation Roadmap & Phase Gates

Following Prompt 3's mandatory execution model, the project progresses through **6 structured phases**:

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                    PHASED EXECUTION MATRIX                                  |
+─────────────────────────────────────────────────────────────────────────────────────────────+
| Phase 1: Foundation, Infrastructure & Shell Architecture                                     |
| • Objective: Establish backend (FastAPI) and frontend (Next.js 15) projects, shared data     |
|   models, 14-location Mumbai registry, and basic map/shell navigation.                      |
| • Gate 1: /api/locations returns 14 verified locations; Next.js shell renders without errors.|
+─────────────────────────────────────────────────────────────────────────────────────────────+
| Phase 2: Feature 1 — Air & Microclimate Implementation                                       |
| • Objective: Implement OpenAQ v3 ground adapter + Open-Meteo weather adapter + CPCB NAQI    |
|   sub-index math engine + frontend Pollutant Matrix & 24h historical charts.                |
| • Gate 2: Real live air & weather data rendered with exact provenance badges; tests pass.   |
+─────────────────────────────────────────────────────────────────────────────────────────────+
| Phase 3: Feature 2 — Greenery & Heat Analysis Implementation                                 |
| • Objective: Implement satellite surface database (NDVI, canopy, built-up, LST) + Leaflet   |
|   thematic GIS layers + cross-area comparison engine (e.g. Borivali vs Andheri).            |
| • Gate 3: Borivali vs Andheri comparison renders accurate comparative metrics; map toggles. |
+─────────────────────────────────────────────────────────────────────────────────────────────+
| Phase 4: Feature 3 — Environmental Risk & Prediction Implementation                          |
| • Objective: Implement Z-score anomaly detector + 72h forecast pipeline + explainable risk   |
|   engine with natural-language reason generator + active alert banners.                     |
| • Gate 4: Anomaly math verified; risk scores articulate plain-English causes; tests pass.   |
+─────────────────────────────────────────────────────────────────────────────────────────────+
| Phase 5: Integration, Hardening, Polish & Comprehensive Testing                              |
| • Objective: Resiliency verification (mock outages, missing pollutants), responsive UI      |
|   polish (mobile-friendly), full automated test suite (unit + API + build verification).    |
| • Gate 5: 100% test pass rate across unit/integration suites; production build succeeds.     |
+─────────────────────────────────────────────────────────────────────────────────────────────+
| Phase 6: Production Deployment & Final Acceptance                                            |
| • Objective: Deploy frontend to Vercel and backend to Render/Railway; verify public live URL |
|   and conduct end-to-end user journey acceptance tests.                                     |
| • Gate 6: Complete live platform verified; zero critical issues; documentation finalized.   |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 11. Verification & Sign-off

This document represents the finalized, authoritative blueprint for **EcoPulse Mumbai**. Implementation will commence with **Phase 1: Foundation, Infrastructure & Shell Architecture**.
