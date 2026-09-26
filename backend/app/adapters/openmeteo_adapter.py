import json
import math
import urllib.request
import urllib.error
from datetime import datetime
from typing import Optional, Tuple, Dict, Any, List
from app.models.schemas import (
    Location,
    AirData,
    WeatherData,
    PollutantDetail,
    HourlyForecastPoint,
    DailyForecastPoint,
    ForecastData,
    DataProvenance
)
from app.config import settings
from app.adapters.base import BaseEnvironmentalProvider
from app.core.http_client import http_client
from app.core.logging import get_logger

logger = get_logger("adapter.openmeteo")


def calculate_naqi_sub_index(pollutant: str, concentration: float) -> Tuple[Optional[int], Optional[str]]:
    """
    Calculate Indian National Air Quality Index (NAQI) sub-index
    using official CPCB standard breakpoints with continuous interval interpolation.
    Eliminates all discrete gap vulnerabilities for floating-point concentrations.
    """
    if concentration is None:
        return None, None

    try:
        c = float(concentration)
    except (ValueError, TypeError):
        return None, None

    if not math.isfinite(c) or c < 0.0:
        return None, None

    # CPCB Official Breakpoints: (C_low, C_high, I_low, I_high)
    # Contiguous ranges: [0, C1], (C1, C2], (C2, C3], ...
    breakpoints = {
        "pm25": [
            (0.0, 30.0, 0, 50),
            (30.0, 60.0, 51, 100),
            (60.0, 90.0, 101, 200),
            (90.0, 120.0, 201, 300),
            (120.0, 250.0, 301, 400),
            (250.0, 500.0, 401, 500)
        ],
        "pm10": [
            (0.0, 50.0, 0, 50),
            (50.0, 100.0, 51, 100),
            (100.0, 250.0, 101, 200),
            (250.0, 350.0, 201, 300),
            (350.0, 430.0, 301, 400),
            (430.0, 600.0, 401, 500)
        ],
        "no2": [
            (0.0, 40.0, 0, 50),
            (40.0, 80.0, 51, 100),
            (80.0, 180.0, 101, 200),
            (180.0, 280.0, 201, 300),
            (280.0, 400.0, 301, 400),
            (400.0, 800.0, 401, 500)
        ],
        "so2": [
            (0.0, 40.0, 0, 50),
            (40.0, 80.0, 51, 100),
            (80.0, 380.0, 101, 200),
            (380.0, 800.0, 201, 300),
            (800.0, 1600.0, 301, 400),
            (1600.0, 2000.0, 401, 500)
        ],
        "co": [
            (0.0, 1.0, 0, 50),
            (1.0, 2.0, 51, 100),
            (2.0, 10.0, 101, 200),
            (10.0, 17.0, 201, 300),
            (17.0, 34.0, 301, 400),
            (34.0, 50.0, 401, 500)
        ],
        "o3": [
            (0.0, 50.0, 0, 50),
            (50.0, 100.0, 51, 100),
            (100.0, 168.0, 101, 200),
            (168.0, 208.0, 201, 300),
            (208.0, 748.0, 301, 400),
            (748.0, 1000.0, 401, 500)
        ]
    }

    poll_key = pollutant.lower()
    if poll_key not in breakpoints:
        return None, None

    table = breakpoints[poll_key]

    for idx, (c_low, c_high, i_low, i_high) in enumerate(table):
        # First interval is inclusive [c_low, c_high]; subsequent are (c_low, c_high]
        in_range = (c_low <= c <= c_high) if idx == 0 else (c_low < c <= c_high)
        if in_range:
            sub_index = int(round(((i_high - i_low) / (c_high - c_low)) * (c - c_low) + i_low))
            category = get_naqi_category(sub_index)
            return sub_index, category

    # If concentration exceeds highest breakpoint, cap at 500 (Severe)
    return 500, "Severe"


def get_naqi_category(index: int) -> str:
    """Return CPCB NAQI descriptor for a given index."""
    if index <= 50:
        return "Good"
    elif index <= 100:
        return "Satisfactory"
    elif index <= 200:
        return "Moderate"
    elif index <= 300:
        return "Poor"
    elif index <= 400:
        return "Very Poor"
    else:
        return "Severe"


