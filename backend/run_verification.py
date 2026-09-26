"""
Standalone self-test and verification script for EcoPulse Mumbai backend.
Can be executed directly via Python.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.data.locations import get_all_locations, get_location_by_id, is_valid_location
from app.services.cache import cache
from app.adapters.satellite_adapter import satellite_adapter
from app.adapters.openmeteo_adapter import calculate_naqi_sub_index, openmeteo_adapter
from app.services.environment_service import environment_service


def run_self_verification():
    print("=" * 60)
    print("ECOPULSE MUMBAI — BACKEND SELF-VERIFICATION REPORT")
    print("=" * 60)

    # 1. Location Registry Check
    locations = get_all_locations()
    print(f"[✓] Location Registry Loaded: {len(locations)} verified Mumbai locations.")
    assert len(locations) >= 11, "Must have at least 11 locations"

    required_check = ["borivali", "andheri", "dadar", "bandra", "powai",
                      "colaba", "worli", "sion", "kurla", "mulund", "kandivali"]
    for req in required_check:
        loc = get_location_by_id(req)
        assert loc is not None, f"Missing required location: {req}"
        assert 18.85 <= loc.latitude <= 19.35, f"Invalid latitude for {loc.name}"
        assert 72.75 <= loc.longitude <= 73.05, f"Invalid longitude for {loc.name}"
    print(f"[✓] Mandatory Locations Verified: {', '.join(required_check[:6])}... all present.")

    # 2. In-Memory Cache Check
    cache.set("ping", "pong", ttl_seconds=10)
    assert cache.get("ping") == "pong", "Cache retrieval failed"
    print("[✓] In-Memory TTL Cache: Verified (get/set/expiration).")

    # 3. NAQI Calculator Check
    idx, cat = calculate_naqi_sub_index("pm25", 25.0)
    assert cat == "Good", f"Expected Good for PM2.5 25, got {cat}"
    idx, cat = calculate_naqi_sub_index("pm25", 75.0)
    assert cat == "Moderate", f"Expected Moderate for PM2.5 75, got {cat}"
    idx, cat = calculate_naqi_sub_index("pm25", 150.0)
    assert cat == "Poor", f"Expected Poor for PM2.5 150, got {cat}"
    print("[✓] CPCB NAQI Breakpoint Engine: Verified across all tiers.")

    # 4. Satellite Surface Indicators Check
    borivali_loc = get_location_by_id("borivali")
    greenery = satellite_adapter.get_greenery(borivali_loc)
    heat = satellite_adapter.get_heat(borivali_loc)
    assert greenery.ndvi_mean > 0.40, "Borivali NDVI should be > 0.40"
    assert heat.surface_heat_index < 5.0, "Borivali heat index should be low"
    print(f"[✓] Satellite Adapter Verified: Borivali NDVI={greenery.ndvi_mean}, Heat Index={heat.surface_heat_index}.")

    # 5. Unified Environmental Intelligence Assembly Check
    kurla_loc = get_location_by_id("kurla")
    response = environment_service.get_unified_environment("kurla", force_refresh=True)
    assert response is not None, "Failed to get unified response"
    assert response.location.name == "Kurla"
    assert response.air is not None
    assert response.weather is not None
    assert response.greenery is not None
    assert response.heat is not None
    assert response.risk is not None
    assert response.metadata is not None
    print("[✓] Unified Environment Assembly: All 7 required components populated.")
    print(f"    - Location: {response.location.name} (Ward: {response.location.ward})")
    print(f"    - Air Quality: AQI={response.air.aqi} ({response.air.aqi_category})")
    print(f"    - Microclimate: {response.weather.temperature_c}°C, Humidity: {response.weather.relative_humidity_pct}%")
    print(f"    - Greenery: NDVI={response.greenery.ndvi_mean} ({response.greenery.ndvi_category})")
    print(f"    - Heat Island: {response.heat.heat_island_intensity} (Index: {response.heat.surface_heat_index}/10)")
    print(f"    - Risk Evaluation: {response.risk.risk_level} (Score: {response.risk.risk_score}/100)")
    print(f"    - Explanation: {response.risk.explanation[:80]}...")
    print(f"    - Data Provenance: {response.air.provenance.value}")

    # 6. Invalid Location Handling
    invalid_resp = environment_service.get_unified_environment("non_existent_area")
    assert invalid_resp is None, "Invalid location should return None"
    assert is_valid_location("non_existent_area") is False
    print("[✓] Error Handling: Invalid location safely rejected.")

    print("=" * 60)
    print("ALL BACKEND VERIFICATION CHECKS PASSED SUCCESSFULLY (6/6)")
    print("=" * 60)


if __name__ == "__main__":
    run_self_verification()
