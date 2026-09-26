import os
import sys
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

# Ensure workspace and backend roots are in sys.path for reliable module resolution
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
root_dir = os.path.dirname(backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    from app.config import settings
    from app.core.logging import setup_logging, get_logger
    from app.core.http_client import http_client
    from app.services.cache import cache
    from app.routers import locations, environment, air_quality, greenery_heat, risk_forecast
    from app.data.locations import get_all_locations
except ImportError:
    from backend.app.config import settings
    from backend.app.core.logging import setup_logging, get_logger
    from backend.app.core.http_client import http_client
    from backend.app.services.cache import cache
    from backend.app.routers import locations, environment, air_quality, greenery_heat, risk_forecast
    from backend.app.data.locations import get_all_locations

# Initialize structured logging on application load
setup_logging()
logger = get_logger("ecopulse.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Modern lifespan handler for graceful startup initialization and shutdown resource cleanup."""
    logger.info("EcoPulse Mumbai API starting up (env=%s, timeout=%ds)", settings.ENVIRONMENT, settings.HTTP_TIMEOUT_SECONDS)
    yield
    logger.info("EcoPulse Mumbai API shutting down, closing pooled HTTP connections")
    http_client.close()


app = FastAPI(
    title="EcoPulse Mumbai API",
    description="High-precision environmental intelligence backend for Mumbai Metropolitan Region.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration: W3C compliant handling of wildcards vs credentials
cors_origins = settings.cors_origins_list
has_wildcard = "*" in cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if not has_wildcard else ["*"],
    allow_credentials=False if has_wildcard else True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Inject defensive HTTP security headers on all responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# Include API Routers
app.include_router(locations.router)
app.include_router(greenery_heat.router)
app.include_router(environment.router)
app.include_router(air_quality.router)
app.include_router(risk_forecast.router)


@app.get("/api/health", tags=["Health"])
def health_check():
    """System health check and diagnostic status with cache telemetry."""
    return {
        "status": "healthy",
        "service": "EcoPulse Mumbai",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "supported_locations_count": len(get_all_locations()),
        "environment": settings.ENVIRONMENT,
        "cache": cache.stats()
    }


STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/dashboard", tags=["Dashboard"])
def get_dashboard():
    """Interactive EcoPulse Mumbai Web Dashboard."""
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Dashboard UI static file not found"}


@app.get("/", tags=["Root"])
def root_redirect(request: Request):
    """Root entry point: serves interactive UI to browsers, API catalog to API clients."""
    accept = request.headers.get("accept", "")
    index_file = os.path.join(STATIC_DIR, "index.html")
    if "text/html" in accept and os.path.exists(index_file):
        return FileResponse(index_file)

    return {
        "service": "EcoPulse Mumbai Environmental Intelligence API",
        "dashboard_ui": "/dashboard",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "dashboard": "/dashboard",
            "health": "/api/health",
            "locations": "/api/locations",
            "environment": "/api/environment/{location_id}",
            "air_quality": "/api/air-quality/{location_id}",
            "microclimate": "/api/microclimate/{location_id}",
            "greenery": "/api/greenery/{location_id}",
            "heat": "/api/heat/{location_id}",
            "compare": "/api/environment/compare?location_a={a}&location_b={b}",
            "map_features": "/api/greenery-heat/map",
            "risk": "/api/risk/{location_id}",
            "forecast": "/api/forecast/{location_id}",
            "risk_summary": "/api/risk/{location_id}/summary"
        }
    }


@app.exception_handler(RequestValidationError)
async def custom_validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_error = errors[0]["msg"] if errors else "Invalid request parameters"
    first_loc = " -> ".join(str(loc) for loc in errors[0]["loc"]) if errors and "loc" in errors[0] else "parameter"
    return JSONResponse(
        status_code=422,
        content={
            "error": "Unprocessable Entity",
            "detail": f"Validation failed for {first_loc}: {first_error}",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


@app.exception_handler(404)
async def custom_404_handler(request: Request, exc):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "error": "Not Found",
            "detail": str(exc.detail) if hasattr(exc, "detail") else "Resource not found",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


@app.exception_handler(500)
async def custom_500_handler(request: Request, exc):
    logger.exception("Unhandled internal server error: %s", str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "detail": "An unexpected error occurred while processing environmental intelligence.",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