def degrees_to_cardinal(d: float) -> str:
    """Convert degrees to 16-point cardinal compass direction with circular normalization."""
    if d is None:
        return "N/A"
    try:
        norm_d = float(d) % 360.0
    except (ValueError, TypeError):
        return "N/A"

    dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
            "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    ix = round(norm_d / (360. / len(dirs)))
    return dirs[ix % len(dirs)]


def estimate_diurnal_solar_radiation(
    dt_utc: Optional[datetime] = None,
    cloud_cover_pct: Optional[float] = 20.0
) -> float:
    """
    Deterministic diurnal solar irradiance model (W/m²) for Mumbai (19.076°N, 72.877°E).
    NOTE: This is a derived physical astronomical calculation (solar elevation curve),
    NOT a physical on-site pyranometer sensor observation.
    Sunrise ~06:15 IST (6.25h), Sunset ~18:45 IST (18.75h).
    At night (before sunrise or after sunset), solar flux is strictly 0.0 W/m².
    """
    if dt_utc is None:
        dt_utc = datetime.utcnow()

    # Convert UTC to Indian Standard Time (IST = UTC + 5:30)
    ist_hour = (dt_utc.hour + 5.5 + (dt_utc.minute / 60.0)) % 24.0

    # Solar elevation window between ~06:15 and ~18:45 IST
    if 6.25 <= ist_hour < 18.75:
        # Solar altitude sine curve with peak at solar noon (~12:30 IST)
        sin_elev = math.sin((ist_hour - 6.25) / 12.5 * math.pi)
        # Cloud transmittance attenuation
        cloud = max(0.0, min(100.0, float(cloud_cover_pct))) if cloud_cover_pct is not None else 20.0
        cloud_transmittance = 1.0 - (cloud / 100.0) * 0.7
        return round(max(0.0, 850.0 * sin_elev * cloud_transmittance), 1)
    else:
        return 0.0  # Physically zero at night


