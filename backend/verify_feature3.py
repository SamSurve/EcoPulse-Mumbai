"""
EcoPulse Mumbai — Feature 3: Environmental Risk & Prediction Verification Script.
Validates the deterministic EcoPulse Environmental Risk Score (0-100),
rule-based explainable reasoning, anomaly Z-score detection against Mumbai seasonal baselines,
72-hour forecast parsing with FORECAST provenance, and active environmental alerts.
"""
import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.data.locations import get_location_by_id
from app.services.environment_service import environment_service
from app.adapters.openmeteo_adapter import openmeteo_adapter
from tests.test_feature3 import TestFeature3RiskAndPrediction


def verify_feature3_pipeline():
    print("=" * 85)
    print("ECOPULSE MUMBAI — FEATURE 3: ENVIRONMENTAL RISK & PREDICTION VERIFICATION")
    print("=" * 85)

    test_locations = ["borivali", "andheri", "dadar", "kurla"]

    print("\n1. EVALUATING RISK ENGINE, ANOMALY DETECTION & ALERTS")
    print("-" * 85)

    for loc_id in test_locations:
        loc = get_location_by_id(loc_id)
        env = environment_service.get_unified_environment(loc_id, force_refresh=True)
        risk = env.risk

        print(f"\n[Location: {loc.name}] (Zone: {loc.zone} | Ward: {loc.ward})")
        print(f"  • {risk.score_label}: {risk.risk_score}/100 [{risk.risk_level}]")
        print(f"  • Primary Stressor: {risk.primary_stressor}")
        print(f"  • Contributing Factors: {risk.contributing_factors}")
        print(f"  • Explainable Reasoning: \"{risk.explanation}\"")
        
        # Anomalies
        print(f"  • Anomaly Detection ({len(risk.anomalies)} metrics evaluated against Mumbai baseline):")
        for anom in risk.anomalies:
            print(f"    - {anom.metric}: Observed={anom.observed_value} vs Base={anom.baseline_value} (Dev={anom.deviation:+.1f}, Z={anom.z_score:+0.2f}) -> [{anom.status}]")

        # Alerts
        print(f"  • Rule-Based Environmental Alerts ({len(risk.alerts)} active):")
        if risk.alerts:
            for alert in risk.alerts:
                print(f"    - [{alert.severity}] {alert.alert_type}: {alert.title} -> {alert.reason}")
        else:
            print("    - No critical thresholds exceeded. Environmental indicators within nominal bounds.")

    print("\n" + "=" * 85)
    print("2. EVALUATING 72-HOUR ENVIRONMENTAL FORECAST (Borivali & Andheri)")
    print("=" * 85)

    for loc_id in ["borivali", "andheri"]:
        loc = get_location_by_id(loc_id)
        forecast = openmeteo_adapter.fetch_72h_forecast(loc)

        print(f"\n[72-Hour Forecast for {loc.name}] (Total Hourly Points: {len(forecast.hourly)})")
        print(f"  • Source: {forecast.source} | Provenance: {forecast.provenance.value}")
        print(f"  • Trend Summary: \"{forecast.trend_summary}\"")
        print(f"  • Daily Overview:")
        for day in forecast.daily:
            print(f"    - Date {day.date}: Temp {day.temp_min_c:.1f}°C to {day.temp_max_c:.1f}°C | Rain: {day.precipitation_sum_mm:.1f} mm | Wind Max: {day.max_wind_speed_kmh:.1f} km/h | PM2.5 Avg: {day.avg_pm25} µg/m³ ({day.predicted_aqi_category}) [{day.dominant_condition}]")

    print("\n" + "=" * 85)
    print("3. VERIFYING UNIFIED ENVIRONMENT ENDPOINT INTEGRATION")
    print("=" * 85)
    unified = environment_service.get_unified_environment("borivali")
    print("Unified Response Component Check:")
    print(f"  • Location Object Present: {unified.location is not None} ({unified.location.name})")
    print(f"  • Air Object Present:      {unified.air is not None} (AQI: {unified.air.aqi})")
    print(f"  • Weather Object Present:  {unified.weather is not None} (Temp: {unified.weather.temperature_c}°C)")
    print(f"  • Greenery Object Present: {unified.greenery is not None} (NDVI: {unified.greenery.ndvi_mean})")
    print(f"  • Heat Object Present:     {unified.heat is not None} (Heat Index: {unified.heat.surface_heat_index})")
    print(f"  • Risk Object Present:     {unified.risk is not None} (Score: {unified.risk.risk_score} - {unified.risk.risk_level})")
    print(f"  • Forecast Object Present: {unified.forecast is not None} ({len(unified.forecast.hourly)} hours)")
    print(f"  • Freshness:               {unified.metadata.data_freshness}")

    print("\n" + "=" * 85)
    print("4. EXECUTING AUTOMATED UNIT TESTS (test_feature3.py)")
    print("=" * 85)
    suite = unittest.TestLoader().loadTestsFromTestCase(TestFeature3RiskAndPrediction)
    runner = unittest.TextTestRunner(verbosity=2)
    test_result = runner.run(suite)

    print("\n" + "=" * 85)
    if test_result.wasSuccessful():
        print(">>> ALL FEATURE 3 VERIFICATIONS AND TESTS PASSED SUCCESSFULLY! <<<")
    else:
        print(">>> SOME TESTS FAILED — INSPECT OUTPUT ABOVE <<<")
    print("=" * 85)


if __name__ == "__main__":
    verify_feature3_pipeline()
