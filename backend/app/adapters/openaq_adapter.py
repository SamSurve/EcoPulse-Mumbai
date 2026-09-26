import math
from datetime import datetime
from typing import Optional, Dict, Any
from app.config import settings
from app.models.schemas import (
    Location,
    AirData,
    PollutantDetail,
    DataProvenance
)
from app.adapters.base import AirQualityProvider
from app.adapters.openmeteo_adapter import calculate_naqi_sub_index, get_naqi_category
from app.core.http_client import http_client
from app.core.logging import get_logger

logger = get_logger("adapter.openaq")


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on the Earth's surface
    using the Haversine formula.
    """
    R = 6371.0  # Earth's mean radius in kilometers
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)


class OpenAQAdapter(AirQualityProvider):
    """
    Adapter for OpenAQ API v3 (Ground-truth physical CAAQM monitoring stations).
    Strictly follows OpenAQ API v3 specifications with X-API-Key header.
    Adheres strictly to the Zero-Fabrication policy: if unmonitored or no key,
    returns None or explicit DATA_GAP without synthesizing fake station data.
    """

    def __init__(self, timeout_seconds: Optional[int] = None):
        self.timeout = timeout_seconds or settings.HTTP_TIMEOUT_SECONDS
        self.base_url = "https://api.openaq.org/v3"

    def fetch_air_quality(self, location: Location) -> Optional[AirData]:
        """
        Attempt to fetch ground-truth sensor measurements from OpenAQ v3
        for the given location's coordinates.
        """
        api_key = settings.OPENAQ_API_KEY
        if not api_key:
            # Explicitly declare unconfigured state without throwing an error
            logger.debug("OpenAQ API key not configured; skipping physical sensor query for %s", location.id)
            return None

        # Query OpenAQ v3 locations within a 15 km radius in Mumbai
        url = (
            f"{self.base_url}/locations?"
            f"coordinates={location.latitude},{location.longitude}&"
            f"radius=15000&limit=3"
        )
        headers = {
            "X-API-Key": api_key,
            "Accept": "application/json"
        }

        try:
            data = http_client.get_json(url, headers=headers)
            if not data:
                return None

            results = data.get("results") or [] if isinstance(data, dict) else []
            if not results or not isinstance(results, list):
                return None

            # Find the closest active station
            station = results[0]
            if not isinstance(station, dict):
                return None

            station_name = station.get("name", location.nearest_station or "Mumbai Physical CAAQM Station")
            sensors = station.get("sensors") or [] if isinstance(station.get("sensors"), list) else []

            # Calculate physical Haversine distance if coordinates are present
            st_coords = station.get("coordinates") or {}
            st_lat = st_coords.get("latitude")
            st_lon = st_coords.get("longitude")
            if st_lat is not None and st_lon is not None:
                calc_dist_km = haversine_km(
                    location.latitude, location.longitude,
                    float(st_lat), float(st_lon)
                )
            else:
                calc_dist_km = None

            # Map sensor readings
            pollutants = {}
            sub_indices = []
            now = datetime.utcnow()

            for sensor in sensors:
                if not isinstance(sensor, dict):
                    continue
                param_dict = sensor.get("parameter") or {}
                if not isinstance(param_dict, dict):
                    param_dict = {}
                param = str(param_dict.get("name") or "").lower()

                latest_dict = sensor.get("latest") or {}
                if not isinstance(latest_dict, dict):
                    latest_dict = {}
                last_val = latest_dict.get("value")
                raw_unit = param_dict.get("units", "µg/m³")

                if last_val is None:
                    continue

                try:
                    val_float = float(last_val)
                    # Filter out NaN, Inf, unphysical spikes, or negative values (hardware zero-drift)
                    if not math.isfinite(val_float) or val_float < 0.0 or val_float > 10000.0:
                        continue
                except (ValueError, TypeError):
                    continue

                poll_key = None
                display = ""
                unit = raw_unit

                if "pm25" in param or "pm2.5" in param:
                    poll_key = "pm25"
                    display = "PM2.5"
                elif "pm10" in param:
                    poll_key = "pm10"
                    display = "PM10"
                elif "no2" in param:
                    poll_key = "no2"
                    display = "Nitrogen Dioxide"
                elif "so2" in param:
                    poll_key = "so2"
                    display = "Sulphur Dioxide"
                elif "co" in param:
                    poll_key = "co"
                    display = "Carbon Monoxide"
                    # Scientific Unit Normalization for CO:
                    # CPCB NAQI breakpoint tables require mg/m³.
                    # If reported in µg/m³, convert by dividing by 1000.
                    # If reported in ppm, convert: 1 ppm CO ≈ 1.145 mg/m³ at STP.
                    raw_unit_lower = raw_unit.lower()
                    if "µg" in raw_unit_lower or "ug" in raw_unit_lower:
                        val_float = round(val_float / 1000.0, 3)
                        unit = "mg/m³"
                    elif "ppm" in raw_unit_lower:
                        val_float = round(val_float * 1.145, 3)
                        unit = "mg/m³"
                    else:
                        unit = "mg/m³"
                elif "o3" in param or "ozone" in param:
                    poll_key = "o3"
                    display = "Ozone"

                if poll_key:
                    sub_idx, cat = calculate_naqi_sub_index(poll_key, val_float)
                    if sub_idx is not None:
                        sub_indices.append((sub_idx, poll_key))
                    pollutants[poll_key] = PollutantDetail(
                        pollutant=poll_key,
                        display_name=display,
                        value=val_float,
                        unit=unit,
                        naqi_sub_index=sub_idx,
                        category=cat,
                        provenance=DataProvenance.DIRECT_OBSERVATION,
                        source=f"OpenAQ / {station_name}",
                        observation_time=now,
                        retrieval_time=now,
                        is_available=True
                    )

            # Ensure missing or unmonitored channels are explicitly stamped as UNAVAILABLE
            all_standard_keys = {
                "pm25": "PM2.5",
                "pm10": "PM10",
                "no2": "Nitrogen Dioxide",
                "so2": "Sulphur Dioxide",
                "co": "Carbon Monoxide",
                "o3": "Ozone"
            }
            for k, disp in all_standard_keys.items():
                if k not in pollutants:
                    pollutants[k] = PollutantDetail(
                        pollutant=k,
                        display_name=disp,
                        value=None,
                        unit="mg/m³" if k == "co" else "µg/m³",
                        naqi_sub_index=None,
                        category=None,
                        provenance=DataProvenance.UNAVAILABLE,
                        source=f"Unmonitored at {station_name}",
                        observation_time=None,
                        retrieval_time=now,
                        is_available=False
                    )

            # Under CPCB NAQI standard:
            # Minimum 3 pollutants required, with at least one PM (PM2.5 or PM10)
            has_pm = (
                (pollutants["pm25"].is_available and pollutants["pm25"].value is not None) or
                (pollutants["pm10"].is_available and pollutants["pm10"].value is not None)
            )
            available_count = len(sub_indices)

            if available_count >= 3 and has_pm:
                max_sub, dom_poll = max(sub_indices, key=lambda x: x[0])
                aqi_val = max_sub
                aqi_cat = get_naqi_category(max_sub)
                dominant = dom_poll.upper()
                calc_method = f"CPCB NAQI Instantaneous Sub-Index ({available_count} Parameters including PM; 1-Hour Snapshot)"
            elif available_count > 0 and has_pm:
                # PM is available but fewer than 3 pollutants -> Indicative sub-index only
                max_sub, dom_poll = max(sub_indices, key=lambda x: x[0])
                aqi_val = max_sub
                aqi_cat = f"{get_naqi_category(max_sub)} (Indicative: <3 pollutants)"
                dominant = dom_poll.upper()
                calc_method = f"Indicative Sub-Index ({available_count} Parameters; CPCB requires >=3 including PM)"
            else:
                aqi_val = None
                aqi_cat = "INSUFFICIENT_INPUTS"
                dominant = None
                calc_method = "Unavailable: Insufficient pollutant parameters monitored (CPCB standard requires >=3 with PM)"

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
                station_name=f"CPCB/MPCB Station: {station_name}",
                station_distance_km=calc_dist_km,
                source=f"OpenAQ v3 ({station_name})",
                timestamp=now,
                retrieval_timestamp=now,
                provenance=DataProvenance.DIRECT_OBSERVATION,
                data_freshness="Near Real-Time Physical Sensor Snapshot (1-Hour)"
            )

        except Exception as exc:
            # Network timeout, 403 invalid key, or upstream failure
            # Log failure and return None to let orchestrator smoothly fall back to Open-Meteo CAMS
            logger.warning("OpenAQ query failed for %s: %s; falling back to CAMS model", location.id, str(exc))
            return None


openaq_adapter = OpenAQAdapter()
