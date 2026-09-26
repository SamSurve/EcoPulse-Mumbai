import sys
import os
import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime
import json

# Add app parent directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.data.locations import get_location_by_id
from app.models.schemas import (
    Location,
    AirData,
    WeatherData,
    GreeneryData,
    HeatData,
    PollutantDetail,
    DataProvenance
)
from app.services.environment_service import (
    evaluate_environmental_risk,
    environment_service,
    MUMBAI_BASELINES
)
from app.adapters.openmeteo_adapter import openmeteo_adapter

client = TestClient(app)


class TestFeature3RiskAndPrediction(unittest.TestCase):
    """
    Comprehensive test suite for Feature 3 — Environmental Risk & Prediction.
    Tests deterministic risk scoring, explainable reasoning, anomaly Z-scores,
    72-hour forecast parsing, rule-based alerts, REST endpoints, and regression.
    """

    def setUp(self):
        self.borivali = get_location_by_id("borivali")
        self.andheri = get_location_by_id("andheri")
        self.kurla = get_location_by_id("kurla")

        # Mock standard moderate conditions
        self.mock_air = AirData(
            aqi=135,
            aqi_category="Moderate",
            dominant_pollutant="PM2.5",
            pollutants_monitored_count=4,
            pm25=PollutantDetail(
                pollutant="pm25",
                display_name="PM2.5",
                value=48.5,
                unit="µg/m³",
                naqi_sub_index=135,
                category="Moderate",
                provenance=DataProvenance.MODELLED_ANALYSIS
            ),
            provenance=DataProvenance.MODELLED_ANALYSIS
        )

        self.mock_weather = WeatherData(
            temperature_c=32.0,
            apparent_temperature_c=37.5,
            relative_humidity_pct=75.0,
            wind_speed_kmh=14.0,
            wind_direction_deg=240.0,
            provenance=DataProvenance.DIRECT_OBSERVATION
        )

        self.mock_heat = HeatData(
            surface_heat_index=7.2,
            heat_classification="HIGH",
            provenance=DataProvenance.SATELLITE_BASELINE
        )

        self.mock_greenery = GreeneryData(
            ndvi_mean=0.25,
            greenery_classification="LOW VEGETATION",
            provenance=DataProvenance.SATELLITE_BASELINE
        )

    # 1. Deterministic Risk Score Calculation & Range
    def test_risk_score_calculation_bounds_and_type(self):
        risk = evaluate_environmental_risk(
            self.andheri,
            self.mock_air,
            self.mock_weather,
            self.mock_heat,
            self.mock_greenery
        )
        self.assertIsInstance(risk.risk_score, int)
        self.assertTrue(0 <= risk.risk_score <= 100)
        self.assertIn(risk.risk_level, ["LOW", "MODERATE", "HIGH", "SEVERE"])
        self.assertEqual(risk.score_label, "EcoPulse Environmental Risk Score")
        self.assertIn("Application-level", risk.disclaimer)

    # 2. Risk Levels: Low vs Severe Conditions
    def test_risk_level_classifications(self):
        # Clean / Low Stress environment
        clean_air = AirData(aqi=35, aqi_category="Good", pm25=PollutantDetail(pollutant="pm25", display_name="PM2.5", value=12.0))
        mild_weather = WeatherData(temperature_c=25.0, apparent_temperature_c=26.0, wind_speed_kmh=18.0)
        cool_heat = HeatData(surface_heat_index=3.0)
        lush_green = GreeneryData(ndvi_mean=0.60)

        low_risk = evaluate_environmental_risk(self.borivali, clean_air, mild_weather, cool_heat, lush_green)
        self.assertIn(low_risk.risk_level, ["LOW", "MODERATE"])
        self.assertTrue(low_risk.risk_score < 50)

        # High Stress environment
        toxic_air = AirData(aqi=260, aqi_category="Poor", pm25=PollutantDetail(pollutant="pm25", display_name="PM2.5", value=115.0))
        scorching_weather = WeatherData(temperature_c=37.0, apparent_temperature_c=42.0, wind_speed_kmh=4.0)
        hot_heat = HeatData(surface_heat_index=8.8)
        sparse_green = GreeneryData(ndvi_mean=0.14)

        severe_risk = evaluate_environmental_risk(self.kurla, toxic_air, scorching_weather, hot_heat, sparse_green)
        self.assertIn(severe_risk.risk_level, ["HIGH", "SEVERE"])
        self.assertTrue(severe_risk.risk_score >= 66)

    # 3. Contributing Factors Breakdown
    def test_contributing_factors_presence(self):
        risk = evaluate_environmental_risk(self.andheri, self.mock_air, self.mock_weather, self.mock_heat, self.mock_greenery)
        factors = risk.contributing_factors
        self.assertIn("air_quality_stress_score", factors)
        self.assertIn("thermal_stress_score", factors)
        self.assertIn("surface_heat_stress_score", factors)
        self.assertIn("dispersion_stress_score", factors)
        self.assertIn("ventilation_status", factors)
        self.assertIn("vegetative_buffer_status", factors)
        self.assertIn("weights", factors)
        self.assertIn("active_weights", factors)

    # 4. Explainable Risk Reasoning (No LLM, dynamic, non-medical)
    def test_explainable_reasoning_narrative(self):
        risk = evaluate_environmental_risk(self.andheri, self.mock_air, self.mock_weather, self.mock_heat, self.mock_greenery)
        exp = risk.explanation
        self.assertIn("EcoPulse Environmental Risk in Andheri is assessed as", exp)
        self.assertIn("Score:", exp)
        # Check non-medical phrasing
        self.assertNotIn("People will get sick", exp)
        self.assertNotIn("medical diagnosis", exp.lower())

    # 5. Handling Missing Data Gracefully (Zero-Fabrication & Scientific Honesty)
    def test_missing_data_resilience(self):
        # When both air and weather are None, EcoPulse returns honest UNAVAILABLE rather than fabricating defaults
        risk_empty = evaluate_environmental_risk(self.borivali, None, None, None, None)
        self.assertIsNotNone(risk_empty)
        self.assertIsNone(risk_empty.risk_score)
        self.assertEqual(risk_empty.risk_level, "UNAVAILABLE")
        self.assertEqual(risk_empty.provenance, DataProvenance.UNAVAILABLE)

        # When partial telemetry is available (e.g. only air), weights are dynamically renormalized
        risk_partial_air = evaluate_environmental_risk(self.borivali, self.mock_air, None, self.mock_heat, self.mock_greenery)
        self.assertIsNotNone(risk_partial_air.risk_score)
        self.assertTrue(0 <= risk_partial_air.risk_score <= 100)
        self.assertIn(risk_partial_air.risk_level, ["LOW", "MODERATE", "HIGH", "SEVERE"])
        # Verify active weights only include available domains
        active_w = risk_partial_air.contributing_factors.get("active_weights", {})
        self.assertIn("air_quality", active_w)
        self.assertNotIn("dispersion", active_w)

    # 5b. Cache Immutability (Deep copy prevents in-place mutation bug)
    def test_cache_immutability(self):
        # Fetch environment response
        resp1 = environment_service.get_unified_environment("borivali", force_refresh=True)
        # Mutate the returned object
        resp1.metadata.cached = True
        resp1.location.name = "MUTATED_TEST_NAME"

        # Subsequent fetch from cache must NOT have been mutated
        resp2 = environment_service.get_unified_environment("borivali", force_refresh=False)
        self.assertNotEqual(resp2.location.name, "MUTATED_TEST_NAME")
        self.assertEqual(resp2.location.name, "Borivali")

    # 6. Anomaly Detection with Z-Score & Baseline Comparison
    def test_anomaly_detection_z_scores(self):
        # Extremely high PM2.5 (100 ug/m3 vs 38 baseline, std 12 -> Z = (100-38)/12 = +5.17)
        extreme_air = AirData(
            aqi=240,
            pm25=PollutantDetail(pollutant="pm25", display_name="PM2.5", value=100.0)
        )
        risk = evaluate_environmental_risk(self.kurla, extreme_air, self.mock_weather, self.mock_heat, self.mock_greenery)
        pm_anomalies = [a for a in risk.anomalies if "PM2.5" in a.metric]
        self.assertTrue(len(pm_anomalies) > 0)
        anom = pm_anomalies[0]
        self.assertEqual(anom.status, "ANOMALOUS")
        self.assertTrue(anom.z_score >= 2.5)
        self.assertEqual(anom.provenance, DataProvenance.BASELINE_COMPARISON)

    # 7. Rule-Based Alert Triggering
    def test_rule_based_alerts(self):
        # High PM2.5 and High Apparent Temperature
        alert_air = AirData(
            aqi=220,
            pm25=PollutantDetail(pollutant="pm25", display_name="PM2.5", value=75.0)
        )
        alert_weather = WeatherData(
            temperature_c=36.0,
            apparent_temperature_c=41.0,
            wind_speed_kmh=4.0
        )
        risk = evaluate_environmental_risk(self.andheri, alert_air, alert_weather, self.mock_heat, self.mock_greenery)
        alert_types = [a.alert_type for a in risk.alerts]

        self.assertIn("HIGH_PM25", alert_types)
        self.assertIn("HIGH_AQI", alert_types)
        self.assertIn("EXTREME_HEAT", alert_types)
        self.assertIn("POOR_AIR_DISPERSION", alert_types)

        # Inspect alert structure
        for alert in risk.alerts:
            self.assertIn(alert.severity, ["INFO", "WARNING", "CRITICAL"])
            self.assertIsNotNone(alert.title)
            self.assertIsNotNone(alert.message)
            self.assertIsNotNone(alert.affected_metric)
            self.assertIsNotNone(alert.reason)

    # 8. 72-Hour Forecast Structure & Provenance
    def test_72h_forecast_generation(self):
        forecast = openmeteo_adapter.fetch_72h_forecast(self.borivali)
        self.assertIsNotNone(forecast)
        self.assertEqual(forecast.location_id, "borivali")
        self.assertEqual(forecast.provenance, DataProvenance.FORECAST)
        self.assertTrue(len(forecast.hourly) >= 24)
        self.assertTrue(len(forecast.daily) >= 3)
        self.assertIsNotNone(forecast.trend_summary)

        # Ensure all hourly points have FORECAST provenance
        for pt in forecast.hourly[:5]:
            self.assertEqual(pt.provenance, DataProvenance.FORECAST)
            self.assertIsNotNone(pt.time)

    # 9. API Endpoint: GET /api/risk/{location_id}
    def test_api_get_risk_valid(self):
        response = client.get("/api/risk/borivali")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["location_id"], "borivali")
        self.assertIn("risk_score", data)
        self.assertIn("risk_level", data)
        self.assertIn("contributing_factors", data)
        self.assertIn("explanation", data)
        self.assertIn("anomalies", data)
        self.assertIn("alerts", data)

    def test_api_get_risk_invalid_404(self):
        response = client.get("/api/risk/invalid_mumbai_place")
        self.assertEqual(response.status_code, 404)

    # 10. API Endpoint: GET /api/forecast/{location_id}
    def test_api_get_forecast_valid(self):
        response = client.get("/api/forecast/andheri")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["location_id"], "andheri")
        self.assertEqual(data["provenance"], "FORECAST")
        self.assertTrue(len(data["hourly"]) >= 24)
        self.assertTrue(len(data["daily"]) >= 3)
        self.assertIn("trend_summary", data)

    def test_api_get_forecast_invalid_404(self):
        response = client.get("/api/forecast/outer_space")
        self.assertEqual(response.status_code, 404)

    # 11. API Endpoint: GET /api/risk/{location_id}/summary
    def test_api_get_risk_summary(self):
        response = client.get("/api/risk/dadar/summary")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["location_id"], "dadar")
        self.assertIn("risk_score", data)
        self.assertIn("active_alerts_count", data)
        self.assertIn("forecast_trend_summary", data)

    # 12. Unified Endpoint contains all 7 Feature Blocks
    def test_unified_endpoint_includes_risk_and_forecast(self):
        response = client.get("/api/environment/borivali")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("location", data)
        self.assertIn("air", data)
        self.assertIn("weather", data)
        self.assertIn("greenery", data)
        self.assertIn("heat", data)
        self.assertIn("risk", data)
        self.assertIn("forecast", data)
        self.assertIn("metadata", data)
        self.assertEqual(data["risk"]["score_label"], "EcoPulse Environmental Risk Score")

    # 13. Regression Check: Feature 1 & 2 Endpoints
    def test_regression_features_1_and_2(self):
        # Feature 1: Air quality & microclimate
        air_resp = client.get("/api/air-quality/borivali")
        self.assertEqual(air_resp.status_code, 200)
        micro_resp = client.get("/api/microclimate/borivali")
        self.assertEqual(micro_resp.status_code, 200)

        # Feature 2: Greenery, Heat, Comparison, Map
        green_resp = client.get("/api/greenery/borivali")
        self.assertEqual(green_resp.status_code, 200)
        heat_resp = client.get("/api/heat/borivali")
        self.assertEqual(heat_resp.status_code, 200)
        comp_resp = client.get("/api/environment/compare?location_a=borivali&location_b=andheri")
        self.assertEqual(comp_resp.status_code, 200)
        map_resp = client.get("/api/greenery-heat/map")
        self.assertEqual(map_resp.status_code, 200)


if __name__ == "__main__":
    unittest.main()
