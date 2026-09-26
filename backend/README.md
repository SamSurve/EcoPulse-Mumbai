# EcoPulse Mumbai — Backend Service

High-precision, software-only environmental intelligence backend for the Mumbai Metropolitan Region (MMR). Built with FastAPI, Pydantic v2, and Python 3.11.

---

## 1. Quick Start

### Prerequisites
* Python 3.10 or higher
* `pip` package manager

### Setup Instructions (Windows / Linux / macOS)

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

# 5. (Optional) Configure environment variables
# Copy .env.example to .env
copy .env.example .env   # Windows
# or: cp .env.example .env # Linux/Mac

# 6. Run the FastAPI development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be live at: **`http://localhost:8000`**  
Interactive Swagger documentation: **`http://localhost:8000/docs`**  
ReDoc documentation: **`http://localhost:8000/redoc`**

---

## 2. Available Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health status, version, and location count |
| `GET` | `/api/locations` | List all 14 supported Mumbai micro-locations |
| `GET` | `/api/locations/{location_id}` | Detailed metadata for a single location |
| `GET` | `/api/environment/{location_id}` | Unified real-time environmental snapshot (Air, Weather, Greenery, Heat, Risk) |
| `GET` | `/docs` | Interactive Swagger API documentation |

---

## 3. Running Verification & Automated Tests

To run the automated test suite:

```bash
# Option A: Run the self-verification script (no external test runner needed)
python run_verification.py

# Option B: Run standard unit test suite
python tests/test_backend.py

# Option C: Run with pytest
pytest tests/ -v
```

---

## 4. Key Architecture Components

* **`app/models/schemas.py`**: Normalized Pydantic models preventing external provider data leak.
* **`app/data/locations.py`**: Registry of 14 Mumbai locations with latitude, longitude, and BMC wards.
* **`app/adapters/openmeteo_adapter.py`**: Open-Meteo Air Quality (CAMS) and Weather integration with official CPCB NAQI calculation.
* **`app/adapters/satellite_adapter.py`**: Sentinel-2 (NDVI) and Landsat thermal surface indices.
* **`app/services/environment_service.py`**: Data orchestrator assembling the 7-key unified response and computing explainable multi-factor environmental risk.
* **`app/services/cache.py`**: Thread-safe in-memory TTL caching (15-min default).
