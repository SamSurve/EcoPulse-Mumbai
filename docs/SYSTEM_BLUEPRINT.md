# ECOPULSE MUMBAI — SYSTEM BLUEPRINT & PHASED ROADMAP
## High-Precision Environmental Intelligence Platform for the Mumbai Metropolitan Region
**Project Name:** EcoPulse Mumbai  
**Domain:** Environmental Science for Engineering (ESE) / Urban Environmental Intelligence  
**Version:** 1.0.0 (Master Architecture Blueprint)  
**Date:** September 2026  

---

## 1. Executive Overview & Core Philosophy

### 1.1 Purpose
**EcoPulse Mumbai** is a software-only, data-driven environmental intelligence platform designed specifically for the unique coastal, high-density, and ecologically complex urban landscape of Mumbai, India.

It empowers citizens, urban planners, environmental engineering students, and local authorities to select any neighborhood or ward across Mumbai and receive an instant, multi-dimensional environmental assessment powered by:
* Verified ground-truth monitoring stations (CPCB / MPCB / SAFAR via OpenAQ API v3).
* Numerical atmospheric models (Copernicus CAMS via Open-Meteo Air Quality).
* High-resolution microclimate observations (Open-Meteo Weather API).
* Satellite-derived surface indicators (Sentinel-2 NDVI, Landsat/MODIS surface thermal proxies, and municipal ward geospatial vectors).
* Statistical anomaly detection and short-term environmental forecasting.

### 1.2 Non-Negotiable Engineering Principles
1. **Zero Hardware Dependencies:** Entirely software-based; utilizes existing open environmental APIs, government monitoring networks, and open satellite/geospatial datasets.
2. **Never Fabricate Environmental Data:** If a physical monitoring station does not report $SO_2$ or Ozone, the system explicitly reports `UNAVAILABLE` or `DATA_GAP`. It never fills gaps with synthetic or fake readings.
3. **Data Provenance & Transparency First:** Every displayed metric must declare its origin:
   * `DIRECT_OBSERVATION` (physical sensor measurement from a named station with exact distance).
   * `MODELLED_ANALYSIS` (assimilated numerical atmospheric model).
   * `FORECAST` (predictive numerical model with uncertainty boundaries).
   * `ESTIMATED_INTERPOLATION` (distance-weighted spatial interpolation).
4. **Three Major Features Only:** Strictly focused on:
   * **Feature 1:** Air & Microclimate
   * **Feature 2:** Greenery & Heat Analysis
   * **Feature 3:** Environmental Risk & Prediction
5. **Explainable Environmental Risk:** Every risk assessment explains *why* it was generated using transparent physical and chemical factors rather than opaque, arbitrary black-box scores.

---

## 2. Core User Experience Journey

```
+-------------------------------------------------------------------------------------------------+
|                                    CORE USER JOURNEY                                            |
|                                                                                                 |
|   [ 1. SELECT LOCATION ]                                                                        |
|   Choose via dropdown selector OR click on interactive Mumbai GIS map                           |
|   (Borivali, Kandivali, Andheri, Dadar, Bandra, Sion, Powai, Kurla, Mulund, Colaba, Worli, etc.)|
|                                        │                                                        |
|                                        ▼                                                        |
|   [ 2. COLLECT DATA (Backend Adapters) ]                                                        |
|   • Query ground station via OpenAQ v3 (nearest CAAQM station, distance, timestamp)            |
|   • Query microclimate & atmospheric layers via Open-Meteo (temp, humidity, wind, solar)       |
|   • Load satellite surface metrics (NDVI, canopy, impervious surface, LST heat index)           |
|                                        │                                                        |
|                                        ▼                                                        |
|   [ 3. ANALYZE & NORMALIZE ]                                                                    |
|   • Compute Indian National AQI (CPCB NAQI sub-index formula)                                   |
|   • Detect anomalies against 30-day baseline (Z-Score & IQR)                                   |
|   • Calculate Coastal Heat Index (ambient temp + relative humidity + solar radiation)          |
|                                        │                                                        |
|                                        ▼                                                        |
|   [ 4. VISUALIZE (Three Polished Views) ]                                                       |
|   • View 1: Air Quality & Microclimate Cards + 24h Trend Charts                                 |
|   • View 2: Greenery & Heat Map Overlay + Cross-Area Comparison (e.g. Borivali vs Andheri)      |
|   • View 3: Explainable Risk Matrix + Configurable Alerts + 72h Trend Forecast                  |
|                                        │                                                        |
|                                        ▼                                                        |
|   [ 5. PREDICT & EXPLAIN RISK ]                                                                 |
|   Clear natural-language explanation: "Why is risk High in Kurla today? ..."                   |
+-------------------------------------------------------------------------------------------------+
```

