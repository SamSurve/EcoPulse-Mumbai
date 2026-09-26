from fastapi import APIRouter, HTTPException, Query, Path
from app.models.schemas import AirData, WeatherData, ErrorResponse
from app.services.environment_service import environment_service
from app.data.locations import is_valid_location

router = APIRouter(prefix="/api", tags=["Feature 1: Air & Microclimate"])


@router.get(
    "/air-quality/{location_id}",
    response_model=AirData,
    responses={
        404: {"model": ErrorResponse, "description": "Location not found in Mumbai registry"},
        422: {"model": ErrorResponse, "description": "Invalid location ID format"}
    }
)
def get_air_quality(
    location_id: str = Path(
        ...,
        min_length=2,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_\-]+$",
        description="Unique identifier for the Mumbai micro-location (e.g. 'borivali', 'andheri')"
    ),
    force_refresh: bool = Query(default=False, description="Bypass cache and query external provider")
):
    """
    Retrieve real-time Air Quality data for a selected Mumbai area.
    Includes CPCB NAQI calculation, individual pollutant channels (PM2.5, PM10, NO2, SO2, CO, O3),
    provenance badges, station distance, and timestamps.
    """
    if not is_valid_location(location_id):
        raise HTTPException(
            status_code=404,
            detail=f"Location '{location_id}' is invalid or not in Mumbai registry."
        )

    air = environment_service.get_air(location_id, force_refresh=force_refresh)
    if not air:
        raise HTTPException(
            status_code=404,
            detail=f"Air quality data currently unavailable for '{location_id}'."
        )
    return air


@router.get(
    "/microclimate/{location_id}",
    response_model=WeatherData,
    responses={
        404: {"model": ErrorResponse, "description": "Location not found in Mumbai registry"},
        422: {"model": ErrorResponse, "description": "Invalid location ID format"}
    }
)
def get_microclimate(
    location_id: str = Path(
        ...,
        min_length=2,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_\-]+$",
        description="Unique identifier for the Mumbai micro-location (e.g. 'borivali', 'andheri')"
    ),
    force_refresh: bool = Query(default=False, description="Bypass cache and query external provider")
):
    """
    Retrieve real-time Microclimate Weather data for a selected Mumbai area.
    Includes ambient temperature, relative humidity, apparent heat index, wind speed/direction,
    cloud cover, and surface pressure.
    """
    if not is_valid_location(location_id):
        raise HTTPException(
            status_code=404,
            detail=f"Location '{location_id}' is invalid or not in Mumbai registry."
        )

    weather = environment_service.get_weather(location_id, force_refresh=force_refresh)
    if not weather:
        raise HTTPException(
            status_code=404,
            detail=f"Microclimate data currently unavailable for '{location_id}'."
        )
    return weather
