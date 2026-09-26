from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class DataProvenance(str, Enum):
    DIRECT_OBSERVATION = "DIRECT_OBSERVATION"
    MODELLED_ANALYSIS = "MODELLED_ANALYSIS"
    FORECAST = "FORECAST"
    ESTIMATED_INTERPOLATION = "ESTIMATED_INTERPOLATION"
    SATELLITE_BASELINE = "SATELLITE_BASELINE"
    BASELINE_COMPARISON = "BASELINE_COMPARISON"
    INSUFFICIENT_HISTORY = "INSUFFICIENT_HISTORY"
    UNAVAILABLE = "UNAVAILABLE"
    DATA_GAP = "DATA_GAP"


class Location(BaseModel):
    id: str = Field(..., description="Unique slug for the location (e.g. 'borivali')")
    name: str = Field(..., description="Display name of the Mumbai location")
    latitude: float = Field(..., description="WGS84 Latitude")
    longitude: float = Field(..., description="WGS84 Longitude")
    zone: str = Field(default="Western Suburbs", description="Mumbai administrative zone")
    ward: str = Field(default="", description="BMC Municipal Ward designation")
    nearest_station: str = Field(default="", description="Name of nearest CPCB/MPCB CAAQM station")


class LocationSummary(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    zone: str
    ward: str
    nearest_station: str


class PollutantDetail(BaseModel):
    pollutant: str
    display_name: str
    value: Optional[float] = None
    unit: str = "µg/m³"
    naqi_sub_index: Optional[int] = None
    category: Optional[str] = None
    provenance: DataProvenance = DataProvenance.DIRECT_OBSERVATION
    source: str = "Open-Meteo CAMS"
    observation_time: Optional[datetime] = None
    retrieval_time: Optional[datetime] = None
    is_available: bool = True
    status_note: Optional[str] = None


class AirData(BaseModel):
    aqi: Optional[int] = None
    aqi_category: Optional[str] = None
    aqi_calculation_method: str = "CPCB NAQI Instantaneous Sub-Index (1-Hour Snapshot)"
    dominant_pollutant: Optional[str] = None
    pollutants_monitored_count: int = 0
    pm25: Optional[PollutantDetail] = None
    pm10: Optional[PollutantDetail] = None
    no2: Optional[PollutantDetail] = None
    so2: Optional[PollutantDetail] = None
    co: Optional[PollutantDetail] = None
    o3: Optional[PollutantDetail] = None
    station_name: Optional[str] = None
    station_distance_km: Optional[float] = None
    source: str = "Open-Meteo CAMS"
    timestamp: Optional[datetime] = None
    retrieval_timestamp: Optional[datetime] = None
    provenance: DataProvenance = DataProvenance.MODELLED_ANALYSIS
    data_freshness: str = "Hourly Assimilated Model"


class WeatherData(BaseModel):
    temperature_c: Optional[float] = None
    relative_humidity_pct: Optional[float] = None
    apparent_temperature_c: Optional[float] = None
    surface_pressure_hpa: Optional[float] = None
    wind_speed_kmh: Optional[float] = None
    wind_direction_deg: Optional[float] = None
    wind_cardinal: Optional[str] = None
    precipitation_mm: Optional[float] = None
    solar_radiation_wm2: Optional[float] = Field(
        default=None,
        description="Downwelling shortwave solar radiation flux (W/m²) from numerical model assimilation or diurnal astronomical solar model (strictly 0.0 at night)"
    )
    cloud_cover_pct: Optional[float] = None
    source: str = "Open-Meteo Weather API"
    timestamp: Optional[datetime] = None
    retrieval_timestamp: Optional[datetime] = None
    provenance: DataProvenance = DataProvenance.DIRECT_OBSERVATION
    data_freshness: str = "Real-time Numerical Observation"


class GreeneryData(BaseModel):
    location_id: Optional[str] = None
    location_name: Optional[str] = None
    ndvi_mean: Optional[float] = None
    greenery_classification: Optional[str] = None  # "HIGH VEGETATION", "MODERATE VEGETATION", "LOW VEGETATION", "SPARSE / BUILT-UP"
    ndvi_category: Optional[str] = None           # Alias
    tree_canopy_pct: Optional[float] = None
    built_up_ratio_pct: Optional[float] = None
    vegetation_change_5yr_pct: Optional[float] = None
    interpretation: Optional[str] = None
    source: str = "Sentinel-2 10m Multispectral Surface Reflectance (Copernicus Baseline)"
    satellite_source: str = "Sentinel-2 10m Multispectral Baseline"
    baseline_date: str = "2023-2025 Multi-temporal Seasonal Median"
    provenance: DataProvenance = DataProvenance.SATELLITE_BASELINE
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class HeatData(BaseModel):
    location_id: Optional[str] = None
    location_name: Optional[str] = None
    surface_heat_index: Optional[float] = None     # 1.0 - 10.0 scale
    heat_classification: Optional[str] = None      # "LOW", "MODERATE", "HIGH", "EXTREME"
    heat_island_intensity: Optional[str] = None    # Alias
    built_up_ratio_pct: Optional[float] = None
    thermal_comfort_category: Optional[str] = None
    apparent_temperature_c: Optional[float] = None # Merged from live weather if available
    interpretation: Optional[str] = None
    source: str = "Landsat-8/9 Thermal Infrared (TIRS) Composite Baseline"
    satellite_source: str = "Landsat-8/9 Thermal Infrared (TIRS) Composite"
    baseline_date: str = "Multi-year Summer/Post-monsoon Thermal Survey"
    provenance: DataProvenance = DataProvenance.SATELLITE_BASELINE
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AnomalyItem(BaseModel):
    metric: str
    observed_value: float
    baseline_value: float
    deviation: Optional[float] = None
    z_score: float
    status: str = "NORMAL"  # "NORMAL", "ELEVATED", "ANOMALOUS"
    description: str
    provenance: DataProvenance = DataProvenance.BASELINE_COMPARISON


class AlertItem(BaseModel):
    id: str
    alert_type: str = "ENVIRONMENTAL_ALERT"  # "HIGH_PM25", "HIGH_AQI", "EXTREME_HEAT", "POOR_AIR_DISPERSION", "UNUSUAL_CONDITION"
    severity: str = "INFO"  # "INFO", "WARNING", "CRITICAL"
    title: str
    message: str
    affected_metric: str = "Composite Environment"
    reason: str = ""
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    provenance: DataProvenance = DataProvenance.MODELLED_ANALYSIS


class RiskData(BaseModel):
    location_id: Optional[str] = None
    location_name: Optional[str] = None
    score_label: str = "EcoPulse Environmental Risk Score"
    risk_score: Optional[int] = None
    risk_level: Optional[str] = None  # "LOW", "MODERATE", "HIGH", "SEVERE"
    primary_stressor: Optional[str] = None
    contributing_factors: Dict[str, Any] = Field(default_factory=dict)
    explanation: Optional[str] = None
    anomalies: List[AnomalyItem] = Field(default_factory=list)
    alerts: List[AlertItem] = Field(default_factory=list)
    disclaimer: str = "Application-level environmental risk indicator. Not an official CPCB/BMC or medical risk classification."
    provenance: DataProvenance = DataProvenance.MODELLED_ANALYSIS
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class HourlyForecastPoint(BaseModel):
    time: str
    temperature_c: Optional[float] = None
    apparent_temperature_c: Optional[float] = None
    relative_humidity_pct: Optional[float] = None
    precipitation_probability_pct: Optional[float] = None
    precipitation_mm: Optional[float] = None
    wind_speed_kmh: Optional[float] = None
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    estimated_aqi: Optional[int] = None
    provenance: DataProvenance = DataProvenance.FORECAST


class DailyForecastPoint(BaseModel):
    date: str
    temp_min_c: Optional[float] = None
    temp_max_c: Optional[float] = None
    precipitation_sum_mm: Optional[float] = None
    max_wind_speed_kmh: Optional[float] = None
    dominant_condition: Optional[str] = None
    avg_pm25: Optional[float] = None
    predicted_aqi_category: Optional[str] = None
    provenance: DataProvenance = DataProvenance.FORECAST


class ForecastData(BaseModel):
    location_id: str
    location_name: str
    forecast_hours: int = 72
    hourly: List[HourlyForecastPoint] = Field(default_factory=list)
    daily: List[DailyForecastPoint] = Field(default_factory=list)
    trend_summary: str = ""
    source: str = "Open-Meteo Numerical Weather & Atmospheric Prediction"
    provenance: DataProvenance = DataProvenance.FORECAST
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ResponseMetadata(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    cached: bool = False
    provider_status: Dict[str, str] = Field(default_factory=dict)
    data_freshness: str = "Real-time"
    version: str = "1.0.0"


class UnifiedEnvironmentResponse(BaseModel):
    location: Location
    air: Optional[AirData] = None
    weather: Optional[WeatherData] = None
    greenery: Optional[GreeneryData] = None
    heat: Optional[HeatData] = None
    risk: Optional[RiskData] = None
    forecast: Optional[ForecastData] = None
    metadata: ResponseMetadata = Field(default_factory=ResponseMetadata)


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    location_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Feature 2: Cross-Area Comparison Schemas
class LocationComparisonItem(BaseModel):
    location_id: str
    location_name: str
    zone: str
    ward: str
    # Greenery
    ndvi_mean: Optional[float] = None
    greenery_classification: Optional[str] = None
    tree_canopy_pct: Optional[float] = None
    # Built-up & Heat
    built_up_ratio_pct: Optional[float] = None
    surface_heat_index: Optional[float] = None
    heat_classification: Optional[str] = None
    # Live microclimate / air (if available)
    temperature_c: Optional[float] = None
    aqi: Optional[int] = None
    aqi_category: Optional[str] = None
    dominant_pollutant: Optional[str] = None
    # Provenance
    greenery_provenance: DataProvenance = DataProvenance.SATELLITE_BASELINE
    heat_provenance: DataProvenance = DataProvenance.SATELLITE_BASELINE


class AreaComparisonResponse(BaseModel):
    location_a: LocationComparisonItem
    location_b: LocationComparisonItem
    differentials: Dict[str, Any]
    interpretation: str
    methodology_note: str = (
        "Greenery and surface heat indicators are derived from multi-temporal Sentinel-2 and Landsat TIRS baselines. "
        "Air quality and temperature values represent current real-time observations/models. "
        "Comparative metrics highlight spatial differences and do not assert unverified direct causal causation."
    )
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Feature 2: GIS / Map Overview Schemas
class LocationMapFeature(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    zone: str
    ward: str
    ndvi_mean: float
    greenery_classification: str
    tree_canopy_pct: float
    built_up_ratio_pct: float
    surface_heat_index: float
    heat_classification: str
    temperature_c: Optional[float] = None
    aqi: Optional[int] = None
    aqi_category: Optional[str] = None
    provenance: DataProvenance = DataProvenance.SATELLITE_BASELINE


class MumbaiMapDataResponse(BaseModel):
    total_locations: int
    locations: List[LocationMapFeature]
    thematic_layers_available: List[str] = ["greenery_ndvi", "urban_heat_index", "built_up_density"]
    satellite_source: str = "Copernicus Sentinel-2 & Landsat-8/9 Thermal Survey Baseline"
    provenance: DataProvenance = DataProvenance.SATELLITE_BASELINE
    timestamp: datetime = Field(default_factory=datetime.utcnow)