---

## 3. Supported Mumbai Locations & Spatial Taxonomy

EcoPulse Mumbai provides verified coverage for **14 primary micro-locations** representing all major zones of the Mumbai Metropolitan Region (MMR):

| Location ID | Area Name | BMC Ward | Zone | Latitude | Longitude | Primary Nearest CAAQM Station | Typical Environmental Baseline |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `borivali` | **Borivali (East/West)** | R/Central | Western Suburbs | 19.2307 | 72.8567 | Borivali East (MPCB) | High vegetative buffer (SGNP edge), lower background PM2.5. |
| `kandivali` | **Kandivali** | R/South | Western Suburbs | 19.2047 | 72.8522 | Borivali East / Malad | Dense residential corridor, moderate vehicular traffic. |
| `malad` | **Malad (West)** | P/North | Western Suburbs | 19.1860 | 72.8485 | Malad West (SAFAR/IITM) | Coastal creek proximity, high construction dust. |
| `andheri` | **Andheri (West/East)** | K/West & K/East | Western Suburbs | 19.1136 | 72.8697 | Andheri (SAFAR/IITM) | Heavy traffic junction (WEH, SV Rd), high impervious surface. |
| `bandra` | **Bandra (West/East)** | H/West & H/East | Western Suburbs | 19.0596 | 72.8295 | Bandra / Kherwadi (MPCB) | Coastal interface, sea breeze dispersion, arterial traffic. |
| `bkc` | **Bandra Kurla Complex** | H/East | Central Corridor | 19.0662 | 72.8665 | BKC (MPCB) | Commercial dense high-rise hub, frequent winter smog traps. |
| `dadar` | **Dadar** | G/North | South-Central | 19.0178 | 72.8478 | Dadar / Worli (MPCB) | Major transit hub, high commercial activity, low tree canopy. |
| `worli` | **Worli** | G/South | South Mumbai | 19.0134 | 72.8154 | Worli (SAFAR/IITM) | Open western seafront promenade, sea-salt aerosol dispersion. |
| `colaba` | **Colaba** | A | South Mumbai | 18.9067 | 72.8147 | Colaba (MPCB) | Maritime tip, cleanest background air, high relative humidity. |
| `sion` | **Sion** | F/North | Central Mumbai | 19.0434 | 72.8634 | Sion (MPCB) | Industrial-residential junction, Eastern Express traffic nexus. |
| `kurla` | **Kurla** | L | Central / Mithi Basin| 19.0726 | 72.8845 | Kurla (MPCB) | Low-lying basin, Mithi River drainage, elevated heat island. |
| `powai` | **Powai** | S | Eastern Suburbs | 19.1176 | 72.9060 | Powai / IIT Bombay (MPCB) | Lake microclimate, hilly green buffers, moderate PM2.5. |
| `chembur` | **Chembur** | M/West | Eastern Suburbs | 19.0622 | 72.8975 | Chembur (MPCB) | Refinery/industrial zone buffer, historic chemical pollution corridor. |
| `mulund` | **Mulund** | T | North-Eastern Suburbs| 19.1726 | 72.9565 | Mulund (MPCB) | Foothills of Sanjay Gandhi National Park, eastern breeze. |

---

## 4. Final Feature Scope (The Three Major Capabilities)

