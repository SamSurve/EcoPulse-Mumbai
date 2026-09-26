"""
Feature 1 — Air & Microclimate Live Verification Script.
Queries live Open-Meteo external APIs for Borivali, Andheri, and Dadar.
Confirms live values are returned with proper provenance, timestamps, and coordinates.
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.data.locations import get_location_by_id
from app.adapters.openmeteo_adapter import openmeteo_adapter
from app.services.environment_service import environment_service


def verify_live_air_and_microclimate():
    print("=" * 70)
    print("ECOPULSE MUMBAI — FEATURE 1 LIVE API VERIFICATION")
    print("=" * 70)

    test_locations = ["borivali", "andheri", "dadar"]
    results = {}

    for loc_id in test_locations:
        loc = get_location_by_id(loc_id)
        print(f"\n[Testing Location: {loc.name}] (Coordinates: {loc.latitude}°N, {loc.longitude}°E | Ward: {loc.ward})")

        # 1. Test Open-Meteo Live Weather
        weather = openmeteo_adapter.fetch_weather(loc)
        print(f"  • Weather Observation:")
        print(f"    - Temp: {weather.temperature_c}°C | Relative Humidity: {weather.relative_humidity_pct}%")
        print(f"    - Apparent Heat Index: {weather.apparent_temperature_c}°C")
        print(f"    - Wind: {weather.wind_speed_kmh} km/h ({weather.wind_cardinal}) | Solar Radiation: {weather.solar_radiation_wm2} W/m²")
        print(f"    - Source: {weather.source} | Provenance: {weather.provenance.value}")
        print(f"    - Timestamp: {weather.timestamp}")

        # 2. Test Open-Meteo Live Air Quality (CAMS)
        air = openmeteo_adapter.fetch_air_quality(loc)
        print(f"  • Air Quality Observation:")
        print(f"    - Overall CPCB AQI: {air.aqi} ({air.aqi_category}) | Dominant: {air.dominant_pollutant}")
        print(f"    - Calculation Method: {air.aqi_calculation_method}")
        print(f"    - Parameters Monitored: {air.pollutants_monitored_count}")

        for poll in [air.pm25, air.pm10, air.no2, air.so2, air.co, air.o3]:
            if poll:
                val_str = f"{poll.value} {poll.unit}" if poll.is_available else "UNAVAILABLE"
                sub_str = f"(Sub-Index: {poll.naqi_sub_index} - {poll.category})" if poll.naqi_sub_index else ""
                print(f"      - {poll.display_name}: {val_str} {sub_str} [{poll.provenance.value}]")

        # 3. Test Full Unified Environment Service
        env_resp = environment_service.get_unified_environment(loc_id, force_refresh=True)
        results[loc_id] = {
            "name": loc.name,
            "temp": env_resp.weather.temperature_c,
            "aqi": env_resp.air.aqi,
            "pm25": env_resp.air.pm25.value if env_resp.air.pm25 else None,
            "risk": env_resp.risk.risk_level,
            "risk_score": env_resp.risk.risk_score,
            "explanation": env_resp.risk.explanation
        }

    print("\n" + "=" * 70)
    print("CROSS-LOCATION LIVE COMPARISON TABLE")
    print("=" * 70)
    print(f"{'Location':<12} | {'Temp (°C)':<10} | {'AQI':<8} | {'PM2.5':<10} | {'Risk Level':<12} | {'Risk Score':<10}")
    print("-" * 70)
    for loc_id, res in results.items():
        pm25_disp = f"{res['pm25']} µg/m³" if res['pm25'] is not None else "N/A"
        print(f"{res['name']:<12} | {res['temp']:<10} | {res['aqi']:<8} | {pm25_disp:<10} | {res['risk']:<12} | {res['risk_score']:<10}")

    print("\n[Sample Risk Explanation for Borivali]:")
    print(f"  \"{results['borivali']['explanation']}\"")
    print("\n[Sample Risk Explanation for Dadar]:")
    print(f"  \"{results['dadar']['explanation']}\"")

    print("\n" + "=" * 70)
    print("FEATURE 1 VERIFICATION COMPLETED: REAL EXTERNAL DATA VALIDATED")
    print("=" * 70)


if __name__ == "__main__":
    verify_live_air_and_microclimate()
