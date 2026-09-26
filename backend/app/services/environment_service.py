import math
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.models.schemas import (
    Location,
    UnifiedEnvironmentResponse,
    ResponseMetadata,
    RiskData,
    AnomalyItem,
    AlertItem,
    AirData,
    WeatherData,
    GreeneryData,
    HeatData,
    ForecastData,
    DataProvenance
)
from app.data.locations import get_location_by_id
from app.services.cache import cache
from app.adapters.openmeteo_adapter import openmeteo_adapter
from app.adapters.openaq_adapter import openaq_adapter
from app.adapters.satellite_adapter import satellite_adapter


def _is_finite_num(v: Any) -> bool:
    """Check if value is a valid non-null, finite number."""
    if v is None:
        return False
    try:
        f = float(v)
        return math.isfinite(f)
    except (ValueError, TypeError):
        return False

# Documented Seasonal Reference Baselines for Coastal Mumbai (Post-Monsoon / Pre-Summer)
MUMBAI_BASELINES = {
    "pm25": {"mean": 38.0, "std": 12.0, "unit": "µg/m³", "label": "PM2.5 Particulate Concentration"},
    "pm10": {"mean": 75.0, "std": 22.0, "unit": "µg/m³", "label": "PM10 Particulate Concentration"},
    "temperature": {"mean": 31.0, "std": 1.8, "unit": "°C", "label": "Ambient Surface Temperature"},
    "humidity": {"mean": 72.0, "std": 10.0, "unit": "%", "label": "Relative Air Humidity"},
    "wind_speed": {"mean": 12.5, "std": 4.0, "unit": "km/h", "label": "Surface Wind Speed"}
}