### Feature 1: Air & Microclimate
* **Pollutant Coverage (Where available from source):**
  * $PM_{2.5}$ ($\mu g/m^3$)
  * $PM_{10}$ ($\mu g/m^3$)
  * $NO_2$ ($\mu g/m^3$)
  * $SO_2$ ($\mu g/m^3$)
  * $CO$ ($mg/m^3$)
  * $O_3$ ($\mu g/m^3$)
* **Meteorological Indicators:**
  * Ambient Air Temperature (°C)
  * Relative Humidity (%)
  * Apparent Temperature / Heat Index (°C)
  * Wind Speed ($km/h$) & Wind Direction (compass degrees & cardinal)
  * Precipitation & Rainfall ($mm$)
  * Solar Radiation ($W/m^2$)
* **Station & Data Provenance Metadata:**
  * Exact reporting station name (e.g., "MPCB - Bandra Kurla Complex CAAQM")
  * Straight-line distance from selected area center ($km$)
  * Measurement timestamp and latency ("Updated 24 mins ago")
  * Provenance badge: `DIRECT SENSOR` vs `NUMERICAL MODEL`
* **Historical Trends:**
  * 24-hour and 7-day hourly historical trend line charts.
  * CPCB National Air Quality Index (NAQI) sub-index calculation and categorical rating (Good, Satisfactory, Moderate, Poor, Very Poor, Severe).

### Feature 2: Greenery & Heat Analysis
* **Satellite & Geospatial Metrics:**
  * **NDVI (Normalized Difference Vegetation Index):** Mean vegetative vigor and canopy density scaled from -0.1 (water/built) to +0.8 (dense forest).
  * **Tree Canopy Cover %:** Estimated percentage of mature tree canopy within the ward boundary.
  * **Built-up / Impervious Surface Ratio %:** Proportion of concrete, asphalt, and high-density structures.
  * **Land Surface Heat Proxy / Urban Heat Island (UHI) Index:** Normalized scale (1–10) capturing surface heat retention relative to coastal/forested baselines.
  * **5-Year Vegetation Change Delta (%):** Historical trend tracking urban canopy loss or gain.
* **Interactive Map Experience:**
  * Mumbai Base Map with selectable ward polygons and area markers.
  * Toggleable thematic layers: Greenery/Vegetation density vs Urban Heat intensity.
* **Cross-Area Comparison Engine:**
  * Side-by-side comparative analysis of any two Mumbai areas (e.g., **Borivali vs Andheri**, or **Dadar vs Powai**).
  * Comparative metrics: Canopy Cover %, Heat Index differential, Mean PM2.5, and Built-up density.

### Feature 3: Environmental Risk & Prediction
* **Analytical Anomaly Detection:**
  * Evaluates current readings against a 30-day rolling baseline for that specific location.
  * Statistical Z-Score ($Z = \frac{x - \mu}{\sigma}$) and IQR outlier flags.
  * Detects unusual pollutant spikes, temperature spikes, or diurnal stagnation traps.
* **Short-Term Environmental Forecasting:**
  * 72-hour hourly projection for PM2.5, PM10, Temperature, and AQI.
  * Clearly visualizes uncertainty bounds ($P_{10}$ to $P_{90}$).
  * Explicit disclaimer: "Forecast generated from numerical meteorological models (CAMS/ECMWF); uncertainty increases beyond 24 hours."
* **Explainable Environmental Risk Engine:**
  * Composite Risk Score (1 to 100) and Level (`LOW`, `MODERATE`, `HIGH`, `SEVERE`).
  * **Explainable Reason Engine:** Every risk score breaks down the primary contributing stressors:
    * *Example:* *"Overall Risk: HIGH (Score: 78/100). Primary Driver: PM2.5 at 145 µg/m³ (Poor air quality). Contributing Factor: Stagnant wind (2.1 km/h) preventing dispersion along the Western Express corridor. Heat stress index is 37°C due to 84% humidity."*
* **Configurable Alerts:**
  * Threshold alert indicators (e.g. Sensitive groups warning, morning jogging window advisories, extreme heat warnings).

---

## 5. System Architecture & Component Design

