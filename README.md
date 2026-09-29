# EcoPulse Mumbai — Environmental Intelligence Platform

EcoPulse Mumbai is an environmental science and engineering web platform built to monitor hyper-local air quality, urban microclimates, greenery cover, and urban heat island effects across 14 municipal areas in Mumbai. It combines verified ground-station data, atmospheric dispersion models, and satellite imagery to provide real-time environmental metrics, 72-hour future forecasts, and explainable risk scores without requiring any specialized hardware.

---

## Main Features

* **Air Quality & NAQI Calculation**: Real-time concentrations of 6 major pollutants ($PM_{2.5}, PM_{10}, NO_2, SO_2, CO, O_3$) with official Central Pollution Control Board (CPCB) National Air Quality Index (NAQI) sub-indices and categories (Good to Severe).
* **Urban Microclimate Monitoring**: Ambient temperature, relative humidity, apparent heat index, wind velocity, and solar radiation.
* **Satellite Greenery & Urban Heat (UHI)**: Sentinel-2 NDVI vegetative vigor, tree canopy percentage, built-up impervious surface ratio, and Landsat Land Surface Temperature (LST) heat island intensity.
* **72-Hour Predictive Forecast**: Forward-looking hourly trajectory charts for air quality and weather with communicated uncertainty boundaries.
* **Explainable Environmental Risk Engine**: Composite risk scoring (1–100) that gives plain-English explanations of why an area's risk is elevated (e.g. atmospheric stagnation, high thermal load, or traffic particulate spikes).
* **Side-by-Side Area Comparison**: Direct comparison between any two Mumbai neighborhoods (e.g., *Borivali vs Andheri*) across vegetation cover, heat retention, and pollution levels.
* **Interactive 3D Earth & Satellite GIS Map**: Cinematic 3D globe landing experience and high-resolution Leaflet satellite map displaying all 14 Mumbai monitoring stations.
* **Light & Dark Mode**: Cohesive, smooth 250ms theme switching across every dashboard component.

---

## Tech Stack

* **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Leaflet GIS, Three.js, Globe.gl, Chart.js, Lucide Icons
* **Backend**: Python 3.11+, FastAPI, Pydantic v2, HTTPX, Uvicorn
* **Data Sources**: Open-Meteo Air Quality (Copernicus CAMS), Open-Meteo Weather, Copernicus Sentinel-2 (NDVI), Landsat-8/9 (Thermal LST), CPCB NAQI Standards

---

## Project Structure

```text
EcoPulse-Mumbai/
├── frontend/                 # Next.js 14 web application
│   ├── src/
│   │   ├── app/              # Next.js App Router (layout, page, styles)
│   │   ├── components/       # Dashboard & landing page components
│   │   ├── services/         # API client connecting to backend
│   │   └── types/            # TypeScript data models
│   ├── public/               # Static assets & icons
│   ├── package.json          # Node dependencies & build scripts
│   ├── tailwind.config.js    # Tailwind theme & color tokens
│   └── tsconfig.json         # TypeScript configuration
├── backend/                  # FastAPI Python backend
│   ├── app/
│   │   ├── adapters/         # Open-Meteo, OpenAQ & Satellite adapters
│   │   ├── core/             # HTTP client pooling & logging
│   │   ├── data/             # 14 Mumbai location coordinates & wards
│   │   ├── models/           # Pydantic data schemas
│   │   ├── routers/          # API endpoints (/api/locations, /api/environment)
│   │   ├── services/         # CPCB NAQI math, risk engine & TTL cache
│   │   └── static/           # Standalone fallback dashboard
│   ├── tests/                # Automated backend test suite
│   ├── requirements.txt      # Python dependencies
│   └── run_verification.py   # Standalone 6-point verification script
├── .env.example              # Backend environment template
├── .gitignore                # Git ignore rules
├── LICENSE                   # MIT License
└── README.md                 # Project documentation
```

---

## How to Run Backend

### Prerequisites
* Python 3.10 or higher
* `pip` package manager

### Steps

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create a virtual environment
python -m venv venv

