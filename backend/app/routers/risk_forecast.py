from fastapi import APIRouter, HTTPException, Query, Path
from typing import Dict, Any

from app.models.schemas import RiskData, ForecastData, ErrorResponse, RiskSummaryResponse
from app.services.environment_service import environment_service
from app.data.locations import is_valid_location, get_location_by_id

router = APIRouter(prefix="/api", tags=["Feature 3: Environmental Risk & Prediction"])


@router.get(
    "/risk/{location_id}",
    response_model=RiskData,
    responses={
        404: {"model": ErrorResponse, "description": "Location not found in Mumbai registry"},
        422: {"model": ErrorResponse, "description": "Invalid location ID format"}
    }
)
def get_environmental_risk(
    location_id: str = Path(
        ...,
        min_length=2,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_\-]+$",
        description="Unique identifier for the Mumbai micro-location (e.g. 'borivali', 'andheri')"
    ),
    force_refresh: bool = Query(default=False, description="Bypass cache and recalculate risk")
):
    """
    Retrieve current explainable environmental risk for a selected Mumbai area.
    Combines air pollution, thermal index, urban heat retention, atmospheric dispersion,
    and vegetative buffer into the EcoPulse Environmental Risk Score (0-100).
    Includes deterministic reasoning, anomaly detection (Z-scores), and rule-based alerts.
    """
    if not is_valid_location(location_id):
        raise HTTPException(
            status_code=404,
            detail=f"Location '{location_id}' is invalid or not in Mumbai registry."
        )

    risk = environment_service.get_risk(location_id, force_refresh=force_refresh)
    if not risk:
        raise HTTPException(
            status_code=404,
            detail=f"Environmental risk assessment currently unavailable for '{location_id}'."
        )
    return risk


@router.get(
    "/forecast/{location_id}",
    response_model=ForecastData,
    responses={
        404: {"model": ErrorResponse, "description": "Location not found in Mumbai registry"},
        422: {"model": ErrorResponse, "description": "Invalid location ID format"}
    }
)
def get_environmental_forecast(
    location_id: str = Path(
        ...,
        min_length=2,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_\-]+$",
        description="Unique identifier for the Mumbai micro-location (e.g. 'borivali', 'andheri')"
    ),
    force_refresh: bool = Query(default=False, description="Bypass cache and query external forecast")
):
    """
    Retrieve 72-hour practical environmental forecast for a selected Mumbai area.
    Provides hourly projections of temperature, apparent heat index, humidity, precipitation,
    wind speed, PM2.5, and estimated NAQI, alongside daily aggregate summaries and trend interpretations.
    Explicitly labeled with FORECAST provenance.
    """
    if not is_valid_location(location_id):
        raise HTTPException(
            status_code=404,
            detail=f"Location '{location_id}' is invalid or not in Mumbai registry."
        )

    forecast = environment_service.get_forecast(location_id, force_refresh=force_refresh)
    if not forecast:
        raise HTTPException(
            status_code=404,
            detail=f"Forecast currently unavailable for '{location_id}'."
        )
    return forecast


@router.get(
    "/risk/{location_id}/summary",
    response_model=RiskSummaryResponse,
    responses={
        404: {"model": ErrorResponse, "description": "Location not found in Mumbai registry"},
        422: {"model": ErrorResponse, "description": "Invalid location ID format"}
    }
)
def get_risk_summary(
    location_id: str = Path(
        ...,
        min_length=2,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_\-]+$",
        description="Unique identifier for the Mumbai micro-location (e.g. 'borivali', 'andheri')"
    ),
    force_refresh: bool = Query(default=False)
) -> RiskSummaryResponse:
    """
    High-level compact summary of current risk, active alerts, and 72-hour outlook.
    """
    if not is_valid_location(location_id):
        raise HTTPException(
            status_code=404,
            detail=f"Location '{location_id}' is invalid or not in Mumbai registry."
        )

    loc = get_location_by_id(location_id)
    env = environment_service.get_unified_environment(location_id, force_refresh=force_refresh)
    risk = env.risk if env else None
    forecast = env.forecast if env else None

    return {
        "location_id": loc.id,
        "location_name": loc.name,
        "zone": loc.zone,
        "ward": loc.ward,
        "risk_score": risk.risk_score if risk else None,
        "risk_level": risk.risk_level if risk else None,
        "score_label": risk.score_label if risk else "EcoPulse Environmental Risk Score",
        "primary_stressor": risk.primary_stressor if risk else None,
        "active_alerts_count": len(risk.alerts) if risk else 0,
        "active_anomalies_count": len(risk.anomalies) if risk else 0,
        "explanation": risk.explanation if risk else "",
        "forecast_trend_summary": forecast.trend_summary if forecast else "",
        "timestamp": risk.timestamp if risk else None
    }