```
+-------------------------------------------------------------------------------------------------+
|                                        FRONTEND LAYER                                           |
|                           Next.js 15 (App Router) + TypeScript + Tailwind CSS                    |
|                                                                                                 |
|   ┌─────────────────────────────────────────────────────────────────────────────────────────┐   |
|   │ Top Navigation: Location Quick-Select, Search, Data Freshness Badge, Theme             │   |
|   └─────────────────────────────────────────────────────────────────────────────────────────┘   |
|   ┌─────────────────────────────────┐  ┌────────────────────────────────────────────────────┐   |
|   │    Interactive Mumbai Map       │  │             Environmental Overview                 │   |
|   │  (Leaflet / MapLibre GIS)       │  │  - Primary NAQI Badge & Health Category            │   |
|   │  - Area Pinpoints & Polygons    │  │  - Real-time Temp, Humidity, Wind & Microclimate   │   |
|   │  - Greenery / Heat Heatmap Mode │  │  - Source Provenance & Station Distance Tag        │   |
|   └─────────────────────────────────┘  └────────────────────────────────────────────────────┘   |
|   ┌─────────────────────────────────┐  ┌────────────────────────────────────────────────────┐   |
|   │   Feature 1: Air & Microclimate │  │         Feature 2: Greenery & Heat Analysis        │   |
|   │   - Full Pollutant Matrix       │  │   - NDVI Vegetation Index & Canopy %               │   |
|   │   - 24h & 7d Recharts Trends    │  │   - Built-Up Surface & Thermal Proxy               │   |
|   │   - Station Freshness Metadata  │  │   - Area Comparison Drawer (Borivali vs Andheri)   │   |
|   └─────────────────────────────────┘  └────────────────────────────────────────────────────┘   |
|   ┌─────────────────────────────────────────────────────────────────────────────────────────┐   |
|   │   Feature 3: Environmental Risk & Prediction                                            │   |
|   │   - Explainable Risk Score & Breakdown (Pollution Stress + Thermal Stress + Stagnation) │   |
|   │   - Anomaly Alerts (Z-score > 2.0 triggers)                                             │   |
|   │   - 72-Hour Forecast Chart with Uncertainty Shading                                     │   |
|   └─────────────────────────────────────────────────────────────────────────────────────────┘   |
+-------------------------------------------------------------------------------------------------+
                                               ▲
                                               │ JSON REST API (Typed Contracts)
                                               ▼
+-------------------------------------------------------------------------------------------------+
|                                     BACKEND API LAYER                                           |
|                                    FastAPI (Python 3.11+)                                       |
|                                                                                                 |
|   ┌─────────────────────────────────────────────────────────────────────────────────────────┐   |
|   │ Routers:                                                                                │   |
|   │ • /api/locations                  • /api/environment/{id}                               │   |
|   │ • /api/air-quality/{id}           • /api/greenery-heat/{id}                             │   |
|   │ • /api/compare?loc1={id}&loc2={id} • /api/risk/{id}                                      │   |
|   │ • /api/forecast/{id}              • /api/history/{id}                                   │   |
|   └─────────────────────────────────────────────────────────────────────────────────────────┘   |
|                                              │                                                  |
|   ┌──────────────────────────────────────────┴──────────────────────────────────────────────┐   |
|   │ Provider Adapter Layer (Resilient, Normalized, Cached):                                 │   |
|   │                                                                                         │   |
|   │  ┌────────────────────────┐  ┌────────────────────────┐  ┌───────────────────────────┐  │   |
|   │  │   OpenAQ v3 Adapter    │  │ Open-Meteo Air Adapter │  │ Open-Meteo Weather Adapter│  │   |
|   │  │ (Physical CAAQM Ground)│  │ (CAMS Modelled Grid)   │  │ (Microclimate & Forecast) │  │   |
|   │  └────────────────────────┘  └────────────────────────┘  └───────────────────────────┘  │   |
|   │  ┌───────────────────────────────────────────────────────────────────────────────────┐  │   |
|   │  │ Geospatial Surface Adapter (Sentinel-2 NDVI & Landsat Surface Heat GeoJSON Store) │  │   |
|   │  └───────────────────────────────────────────────────────────────────────────────────┘  │   |
|   └─────────────────────────────────────────────────────────────────────────────────────────┘   |
|                                              │                                                  |
|   ┌──────────────────────────────────────────┴──────────────────────────────────────────────┐   |
|   │ Analytics & Modeling Engine:                                                            |   |
|   │ • CPCB NAQI Sub-Index Calculator                                                        │   |
|   │ • Statistical Anomaly Detector (Rolling Mean, Standard Deviation, Z-Score, IQR)         │   |
|   │ • Explainable Risk Generator (Rule-based multi-factor physical model)                   │   |
|   │ • In-Memory TTL Cache (prevents duplicate API hits, handles provider outages)           │   |
|   └─────────────────────────────────────────────────────────────────────────────────────────┘   |
+-------------------------------------------------------------------------------------------------+
```

