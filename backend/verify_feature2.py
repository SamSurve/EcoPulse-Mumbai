"""
EcoPulse Mumbai — Feature 2: Greenery & Heat Analysis Verification Script.
Validates Sentinel-2 NDVI (10m) and Landsat-8/9 TIRS thermal surface baselines,
cross-area comparative calculations, GIS map features, and unit tests.
"""
import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.data.locations import get_all_locations, get_location_by_id
from app.adapters.satellite_adapter import satellite_adapter, SATELLITE_BASELINES
from app.services.environment_service import environment_service
from tests.test_feature2 import TestFeature2GreeneryHeat


def verify_feature2_analysis():
    print("=" * 80)
    print("ECOPULSE MUMBAI — FEATURE 2: GREENERY & HEAT ANALYSIS VERIFICATION")
    print("=" * 80)

    locations = get_all_locations()
    print(f"\n1. AUDITING SATELLITE BASELINE REGISTRY ({len(locations)} Locations)")
    print(f"{'Location':<12} | {'Ward':<6} | {'NDVI':<6} | {'Greenery Class':<18} | {'Heat Idx':<8} | {'Heat Class':<10} | {'Canopy%':<7} | {'Built-up%'}")
    print("-" * 88)

    for loc in locations:
        greenery = satellite_adapter.get_greenery(loc)
        heat = satellite_adapter.get_heat(loc)
        print(f"{loc.name:<12} | {loc.ward:<6} | {greenery.ndvi_mean:<6.2f} | {greenery.greenery_classification:<18} | "
              f"{heat.surface_heat_index:<8.1f} | {heat.heat_classification:<10} | {greenery.tree_canopy_pct:<7.1f} | {greenery.built_up_ratio_pct:.1f}%")

    print("\n" + "=" * 80)
    print("2. TESTING CROSS-AREA COMPARISON: BORIVALI (SGNP Fringe) vs ANDHERI (Commercial Transit Hub)")
    print("=" * 80)

    loc_borivali = get_location_by_id("borivali")
    loc_andheri = get_location_by_id("andheri")

    # Fetch with unified environment data if available
    env_b = environment_service.get_unified_environment("borivali")
    env_a = environment_service.get_unified_environment("andheri")

    comparison = satellite_adapter.compare_locations(
        loc_a=loc_borivali,
        loc_b=loc_andheri,
        air_a=env_b.air if env_b else None,
        air_b=env_a.air if env_a else None,
        weather_a=env_b.weather if env_b else None,
        weather_b=env_a.weather if env_a else None
    )

    print(f"Location A: {comparison.location_a.location_name} (Zone: {comparison.location_a.zone}, Ward: {comparison.location_a.ward})")
    print(f"  • NDVI: {comparison.location_a.ndvi_mean} ({comparison.location_a.greenery_classification})")
    print(f"  • Tree Canopy: {comparison.location_a.tree_canopy_pct}% | Built-Up Surface: {comparison.location_a.built_up_ratio_pct}%")
    print(f"  • Surface Heat Index: {comparison.location_a.surface_heat_index}/10 ({comparison.location_a.heat_classification})")
    print(f"  • Ambient Temp: {comparison.location_a.temperature_c}°C | AQI: {comparison.location_a.aqi}")

    print(f"\nLocation B: {comparison.location_b.location_name} (Zone: {comparison.location_b.zone}, Ward: {comparison.location_b.ward})")
    print(f"  • NDVI: {comparison.location_b.ndvi_mean} ({comparison.location_b.greenery_classification})")
    print(f"  • Tree Canopy: {comparison.location_b.tree_canopy_pct}% | Built-Up Surface: {comparison.location_b.built_up_ratio_pct}%")
    print(f"  • Surface Heat Index: {comparison.location_b.surface_heat_index}/10 ({comparison.location_b.heat_classification})")
    print(f"  • Ambient Temp: {comparison.location_b.temperature_c}°C | AQI: {comparison.location_b.aqi}")

    print(f"\nCalculated Differentials (Borivali vs Andheri):")
    for k, v in comparison.differentials.items():
        print(f"  • {k}: {v}")

    print(f"\nScientifically Defensible Interpretation:")
    print(f"  \"{comparison.interpretation}\"")

    print("\n" + "=" * 80)
    print("3. TESTING GIS MAP OVERLAY DATA (14 Locations)")
    print("=" * 80)
    map_data = satellite_adapter.get_all_map_features(locations)
    print(f"Map feature count: {map_data.total_locations}")
    print(f"Satellite Source: {map_data.satellite_source}")
    print(f"Provenance: {map_data.provenance.value}")

    print("\n" + "=" * 80)
    print("4. EXECUTING AUTOMATED UNIT TESTS (test_feature2.py)")
    print("=" * 80)
    suite = unittest.TestLoader().loadTestsFromTestCase(TestFeature2GreeneryHeat)
    runner = unittest.TextTestRunner(verbosity=2)
    test_result = runner.run(suite)

    print("\n" + "=" * 80)
    if test_result.wasSuccessful():
        print(">>> ALL FEATURE 2 VERIFICATIONS AND UNIT TESTS PASSED SUCCESSFULLY! <<<")
    else:
        print(">>> SOME TESTS FAILED — INSPECT OUTPUT ABOVE <<<")
    print("=" * 80)


if __name__ == "__main__":
    verify_feature2_analysis()