def evaluate_environmental_risk(
    location: Location,
    air: Optional[AirData],
    weather: Optional[WeatherData],
    heat: Optional[HeatData],
    greenery: Optional[GreeneryData] = None
) -> RiskData:
    """
    Deterministic, explainable EcoPulse Environmental Risk Engine.
    Scientifically combines available environmental stress domains using
    dynamic weight renormalization (OECD Composite Indicator guidelines):
      - Air Quality stress (PM2.5, PM10, CPCB NAQI) [Nominal weight: 0.40]
      - Thermal stress (Ambient temperature & apparent heat index) [Nominal weight: 0.25]
      - Urban Surface Heat (Landsat TIRS & built-up density) [Nominal weight: 0.20]
      - Atmospheric Dispersion / Stagnation (wind velocity) [Nominal weight: 0.15]
      - Vegetative Mitigation Buffer (Sentinel-2 NDVI & tree canopy) [Offset: -8 to +4]

    Adheres strictly to the Zero-Fabrication policy:
      - Never substitutes fake default values (e.g. 85 AQI or 30.5°C) when inputs are missing.
      - If both real-time air and weather observations are missing, returns UNAVAILABLE.
      - Normalizes active weights dynamically over genuinely available domains.
      - Full unconstrained 0-100 continuous score scale.
    """
    now = datetime.utcnow()

    # 1. Determine availability of telemetry domains
    has_air = air is not None and _is_finite_num(air.aqi)
    has_temp = weather is not None and (_is_finite_num(weather.apparent_temperature_c) or _is_finite_num(weather.temperature_c))
    has_wind = weather is not None and _is_finite_num(weather.wind_speed_kmh)
    has_heat = heat is not None and _is_finite_num(heat.surface_heat_index)
    has_greenery = greenery is not None and _is_finite_num(greenery.ndvi_mean)

    # If neither real-time air quality nor meteorological telemetry is available,
    # return explicit UNAVAILABLE risk assessment rather than synthesizing fabricated risk.
    if not has_air and not (has_temp or has_wind):
        return RiskData(
            location_id=location.id,
            location_name=location.name,
            score_label="EcoPulse Environmental Risk Score",
            risk_score=None,
            risk_level="UNAVAILABLE",
            primary_stressor="Insufficient Real-Time Atmospheric Telemetry",
            contributing_factors={
                "status": "UNAVAILABLE",
                "reason": "Both real-time air quality and meteorological observations are currently unavailable"
            },
            explanation=f"Real-time environmental risk assessment for {location.name} is currently UNAVAILABLE due to telemetry absence.",
            anomalies=[],
            alerts=[],
            disclaimer="Application-level environmental risk indicator. Telemetry unavailable.",
            provenance=DataProvenance.UNAVAILABLE,
            timestamp=now
        )

    # 2. Compute stress scores for genuinely available domains
    active_weights: Dict[str, float] = {}
    component_scores: Dict[str, float] = {}

    # Air quality stress (nominal weight 0.40)
    aqi_val = None
    if has_air:
        aqi_val = air.aqi
        # Scaled against CPCB Poor threshold (200) / Severe threshold (400)
        air_stress = min(100.0, max(0.0, (float(aqi_val) / 250.0) * 100.0))
        active_weights["air_quality"] = 0.40
        component_scores["air_quality"] = air_stress
    else:
        air_stress = None

    # Thermal stress (nominal weight 0.25)
    temp_val = weather.temperature_c if weather else None
    app_temp_val = None
    if has_temp:
        app_temp_val = (
            weather.apparent_temperature_c
            if _is_finite_num(weather.apparent_temperature_c)
            else weather.temperature_c
        )
        # Scaled against coastal Mumbai comfort zone (26°C - 40°C apparent heat index)
        thermal_stress = min(100.0, max(0.0, (float(app_temp_val) - 26.0) / 14.0 * 100.0))
        active_weights["thermal_stress"] = 0.25
        component_scores["thermal_stress"] = thermal_stress
    else:
        thermal_stress = None

    # Surface heat stress from satellite baseline (nominal weight 0.20)
    heat_idx = None
    if has_heat:
        heat_idx = heat.surface_heat_index
        surface_heat_stress = min(100.0, max(0.0, (float(heat_idx) / 10.0) * 100.0))
        active_weights["surface_heat"] = 0.20
        component_scores["surface_heat"] = surface_heat_stress
    else:
        surface_heat_stress = None

    # Atmospheric dispersion stress (nominal weight 0.15)
    wind_val = None
    if has_wind:
        wind_val = weather.wind_speed_kmh
        if wind_val >= 16.0:
            dispersion_stress = 10.0
            ventilation_status = "FAVORABLE"
        elif wind_val >= 8.0:
            dispersion_stress = 35.0
            ventilation_status = "MODERATE"
        else:
            dispersion_stress = 75.0
            ventilation_status = "STAGNANT"
        active_weights["dispersion"] = 0.15
        component_scores["dispersion"] = dispersion_stress
    else:
        dispersion_stress = None
        ventilation_status = "UNAVAILABLE"

    # Vegetative mitigation buffer
    if has_greenery:
        ndvi_val = greenery.ndvi_mean
        if ndvi_val >= 0.45:
            vegetative_buffer_status = "STRONG"
            veg_relief = -8.0
        elif ndvi_val >= 0.25:
            vegetative_buffer_status = "MODERATE"
            veg_relief = -3.0
        else:
            vegetative_buffer_status = "SPARSE"
            veg_relief = +4.0
    else:
        vegetative_buffer_status = "UNAVAILABLE"
        veg_relief = 0.0

    # 3. Dynamic weight renormalization across available components
    total_active_weight = sum(active_weights.values())
    if total_active_weight > 0:
        normalized_weighted_sum = sum(
            (active_weights[k] / total_active_weight) * component_scores[k]
            for k in active_weights
        )
        composite_score = normalized_weighted_sum + veg_relief
        # Unclamp to full physical 0-100 range with finite float safety
        if math.isfinite(composite_score):
            risk_score = int(max(0, min(100, round(composite_score))))
        else:
            risk_score = None
    else:
        risk_score = None

    # 4. Classify risk level
    if risk_score is None:
        risk_level = "UNAVAILABLE"
    elif risk_score <= 35:
        risk_level = "LOW"
    elif risk_score <= 65:
        risk_level = "MODERATE"
    elif risk_score <= 85:
        risk_level = "HIGH"
    else:
        risk_level = "SEVERE"

    # 5. Determine primary stressor among available components
    stress_contributions = {}
    if total_active_weight > 0:
        if "air_quality" in component_scores:
            stress_contributions["Air Quality & Particulate Loading"] = (
                (active_weights["air_quality"] / total_active_weight) * component_scores["air_quality"]
            )
        if "thermal_stress" in component_scores:
            stress_contributions["Thermal Heat Index"] = (
                (active_weights["thermal_stress"] / total_active_weight) * component_scores["thermal_stress"]
            )
        if "surface_heat" in component_scores:
            stress_contributions["Urban Surface Heat Retention"] = (
                (active_weights["surface_heat"] / total_active_weight) * component_scores["surface_heat"]
            )
        if "dispersion" in component_scores:
            stress_contributions["Atmospheric Stagnation"] = (
                (active_weights["dispersion"] / total_active_weight) * component_scores["dispersion"]
            )

    if stress_contributions:
        primary_stressor = max(stress_contributions.items(), key=lambda x: x[1])[0]
    else:
        primary_stressor = "None Identified"

    # 6. Detailed contributing factors breakdown
    normalized_weights = {
        k: round(v / total_active_weight, 3) for k, v in active_weights.items()
    } if total_active_weight > 0 else {}

    contributing_factors = {
        "air_quality_stress_score": round(air_stress, 1) if air_stress is not None else None,
        "thermal_stress_score": round(thermal_stress, 1) if thermal_stress is not None else None,
        "surface_heat_stress_score": round(surface_heat_stress, 1) if surface_heat_stress is not None else None,
        "dispersion_stress_score": round(dispersion_stress, 1) if dispersion_stress is not None else None,
        "ventilation_status": ventilation_status,
        "vegetative_buffer_status": vegetative_buffer_status,
        "active_weights": normalized_weights,
        "weights": normalized_weights
    }

    # 7. Deterministic, explainable reasoning (non-medical phrasing)
    explanation_parts = []
    explanation_parts.append(
        f"EcoPulse Environmental Risk in {location.name} is assessed as {risk_level} (Score: {risk_score}/100)."
    )

    if air_stress is not None:
        if air_stress >= 50.0:
            dom = air.dominant_pollutant if air and air.dominant_pollutant else "PM2.5"
            explanation_parts.append(f"Elevated particulate concentration ({dom}) is a primary contributor (AQI: {aqi_val}).")
        else:
            explanation_parts.append(f"Air quality is in the acceptable range (AQI: {aqi_val}).")
    else:
        explanation_parts.append("Air quality monitoring is currently offline or unavailable.")

    if thermal_stress is not None and app_temp_val is not None:
        if thermal_stress >= 50.0:
            t_str = f"{temp_val:.1f}°C" if temp_val is not None else "N/A"
            explanation_parts.append(f"Elevated ambient temperature ({t_str}, heat index {app_temp_val:.1f}°C) adds thermal stress.")
        else:
            t_str = f"{temp_val:.1f}°C" if temp_val is not None else "moderate"
            explanation_parts.append(f"Thermal load remains moderate ({t_str}).")

    if ventilation_status == "FAVORABLE" and wind_val is not None:
        explanation_parts.append(f"Active coastal wind ({wind_val:.1f} km/h) aids atmospheric dispersion.")
    elif ventilation_status == "STAGNANT" and wind_val is not None:
        explanation_parts.append(f"Low surface wind ({wind_val:.1f} km/h) restricts vertical mixing and pollutant dispersion.")

    if vegetative_buffer_status == "STRONG":
        explanation_parts.append("Dense canopy buffer moderates local surface heat retention.")
    elif vegetative_buffer_status == "SPARSE":
        explanation_parts.append("Dense impervious surfaces amplify local microclimate heat retention.")

    if risk_level in ["HIGH", "SEVERE"]:
        explanation_parts.append("Environmental conditions may be unfavorable for sensitive individuals.")

    explanation_text = " ".join(explanation_parts)

    # 8. Lightweight Anomaly Detection (Z-score against Mumbai seasonal baselines)
    anomalies: List[AnomalyItem] = []

    # Check PM2.5 anomaly
    if air and air.pm25 and _is_finite_num(air.pm25.value):
        pm_obs = air.pm25.value
        pm_base = MUMBAI_BASELINES["pm25"]["mean"]
        pm_std = MUMBAI_BASELINES["pm25"]["std"]
        dev = round(pm_obs - pm_base, 1)
        z = round(dev / pm_std, 2)
        status = "ANOMALOUS" if abs(z) >= 2.5 else ("ELEVATED" if abs(z) >= 1.5 else "NORMAL")
        anomalies.append(AnomalyItem(
            metric="PM2.5 Particulate Concentration",
            observed_value=pm_obs,
            baseline_value=pm_base,
            deviation=dev,
            z_score=z,
            status=status,
            description=f"PM2.5 concentration of {pm_obs} µg/m³ is {dev:+.1f} µg/m³ relative to seasonal baseline ({status}, Z={z:+0.2f})",
            provenance=DataProvenance.BASELINE_COMPARISON
        ))

    # Check Ambient Temperature anomaly
    if weather and _is_finite_num(weather.temperature_c):
        t_obs = weather.temperature_c
        t_base = MUMBAI_BASELINES["temperature"]["mean"]
        t_std = MUMBAI_BASELINES["temperature"]["std"]
        dev = round(t_obs - t_base, 1)
        z = round(dev / t_std, 2)
        status = "ANOMALOUS" if abs(z) >= 2.5 else ("ELEVATED" if abs(z) >= 1.5 else "NORMAL")
        anomalies.append(AnomalyItem(
            metric="Ambient Temperature",
            observed_value=t_obs,
            baseline_value=t_base,
            deviation=dev,
            z_score=z,
            status=status,
            description=f"Surface temperature of {t_obs}°C is {dev:+.1f}°C relative to coastal baseline ({status}, Z={z:+0.2f})",
            provenance=DataProvenance.BASELINE_COMPARISON
        ))

    # Check Surface Wind Speed anomaly
    if weather and _is_finite_num(weather.wind_speed_kmh):
        w_obs = weather.wind_speed_kmh
        w_base = MUMBAI_BASELINES["wind_speed"]["mean"]
        w_std = MUMBAI_BASELINES["wind_speed"]["std"]
        dev = round(w_obs - w_base, 1)
        z = round(dev / w_std, 2)
        status = "ANOMALOUS" if abs(z) >= 2.5 else ("ELEVATED" if abs(z) >= 1.5 else "NORMAL")
        anomalies.append(AnomalyItem(
            metric="Surface Wind Speed",
            observed_value=w_obs,
            baseline_value=w_base,
            deviation=dev,
            z_score=z,
            status=status,
            description=f"Wind speed of {w_obs} km/h is {dev:+.1f} km/h relative to typical baseline ({status}, Z={z:+0.2f})",
            provenance=DataProvenance.BASELINE_COMPARISON
        ))

    # 9. Deterministic Rule-Based Environmental Alerts
    alerts: List[AlertItem] = []

    # Alert 1: High PM2.5
    if air and air.pm25 and _is_finite_num(air.pm25.value) and air.pm25.value >= 60.0:
        val = air.pm25.value
        sev = "CRITICAL" if val >= 120.0 else "WARNING"
        alerts.append(AlertItem(
            id=f"alert-pm25-{location.id}",
            alert_type="HIGH_PM25",
            severity=sev,
            title=f"Elevated PM2.5 in {location.name}",
            message="Fine particulate concentration exceeds the recommended 24-hour advisory threshold.",
            affected_metric="PM2.5",
            reason=f"Observed PM2.5 concentration of {val} µg/m³ exceeds standard threshold (60 µg/m³)",
            timestamp=now,
            provenance=DataProvenance.MODELLED_ANALYSIS
        ))

    # Alert 2: High AQI
    if air and _is_finite_num(air.aqi) and air.aqi >= 200:
        sev = "CRITICAL" if air.aqi >= 300 else "WARNING"
        alerts.append(AlertItem(
            id=f"alert-aqi-{location.id}",
            alert_type="HIGH_AQI",
            severity=sev,
            title=f"High NAQI ({air.aqi}) in {location.name}",
            message="Overall air quality is categorized as Poor or Severe. Sensitive individuals should reduce prolonged outdoor exertion.",
            affected_metric="CPCB NAQI",
            reason=f"Composite AQI of {air.aqi} exceeds the 200 threshold",
            timestamp=now,
            provenance=DataProvenance.MODELLED_ANALYSIS
        ))

    # Alert 3: Extreme Heat / High Thermal Stress
    if _is_finite_num(app_temp_val):
        if app_temp_val >= 38.0 or (_is_finite_num(temp_val) and temp_val >= 35.5):
            alerts.append(AlertItem(
                id=f"alert-heat-{location.id}",
                alert_type="EXTREME_HEAT",
                severity="WARNING",
                title=f"High Thermal Stress in {location.name}",
                message=f"Apparent heat index ({app_temp_val:.1f}°C) is elevated due to coastal humidity.",
                affected_metric="Apparent Temperature",
                reason=f"Combined heat index of {app_temp_val:.1f}°C exceeds the 38°C threshold",
                timestamp=now,
                provenance=DataProvenance.DIRECT_OBSERVATION
            ))

    # Alert 4: Poor Air Dispersion / Stagnation
    if ventilation_status == "STAGNANT" and _is_finite_num(aqi_val) and aqi_val >= 100:
        alerts.append(AlertItem(
            id=f"alert-dispersion-{location.id}",
            alert_type="POOR_AIR_DISPERSION",
            severity="INFO",
            title=f"Subdued Atmospheric Dispersion in {location.name}",
            message="Low surface wind speeds reduce vertical atmospheric mixing, sustaining local pollutant retention.",
            affected_metric="Surface Wind Speed",
            reason=f"Surface wind ({wind_val:.1f} km/h) is below 8 km/h while AQI is {aqi_val}",
            timestamp=now,
            provenance=DataProvenance.DIRECT_OBSERVATION
        ))

    # Alert 5: Unusual Condition (Triggered if any anomaly is ANOMALOUS)
    anomalous_items = [a for a in anomalies if a.status == "ANOMALOUS"]
    if anomalous_items:
        first_a = anomalous_items[0]
        alerts.append(AlertItem(
            id=f"alert-unusual-{location.id}",
            alert_type="UNUSUAL_CONDITION",
            severity="WARNING",
            title=f"Statistically Unusual Condition in {location.name}",
            message=f"{first_a.description}",
            affected_metric=first_a.metric,
            reason=f"Observed value deviates by Z={first_a.z_score:+.2f} from seasonal baseline",
            timestamp=now,
            provenance=DataProvenance.BASELINE_COMPARISON
        ))

    return RiskData(
        location_id=location.id,
        location_name=location.name,
        score_label="EcoPulse Environmental Risk Score",
        risk_score=risk_score,
        risk_level=risk_level,
        primary_stressor=primary_stressor,
        contributing_factors=contributing_factors,
        explanation=explanation_text,
        anomalies=anomalies,
        alerts=alerts,
        disclaimer="Application-level environmental risk indicator. Not an official CPCB/BMC or medical risk classification.",
        provenance=DataProvenance.MODELLED_ANALYSIS,
        timestamp=now
    )