---

## 6. Data Engineering & Provider Integration Strategy

### 6.1 Data Providers Matrix

| Source / Provider | Data Retrieved | Update Frequency | Rate Limit / Auth | Fallback Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **OpenAQ API v3** | Real ground-station measurements ($PM_{2.5}, PM_{10}, NO_2, SO_2, CO, O_3$) from CPCB/MPCB CAAQM stations in Mumbai. | Hourly | 60 req/min, 2000 req/hr (Free `X-API-Key`). | Fall back to CAMS atmospheric model; clearly tag metric as `MODELLED_ANALYSIS`. |
| **Open-Meteo Air Quality** | Gridded CAMS hourly pollutants, European AQI, and 72-hour forecast projections. | Hourly | Free for non-commercial use, 10,000 calls/day. No key required. | Return cached prior observation with `STALE_DATA` warning. |
| **Open-Meteo Weather** | Temperature, relative humidity, wind speed, wind direction, rain, direct normal irradiance. | Hourly | Free for non-commercial use, 10,000 calls/day. No key required. | In-memory cached microclimate baseline. |
| **Pre-processed Satellite & Geospatial Datasets** | Sentinel-2 10m NDVI distributions, Tree canopy cover %, built-up ratio %, Landsat thermal surface proxy per ward. | Static / Quarterly verified baseline | Local GeoJSON / Parquet store. | Immediate zero-latency local retrieval. |

### 6.2 Internal Normalized Environmental Data Model
To prevent vendor leak, all data is parsed through strict Pydantic schemas:

```python
class DataProvenance(str, Enum):
    DIRECT_OBSERVATION = "direct_observation"
    MODELLED_ANALYSIS = "modelled_analysis"
    FORECAST = "forecast"
    ESTIMATED_INTERPOLATION = "estimated_interpolation"

class PollutantMeasurement(BaseModel):
    pollutant: str               # "pm25", "pm10", "no2", "so2", "co", "o3"
    value: Optional[float]       # e.g., 68.4 (None if unavailable)
    unit: str                    # "ug/m3", "mg/m3"
    naqi_sub_index: Optional[int]# Calculated CPCB sub-index (0-500)
    category: Optional[str]      # "Good", "Moderate", "Poor", etc.
    provenance: DataProvenance
    station_name: Optional[str]
    station_distance_km: Optional[float]
    timestamp: datetime
    is_available: bool

class MicroclimateData(BaseModel):
    temperature_c: float
    relative_humidity_pct: float
    heat_index_c: float
    wind_speed_kmh: float
    wind_direction_deg: float
    wind_direction_cardinal: str
    solar_radiation_wm2: float
    precipitation_mm: float
    timestamp: datetime
    provenance: DataProvenance

class GreeneryHeatData(BaseModel):
    location_id: str
    ndvi_mean: float             # e.g., 0.38
    ndvi_category: str           # "Dense Canopy", "Moderate", "Sparse", "Built-Up"
    tree_canopy_pct: float       # e.g., 24.5%
    built_up_ratio_pct: float    # e.g., 68.2%
    surface_heat_index: float    # 1.0 - 10.0 scale
    heat_island_intensity: str   # "Low", "Moderate", "High", "Extreme"
    vegetation_change_5yr_pct: float # e.g., -2.1%
    satellite_source: str        # "Sentinel-2 & Landsat-8/9 Composite"
```

