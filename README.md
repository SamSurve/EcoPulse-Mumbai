# EcoPulse Mumbai — Environmental Intelligence Web Platform

A software-only, data-driven environmental intelligence platform designed specifically for the unique coastal, high-density, and ecologically complex urban landscape of Mumbai, India.

---

## 1. Project Overview

EcoPulse Mumbai allows users to select any neighborhood across the Mumbai Metropolitan Region (MMR) and understand its environmental conditions across three core product capabilities:
1. **Air & Microclimate:** Real-time ground station and numerical atmospheric measurements ($PM_{2.5}, PM_{10}, NO_2, SO_2, CO, O_3$), official CPCB NAQI calculation, microclimate metrics (Temperature, Humidity, Heat Index, Wind, Solar Radiation), and 24h historical trends.
2. **Greenery & Heat Analysis:** Satellite-derived surface indicators (Sentinel-2 NDVI vegetation vigor, tree canopy %, impervious surface %, Landsat thermal surface heat proxies), and cross-area comparisons (e.g. *Borivali vs Andheri*).
3. **Environmental Risk & Prediction:** 30-day baseline Z-score anomaly detection, 72h future trend projections with communicated uncertainty, and an **explainable risk engine** with natural-language reasoning (explaining exactly why an area's risk is elevated, with zero opaque black-box scores).

---

## 2. Supported Mumbai Locations

EcoPulse Mumbai currently supports **14 micro-locations** across all major zones of Mumbai:
* **Western Suburbs:** Borivali, Kandivali, Malad, Andheri, Bandra
* **Central & Island City:** Bandra Kurla Complex (BKC), Dadar, Worli, Colaba, Sion, Kurla
* **Eastern Suburbs:** Powai, Chembur, Mulund

---

## 3. Project Structure

```
e:/ESE PROJECT/
├── backend/                      # Python 3.11 + FastAPI Service
│   ├── app/
│   │   ├── main.py               # Application bootstrap & CORS configuration
│   │   ├── config.py             # Pydantic environment configuration
│   │   ├── models/schemas.py     # Normalized Pydantic models for all 3 features
│   │   ├── data/locations.py     # 14 Mumbai locations with coordinates & wards
│   │   ├── adapters/             # Modular provider adapters (Open-Meteo, Satellite, OpenAQ)
│   │   ├── services/             # In-memory TTL cache, CPCB NAQI math, risk engine
│   │   └── routers/              # API routers (/api/locations, /api/environment)
│   ├── tests/test_backend.py     # Unit and integration test suite
│   ├── run_verification.py       # Standalone self-verification test runner
│   ├── requirements.txt          # Python dependencies
│   ├── README.md                 # Backend setup guide
│   └── .env.example              # Environment variables template
├── ECOPULSE_MUMBAI_BLUEPRINT.md  # Architectural blueprint & phased roadmap
├── MASTER_ENGINEERING_SPECIFICATION.md # Master engineering instruction specification
└── README.md                     # Root project overview
```

---

## 4. Running the Backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # Windows (or source venv/bin/activate on Linux/Mac)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

* API Root: `http://localhost:8000`
* Swagger UI: `http://localhost:8000/docs`
* Health Check: `http://localhost:8000/api/health`
* Locations: `http://localhost:8000/api/locations`
* Environmental Snapshot: `http://localhost:8000/api/environment/borivali`

---

## 5. Verification & Tests

```bash
cd backend
python run_verification.py
```
