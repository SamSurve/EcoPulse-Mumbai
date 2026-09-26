import sys
import os
import unittest
from datetime import datetime

# Add app parent directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.data.locations import (
    get_all_locations,
    get_location_by_id,
    is_valid_location,
    MUMBAI_LOCATIONS
)
from app.services.cache import InMemoryTTLCache
from app.adapters.openmeteo_adapter import calculate_naqi_sub_index, get_naqi_category
from app.adapters.satellite_adapter import satellite_adapter, SATELLITE_BASELINES
from app.services.environment_service import environment_service


class TestEcoPulseBackend(unittest.TestCase):
    """Core verification test suite for EcoPulse Mumbai backend."""

    def test_location_registry_coverage(self):
        """Verify that all mandatory Mumbai locations exist."""
        required_locations = [
            "borivali", "andheri", "dadar", "bandra", "powai",
            "colaba", "worli", "sion", "kurla", "mulund", "kandivali"
        ]
        all_locs = get_all_locations()
        all_ids = [loc.id for loc in all_locs]

        for req in required_locations:
            self.assertIn(req, all_ids, f"Required location '{req}' missing from registry")

        self.assertGreaterEqual(len(all_locs), 11, "Must have at least 11 locations")

    def test_location_coordinates_mumbai_bounds(self):
        """Ensure all location coordinates fall within Mumbai Metropolitan Region bounds."""
        for loc in get_all_locations():
            # Latitude bounds for Mumbai: ~18.85 to 19.35
            self.assertTrue(
                18.85 <= loc.latitude <= 19.35,
                f"Location {loc.name} latitude {loc.latitude} outside Mumbai bounds"
            )
            # Longitude bounds for Mumbai: ~72.75 to 73.05
            self.assertTrue(
                72.75 <= loc.longitude <= 73.05,
                f"Location {loc.name} longitude {loc.longitude} outside Mumbai bounds"
            )

    def test_location_lookup_and_invalid(self):
        """Test valid retrieval and invalid location handling."""
        borivali = get_location_by_id("borivali")
        self.assertIsNotNone(borivali)
        self.assertEqual(borivali.name, "Borivali")

        invalid = get_location_by_id("atlantis")
        self.assertIsNone(invalid)
        self.assertFalse(is_valid_location("atlantis"))

    def test_in_memory_ttl_cache(self):
        """Verify TTL cache storage, retrieval, and expiration."""
        cache = InMemoryTTLCache(default_ttl_seconds=1)
        cache.set("test_key", {"data": "mumbai"}, ttl_seconds=1)

        # Immediate retrieval
        val = cache.get("test_key")
        self.assertIsNotNone(val)
        self.assertEqual(val["data"], "mumbai")

        # Expired retrieval
        import time
        time.sleep(1.1)
        expired_val = cache.get("test_key")
        self.assertIsNone(expired_val)

    def test_in_memory_ttl_cache_lru_and_stats(self):
        """Verify bounded LRU eviction and telemetry stats."""
        bounded_cache = InMemoryTTLCache(default_ttl_seconds=300, maxsize=3)
        bounded_cache.set("a", 1)
        bounded_cache.set("b", 2)
        bounded_cache.set("c", 3)
        self.assertEqual(bounded_cache.size(), 3)

        # Access "a" so that "b" becomes the least recently used
        _ = bounded_cache.get("a")

        # Insert 4th item, triggering LRU eviction of "b"
        bounded_cache.set("d", 4)
        self.assertEqual(bounded_cache.size(), 3)
        self.assertIsNone(bounded_cache.get("b"))
        self.assertEqual(bounded_cache.get("a"), 1)
        self.assertEqual(bounded_cache.get("c"), 3)
        self.assertEqual(bounded_cache.get("d"), 4)

        # Verify stats telemetry
        stats = bounded_cache.stats()
        self.assertEqual(stats["maxsize"], 3)
        self.assertGreaterEqual(stats["evictions"], 1)
        self.assertGreaterEqual(stats["hits"], 3)
        self.assertGreaterEqual(stats["misses"], 1)
        self.assertIn("hit_ratio", stats)

    def test_decoupled_environment_service_getters(self):
        """Verify get_air and get_weather return valid models and populate sub-caches."""
        air = environment_service.get_air("borivali", force_refresh=True)
        self.assertIsNotNone(air)
        self.assertIsNotNone(air.provenance)

        weather = environment_service.get_weather("borivali", force_refresh=True)
        self.assertIsNotNone(weather)
        self.assertIsNotNone(weather.provenance)

    def test_naqi_calculation(self):
        """Test CPCB NAQI sub-index calculation accuracy."""
        # PM2.5 = 25 µg/m³ -> Good (0-50)
        idx, cat = calculate_naqi_sub_index("pm25", 25.0)
        self.assertIsNotNone(idx)
        self.assertTrue(0 <= idx <= 50)
        self.assertEqual(cat, "Good")

        # PM2.5 = 75 µg/m³ -> Moderate (101-200)
        idx, cat = calculate_naqi_sub_index("pm25", 75.0)
        self.assertIsNotNone(idx)
        self.assertTrue(101 <= idx <= 200)
        self.assertEqual(cat, "Moderate")

        # PM2.5 = 105 µg/m³ -> Poor (201-300)
        idx, cat = calculate_naqi_sub_index("pm25", 105.0)
        self.assertIsNotNone(idx)
        self.assertTrue(201 <= idx <= 300)
        self.assertEqual(cat, "Poor")

        # PM2.5 = 150 µg/m³ -> Very Poor (301-400)
        idx, cat = calculate_naqi_sub_index("pm25", 150.0)
        self.assertIsNotNone(idx)
        self.assertTrue(301 <= idx <= 400)
        self.assertEqual(cat, "Very Poor")

    def test_satellite_adapter_baselines(self):
        """Verify satellite surface baselines are available for all locations."""
        for loc_id, loc in MUMBAI_LOCATIONS.items():
            greenery = satellite_adapter.get_greenery(loc)
            heat = satellite_adapter.get_heat(loc)

            self.assertIsNotNone(greenery.ndvi_mean)
            self.assertIsNotNone(greenery.tree_canopy_pct)
            self.assertIsNotNone(greenery.built_up_ratio_pct)
            self.assertIsNotNone(heat.surface_heat_index)

            # NDVI must be physically between -0.1 and 1.0
            self.assertTrue(-0.1 <= greenery.ndvi_mean <= 1.0)
            # Canopy and built-up must be between 0 and 100%
            self.assertTrue(0 <= greenery.tree_canopy_pct <= 100)
            self.assertTrue(0 <= greenery.built_up_ratio_pct <= 100)

    def test_unified_environment_response_structure(self):
        """Verify the unified response contract contains all 7 required components."""
        response = environment_service.get_unified_environment("borivali", force_refresh=True)

        self.assertIsNotNone(response, "Response should not be None")
        # 1. Location
        self.assertEqual(response.location.id, "borivali")
        self.assertEqual(response.location.name, "Borivali")

        # 2. Air
        self.assertIsNotNone(response.air)
        self.assertIsNotNone(response.air.aqi)

        # 3. Weather
        self.assertIsNotNone(response.weather)
        self.assertIsNotNone(response.weather.temperature_c)
        self.assertIsNotNone(response.weather.relative_humidity_pct)

        # 4. Greenery
        self.assertIsNotNone(response.greenery)
        self.assertGreater(response.greenery.ndvi_mean, 0.40, "Borivali should have high NDVI")

        # 5. Heat
        self.assertIsNotNone(response.heat)
        self.assertIsNotNone(response.heat.surface_heat_index)

        # 6. Risk
        self.assertIsNotNone(response.risk)
        self.assertIsNotNone(response.risk.risk_score)
        self.assertIn(response.risk.risk_level, ["LOW", "MODERATE", "HIGH", "SEVERE"])
        self.assertTrue(len(response.risk.explanation) > 10, "Risk explanation should be informative")

        # 7. Metadata
        self.assertIsNotNone(response.metadata)
        self.assertEqual(response.metadata.version, "1.0.0")

    def test_fastapi_endpoints_via_testclient(self):
        """Test API endpoints using FastAPI TestClient if installed."""
        try:
            from fastapi.testclient import TestClient
            from app.main import app

            client = TestClient(app)

            # 1. Health endpoint
            res = client.get("/api/health")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(data["status"], "healthy")
            self.assertEqual(data["service"], "EcoPulse Mumbai")
            self.assertEqual(data["supported_locations_count"], 14)
            self.assertIn("cache", data)
            self.assertEqual(data["cache"]["maxsize"], 1000)

            # 2. Locations endpoint
            res = client.get("/api/locations")
            self.assertEqual(res.status_code, 200)
            locs = res.json()
            self.assertEqual(len(locs), 14)

            # 3. Valid location environment endpoint
            res = client.get("/api/environment/andheri")
            self.assertEqual(res.status_code, 200)
            env_data = res.json()
            self.assertIn("location", env_data)
            self.assertIn("air", env_data)
            self.assertIn("weather", env_data)
            self.assertIn("greenery", env_data)
            self.assertIn("heat", env_data)
            self.assertIn("risk", env_data)
            self.assertIn("metadata", env_data)

            # 4. Invalid location returns 404
            res = client.get("/api/environment/non_existent_place")
            self.assertEqual(res.status_code, 404)
        except ImportError:
            print("Note: fastapi.testclient not installed in current env; skipping HTTP client test")


if __name__ == "__main__":
    unittest.main(verbosity=2)