---

## 7. Explainable Environmental Risk & Anomaly Formulation

### 7.1 CPCB National Air Quality Index (NAQI) Breakpoint Formulation
The sub-index $I_p$ for pollutant concentration $C_p$ is calculated strictly following the CPCB standard formula:
$$I_p = \frac{I_{HI} - I_{LO}}{B_{HI} - B_{LO}} \cdot (C_p - B_{LO}) + I_{LO}$$
where:
* $[B_{LO}, B_{HI}]$: Breakpoint concentration range.
* $[I_{LO}, I_{HI}]$: Sub-index range corresponding to the category (0–50 Good, 51–100 Satisfactory, 101–200 Moderate, 201–300 Poor, 301–400 Very Poor, 401–500 Severe).
* Overall $AQI = \max(I_{PM2.5}, I_{PM10}, I_{NO2}, \dots)$ (provided at least 3 pollutants are available, with one being PM2.5 or PM10).

### 7.2 Coastal Heat Index Formulation
Combining temperature $T$ (°C) and relative humidity $RH$ (%) via Rothfusz regression adapted for Indian coastal climates:
$$\text{HeatIndex} = -8.784 + 1.611 T + 2.338 RH - 0.146 T \cdot RH - 0.0123 T^2 - 0.0164 RH^2 + \dots$$
Categorization:
* $< 30^\circ\text{C}$: Comfortable
* $30 - 35^\circ\text{C}$: Moderate Heat Caution
* $35 - 41^\circ\text{C}$: Extreme Heat Caution (Cramps/fatigue likely)
* $> 41^\circ\text{C}$: Severe Heat Danger

### 7.3 Statistical Anomaly Detection
* **Z-Score:** $Z = \frac{x_t - \mu_{30}}{\sigma_{30}}$. If $|Z| \ge 2.0$, triggers an **Anomaly Flag**.
* **Interquartile Range (IQR):** $IQR = Q_3 - Q_1$. Values $> Q_3 + 1.5 \cdot IQR$ flag an extreme transient spike.

### 7.4 Explainable Composite Risk Score (1 to 100)
Rather than an opaque number, the composite score is a weighted combination of physical stressors:
$$\text{RiskScore} = w_{air} \cdot S_{air} + w_{heat} \cdot S_{heat} + w_{stagnation} \cdot S_{stagnation} + w_{anomaly} \cdot S_{anomaly}$$
Where:
* $S_{air} = \min(100, \frac{AQI}{300} \cdot 100)$
* $S_{heat} = \text{Normalized Thermal Stress (0–100)}$
* $S_{stagnation} = \text{Dispersion Penalty when wind} < 3 \text{ km/h and humidity} > 80\%$
* Every score output includes a **Primary Driver** and an automated **Human-Readable Explanation**.

---

## 8. REST API Specifications