# 3. Activate the virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (Command Prompt):
.\venv\Scripts\activate.bat
# On macOS / Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Start the FastAPI server
python -m uvicorn app.main:app --reload --port 8000
```

* API will be live at: `http://localhost:8000`
* Interactive API Documentation (Swagger): `http://localhost:8000/docs`
* System Health Check: `http://localhost:8000/api/health`

---

## How to Run Frontend

### Prerequisites
* Node.js 18.x or higher
* `npm` package manager

### Steps

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the Next.js development server
npm run dev
```

* Open your browser and navigate to: **`http://localhost:3000`**

---

## How Frontend Connects to Backend

1. When you select a location or open the dashboard, the frontend calls the REST API via [`frontend/src/services/apiClient.ts`](./frontend/src/services/apiClient.ts).
2. By default, requests are sent to `http://localhost:8000/api`.
3. This URL is controlled by the `NEXT_PUBLIC_API_URL` environment variable in `frontend/.env.local`.
4. The backend returns standardized JSON objects defined by Pydantic models in [`backend/app/models/schemas.py`](./backend/app/models/schemas.py) and typed in [`frontend/src/types/api.ts`](./frontend/src/types/api.ts).
5. If the backend is offline, the frontend handles the error gracefully and displays a connection notice without crashing.

---

## Data & API Sources

| Data Source | Information Provided | Authentication |
| :--- | :--- | :--- |
| **Open-Meteo Air Quality** | Hourly $PM_{2.5}, PM_{10}, NO_2, SO_2, CO, O_3$ from Copernicus CAMS and 72-hour forecasts | Free / Open (No key required) |
| **Open-Meteo Weather** | Temperature, relative humidity, apparent heat index, wind velocity, and solar radiation | Free / Open (No key required) |
| **Copernicus Sentinel-2** | 10m Normalized Difference Vegetation Index (NDVI) and tree canopy density | Open Earth Observation baseline |
| **Landsat-8 / Landsat-9** | Thermal Infrared Sensor (TIRS) surface heat proxies and Urban Heat Island (UHI) intensity | Open USGS/NASA baseline |
| **CPCB Standards** | Official Indian National Air Quality Index (NAQI) breakpoint tables and sub-index formulas | Published Indian government standard |

---

## Important Environment Variables

### Backend (`backend/.env` or root `.env`)
* `PORT`: Server port (default: `8000`).
* `HOST`: Server host (default: `0.0.0.0`).
* `CORS_ORIGINS`: Comma-separated list of allowed frontend origins (default: `http://localhost:3000,http://127.0.0.1:3000`).
* `CACHE_TTL_SECONDS`: In-memory cache duration to prevent API rate limits (default: `900` seconds / 15 minutes).
* `OPENAQ_API_KEY`: *(Optional)* Free API key from openaq.org for direct ground-station feeds.

### Frontend (`frontend/.env.local`)
* `NEXT_PUBLIC_API_URL`: Backend API base URL (default: `http://localhost:8000/api`).
* `NEXT_PUBLIC_MAP_API_KEY`: *(Optional)* Map tile key if using a custom tile provider. By default, high-resolution Esri Satellite imagery is loaded without an API key.

---

## Basic Troubleshooting

* **Backend port already in use (`error: [Errno 10048]`)**:
  Another application is using port 8000. Either stop that process or run on another port:
  ```bash
  python -m uvicorn app.main:app --reload --port 8001
  ```
  Then update `NEXT_PUBLIC_API_URL=http://localhost:8001/api` in `frontend/.env.local`.

* **CORS error in browser console**:
  Verify the backend is running and `CORS_ORIGINS` in your backend configuration contains `http://localhost:3000`.

* **Frontend dependencies or build failure**:
  Delete the temporary `.next` folder and reinstall packages:
  ```bash
  cd frontend
  npm install
  npm run build
  ```

* **Map tiles appear blank**:
  Ensure your machine has an active internet connection. The satellite map loads aerial tiles directly from Esri World Imagery.

---

## Team & Project Information

* **Project**: EcoPulse Mumbai — Environmental Science for Engineering (ESE) Project
* **Scope**: Mumbai Metropolitan Region (MMR) — 14 Municipal Locations
* **Team**: EcoPulse Research Team (Siddhant Surve & Contributors)
* **License**: This project is licensed under the [MIT License](./LICENSE).
