# EcoPulse Mumbai — Frontend Application

Modern SaaS-grade environmental intelligence dashboard for the Mumbai Metropolitan Region (MMR).

## Architecture & Data Flow

```
[ FastAPI Backend (Port 8000) ]
        │
        ├── GET /api/locations
        ├── GET /api/environment/{id}
        ├── GET /api/air-quality/{id}
        ├── GET /api/microclimate/{id}
        ├── GET /api/greenery/{id}
        ├── GET /api/heat/{id}
        ├── GET /api/environment/compare
        ├── GET /api/greenery-heat/map
        ├── GET /api/risk/{id}
        └── GET /api/forecast/{id}
        │
        ▼
[ EcoPulse Frontend UI ]
  ├── Interactive Location Selector (14 Mumbai Areas)
  ├── 5 Physical Metric Overview Cards
  ├── EcoPulse Environmental Risk Score Gauge & Reasoning
  ├── Sentinel-2 NDVI vs Landsat Heat Island Deep Dive
  ├── 72-Hour Forecast & Diurnal Trend Chart
  ├── 6-Channel CPCB Pollutant Matrix (Zero-Fabrication)
  ├── Leaflet Interactive Mumbai Map (Click-to-Load)
  └── Cross-Area Comparison Tool (e.g. Borivali vs Andheri)
```

## Running the Frontend

### Option 1: Direct Browser Access (FastAPI Integrated UI)
The interactive production dashboard is served directly by the FastAPI backend!
1. Start backend:
   ```bash
   python backend/app/main.py
   ```
2. Open your browser:
   ```
   http://localhost:8000/
   or
   http://localhost:8000/dashboard
   ```

### Option 2: Standalone Next.js Development Server
If you prefer running via Node.js:
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000`.

## Team & Contributors

* **YuvrajsinghAIML** - Frontend Engineering & UI/UX Polish