| Method | Endpoint | Description | Query / Body Params | Response Structure |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/locations` | List all 14 supported Mumbai locations with coordinates, ward info, and status. | None | `LocationSummary[]` |
| `GET` | `/api/environment/{location_id}` | Complete environmental snapshot (Air, Microclimate, Greenery, Risk) for chosen area. | None | `UnifiedEnvironmentResponse` |
| `GET` | `/api/air-quality/{location_id}` | Detailed pollutant breakdown, station metadata, and 24h trend. | None | `AirQualityResponse` |
| `GET` | `/api/microclimate/{location_id}` | Real-time weather, heat index, wind, and solar radiation. | None | `MicroclimateResponse` |
| `GET` | `/api/greenery-heat/{location_id}` | NDVI, tree canopy %, impervious surface %, and surface heat proxy. | None | `GreeneryHeatResponse` |
| `GET` | `/api/compare` | Side-by-side comparison of any two supported Mumbai areas. | `loc1=borivali&loc2=andheri` | `AreaComparisonResponse` |
| `GET` | `/api/risk/{location_id}` | Explainable risk evaluation, anomaly breakdown, and active alerts. | None | `RiskExplanationResponse` |
| `GET` | `/api/forecast/{location_id}` | 72-hour hourly forecast with uncertainty bounds. | None | `ForecastResponse` |
| `GET` | `/api/history/{location_id}` | 7-day historical timeseries data for pollutants and temperature. | `days=7` | `HistoricalTimeseriesResponse` |

---

## 9. Phased Development Roadmap & Verification Gates

```
+-------------------------------------------------------------------------------------------------+
|                                    PHASED ROADMAP MATRIX                                        |
+-------------------------------------------------------------------------------------------------+
| Phase 1: Foundation & Shell Architecture                                                        |
| • Establish repository structure: backend (FastAPI), frontend (Next.js 15), shared schemas.     |
| • Implement Location Registry with 14 Mumbai areas, coordinates, and ward mappings.            |
| • Scaffold frontend layout, responsive navigation, location switcher, and interactive map shell.|
| • Gate 1 Verification: /api/locations returns 14 valid records; frontend map renders Mumbai.    |
+-------------------------------------------------------------------------------------------------+
| Phase 2: Feature 1 — Air & Microclimate Implementation                                          |
| • Implement OpenAQ v3 Adapter with CPCB station mapping, latency tracking, and fallback.        |
| • Implement Open-Meteo Air Quality & Weather Adapters with caching and unit normalization.      |
| • Build CPCB NAQI sub-index calculation engine.                                                 |
| • Build frontend Air Quality Cards, Pollutant Matrix, 24h Trend Charts, and Provenance Badges.   |
| • Gate 2 Verification: Real-time air & weather data live for all 14 locations; zero fake data.  |
+-------------------------------------------------------------------------------------------------+
| Phase 3: Feature 2 — Greenery & Heat Analysis                                                   |
| • Create verified geospatial database for Mumbai wards (NDVI, Canopy %, Built-up %, Heat Index).|
| • Implement Leaflet/MapLibre thematic layer toggling (Vegetation Density vs Heat Intensity).    |
| • Implement Cross-Area Comparison API & side-by-side frontend comparison drawer.                |
| • Gate 3 Verification: Borivali vs Andheri comparison renders clear, statistically sound diffs. |
+-------------------------------------------------------------------------------------------------+
| Phase 4: Feature 3 — Environmental Risk & Prediction                                            |
| • Implement Anomaly Detection Engine (Z-Score & IQR on 30-day baseline).                        |
| • Implement Explainable Risk Engine (Multi-factor formulation with natural language reasoner).  |
| • Implement 72-hour forecast pipeline with uncertainty boundaries.                             |
| • Build frontend Risk Gauge, Driver Breakdown Card, Alert Banners, and Forecast Charts.         |
| • Gate 4 Verification: Risk explanations verified for low/moderate/high scenarios.             |
+-------------------------------------------------------------------------------------------------+
| Phase 5: Integration, Hardening, Polish & Comprehensive Testing                                 |
| • Error handling test battery: missing pollutants, API rate limits, network timeouts.           |
| • UI polish: responsive mobile view, loading skeletons, dark/light contrast, typography.        |
| • Comprehensive test suite: Unit tests (calculations), API integration tests, Frontend tests.   |
| • Gate 5 Verification: 100% test pass rate across unit and API suites.                          |
+-------------------------------------------------------------------------------------------------+
| Phase 6: Production Deployment & Verification                                                   |
| • Deploy frontend to Vercel and backend to Render/Railway.                                      |
| • Verify live environment variables and public URLs.                                            |
| • Conduct end-to-end user journey smoke tests on public domain.                                 |
| • Final Deliverable Sign-off for academic evaluation and real-world hosting.                    |
+-------------------------------------------------------------------------------------------------+
```

---

## 10. Summary & Transition to Execution

This document establishes the verified, scientifically grounded, and technically feasible blueprint for **EcoPulse Mumbai**. Every component adheres strictly to the constraints:
* **Software-Only & Deployable**
* **Three Major Features Only**
* **Mumbai-Specific Grounding**
* **Transparent Data Provenance**
* **Explainable Environmental Risk**

Implementation will proceed incrementally through the 6 Phased Gates as defined above.
