from typing import List
from fastapi import APIRouter, HTTPException, Path
from app.data.locations import get_all_locations, get_location_by_id
from app.models.schemas import Location, LocationSummary, ErrorResponse

router = APIRouter(prefix="/api/locations", tags=["Locations"])


@router.get("", response_model=List[LocationSummary])
def list_locations():
    """
    List all 14 supported micro-locations across Mumbai.
    Includes coordinates, BMC ward designations, and nearest CAAQM monitoring stations.
    """
    locations = get_all_locations()
    return [
        LocationSummary(
            id=loc.id,
            name=loc.name,
            latitude=loc.latitude,
            longitude=loc.longitude,
            zone=loc.zone,
            ward=loc.ward,
            nearest_station=loc.nearest_station
        )
        for loc in locations
    ]


@router.get(
    "/{location_id}",
    response_model=Location,
    responses={
        404: {"model": ErrorResponse, "description": "Location not found in Mumbai registry"},
        422: {"model": ErrorResponse, "description": "Invalid location ID format"}
    }
)
def get_location_details(
    location_id: str = Path(
        ...,
        min_length=2,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_\-]+$",
        description="Unique identifier for the Mumbai micro-location (e.g. 'borivali', 'andheri')"
    )
):
    """
    Retrieve geographic and administrative metadata for a specific Mumbai location.
    """
    location = get_location_by_id(location_id)
    if not location:
        raise HTTPException(
            status_code=404,
            detail=f"Location '{location_id}' is not supported. Choose from registered Mumbai areas."
        )
    return location
