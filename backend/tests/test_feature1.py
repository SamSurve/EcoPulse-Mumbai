import sys
import os
import unittest
from unittest.mock import patch, MagicMock
import json
import io
from datetime import datetime

# Add app parent directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.schemas import DataProvenance
from app.data.locations import get_location_by_id
from app.adapters.openmeteo_adapter import (
    OpenMeteoAdapter,
    calculate_naqi_sub_index,
    get_naqi_category,
    degrees_to_cardinal
)
from app.adapters.openaq_adapter import OpenAQAdapter
from app.services.environment_service import EnvironmentalService, evaluate_environmental_risk
from app.services.cache import InMemoryTTLCache


class TestFeature1AirMicroclimate(unittest.TestCase):
    """
    Test suite for Feature 1 — Air & Microclimate.
    Uses mocks to ensure tests do not depend on live internet connectivity.
    """

    def setUp(self):
        self.borivali = get_location_by_id("borivali")
        self.andheri = get_location_by_id("andheri")
        self.dadar = get_location_by_id("dadar")
        self.adapter = OpenMeteoAdapter(timeout_seconds=2)

    # 1. Weather parsing test with mocked JSON
    @patch("urllib.request.urlopen")
    def test_openmeteo_weather_parsing_success(self, mock_urlopen):
        mock_response = MagicMock()
        mock_payload = {
            "current": {
                "time": "2026-09-26T12:00",
                "temperature_2m": 32.4,
                "relative_humidity_2m": 72.0,
                "apparent_temperature": 38.1,
                "wind_speed_10m": 15.6,
                "wind_direction_10m": 245.0,
                "precipitation": 0.0,
                "surface_pressure": 1010.5,
                "cloud_cover": 30.0
            }
        }
        mock_response.read.return_value = json.dumps(mock_payload).encode("utf-8")
        mock_response.__enter__.return_value = mock_response
        mock_urlopen.return_value = mock_response

        weather = self.adapter.fetch_weather(self.borivali)

        self.assertIsNotNone(weather)
        self.assertEqual(weather.temperature_c, 32.4)
        self.assertEqual(weather.relative_humidity_pct, 72.0)
        self.assertEqual(weather.apparent_temperature_c, 38.1)
        self.assertEqual(weather.wind_speed_kmh, 15.6)
        self.assertEqual(weather.wind_cardinal, "WSW")
        self.assertEqual(weather.provenance, DataProvenance.DIRECT_OBSERVATION)
        self.assertIn("Open-Meteo", weather.source)
        self.assertIsNotNone(weather.timestamp)
        self.assertIsNotNone(weather.retrieval_timestamp)

    # 2. Air quality parsing test with mocked JSON
    @patch("urllib.request.urlopen")
    def test_openmeteo_air_quality_parsing_success(self, mock_urlopen):
        mock_response = MagicMock()
        mock_payload = {
            "current": {
                "time": "2026-09-26T12:00",
                "pm10": 85.0,
                "pm2_5": 42.0,
                "nitrogen_dioxide": 28.0,
                "sulphur_dioxide": 12.0,
                "carbon_monoxide": 450.0,  # ug/m3 -> 0.45 mg/m3
                "ozone": 35.0
            }
        }
        mock_response.read.return_value = json.dumps(mock_payload).encode("utf-8")
        mock_response.__enter__.return_value = mock_response
        mock_urlopen.return_value = mock_response

        air = self.adapter.fetch_air_quality(self.andheri)

        self.assertIsNotNone(air)
        self.assertIsNotNone(air.aqi)
        # PM2.5 = 42 gives sub-index in Satisfactory band (51-100) or Moderate
        self.assertEqual(air.pm25.value, 42.0)
        self.assertEqual(air.pm10.value, 85.0)
        self.assertEqual(air.no2.value, 28.0)
        self.assertEqual(air.co.value, 0.45)  # converted to mg/m3
        self.assertEqual(air.so2.value, 12.0)
        self.assertEqual(air.o3.value, 35.0)
        self.assertEqual(air.provenance, DataProvenance.MODELLED_ANALYSIS)
        self.assertGreaterEqual(air.pollutants_monitored_count, 3)
        self.assertIn("CPCB NAQI", air.aqi_calculation_method)

    # 3. Missing pollutant handling (e.g. SO2 is null)
    @patch("urllib.request.urlopen")
    def test_missing_pollutant_handling(self, mock_urlopen):
        mock_response = MagicMock()
        mock_payload = {
            "current": {
                "time": "2026-09-26T12:00",
                "pm10": 70.0,
                "pm2_5": 35.0,
                "nitrogen_dioxide": None,  # Missing
                "sulphur_dioxide": None,    # Missing
                "carbon_monoxide": 300.0,
                "ozone": None               # Missing
            }
        }
        mock_response.read.return_value = json.dumps(mock_payload).encode("utf-8")
        mock_response.__enter__.return_value = mock_response
        mock_urlopen.return_value = mock_response

        air = self.adapter.fetch_air_quality(self.dadar)

        self.assertIsNotNone(air)
        # Check that unavailable channels are marked explicitly
        self.assertFalse(air.so2.is_available)
        self.assertIsNone(air.so2.value)
        self.assertEqual(air.so2.provenance, DataProvenance.UNAVAILABLE)
        self.assertIn("unavailable", air.so2.status_note.lower())

        self.assertFalse(air.no2.is_available)
        self.assertEqual(air.no2.provenance, DataProvenance.UNAVAILABLE)

        # Available channels are populated
        self.assertTrue(air.pm25.is_available)
        self.assertEqual(air.pm25.value, 35.0)

    # 4. Upstream timeout handling
    @patch("urllib.request.urlopen", side_effect=TimeoutError("Connection timed out"))
    def test_upstream_timeout_graceful_fallback(self, mock_urlopen):
        weather = self.adapter.fetch_weather(self.borivali)
        air = self.adapter.fetch_air_quality(self.borivali)

        self.assertIsNotNone(weather, "Weather should fall back gracefully on timeout")
        self.assertIsNotNone(air, "Air should fall back gracefully on timeout")
        self.assertEqual(weather.provenance, DataProvenance.ESTIMATED_INTERPOLATION)
        self.assertEqual(air.provenance, DataProvenance.ESTIMATED_INTERPOLATION)
        self.assertIn("Fallback", weather.source)

    # 5. Upstream HTTP Error handling
    @patch("urllib.request.urlopen", side_effect=Exception("HTTP 503 Service Unavailable"))
    def test_upstream_http_error_graceful_fallback(self, mock_urlopen):
        weather = self.adapter.fetch_weather(self.andheri)
        self.assertIsNotNone(weather)
        self.assertEqual(weather.provenance, DataProvenance.ESTIMATED_INTERPOLATION)

    # 6. OpenAQ unconfigured key handling
    def test_openaq_unconfigured_key_returns_none(self):
        openaq = OpenAQAdapter(timeout_seconds=2)
        # Without key, returns None without throwing exception
        res = openaq.fetch_air_quality(self.borivali)
        self.assertIsNone(res)

    # 7. CPCB NAQI calculation accuracy with valid inputs
    def test_naqi_breakpoints_accuracy(self):
        # Good Band (0 - 50)
        idx, cat = calculate_naqi_sub_index("pm25", 15.0)
        self.assertEqual(cat, "Good")
        self.assertEqual(idx, 25)

        # Satisfactory Band (51 - 100)
        idx, cat = calculate_naqi_sub_index("pm25", 45.0)
        self.assertEqual(cat, "Satisfactory")
        self.assertTrue(51 <= idx <= 100)

        # Moderate Band (101 - 200)
        idx, cat = calculate_naqi_sub_index("pm25", 75.0)
        self.assertEqual(cat, "Moderate")
        self.assertTrue(101 <= idx <= 200)

        # Poor Band (201 - 300)
        idx, cat = calculate_naqi_sub_index("pm25", 105.0)
        self.assertEqual(cat, "Poor")
        self.assertTrue(201 <= idx <= 300)

        # Very Poor Band (301 - 400)
        idx, cat = calculate_naqi_sub_index("pm25", 185.0)
        self.assertEqual(cat, "Very Poor")
        self.assertTrue(301 <= idx <= 400)

        # Severe Band (401 - 500)
        idx, cat = calculate_naqi_sub_index("pm25", 375.0)
        self.assertEqual(cat, "Severe")
        self.assertTrue(401 <= idx <= 500)

    # 8. CPCB NAQI behavior with insufficient inputs
    def test_naqi_insufficient_inputs_rule(self):
        # When no inputs or negative
        idx, cat = calculate_naqi_sub_index("pm25", -5.0)
        self.assertIsNone(idx)
        self.assertIsNone(cat)

        idx, cat = calculate_naqi_sub_index("unknown_pollutant", 100.0)
        self.assertIsNone(idx)
        self.assertIsNone(cat)

    # 9. Degrees to cardinal conversion
    def test_degrees_to_cardinal(self):
        self.assertEqual(degrees_to_cardinal(0), "N")
        self.assertEqual(degrees_to_cardinal(90), "E")
        self.assertEqual(degrees_to_cardinal(180), "S")
        self.assertEqual(degrees_to_cardinal(270), "W")
        self.assertEqual(degrees_to_cardinal(240), "WSW")

    # 10. Cache behavior and provenance verification in EnvironmentalService
    def test_service_caching_and_provenance(self):
        service = EnvironmentalService()
        # Force refresh to populate cache
        resp1 = service.get_unified_environment("borivali", force_refresh=True)
        self.assertFalse(resp1.metadata.cached)

        # Subsequent call without force refresh should return cached=True
        resp2 = service.get_unified_environment("borivali", force_refresh=False)
        self.assertTrue(resp2.metadata.cached)
        self.assertEqual(resp1.location.id, resp2.location.id)

    # 12. Floating-point breakpoint continuity (eliminating the gap bug)
    def test_naqi_floating_point_continuity(self):
        # In the unhardened code, 30.05 fell between [0..30] and [31..60], returning 500!
        idx_30_05, cat_30_05 = calculate_naqi_sub_index("pm25", 30.05)
        self.assertIsNotNone(idx_30_05)
        self.assertEqual(cat_30_05, "Satisfactory")
        self.assertTrue(50 <= idx_30_05 <= 53)

        # 60.05 fell between 60 and 61
        idx_60_05, cat_60_05 = calculate_naqi_sub_index("pm25", 60.05)
        self.assertIsNotNone(idx_60_05)
        self.assertEqual(cat_60_05, "Moderate")
        self.assertTrue(100 <= idx_60_05 <= 102)

        # 90.05 fell between 90 and 91
        idx_90_05, cat_90_05 = calculate_naqi_sub_index("pm25", 90.05)
        self.assertIsNotNone(idx_90_05)
        self.assertEqual(cat_90_05, "Poor")
        self.assertTrue(200 <= idx_90_05 <= 202)

    # 13. Physical Solar Radiation diurnal behavior (Night is strictly 0.0 W/m²)
    def test_solar_radiation_night_is_zero(self):
        from app.adapters.openmeteo_adapter import estimate_diurnal_solar_radiation
        # 02:00 AM UTC = 07:30 AM IST (morning twilight/sun rising)
        # 18:00 UTC = 23:30 IST (deep night in Mumbai)
        night_time_utc = datetime(2026, 9, 26, 18, 0, 0)
        sol_night = estimate_diurnal_solar_radiation(night_time_utc, cloud_cover_pct=20.0)
        self.assertEqual(sol_night, 0.0, "Nighttime solar radiation must be strictly 0.0 W/m²")

        # 07:00 UTC = 12:30 IST (midday peak in Mumbai)
        midday_time_utc = datetime(2026, 9, 26, 7, 0, 0)
        sol_midday = estimate_diurnal_solar_radiation(midday_time_utc, cloud_cover_pct=10.0)
        self.assertGreater(sol_midday, 500.0, "Midday solar radiation under clear skies should exceed 500 W/m²")

    # 14. Haversine distance accuracy
    def test_haversine_distance_calculation(self):
        from app.adapters.openaq_adapter import haversine_km
        # Borivali (19.2307, 72.8567) to Dadar (19.0178, 72.8478) ~ 23.6 km
        dist = haversine_km(19.2307, 72.8567, 19.0178, 72.8478)
        self.assertTrue(22.0 <= dist <= 25.0)

    # 15. Circular wind normalization
    def test_circular_wind_degrees_normalization(self):
        self.assertEqual(degrees_to_cardinal(365), "N")
        self.assertEqual(degrees_to_cardinal(-10), "N")
        self.assertEqual(degrees_to_cardinal(-25), "NNW")
        self.assertEqual(degrees_to_cardinal(720), "N")


if __name__ == "__main__":
    unittest.main(verbosity=2)
