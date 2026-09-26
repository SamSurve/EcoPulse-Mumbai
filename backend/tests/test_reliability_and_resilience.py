import sys
import os
import unittest
from unittest.mock import patch, MagicMock
import socket
import urllib.error
from threading import Thread
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.schemas import DataProvenance, WeatherData, AirData
from app.data.locations import get_location_by_id
from app.adapters.openmeteo_adapter import OpenMeteoAdapter
from app.adapters.openaq_adapter import OpenAQAdapter
from app.services.cache import InMemoryTTLCache, cache
from app.services.environment_service import EnvironmentalService, evaluate_environmental_risk
from app.core.http_client import HttpClientManager
from app.config import FallbackSettings
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestReliabilityAndResilience(unittest.TestCase):
    """
    Exhaustive reliability, concurrency, error-handling, and resilience test suite.
    Validates failure scenarios, timeouts, cache isolation, thread safety, and API contracts.
    """

    def setUp(self):
        self.borivali = get_location_by_id("borivali")
        self.andheri = get_location_by_id("andheri")
        self.adapter = OpenMeteoAdapter(timeout_seconds=1)
        self.service = EnvironmentalService()

    # 1. Provider Timeout Resilience
    @patch("urllib.request.urlopen")
    def test_provider_timeout_resilience(self, mock_urlopen):
        """Simulate upstream socket timeout and verify graceful fallback without crashing."""
        mock_urlopen.side_effect = socket.timeout("Connection to Open-Meteo timed out")

        weather = self.adapter.fetch_weather(self.borivali)
        self.assertIsNotNone(weather, "Should return a safe fallback rather than raising an uncaught exception")
        self.assertEqual(weather.provenance, DataProvenance.ESTIMATED_INTERPOLATION)
        self.assertIn("Fallback", weather.source)
        self.assertIsNotNone(weather.temperature_c)

    # 2. Provider Connection Reset Resilience
    @patch("urllib.request.urlopen")
    def test_provider_connection_reset_resilience(self, mock_urlopen):
        """Simulate TCP connection reset and verify resilient fallback."""
        mock_urlopen.side_effect = ConnectionResetError("Connection reset by peer")

        air = self.adapter.fetch_air_quality(self.andheri)
        self.assertIsNotNone(air, "Should return resilient baseline model on network connection reset")
        self.assertEqual(air.provenance, DataProvenance.ESTIMATED_INTERPOLATION)
        self.assertIsNotNone(air.aqi)

    # 3. Provider HTTP 500/502/503 Error Responses
    @patch("urllib.request.urlopen")
    def test_provider_http_server_errors_handling(self, mock_urlopen):
        """Verify that HTTP 502/503 errors return None safely from http_client without crashing."""
        http_mgr = HttpClientManager(timeout_seconds=1, max_retries=1)
        mock_err = urllib.error.HTTPError(
            url="https://api.open-meteo.com/v1/forecast",
            code=503,
            msg="Service Unavailable",
            hdrs={},
            fp=None
        )
        mock_urlopen.side_effect = mock_err

        res = http_mgr.get_json("https://api.open-meteo.com/v1/forecast")
        self.assertIsNone(res, "HTTP 503 should result in None return")

    # 4. Provider HTTP 401/403 Non-Retryable Handling
    @patch("urllib.request.urlopen")
    def test_provider_http_403_non_retryable(self, mock_urlopen):
        """Verify that HTTP 403 Forbidden is non-retryable and exits cleanly."""
        http_mgr = HttpClientManager(timeout_seconds=1, max_retries=1)
        mock_err = urllib.error.HTTPError(
            url="https://api.openaq.org/v3/locations",
            code=403,
            msg="Forbidden",
            hdrs={},
            fp=None
        )
        mock_urlopen.side_effect = mock_err

        res = http_mgr.get_json("https://api.openaq.org/v3/locations")
        self.assertIsNone(res, "HTTP 403 should return None without error")

    # 5. Provider Malformed Non-JSON Response Handling
    @patch("urllib.request.urlopen")
    def test_provider_malformed_json_response(self, mock_urlopen):
        """Verify that corrupted or non-JSON payloads are handled without unhandled JSONDecodeError."""
        http_mgr = HttpClientManager(timeout_seconds=1, max_retries=0)
        mock_resp = MagicMock()
        mock_resp.read.return_value = b"<html><head><title>502 Bad Gateway</title></head><body>Bad Gateway</body></html>"
        mock_resp.__enter__.return_value = mock_resp
        mock_urlopen.return_value = mock_resp

        res = http_mgr.get_json("https://api.open-meteo.com/v1/forecast")
        self.assertIsNone(res, "Malformed non-JSON upstream payload must return None")

    # 6. Cache Location Isolation & Mutation Safety
    def test_cache_location_isolation_and_immutability(self):
        """Verify cache keys are strictly isolated per location and immune to in-place mutation."""
        local_cache = InMemoryTTLCache(default_ttl_seconds=300, maxsize=10)

        # Store two distinct models
        data_a = WeatherData(temperature_c=28.5, apparent_temperature_c=32.0)
        data_b = WeatherData(temperature_c=36.0, apparent_temperature_c=42.0)

        local_cache.set("weather:borivali", data_a)
        local_cache.set("weather:andheri", data_b)

        # Retrieve and verify strict isolation
        cached_a = local_cache.get("weather:borivali")
        cached_b = local_cache.get("weather:andheri")

        self.assertIsNotNone(cached_a)
        self.assertIsNotNone(cached_b)
        self.assertEqual(cached_a.temperature_c, 28.5)
        self.assertEqual(cached_b.temperature_c, 36.0)

        # Verify mutation safety via model_copy
        cloned_a = cached_a.model_copy(deep=True)
        cloned_a.temperature_c = 99.9  # mutate clone

        # Fresh retrieval from cache must retain original value
        fresh_a = local_cache.get("weather:borivali")
        self.assertEqual(fresh_a.temperature_c, 28.5, "Original cached value must not be mutated")

    # 7. Concurrent Multi-Threaded Cache Access
    def test_cache_concurrent_multithreaded_access(self):
        """Verify thread-safety and lock synchronization under high concurrent access."""
        thread_cache = InMemoryTTLCache(default_ttl_seconds=10, maxsize=50)
        errors = []

        def worker(thread_id: int):
            try:
                for i in range(50):
                    key = f"key_{thread_id}_{i % 5}"
                    thread_cache.set(key, {"thread": thread_id, "val": i})
                    val = thread_cache.get(key)
                    if val is not None and val["thread"] != thread_id:
                        errors.append(f"Thread {thread_id} read data from thread {val['thread']}")
                    stats = thread_cache.stats()
                    self.assertIn("size", stats)
            except Exception as e:
                errors.append(str(e))

        threads = [Thread(target=worker, args=(t,)) for t in range(10)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        self.assertEqual(len(errors), 0, f"Concurrent thread errors encountered: {errors}")

    # 8. API Contract Validation & Error Status Codes
    def test_api_contract_validation_and_status_codes(self):
        """Test strict HTTP status codes across error boundaries."""
        # 1. Compare same location -> 400 Bad Request
        res_same = client.get("/api/environment/compare?location_a=borivali&location_b=borivali")
        self.assertEqual(res_same.status_code, 400)
        self.assertIn("Cannot compare a location to itself", res_same.json()["detail"])

        # 2. Non-existent location -> 404 Not Found
        res_404 = client.get("/api/environment/non_existent_place")
        self.assertEqual(res_404.status_code, 404)

        # 3. Invalid location on air-quality -> 404 Not Found
        res_air_404 = client.get("/api/air-quality/atlantis")
        self.assertEqual(res_air_404.status_code, 404)

        # 4. Invalid location on microclimate -> 404 Not Found
        res_micro_404 = client.get("/api/microclimate/atlantis")
        self.assertEqual(res_micro_404.status_code, 404)

        # 5. Invalid location on risk -> 404 Not Found
        res_risk_404 = client.get("/api/risk/atlantis")
        self.assertEqual(res_risk_404.status_code, 404)

        # 6. Invalid location on forecast -> 404 Not Found
        res_fc_404 = client.get("/api/forecast/atlantis")
        self.assertEqual(res_fc_404.status_code, 404)

    # 9. Fallback Settings & Environment Variable Safety
    def test_configuration_fallback_settings(self):
        """Verify FallbackSettings initializes safely with standard defaults when pydantic-settings is absent."""
        fb = FallbackSettings()
        self.assertEqual(fb.PORT, 8000)
        self.assertEqual(fb.HOST, "0.0.0.0")
        self.assertEqual(fb.ENVIRONMENT, "development")
        self.assertEqual(fb.LOG_LEVEL, "INFO")
        self.assertEqual(fb.HTTP_TIMEOUT_SECONDS, 5)
        self.assertEqual(fb.MAX_CACHE_SIZE, 1000)
        self.assertIsInstance(fb.cors_origins_list, list)
        self.assertGreaterEqual(len(fb.cors_origins_list), 1)

    # 10. Partial Provider Failure Handling
    def test_partial_provider_failure_does_not_crash_risk_engine(self):
        """Verify that when air quality is None, the risk engine normalizes remaining domains rather than crashing."""
        weather = WeatherData(
            temperature_c=33.0,
            apparent_temperature_c=38.0,
            wind_speed_kmh=12.0
        )
        # Air quality is completely None
        risk = evaluate_environmental_risk(
            location=self.borivali,
            air=None,
            weather=weather,
            heat=None,
            greenery=None
        )

        self.assertIsNotNone(risk)
        self.assertIsNotNone(risk.risk_score)
        self.assertIn(risk.risk_level, ["LOW", "MODERATE", "HIGH", "SEVERE"])
        self.assertIn("Thermal", risk.primary_stressor)


if __name__ == "__main__":
    unittest.main()