class EnvironmentalService:
    """Core orchestrator assembling environmental intelligence for Mumbai."""

    def get_air(self, location_id: str, force_refresh: bool = False) -> Optional[AirData]:
        """Fetch real-time air quality data for a location with sub-key caching."""
        location = get_location_by_id(location_id)
        if not location:
            return None

        # 1. Check unified environment cache first, then domain-specific cache
        if not force_refresh:
            cached_env = cache.get(f"env:{location.id}")
            if cached_env is not None and cached_env.air is not None:
                return cached_env.air.model_copy(deep=True)

            cached_air = cache.get(f"air:{location.id}")
            if cached_air is not None:
                return cached_air.model_copy(deep=True)

        # 2. Fetch from physical station (OpenAQ) or fallback to numerical model (Open-Meteo)
        air = openaq_adapter.fetch_air_quality(location)
        if not air:
            air = openmeteo_adapter.fetch_air_quality(location)

        if air is not None:
            cache.set(f"air:{location.id}", air, ttl_seconds=900)
        return air

    def get_weather(self, location_id: str, force_refresh: bool = False) -> Optional[WeatherData]:
        """Fetch microclimate meteorological data for a location with sub-key caching."""
        location = get_location_by_id(location_id)
        if not location:
            return None

        # 1. Check unified environment cache first, then domain-specific cache
        if not force_refresh:
            cached_env = cache.get(f"env:{location.id}")
            if cached_env is not None and cached_env.weather is not None:
                return cached_env.weather.model_copy(deep=True)

            cached_weather = cache.get(f"weather:{location.id}")
            if cached_weather is not None:
                return cached_weather.model_copy(deep=True)

        # 2. Fetch from Open-Meteo weather adapter
        weather = openmeteo_adapter.fetch_weather(location)
        if weather is not None:
            cache.set(f"weather:{location.id}", weather, ttl_seconds=900)
        return weather

    def get_forecast(self, location_id: str, force_refresh: bool = False) -> Optional[ForecastData]:
        """Fetch 72-hour forecast for a location, with 1-hour caching."""
        location = get_location_by_id(location_id)
        if not location:
            return None

        cache_key = f"forecast:{location.id}"
        if not force_refresh:
            cached = cache.get(cache_key)
            if cached is not None:
                return cached.model_copy(deep=True)

        forecast = openmeteo_adapter.fetch_72h_forecast(location)
        if forecast is not None:
            cache.set(cache_key, forecast, ttl_seconds=3600)
        return forecast

    def get_risk(self, location_id: str, force_refresh: bool = False) -> Optional[RiskData]:
        """Calculate and return explainable environmental risk for a location."""
        location = get_location_by_id(location_id)
        if not location:
            return None

        # Delegate through unified environment to leverage cached sensor/model layers
        env = self.get_unified_environment(location_id, force_refresh=force_refresh)
        return env.risk if env else None

    def get_unified_environment(
        self,
        location_id: str,
        force_refresh: bool = False
    ) -> Optional[UnifiedEnvironmentResponse]:
        location = get_location_by_id(location_id)
        if not location:
            return None

        cache_key = f"env:{location.id}"
        if not force_refresh:
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                # Deep copy to prevent in-place cache mutation bug
                cloned = cached_data.model_copy(deep=True)
                cloned.metadata.cached = True
                return cloned

        provider_status: Dict[str, str] = {}

        # 1. Fetch Microclimate Weather (Open-Meteo Weather API)
        weather = openmeteo_adapter.fetch_weather(location)
        if weather:
            provider_status["open_meteo_weather"] = "active"
        else:
            provider_status["open_meteo_weather"] = "unavailable"

        # 2. Fetch Air Quality: Try OpenAQ v3 Ground Station First, Fallback to Open-Meteo CAMS
        air = openaq_adapter.fetch_air_quality(location)
        if air:
            provider_status["openaq_v3"] = "active_physical_station"
        else:
            provider_status["openaq_v3"] = "no_station_or_unconfigured"
            air = openmeteo_adapter.fetch_air_quality(location)
            if air:
                provider_status["open_meteo_cams"] = "active_assimilated_model"
            else:
                provider_status["open_meteo_cams"] = "unavailable"

        # Prime domain-specific sub-caches
        if weather:
            cache.set(f"weather:{location.id}", weather, ttl_seconds=900)
        if air:
            cache.set(f"air:{location.id}", air, ttl_seconds=900)

        # 3. Fetch Satellite Surface Indicators (Sentinel-2 & Landsat Baselines)
        greenery = satellite_adapter.get_greenery(location)
        heat = satellite_adapter.get_heat(location)
        provider_status["sentinel2_ndvi"] = "baseline_active"
        provider_status["landsat_tirs"] = "baseline_active"

        # Merge apparent temperature into heat metric
        if weather and heat:
            heat.apparent_temperature_c = weather.apparent_temperature_c

        # 4. Synthesize Explainable Risk
        risk = evaluate_environmental_risk(location, air, weather, heat, greenery)

        # 5. Fetch 72-Hour Forecast (Open-Meteo Forecast)
        forecast = None
        try:
            forecast = self.get_forecast(location_id, force_refresh=force_refresh)
            if forecast:
                provider_status["open_meteo_forecast"] = "active"
        except Exception:
            provider_status["open_meteo_forecast"] = "unavailable"

        # 6. Build Unified Response
        response = UnifiedEnvironmentResponse(
            location=location,
            air=air,
            weather=weather,
            greenery=greenery,
            heat=heat,
            risk=risk,
            forecast=forecast,
            metadata=ResponseMetadata(
                timestamp=datetime.utcnow(),
                cached=False,
                provider_status=provider_status,
                data_freshness="Real-time Observation / Modelled Forecast",
                version="1.0.0"
            )
        )

        # 7. Store in cache (15 min TTL normal, 60s degraded fallback TTL if both live upstream channels failed)
        cache_ttl = 60 if (weather is None and air is None) else 900
        cache.set(cache_key, response.model_copy(deep=True), ttl_seconds=cache_ttl)
        return response


environment_service = EnvironmentalService()
