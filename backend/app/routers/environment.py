import logging
from fastapi import APIRouter, HTTPException, Query, Path
from app.models.schemas import UnifiedEnvironmentResponse, ErrorResponse
from app.services.environment_service import environment_service
from app.data.locations import is_valid_location

logger = logging.getLogger("ecopulse.environment")

router = APIRouter(prefix="/api/environment", tags=["Environmental Intelligence"])


@router.get(
    "/{location_id}",
    response_model=UnifiedEnvironmentResponse,
    responses={
        404: {"model": ErrorResponse, "description": "Location not found in Mumbai registry"},
        422: {"model": ErrorResponse, "description": "Invalid location ID format"},
        500: {"model": ErrorResponse, "description": "Internal server error assembling data"}
    }
)
def get_environment(
    location_id: str = Path(
        ...,
        min_length=2,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_\-]+$",
        description="Unique identifier for the Mumbai micro-location (e.g. 'borivali', 'andheri')"
    ),
    force_refresh: bool = Query(default=False, description="Bypass cache and query providers directly")
):
    """
    Retrieve full multi-layer environmental intelligence for a Mumbai location.
    Assembles real-time Air Quality, Microclimate, Greenery, Heat, and Explainable Risk.
    """
    if not is_valid_location(location_id):
        raise HTTPException(
            status_code=404,
            detail=f"Location '{location_id}' is invalid or not in Mumbai registry. Supported locations include: borivali, andheri, dadar, bandra, powai, colaba, worli, kurla, etc."
        )

    try:
        response = environment_service.get_unified_environment(location_id, force_refresh=force_refresh)
        if not response:
            raise HTTPException(
                status_code=404,
                detail=f"Unable to retrieve environmental data for location '{location_id}'."
            )
        return response
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Error synthesizing environmental intelligence for %s: %s", location_id, str(exc))
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while synthesizing environmental intelligence. Please try again later."
        )