class OpenMeteoAdapter(BaseEnvironmentalProvider):
    """
    Adapter for Open-Meteo Air Quality (CAMS models) & Weather APIs.
    Free, non-commercial open API. Resilient with network timeout handling.
    """

    def __init__(self, timeout_seconds: Optional[int] = None):
        self.timeout = timeout_seconds or settings.HTTP_TIMEOUT_SECONDS

    def fetch_weather(self, location: Location) -> Optional[WeatherData]:
        """Fetch real-time microclimate parameters from Open-Meteo Weather API."""
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={location.latitude}&longitude={location.longitude}&"
            f"current=temperature_2m,relative_humidity_2m,apparent_temperature,"
            f"precipitation,wind_speed_10m,wind_direction_10m,surface_pressure,cloud_cover,shortwave_radiation_instant&"
            f"timezone=Asia%2FKolkata"
        )
        now = datetime.utcnow()
        try:
            data = http_client.get_json(url)
            if not data or not isinstance(data, dict):
                raise ConnectionError(f"Open-Meteo weather unavailable for {location.id}")

            current = data.get("current") or {}

            temp = current.get("temperature_2m")
            rh = current.get("relative_humidity_2m")
            app_temp = current.get("apparent_temperature")
            wind_spd = current.get("wind_speed_10m")
            wind_deg = current.get("wind_direction_10m")
            precip = current.get("precipitation")
            pressure = current.get("surface_pressure")
            cloud = current.get("cloud_cover")
            solar_val = current.get("shortwave_radiation_instant")
            obs_time_str = current.get("time")

            obs_time = datetime.fromisoformat(obs_time_str) if obs_time_str else now

            # Physical bounds and sanity validation
            if temp is not None:
                try:
                    f_temp = float(temp)
                    temp = f_temp if (math.isfinite(f_temp) and -10.0 <= f_temp <= 60.0) else None
                except (ValueError, TypeError):
                    temp = None

            if rh is not None:
                try:
                    f_rh = float(rh)
                    rh = max(0.0, min(100.0, f_rh)) if math.isfinite(f_rh) else None
                except (ValueError, TypeError):
                    rh = None

            if app_temp is not None:
                try:
                    f_app = float(app_temp)
                    app_temp = f_app if (math.isfinite(f_app) and -10.0 <= f_app <= 70.0) else None
                except (ValueError, TypeError):
                    app_temp = None

            if wind_spd is not None:
                try:
                    f_wind = float(wind_spd)
                    wind_spd = max(0.0, min(250.0, f_wind)) if math.isfinite(f_wind) else None
                except (ValueError, TypeError):
                    wind_spd = None

            if wind_deg is not None:
                try:
                    f_deg = float(wind_deg)
                    wind_deg = (f_deg % 360.0) if math.isfinite(f_deg) else None
                except (ValueError, TypeError):
                    wind_deg = None

            if precip is not None:
                try:
                    f_precip = float(precip)
                    precip = max(0.0, min(1000.0, f_precip)) if math.isfinite(f_precip) else None
                except (ValueError, TypeError):
                    precip = None

            if pressure is not None:
                try:
                    f_pres = float(pressure)
                    pressure = f_pres if (math.isfinite(f_pres) and 800.0 <= f_pres <= 1100.0) else None
                except (ValueError, TypeError):
                    pressure = None

            if cloud is not None:
                try:
                    f_cloud = float(cloud)
                    cloud = max(0.0, min(100.0, f_cloud)) if math.isfinite(f_cloud) else None
                except (ValueError, TypeError):
                    cloud = None

            # Physical Solar Irradiance Determination:
            # 1. If Open-Meteo NWP model provides instant downwelling solar flux, use it.
            # 2. Otherwise, estimate via clear-sky diurnal solar elevation curve for Mumbai (UTC+5:30).
            # NOTE: Both sources are derived numerical/astronomical models, NOT direct rooftop sensor pyranometers.
            if solar_val is not None:
                try:
                    f_solar = float(solar_val)
                    solar_wm2 = max(0.0, min(2000.0, f_solar)) if math.isfinite(f_solar) else 0.0
                except (ValueError, TypeError):
                    solar_wm2 = estimate_diurnal_solar_radiation(now, cloud_cover_pct=cloud)
            else:
                solar_wm2 = estimate_diurnal_solar_radiation(now, cloud_cover_pct=cloud)

            return WeatherData(
                temperature_c=temp,
                relative_humidity_pct=rh,
                apparent_temperature_c=app_temp,
                surface_pressure_hpa=pressure,
                wind_speed_kmh=wind_spd,
                wind_direction_deg=wind_deg,
                wind_cardinal=degrees_to_cardinal(wind_deg) if wind_deg is not None else None,
                precipitation_mm=precip,
                solar_radiation_wm2=solar_wm2,
                cloud_cover_pct=cloud,
                source="Open-Meteo Weather API",
                timestamp=obs_time,
                retrieval_timestamp=now,
                provenance=DataProvenance.DIRECT_OBSERVATION,
                data_freshness="Real-time Numerical Observation"
            )
        except Exception as exc:
            # Fallback to realistic location-specific Mumbai baseline if network unavailable
            logger.warning("Weather fetch failed for %s: %s; activating baseline fallback", location.id, str(exc))
            temp_offset = (location.latitude - 19.0) * 0.5
            fallback_solar = estimate_diurnal_solar_radiation(now, cloud_cover_pct=25.0)

            return WeatherData(
                temperature_c=round(31.2 + temp_offset, 1),
                relative_humidity_pct=76.0,
                apparent_temperature_c=round(36.4 + temp_offset, 1),
                surface_pressure_hpa=1012.0,
                wind_speed_kmh=14.0,
                wind_direction_deg=250.0,
                wind_cardinal="WSW",
                precipitation_mm=0.0,
                solar_radiation_wm2=fallback_solar,
                cloud_cover_pct=25.0,
                source="Open-Meteo Weather (Estimated Fallback)",
                timestamp=now,
                retrieval_timestamp=now,
                provenance=DataProvenance.ESTIMATED_INTERPOLATION,
                data_freshness="Interpolated Fallback"
            )

    def fetch_air_quality(self, location: Location) -> Optional[AirData]:
        """Fetch CAMS atmospheric pollutant concentrations from Open-Meteo Air Quality API."""
        url = (
            f"https://air-quality-api.open-meteo.com/v1/air-quality?"
            f"latitude={location.latitude}&longitude={location.longitude}&"
            f"current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&"
            f"timezone=Asia%2FKolkata"
        )
        now = datetime.utcnow()
        try:
            data = http_client.get_json(url)
            if not data or not isinstance(data, dict):
                raise ConnectionError(f"Open-Meteo air quality unavailable for {location.id}")

            current = data.get("current") or {}
            obs_time_str = current.get("time")
            obs_time = datetime.fromisoformat(obs_time_str) if obs_time_str else now

            def safe_pollutant(val):
                if val is None:
                    return None
                try:
                    f = float(val)
                    if math.isfinite(f) and (0.0 <= f <= 5000.0):
                        return f
                    return None
                except (ValueError, TypeError):
                    return None

            pm25_val = safe_pollutant(current.get("pm2_5"))
            pm10_val = safe_pollutant(current.get("pm10"))
            no2_val = safe_pollutant(current.get("nitrogen_dioxide"))
            so2_val = safe_pollutant(current.get("sulphur_dioxide"))
            co_raw = safe_pollutant(current.get("carbon_monoxide"))
            # Open-Meteo CO is in ug/m3, convert to mg/m3 for CPCB NAQI standard
            co_val = round(co_raw / 1000.0, 2) if co_raw is not None else None
            o3_val = safe_pollutant(current.get("ozone"))

            # Build pollutant details with NAQI sub-indices
            sub_indices = []
            pollutants = {}

            for key, val, name in [
                ("pm25", pm25_val, "PM2.5"),
                ("pm10", pm10_val, "PM10"),
                ("no2", no2_val, "Nitrogen Dioxide"),
                ("so2", so2_val, "Sulphur Dioxide"),
                ("co", co_val, "Carbon Monoxide"),
                ("o3", o3_val, "Ozone"),
            ]:
                if val is not None:
                    sub_idx, cat = calculate_naqi_sub_index(key, val)
                    if sub_idx is not None:
                        sub_indices.append((sub_idx, key))
                    pollutants[key] = PollutantDetail(
                        pollutant=key,
                        display_name=name,
                        value=val,
                        unit="mg/m³" if key == "co" else "µg/m³",
                        naqi_sub_index=sub_idx,
                        category=cat,
                        provenance=DataProvenance.MODELLED_ANALYSIS,
                        source="Open-Meteo CAMS",
                        observation_time=obs_time,
                        retrieval_time=now,
                        is_available=True,
                        status_note="Available"
                    )
                else:
                    pollutants[key] = PollutantDetail(
                        pollutant=key,
                        display_name=name,
                        value=None,
                        unit="mg/m³" if key == "co" else "µg/m³",
                        is_available=False,
                        provenance=DataProvenance.UNAVAILABLE,
                        source="Open-Meteo CAMS",
                        observation_time=obs_time,
                        retrieval_time=now,
                        status_note="Sensor channel unavailable from provider"
                    )

            # CPCB NAQI Qualification Rule:
            # Requires at least 3 pollutants, with at least one PM parameter (PM2.5 or PM10)
            has_pm = ("pm25" in pollutants and pollutants["pm25"].is_available and pollutants["pm25"].value is not None) or \
                     ("pm10" in pollutants and pollutants["pm10"].is_available and pollutants["pm10"].value is not None)
            available_count = len(sub_indices)

            if available_count >= 3 and has_pm:
                max_sub, dom_poll = max(sub_indices, key=lambda x: x[0])
                aqi_val = max_sub
                aqi_cat = get_naqi_category(max_sub)
                dominant = dom_poll.upper()
                calc_method = f"CPCB NAQI Instantaneous Sub-Index ({available_count} Parameters including PM; 1-Hour Snapshot)"
            elif available_count > 0 and has_pm:
                max_sub, dom_poll = max(sub_indices, key=lambda x: x[0])
                aqi_val = max_sub
                aqi_cat = f"{get_naqi_category(max_sub)} (Indicative: <3 pollutants)"
                dominant = dom_poll.upper()
                calc_method = "Indicative PM Sub-Index (<3 parameters available; 1-Hour Snapshot)"
            else:
                aqi_val = None
                aqi_cat = "UNAVAILABLE"
                dominant = None
                calc_method = "Unavailable: Insufficient pollutant parameters monitored"

            return AirData(
                aqi=aqi_val,
                aqi_category=aqi_cat,
                aqi_calculation_method=calc_method,
                dominant_pollutant=dominant,
                pollutants_monitored_count=available_count,
                pm25=pollutants.get("pm25"),
                pm10=pollutants.get("pm10"),
                no2=pollutants.get("no2"),
                so2=pollutants.get("so2"),
                co=pollutants.get("co"),
                o3=pollutants.get("o3"),
                station_name=f"Copernicus CAMS - {location.name} Grid Cell",
                station_distance_km=0.0,
                source="Open-Meteo CAMS Atmospheric Model",
                timestamp=obs_time,
                retrieval_timestamp=now,
                provenance=DataProvenance.MODELLED_ANALYSIS,
                data_freshness="Hourly Assimilated Model"
            )
        except Exception as exc:
            # Fallback to realistic baseline without crashing
            logger.warning("Air quality fetch failed for %s: %s; activating baseline fallback", location.id, str(exc))
            temp_offset = (location.latitude - 19.0) * 2.0
            return AirData(
                aqi=int(115 + temp_offset),
                aqi_category="Moderate",
                aqi_calculation_method="Estimated Baseline (Network Unavailable; 1-Hour Snapshot)",
                dominant_pollutant="PM2.5",
                pollutants_monitored_count=2,
                pm25=PollutantDetail(
                    pollutant="pm25",
                    display_name="PM2.5",
                    value=round(41.0 + temp_offset, 1),
                    unit="µg/m³",
                    naqi_sub_index=115,
                    category="Moderate",
                    provenance=DataProvenance.ESTIMATED_INTERPOLATION,
                    source="Baseline Fallback",
                    observation_time=now,
                    retrieval_time=now,
                    is_available=True,
                    status_note="Estimated from historical baseline"
                ),
                pm10=PollutantDetail(
                    pollutant="pm10",
                    display_name="PM10",
                    value=round(82.0 + temp_offset * 1.5, 1),
                    unit="µg/m³",
                    naqi_sub_index=82,
                    category="Satisfactory",
                    provenance=DataProvenance.ESTIMATED_INTERPOLATION,
                    source="Baseline Fallback",
                    observation_time=now,
                    retrieval_time=now,
                    is_available=True,
                    status_note="Estimated from historical baseline"
                ),
                no2=PollutantDetail(
                    pollutant="no2",
                    display_name="Nitrogen Dioxide",
                    value=None,
                    unit="µg/m³",
                    is_available=False,
                    provenance=DataProvenance.UNAVAILABLE,
                    source="Baseline Fallback",
                    observation_time=now,
                    retrieval_time=now,
                    status_note="Unmonitored in fallback mode"
                ),
                so2=PollutantDetail(
                    pollutant="so2",
                    display_name="Sulphur Dioxide",
                    value=None,
                    unit="µg/m³",
                    is_available=False,
                    provenance=DataProvenance.UNAVAILABLE,
                    source="Baseline Fallback",
                    observation_time=now,
                    retrieval_time=now,
                    status_note="Unmonitored in fallback mode"
                ),
                co=PollutantDetail(
                    pollutant="co",
                    display_name="Carbon Monoxide",
                    value=None,
                    unit="mg/m³",
                    is_available=False,
                    provenance=DataProvenance.UNAVAILABLE,
                    source="Baseline Fallback",
                    observation_time=now,
                    retrieval_time=now,
                    status_note="Unmonitored in fallback mode"
                ),
                o3=PollutantDetail(
                    pollutant="o3",
                    display_name="Ozone",
                    value=None,
                    unit="µg/m³",
                    is_available=False,
                    provenance=DataProvenance.UNAVAILABLE,
                    source="Baseline Fallback",
                    observation_time=now,
                    retrieval_time=now,
                    status_note="Unmonitored in fallback mode"
                ),
                station_name=f"Baseline Model - {location.name}",
                station_distance_km=1.2,
                source="Estimated Fallback",
                timestamp=now,
                retrieval_timestamp=now,
                provenance=DataProvenance.ESTIMATED_INTERPOLATION,
                data_freshness="Interpolated Fallback"
            )

    def fetch_72h_forecast(self, location: Location) -> ForecastData:
        """
        Fetch practical 72-hour environmental forecast from Open-Meteo Weather and Air Quality APIs.
        Forecast variables: temperature, apparent temperature, humidity, precipitation, wind speed, PM2.5, PM10.
        All forecast points are explicitly labeled with DataProvenance.FORECAST.
        """
        now = datetime.utcnow()
        weather_forecast_url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={location.latitude}&longitude={location.longitude}&"
            f"hourly=temperature_2m,relative_humidity_2m,apparent_temperature,"
            f"precipitation_probability,precipitation,wind_speed_10m&"
            f"daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&"
            f"forecast_days=3&timezone=Asia%2FKolkata"
        )
        air_forecast_url = (
            f"https://air-quality-api.open-meteo.com/v1/air-quality?"
            f"latitude={location.latitude}&longitude={location.longitude}&"
            f"hourly=pm10,pm2_5&forecast_days=3&timezone=Asia%2FKolkata"
        )

        try:
            # 1. Fetch Weather Forecast & 2. Fetch Air Quality Forecast via pooled HTTP client
            weather_data = http_client.get_json(weather_forecast_url) or {}
            air_data = http_client.get_json(air_forecast_url) or {}

            if not isinstance(weather_data, dict):
                weather_data = {}
            if not isinstance(air_data, dict):
                air_data = {}

            hourly_weather = weather_data.get("hourly") or {}
            hourly_air = air_data.get("hourly") or {}
            daily_weather = weather_data.get("daily") or {}

            w_times = hourly_weather.get("time") or []
            w_temps = hourly_weather.get("temperature_2m") or []
            w_app_temps = hourly_weather.get("apparent_temperature") or []
            w_rhs = hourly_weather.get("relative_humidity_2m") or []
            w_precip_probs = hourly_weather.get("precipitation_probability") or []
            w_precips = hourly_weather.get("precipitation") or []
            w_winds = hourly_weather.get("wind_speed_10m") or []

            a_pm25s = hourly_air.get("pm2_5") or []
            a_pm10s = hourly_air.get("pm10") or []

            # If external response was empty or incomplete, fall through to fallback
            if not w_times or not isinstance(w_times, list):
                raise ValueError("Incomplete external forecast response")

            def _clean_finite_float(val, min_v=-math.inf, max_v=math.inf):
                if val is None:
                    return None
                try:
                    f = float(val)
                    return f if (math.isfinite(f) and min_v <= f <= max_v) else None
                except (ValueError, TypeError):
                    return None

            hourly_points: List[HourlyForecastPoint] = []
            limit = min(72, len(w_times))

            for i in range(limit):
                time_str = str(w_times[i])
                t_val = _clean_finite_float(w_temps[i] if i < len(w_temps) else None, -10.0, 60.0)
                at_val = _clean_finite_float(w_app_temps[i] if i < len(w_app_temps) else None, -10.0, 70.0)
                rh_val = _clean_finite_float(w_rhs[i] if i < len(w_rhs) else None, 0.0, 100.0)
                pp_val = _clean_finite_float(w_precip_probs[i] if i < len(w_precip_probs) else None, 0.0, 100.0)
                p_val = _clean_finite_float(w_precips[i] if i < len(w_precips) else None, 0.0, 1000.0)
                ws_val = _clean_finite_float(w_winds[i] if i < len(w_winds) else None, 0.0, 250.0)

                pm25_val = _clean_finite_float(a_pm25s[i] if i < len(a_pm25s) else None, 0.0, 5000.0)
                pm10_val = _clean_finite_float(a_pm10s[i] if i < len(a_pm10s) else None, 0.0, 5000.0)

                est_aqi = None
                if pm25_val is not None:
                    sub_idx, _ = calculate_naqi_sub_index("pm25", pm25_val)
                    est_aqi = sub_idx

                hourly_points.append(HourlyForecastPoint(
                    time=time_str,
                    temperature_c=t_val,
                    apparent_temperature_c=at_val,
                    relative_humidity_pct=rh_val,
                    precipitation_probability_pct=pp_val,
                    precipitation_mm=p_val,
                    wind_speed_kmh=ws_val,
                    pm25=pm25_val,
                    pm10=pm10_val,
                    estimated_aqi=est_aqi,
                    provenance=DataProvenance.FORECAST
                ))

            # Assemble daily points
            daily_points: List[DailyForecastPoint] = []
            d_times = daily_weather.get("time") or []
            d_max_temps = daily_weather.get("temperature_2m_max") or []
            d_min_temps = daily_weather.get("temperature_2m_min") or []
            d_precips = daily_weather.get("precipitation_sum") or []
            d_max_winds = daily_weather.get("wind_speed_10m_max") or []

            for j in range(min(3, len(d_times))):
                day_date = str(d_times[j])
                max_t = _clean_finite_float(d_max_temps[j] if j < len(d_max_temps) else None, -10.0, 60.0)
                min_t = _clean_finite_float(d_min_temps[j] if j < len(d_min_temps) else None, -10.0, 60.0)
                p_sum = _clean_finite_float(d_precips[j] if j < len(d_precips) else None, 0.0, 1000.0)
                w_max = _clean_finite_float(d_max_winds[j] if j < len(d_max_winds) else None, 0.0, 250.0)

                # Calculate avg pm25 for this day from hourly points
                day_start = j * 24
                day_end = min(len(hourly_points), (j + 1) * 24)
                day_pm25_values = [p.pm25 for p in hourly_points[day_start:day_end] if p.pm25 is not None and math.isfinite(p.pm25)]
                avg_pm = round(sum(day_pm25_values) / len(day_pm25_values), 1) if day_pm25_values else None

                aqi_cat = "Moderate"
                if avg_pm is not None:
                    sub_idx, cat = calculate_naqi_sub_index("pm25", avg_pm)
                    aqi_cat = cat if cat else "Moderate"

                cond = "Dry / Sunny"
                if p_sum and p_sum > 2.0:
                    cond = "Scattered Showers"
                elif w_max and w_max >= 18.0:
                    cond = "Windy / Coastal Breeze"
                elif max_t and max_t > 34.0:
                    cond = "Hot / Humid"

                daily_points.append(DailyForecastPoint(
                    date=day_date,
                    temp_min_c=min_t,
                    temp_max_c=max_t,
                    precipitation_sum_mm=p_sum,
                    max_wind_speed_kmh=w_max,
                    dominant_condition=cond,
                    avg_pm25=avg_pm,
                    predicted_aqi_category=aqi_cat,
                    provenance=DataProvenance.FORECAST
                ))

            # Generate deterministic trend summary
            trend_sentences = []
            if len(daily_points) >= 2 and daily_points[0].avg_pm25 is not None and daily_points[-1].avg_pm25 is not None:
                delta_pm = daily_points[-1].avg_pm25 - daily_points[0].avg_pm25
                if abs(delta_pm) <= 5.0:
                    trend_sentences.append("Air quality is forecast to remain broadly stable over the next 72 hours.")
                elif delta_pm > 5.0:
                    trend_sentences.append("Particulate concentration is forecast to increase slightly over the next 48-72 hours.")
                else:
                    trend_sentences.append("Atmospheric dispersion is forecast to moderately reduce particulate concentrations over 72 hours.")
            else:
                trend_sentences.append("Air quality is forecast to remain within typical seasonal limits over the next 72 hours.")

            valid_max_temps = [p.temp_max_c for p in daily_points if p.temp_max_c is not None and math.isfinite(p.temp_max_c)]
            valid_min_temps = [p.temp_min_c for p in daily_points if p.temp_min_c is not None and math.isfinite(p.temp_min_c)]
            max_forecast_temp = max(valid_max_temps, default=33.5)
            min_forecast_temp = min(valid_min_temps, default=26.5)
            trend_sentences.append(f"Diurnal temperatures will peak near {max_forecast_temp:.1f}°C during afternoon hours, cooling to {min_forecast_temp:.1f}°C overnight.")

            total_rain = sum([p.precipitation_sum_mm for p in daily_points if p.precipitation_sum_mm is not None and math.isfinite(p.precipitation_sum_mm)])
            valid_winds = [p.max_wind_speed_kmh for p in daily_points if p.max_wind_speed_kmh is not None and math.isfinite(p.max_wind_speed_kmh)]
            max_wind = max(valid_winds, default=15.0)

            if total_rain > 3.0:
                trend_sentences.append(f"Precipitation expected ({total_rain:.1f} mm cumulative), providing natural wet-deposition cleansing.")
            elif max_wind >= 16.0:
                trend_sentences.append(f"Active coastal wind speeds up to {max_wind:.1f} km/h will facilitate sustained atmospheric ventilation.")
            else:
                trend_sentences.append("Light morning breezes may temporarily reduce local ventilation in dense transit corridors.")

            summary_text = " ".join(trend_sentences)

            return ForecastData(
                location_id=location.id,
                location_name=location.name,
                forecast_hours=len(hourly_points),
                hourly=hourly_points,
                daily=daily_points,
                trend_summary=summary_text,
                source="Open-Meteo Numerical Weather & Atmospheric Prediction",
                provenance=DataProvenance.FORECAST,
                timestamp=now
            )

        except Exception as exc:
            logger.warning(
                "Forecast API request failed for %s (%s), generating fallback: %s",
                location.id, location.name, str(exc)
            )
            # Resilient fallback with diurnal curves without crashing
            from datetime import timedelta

            hourly_points = []
            start_time = now.replace(minute=0, second=0, microsecond=0)
            base_temp = 30.5 + (location.latitude - 19.0) * 0.5
            base_pm25 = 39.0

            for i in range(72):
                pt_time = start_time + timedelta(hours=i)
                hour_of_day = pt_time.hour
                diurnal_factor = math.sin((hour_of_day - 6) / 24.0 * 2 * math.pi)
                t_val = round(base_temp + 3.2 * diurnal_factor, 1)
                at_val = round(t_val + 5.0 - 1.5 * diurnal_factor, 1)
                rh_val = round(74.0 - 16.0 * diurnal_factor, 1)
                ws_val = round(12.0 + 4.5 * math.sin((hour_of_day - 12) / 24.0 * 2 * math.pi), 1)
                pm_val = round(base_pm25 + 7.5 * math.cos((hour_of_day - 8) / 24.0 * 2 * math.pi), 1)
                sub_idx, _ = calculate_naqi_sub_index("pm25", pm_val)

                hourly_points.append(HourlyForecastPoint(
                    time=pt_time.strftime("%Y-%m-%dT%H:00"),
                    temperature_c=t_val,
                    apparent_temperature_c=at_val,
                    relative_humidity_pct=rh_val,
                    precipitation_probability_pct=5.0,
                    precipitation_mm=0.0,
                    wind_speed_kmh=ws_val,
                    pm25=pm_val,
                    pm10=round(pm_val * 1.8, 1),
                    estimated_aqi=sub_idx,
                    provenance=DataProvenance.ESTIMATED_INTERPOLATION
                ))

            daily_points = []
            for j in range(3):
                day_start = j * 24
                day_slice = hourly_points[day_start:day_start + 24]
                d_date = (start_time + timedelta(days=j)).strftime("%Y-%m-%d")
                d_min = min([p.temperature_c for p in day_slice])
                d_max = max([p.temperature_c for p in day_slice])
                d_wind = max([p.wind_speed_kmh for p in day_slice])
                d_pm = round(sum([p.pm25 for p in day_slice]) / len(day_slice), 1)
                sub_idx, cat = calculate_naqi_sub_index("pm25", d_pm)

                daily_points.append(DailyForecastPoint(
                    date=d_date,
                    temp_min_c=d_min,
                    temp_max_c=d_max,
                    precipitation_sum_mm=0.0,
                    max_wind_speed_kmh=d_wind,
                    dominant_condition="Partly Cloudy / Humid",
                    avg_pm25=d_pm,
                    predicted_aqi_category=cat if cat else "Moderate",
                    provenance=DataProvenance.ESTIMATED_INTERPOLATION
                ))

            return ForecastData(
                location_id=location.id,
                location_name=location.name,
                forecast_hours=72,
                hourly=hourly_points,
                daily=daily_points,
                trend_summary=(
                    "Air quality is forecast to remain broadly stable over the next 72 hours based on seasonal baselines. "
                    f"Diurnal temperatures will peak near {base_temp + 3.2:.1f}°C during afternoon hours, "
                    f"cooling to {base_temp - 3.2:.1f}°C overnight. "
                    "Active coastal wind speeds will facilitate sustained atmospheric ventilation."
                ),
                source="Deterministic Diurnal Baseline (Network Fallback)",
                provenance=DataProvenance.ESTIMATED_INTERPOLATION,
                timestamp=now
            )


openmeteo_adapter = OpenMeteoAdapter()


