"""
EcoPulse Mumbai — Prompt 5/6: Frontend Integration Verification Script.
Validates the complete web dashboard UI, Leaflet map data, 72-hour forecast chart data,
cross-area comparison, and seamless FastAPI integration.
"""
import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.data.locations import get_all_locations
from tests.test_frontend_integration import TestFrontendIntegration

client = TestClient(app)


def verify_frontend():
    print("=" * 80)
    print("ECOPULSE MUMBAI — FRONTEND INTEGRATION & DEMO UI VERIFICATION")
    print("=" * 80)

    # 1. Verify Static Dashboard Files
    static_file = os.path.join(os.path.dirname(__file__), "app", "static", "index.html")
    exists = os.path.exists(static_file)
    size = os.path.getsize(static_file) if exists else 0
    print(f"\n1. STATIC DASHBOARD ARTIFACT CHECK:")
    print(f"  • Template Path: {static_file}")
    print(f"  • File Exists: {exists} ({size} bytes)")
    assert exists, "Dashboard index.html must exist"

    # 2. Test Browser Dashboard Route
    print(f"\n2. HTTP SERVING & BROWSER CONTENT NEGOTIATION:")
    dash_res = client.get("/dashboard")
    print(f"  • GET /dashboard -> Status: {dash_res.status_code} | Content-Type: {dash_res.headers.get('content-type')}")
    assert dash_res.status_code == 200

    root_html = client.get("/", headers={"Accept": "text/html,application/xhtml+xml"})
    print(f"  • GET / (Browser Accept: text/html) -> Status: {root_html.status_code} | Title present: {'EcoPulse Mumbai' in root_html.text}")

    root_json = client.get("/", headers={"Accept": "application/json"})
    print(f"  • GET / (API Accept: application/json) -> Status: {root_json.status_code} | Dashboard link: {root_json.json().get('dashboard_ui')}")

    # 3. Test Location Data Pipeline for UI
    locations = get_all_locations()
    print(f"\n3. FRONTEND LOCATION SELECTOR AUDIT ({len(locations)} Locations):")
    sample_locs = ["borivali", "andheri", "dadar", "kurla"]
    for loc_id in sample_locs:
        res = client.get(f"/api/environment/{loc_id}")
        assert res.status_code == 200, f"Failed for {loc_id}"
        data = res.json()
        print(f"  • {data['location']['name']:<12}: AQI={data['air']['aqi']} | Temp={data['weather']['temperature_c']}°C | NDVI={data['greenery']['ndvi_mean']} | Risk={data['risk']['risk_score']} ({data['risk']['risk_level']}) | Forecast={len(data['forecast']['hourly'])}h")

    # 4. Run Automated Frontend Tests
    print(f"\n4. EXECUTING AUTOMATED FRONTEND TEST SUITE (test_frontend_integration.py):")
    print("-" * 80)
    suite = unittest.TestLoader().loadTestsFromTestCase(TestFrontendIntegration)
    runner = unittest.TextTestRunner(verbosity=2)
    test_result = runner.run(suite)

    print("\n" + "=" * 80)
    if test_result.wasSuccessful():
        print(">>> ALL FRONTEND INTEGRATION VERIFICATIONS PASSED CLEANLY! <<<")
        print(">>> Open http://localhost:8000/ or http://localhost:8000/dashboard in any browser <<<")
    else:
        print(">>> SOME TESTS FAILED — CHECK TRACEBACK ABOVE <<<")
    print("=" * 80)


if __name__ == "__main__":
    verify_frontend()
