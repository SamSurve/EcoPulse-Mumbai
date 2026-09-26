import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestFrontendIntegration(unittest.TestCase):
    """
    Test suite for Frontend UI integration and API consumption.
    Verifies HTML dashboard serving, static assets, and endpoint contract compatibility.
    """

    def test_dashboard_endpoint_serves_html(self):
        res = client.get("/dashboard")
        self.assertEqual(res.status_code, 200)
        self.assertIn("text/html", res.headers.get("content-type", ""))
        html = res.text
        self.assertIn("EcoPulse", html)
        self.assertIn("Mumbai", html)
        self.assertIn("location-select", html)
        self.assertIn("mumbai-map", html)
        self.assertIn("forecastChart", html)
        self.assertIn("comparison-section", html)

    def test_browser_root_serves_html(self):
        res = client.get("/", headers={"Accept": "text/html,application/xhtml+xml"})
        self.assertEqual(res.status_code, 200)
        self.assertIn("text/html", res.headers.get("content-type", ""))
        self.assertIn("EcoPulse Mumbai", res.text)

    def test_api_client_root_serves_json(self):
        res = client.get("/", headers={"Accept": "application/json"})
        self.assertEqual(res.status_code, 200)
        self.assertIn("application/json", res.headers.get("content-type", ""))
        data = res.json()
        self.assertIn("dashboard_ui", data)
        self.assertEqual(data["dashboard_ui"], "/dashboard")

    def test_static_index_reachable(self):
        res = client.get("/static/index.html")
        self.assertEqual(res.status_code, 200)
        self.assertIn("text/html", res.headers.get("content-type", ""))

    def test_frontend_consumed_endpoints_health(self):
        # 1. Locations
        res = client.get("/api/locations")
        self.assertEqual(res.status_code, 200)
        locs = res.json()
        self.assertEqual(len(locs), 14)

        # 2. Map Features
        res = client.get("/api/greenery-heat/map")
        self.assertEqual(res.status_code, 200)
        map_data = res.json()
        self.assertEqual(map_data["total_locations"], 14)

        # 3. Environment unified
        res = client.get("/api/environment/borivali")
        self.assertEqual(res.status_code, 200)
        env = res.json()
        self.assertIn("risk", env)
        self.assertIn("forecast", env)
        self.assertIn("greenery", env)
        self.assertIn("heat", env)

        # 4. Comparison
        res = client.get("/api/environment/compare?location_a=borivali&location_b=andheri")
        self.assertEqual(res.status_code, 200)
        comp = res.json()
        self.assertIn("differentials", comp)
        self.assertIn("interpretation", comp)


if __name__ == "__main__":
    unittest.main()
