"""
Security, Input Validation, and Data-Flow Integrity Test Suite for EcoPulse Mumbai.
Validates:
1. Input validation perimeter (Path/Query parameter bounds, regex constraints, length checks).
2. Injection prevention (path traversal, XSS scripts, shell characters).
3. Defensive HTTP security headers (nosniff, DENY, XSS protection, Referrer-Policy).
4. Error response schema contracts (400, 404, 422, 500).
5. Provider trust boundaries (NaN, Inf, unphysical values sanitization).
6. Zero-fabrication telemetry flow and honest provenance propagation.
"""
import sys
import os
import math
import unittest
from unittest.mock import patch, MagicMock
import urllib.parse
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.models.schemas import DataProvenance, Location
from app.data.locations import get_location_by_id
from app.adapters.openmeteo_adapter import OpenMeteoAdapter
from app.adapters.openaq_adapter import OpenAQAdapter

client = TestClient(app)


class TestApiSecurityAndDataFlow(unittest.TestCase):
    """Exhaustive tests for API security, input validation, and data flow."""

    def setUp(self):
        self.borivali = get_location_by_id("borivali")
        self.openmeteo_adapter = OpenMeteoAdapter()
        self.openaq_adapter = OpenAQAdapter()

    # =========================================================================
    # 1. DEFENSIVE HTTP SECURITY HEADERS
    # =========================================================================
    def test_security_headers_present_on_endpoints(self):
        """Verify that defensive HTTP security headers are injected on all responses."""
        endpoints = [
            "/api/health",
            "/api/locations",
            "/api/locations/borivali",
            "/api/air-quality/borivali",
            "/api/microclimate/borivali",
            "/api/greenery/borivali",
            "/api/heat/borivali",
            "/api/risk/borivali",
            "/api/forecast/borivali",
            "/api/environment/borivali",
        ]
        for ep in endpoints:
            resp = client.get(ep)
            self.assertEqual(
                resp.headers.get("X-Content-Type-Options"),
                "nosniff",
                f"Missing nosniff header on {ep}"
            )
            self.assertEqual(
                resp.headers.get("X-Frame-Options"),
                "DENY",
                f"Missing X-Frame-Options DENY on {ep}"
            )
            self.assertEqual(
                resp.headers.get("X-XSS-Protection"),
                "1; mode=block",
                f"Missing X-XSS-Protection on {ep}"
            )
            self.assertEqual(
                resp.headers.get("Referrer-Policy"),
                "strict-origin-when-cross-origin",
                f"Missing Referrer-Policy on {ep}"
            )

    # =========================================================================
    # 2. INPUT VALIDATION & INJECTION PREVENTION (PERIMETER DEFENSE)
    # =========================================================================
    def test_path_traversal_rejection(self):
        """Verify that directory traversal attempts are rejected at the parameter boundary."""
        malicious_ids = [
            "..",
            "../etc/passwd",
            "..%2f..%2f",
            "....//",
            "/etc/passwd"
        ]
        for bad_id in malicious_ids:
            resp = client.get(f"/api/locations/{bad_id}")
            # Should be 404 (route not matched) or 422 (validation failed)
            self.assertIn(resp.status_code, [404, 422], f"Failed to reject path traversal: {bad_id}")

    def test_xss_and_special_character_rejection(self):
        """Verify that XSS tags, semicolons, and spaces trigger HTTP 422 Unprocessable Entity."""
        bad_inputs = [
            "<script>alert(1)</script>",
            "borivali;drop table",
            "borivali dadar",
            "borivali' OR 1=1--",
            "a",             # min_length=2 violation
            "x" * 51,        # max_length=50 violation
            "borivali$#@",   # regex violation
        ]
        test_routes = [
            "/api/locations/{}",
            "/api/air-quality/{}",
            "/api/microclimate/{}",
            "/api/greenery/{}",
            "/api/heat/{}",
            "/api/risk/{}",
            "/api/forecast/{}",
            "/api/environment/{}"
        ]
        for route_template in test_routes:
            for bad_input in bad_inputs:
                resp = client.get(route_template.format(urllib.parse.quote(bad_input, safe="")))
                self.assertEqual(
                    resp.status_code,
                    422,
                    f"Route {route_template} failed to return 422 for input '{bad_input}' (got {resp.status_code})"
                )
                data = resp.json()
                self.assertIn("error", data)
                self.assertIn("detail", data)
                # Verify string detail for frontend client compatibility
                self.assertIsInstance(data["detail"], str)

    def test_unknown_location_returns_clean_404(self):
        """Valid syntax but unknown location returns 404 with structured JSON ErrorResponse."""
        resp = client.get("/api/locations/unknownplace")
        self.assertEqual(resp.status_code, 404)
        data = resp.json()
        self.assertEqual(data["error"], "Not Found")
        self.assertIn("detail", data)
        self.assertIn("unknownplace", data["detail"])

    # =========================================================================
    # 3. COMPARISON ENDPOINT VALIDATION
    # =========================================================================
    def test_compare_same_location_rejected(self):
        """Comparing a location to itself should be rejected with HTTP 400."""
        resp = client.get("/api/environment/compare?location_a=borivali&location_b=borivali")
        self.assertEqual(resp.status_code, 400)
        data = resp.json()
        self.assertIn("Cannot compare a location to itself", data.get("detail", ""))

    def test_compare_missing_query_parameters(self):
        """Omitting required query parameters returns HTTP 422."""
        resp = client.get("/api/environment/compare?location_a=borivali")
        self.assertEqual(resp.status_code, 422)

    def test_compare_malformed_query_parameters(self):
        """Passing regex-violating query parameters to compare returns HTTP 422."""
        resp = client.get("/api/environment/compare?location_a=<script>&location_b=powai")
        self.assertEqual(resp.status_code, 422)

    def test_compare_unknown_locations(self):
        """Valid syntax but non-existent comparison location returns HTTP 404."""
        resp = client.get("/api/environment/compare?location_a=borivali&location_b=delhi")
        self.assertEqual(resp.status_code, 404)

    # =========================================================================
    # 4. EXTERNAL PROVIDER TRUST BOUNDARIES & INPUT SANITIZATION
    # =========================================================================
    @patch("app.core.http_client.http_client.get_json")
    def test_openmeteo_nan_inf_unphysical_sanitization(self, mock_get_json):
        """
        Verify that corrupted provider feeds containing NaN, Infinity, or impossible
        physical bounds are sanitized to None and never cause division by zero or NaN propagation.
        """
        mock_get_json.return_value = {
            "current": {
                "time": "2026-09-26T12:00:00",
                "temperature_2m": float("nan"),
                "relative_humidity_2m": 150.0,       # > 100% physically impossible
                "apparent_temperature": float("inf"),
                "wind_speed_10m": -15.0,              # negative speed physically impossible
                "surface_pressure": 500.0,            # < 800 hPa physically impossible at sea level
                "cloud_cover": 200.0,                 # > 100% impossible
                "shortwave_radiation_instant": float("nan"),
            }
        }
        weather = self.openmeteo_adapter.fetch_weather(self.borivali)
        self.assertIsNotNone(weather)
        # NaN temperature should be sanitized to None
        self.assertIsNone(weather.temperature_c)
        # Relative humidity capped at 100.0
        self.assertEqual(weather.relative_humidity_pct, 100.0)
        # Inf apparent temp sanitized to None
        self.assertIsNone(weather.apparent_temperature_c)
        # Negative wind speed clamped to 0.0
        self.assertEqual(weather.wind_speed_kmh, 0.0)
        # 500 hPa unphysical sea-level pressure sanitized to None
        self.assertIsNone(weather.surface_pressure_hpa)
        # Cloud cover capped at 100.0
        self.assertEqual(weather.cloud_cover_pct, 100.0)

    @patch("app.core.http_client.http_client.get_json")
    def test_openmeteo_air_quality_nan_inf_sanitization(self, mock_get_json):
        """Verify that NaN, Inf, or unphysical concentrations (>5000 ug/m3) are filtered out."""
        mock_get_json.return_value = {
            "current": {
                "time": "2026-09-26T12:00:00",
                "pm2_5": float("nan"),
                "pm10": 99999.0,                      # corrupted extreme value
                "nitrogen_dioxide": float("inf"),
                "sulphur_dioxide": -10.0,             # negative reading
                "carbon_monoxide": 1500.0,            # valid: 1500 ug/m3 -> 1.5 mg/m3
                "ozone": 45.0                         # valid: 45 ug/m3
            }
        }
        air = self.openmeteo_adapter.fetch_air_quality(self.borivali)
        self.assertIsNotNone(air)
        # PM2.5, PM10, NO2, SO2 should be marked unavailable due to unphysical/NaN/Inf values
        self.assertFalse(air.pm25.is_available)
        self.assertFalse(air.pm10.is_available)
        self.assertFalse(air.no2.is_available)
        self.assertFalse(air.so2.is_available)
        # CO and O3 should remain valid
        self.assertTrue(air.co.is_available)
        self.assertEqual(air.co.value, 1.5)
        self.assertTrue(air.o3.is_available)
        self.assertEqual(air.o3.value, 45.0)

    # =========================================================================
    # 5. ZERO-FABRICATION & PROVENANCE PROPAGATION
    # =========================================================================
    def test_zero_fabrication_unmonitored_channels(self):
        """Verify that when an air quality channel is unmonitored, it is never populated with fake numbers."""
        resp = client.get("/api/air-quality/borivali")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        pollutants = {k: data[k] for k in ["pm25", "pm10", "no2", "so2", "co", "o3"] if isinstance(data.get(k), dict)}
        for poll_key, p_detail in pollutants.items():
            if not p_detail.get("is_available"):
                self.assertIsNone(
                    p_detail.get("value"),
                    f"Channel {poll_key} is marked unavailable but contains fabricated value {p_detail.get('value')}"
                )
                self.assertEqual(
                    p_detail.get("provenance"),
                    DataProvenance.UNAVAILABLE.value,
                    f"Unavailable channel {poll_key} must have UNAVAILABLE provenance"
                )

    def test_provenance_preservation_across_endpoints(self):
        """Verify all endpoints include accurate, valid DataProvenance enum values."""
        valid_provenance_values = {p.value for p in DataProvenance}

        # Check greenery
        greenery_resp = client.get("/api/greenery/borivali").json()
        self.assertIn(greenery_resp["provenance"], valid_provenance_values)
        self.assertEqual(greenery_resp["provenance"], DataProvenance.SATELLITE_BASELINE.value)

        # Check heat
        heat_resp = client.get("/api/heat/borivali").json()
        self.assertIn(heat_resp["provenance"], valid_provenance_values)
        self.assertEqual(heat_resp["provenance"], DataProvenance.SATELLITE_BASELINE.value)

        # Check forecast
        forecast_resp = client.get("/api/forecast/borivali").json()
        self.assertIn(forecast_resp["provenance"], valid_provenance_values)
        self.assertEqual(forecast_resp["provenance"], DataProvenance.FORECAST.value)

        # Check unified environment
        env_resp = client.get("/api/environment/borivali").json()
        self.assertIn(env_resp["greenery"]["provenance"], valid_provenance_values)
        self.assertIn(env_resp["heat"]["provenance"], valid_provenance_values)
        self.assertIn(env_resp["risk"]["provenance"], valid_provenance_values)
        self.assertIn(env_resp["forecast"]["provenance"], valid_provenance_values)


if __name__ == "__main__":
    unittest.main()
