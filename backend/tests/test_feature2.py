import sys
import os
import unittest
from unittest.mock import patch, MagicMock

# Add app parent directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.data.locations import get_location_by_id, get_all_locations
from app.adapters.satellite_adapter import (
    satellite_adapter,
    classify_ndvi,
    classify_heat,
    SATELLITE_BASELINES
)
from app.models.schemas import DataProvenance

client = TestClient(app)


class TestFeature2GreeneryHeat(unittest.TestCase):
    """
    Test suite for Feature 2 — Greenery & Heat Analysis.
    Verifies satellite baseline adapters, classifications, API routers, cross-area comparison,
    and GIS map endpoints without external network dependency.
    """

    def setUp(self):
        self.borivali = get_location_by_id("borivali")
        self.andheri = get_location_by_id("andheri")
        self.dadar = get_location_by_id("dadar")
        self.powai = get_location_by_id("powai")
        self.kurla = get_location_by_id("kurla")

    # 1. Baseline Data Integrity for all 14 Locations
    def test_all_14_locations_have_satellite_baselines(self):
        all_locations = get_all_locations()
        self.assertEqual(len(all_locations), 14)
        for loc in all_locations:
            self.assertIn(loc.id, SATELLITE_BASELINES)
            base = SATELLITE_BASELINES[loc.id]
            self.assertIn("ndvi_mean", base)
            self.assertIn("tree_canopy_pct", base)
            self.assertIn("built_up_ratio_pct", base)
            self.assertIn("surface_heat_index", base)
            self.assertTrue(0.0 <= base["ndvi_mean"] <= 1.0)
            self.assertTrue(1.0 <= base["surface_heat_index"] <= 10.0)

    # 2. Scientific Classification Rules
    def test_ndvi_classification_thresholds(self):
        self.assertEqual(classify_ndvi(0.65), "HIGH VEGETATION")
        self.assertEqual(classify_ndvi(0.50), "HIGH VEGETATION")
        self.assertEqual(classify_ndvi(0.44), "MODERATE VEGETATION")
        self.assertEqual(classify_ndvi(0.30), "MODERATE VEGETATION")
        self.assertEqual(classify_ndvi(0.25), "LOW VEGETATION")
        self.assertEqual(classify_ndvi(0.20), "LOW VEGETATION")
        self.assertEqual(classify_ndvi(0.16), "SPARSE / BUILT-UP")
        self.assertEqual(classify_ndvi(0.05), "SPARSE / BUILT-UP")
        self.assertEqual(classify_ndvi(-0.15), "WATER / NON-VEGETATED")
        self.assertEqual(classify_ndvi(1.5), "ANOMALY / OUT OF BOUNDS")
        self.assertEqual(classify_ndvi(-1.5), "ANOMALY / OUT OF BOUNDS")
        self.assertEqual(classify_ndvi(None), "UNAVAILABLE")

    def test_heat_classification_thresholds(self):
        self.assertEqual(classify_heat(3.2), "LOW")
        self.assertEqual(classify_heat(4.0), "LOW")
        self.assertEqual(classify_heat(5.5), "MODERATE")
        self.assertEqual(classify_heat(6.5), "MODERATE")
        self.assertEqual(classify_heat(7.2), "HIGH")
        self.assertEqual(classify_heat(8.0), "HIGH")
        self.assertEqual(classify_heat(8.5), "EXTREME")
        self.assertEqual(classify_heat(12.0), "ANOMALY / OUT OF BOUNDS")
        self.assertEqual(classify_heat(-2.0), "ANOMALY / OUT OF BOUNDS")
        self.assertEqual(classify_heat(None), "UNAVAILABLE")

    def test_satellite_baselines_use_non_causal_language(self):
        # Verify no baseline uses unverified causal language
        forbidden_causal_phrases = ["caused by", "trap heat", "driven by", "resulting from"]
        for loc_id, base in SATELLITE_BASELINES.items():
            heat_interp = base.get("heat_interpretation", "").lower()
            for phrase in forbidden_causal_phrases:
                self.assertNotIn(
                    phrase,
                    heat_interp,
                    f"Baseline for {loc_id} contains unverified causal phrase: '{phrase}'"
                )

    # 3. Direct Satellite Adapter Methods
    def test_satellite_adapter_greenery(self):
        greenery = satellite_adapter.get_greenery(self.borivali)
        self.assertEqual(greenery.location_id, "borivali")
        self.assertEqual(greenery.ndvi_mean, 0.58)
        self.assertEqual(greenery.greenery_classification, "HIGH VEGETATION")
        self.assertEqual(greenery.provenance, DataProvenance.SATELLITE_BASELINE)
        self.assertIn("Sentinel-2", greenery.satellite_source)

    def test_satellite_adapter_heat(self):
        heat = satellite_adapter.get_heat(self.kurla)
        self.assertEqual(heat.location_id, "kurla")
        self.assertEqual(heat.surface_heat_index, 8.4)
        self.assertEqual(heat.heat_classification, "EXTREME")
        self.assertEqual(heat.provenance, DataProvenance.SATELLITE_BASELINE)
        self.assertIn("Landsat", heat.satellite_source)

    # 4. API Endpoint: GET /api/greenery/{location_id}
    def test_api_get_greenery_valid(self):
        response = client.get("/api/greenery/borivali")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["location_id"], "borivali")
        self.assertEqual(data["ndvi_mean"], 0.58)
        self.assertEqual(data["greenery_classification"], "HIGH VEGETATION")
        self.assertEqual(data["provenance"], "SATELLITE_BASELINE")
        self.assertIsNotNone(data["interpretation"])

    def test_api_get_greenery_invalid_404(self):
        response = client.get("/api/greenery/nonexistent_area")
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn("detail", data)

    # 5. API Endpoint: GET /api/heat/{location_id}
    def test_api_get_heat_valid(self):
        response = client.get("/api/heat/andheri")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["location_id"], "andheri")
        self.assertEqual(data["surface_heat_index"], 7.6)
        self.assertEqual(data["heat_classification"], "HIGH")
        self.assertEqual(data["provenance"], "SATELLITE_BASELINE")
        self.assertIn("heat", data["interpretation"].lower() if data.get("interpretation") else "")

    def test_api_get_heat_invalid_404(self):
        response = client.get("/api/heat/atlantis")
        self.assertEqual(response.status_code, 404)

    # 6. API Endpoint: GET /api/environment/compare
    def test_api_compare_borivali_vs_andheri(self):
        response = client.get("/api/environment/compare?location_a=borivali&location_b=andheri")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["location_a"]["location_id"], "borivali")
        self.assertEqual(data["location_b"]["location_id"], "andheri")

        # Borivali (0.58) vs Andheri (0.22) -> diff_ndvi = +0.36
        diffs = data["differentials"]
        self.assertAlmostEqual(diffs["ndvi_delta"], 0.36, places=2)
        self.assertEqual(diffs["higher_greenery_location"], "Borivali")
        self.assertEqual(diffs["higher_surface_heat_location"], "Andheri")

        # Interpretation checks
        interpretation = data["interpretation"]
        self.assertIn("Borivali exhibits higher vegetative vigor", interpretation)
        self.assertIn("Andheri displays a higher surface-heat indicator", interpretation)

    def test_api_compare_dadar_vs_powai(self):
        response = client.get("/api/environment/compare?location_a=dadar&location_b=powai")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        diffs = data["differentials"]
        self.assertEqual(diffs["higher_greenery_location"], "Powai")
        self.assertEqual(diffs["higher_surface_heat_location"], "Dadar")

    def test_api_compare_identical_locations_400(self):
        response = client.get("/api/environment/compare?location_a=bandra&location_b=bandra")
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("Cannot compare a location to itself", data["detail"])

    def test_api_compare_invalid_location_404(self):
        response = client.get("/api/environment/compare?location_a=borivali&location_b=unknown_spot")
        self.assertEqual(response.status_code, 404)

    def test_api_compare_alias(self):
        response = client.get("/api/compare?location_a=borivali&location_b=andheri")
        self.assertEqual(response.status_code, 200)

    # 7. API Endpoint: GET /api/greenery-heat/map
    def test_api_greenery_heat_map(self):
        response = client.get("/api/greenery-heat/map")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["total_locations"], 14)
        self.assertEqual(len(data["locations"]), 14)
        self.assertEqual(data["provenance"], "SATELLITE_BASELINE")

        first_loc = data["locations"][0]
        self.assertIn("id", first_loc)
        self.assertIn("latitude", first_loc)
        self.assertIn("longitude", first_loc)
        self.assertIn("ndvi_mean", first_loc)
        self.assertIn("surface_heat_index", first_loc)

    # 8. Non-regression: Check Root and Unified endpoints
    def test_non_regression_root_endpoints(self):
        root = client.get("/")
        self.assertEqual(root.status_code, 200)
        endpoints = root.json()["endpoints"]
        self.assertIn("greenery", endpoints)
        self.assertIn("heat", endpoints)
        self.assertIn("compare", endpoints)
        self.assertIn("map_features", endpoints)


if __name__ == "__main__":
    unittest.main()
