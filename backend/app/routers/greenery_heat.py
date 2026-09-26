from fastapi import APIRouter, HTTPException, Query, Path
from app.models.schemas import (
    GreeneryData,
    HeatData,
    AreaComparisonResponse,
    MumbaiMapDataResponse,
    ErrorResponse
)
from app.data.locations import (
    get_location_by_id,
    get_all_locations
)
from app.adapters.satellite_adapter import satellite_adapter
from app.services.environment_service import environment_service
from app.services.cache import cache

router = APIRouter(prefix="/api", tags=["Feature 2: Greenery & Heat Analysis"])


@router.get(
    "/greenery/{location_id}",
    response_model=GreeneryData,
    responses={
        404: {"model": ErrorResponse, "description": "Location not found in Mumbai registry"},
        422: {"model": ErrorResponse, "description": "Invalid location ID format"}
    }
)
def get_greenery_analysis(
    location_id: str = Path(
        ...,
        min_length=2,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_\-]+$",
        description="Unique identifier for the Mumbai micro-location (e.g. 'borivali', 'andheri')"
    )
):
    """
    Retrieve satellite-derived vegetation indicators for a selected Mumbai area.
    Provides Sentinel-2 NDVI (10m resolution), tree canopy %, built-up ratio %,
    5-year vegetative trend, and plain-English environmental interpretation.
    Explicitly labeled with SATELLITE_BASELINE provenance.
    """
    loc = get_location_by_id(location_id)
    if not loc:
        raise HTTPException(
            status_code=404,
            detail=f"Location '{location_id}' is invalid or not in Mumbai registry."
        )

    return satellite_adapter.get_greenery(loc)


@router.get(
    "/heat/{location_id}",
    response_model=HeatData,
    responses={
        404: {"model": ErrorResponse, "description": "Location not found in Mumbai registry"},
        422: {"model": ErrorResponse, "description": "Invalid location ID format"}
    }
)
def get_heat_analysis(
    location_id: str = Path(
        ...,
        min_length=2,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_\-]+$",
        description="Unique identifier for the Mumbai micro-location (e.g. 'borivali', 'andheri')"
    )
):
    """
    Retrieve satellite-derived surface thermal metrics and urban heat island intensity.
    Provides Landsat-8/9 Thermal Infrared (TIRS) surface heat index (1-10 scale),
    thermal comfort classification, built-up ratio, and apparent temperature if available.
    Explicitly labeled with SATELLITE_BASELINE provenance.
    """
    loc = get_location_by_id(location_id)
    if not loc:
        raise HTTPException(
            status_code=404,
            detail=f"Location '{location_id}' is invalid or not in Mumbai registry."
        )

    heat_data = satellite_adapter.get_heat(loc)

    # Optionally augment with live apparent temperature from microclimate cache if available
    try:
        cached_env = cache.get(f"env:{loc.id}")
        if cached_env and cached_env.weather and cached_env.weather.apparent_temperature_c is not None:
            heat_data.apparent_temperature_c = cached_env.weather.apparent_temperature_c
        else:
            cached_w = cache.get(f"weather:{loc.id}")
            if cached_w and cached_w.apparent_temperature_c is not None:
                heat_data.apparent_temperature_c = cached_w.apparent_temperature_c
    except Exception:
        pass

    return heat_data


@router.get(
    "/environment/compare",
    response_model=AreaComparisonResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Cannot compare a location to itself"},
        404: {"model": ErrorResponse, "description": "One or both locations not found"},
        422: {"model": ErrorResponse, "description": "Invalid query parameters"}
    }
)
def compare_areas(
    location_a: str = Query(
        ...,
        min_length=2,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_\-]+$",
        description="First Mumbai location ID (e.g., borivali, dadar)"
    ),
    location_b: str = Query(
        ...,
        min_length=2,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_\-]+$",
        description="Second Mumbai location ID (e.g., andheri, powai)"
    )
):
    """
    Compare two Mumbai micro-locations side-by-side across environmental metrics:
    - Vegetative vigor (NDVI) & canopy density
    - Built-up surface ratio & Landsat surface heat index
    - Live microclimate temperature & CPCB NAQI (if available)
    - Calculated differentials (deltas) & scientifically defensible plain-English interpretation.
    """
    if location_a.strip().lower() == location_b.strip().lower():
        raise HTTPException(
            status_code=400,
            detail="Cannot compare a location to itself. Please specify two distinct Mumbai locations."
        )

    loc_a = get_location_by_id(location_a)
    if not loc_a:
        raise HTTPException(
            status_code=404,
            detail=f"Location '{location_a}' is invalid or not in Mumbai registry."
        )

    loc_b = get_location_by_id(location_b)
    if not loc_b:
        raise HTTPException(
            status_code=404,
            detail=f"Location '{location_b}' is invalid or not in Mumbai registry."
        )

    # Fetch live weather/air from environment service for enriched comparison
    air_a, air_b = None, None
    weather_a, weather_b = None, None

    try:
        air_a = environment_service.get_air(loc_a.id)
        weather_a = environment_service.get_weather(loc_a.id)
    except Exception:
        pass

    try:
        air_b = environment_service.get_air(loc_b.id)
        weather_b = environment_service.get_weather(loc_b.id)
    except Exception:
        pass

    return satellite_adapter.compare_locations(
        loc_a=loc_a,
        loc_b=loc_b,
        air_a=air_a,
        air_b=air_b,
        weather_a=weather_a,
        weather_b=weather_b
    )


@router.get(
    "/compare",
    response_model=AreaComparisonResponse,
    include_in_schema=False
)
def compare_areas_alias(
    location_a: str = Query(
        ...,
        min_length=2,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_\-]+$",
        description="First Mumbai location ID (e.g., borivali, dadar)"
    ),
    location_b: str = Query(
        ...,
        min_length=2,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_\-]+$",
        description="Second Mumbai location ID (e.g., andheri, powai)"
    )
):
    """Convenience alias for /api/environment/compare."""
    return compare_areas(location_a=location_a, location_b=location_b)


@router.get(
    "/greenery-heat/map",
    response_model=MumbaiMapDataResponse
)
def get_map_features():
    """
    Retrieve spatial GIS overlay metrics for all 14 registered Mumbai locations.
    Includes coordinates, ward, NDVI, greenery category, heat index, and heat classification.
    """
    locations = get_all_locations()
    return satellite_adapter.get_all_map_features(locations)
