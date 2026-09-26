"""
Complete Test Suite Runner for EcoPulse Mumbai Backend.
Runs all unit and integration test suites:
- test_backend.py (Phase 1 Foundation)
- test_feature1.py (Phase 2 Air & Microclimate)
- test_feature2.py (Phase 3 Greenery & Heat)
- test_feature3.py (Phase 4 Risk & Prediction)
"""
import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from tests.test_backend import TestEcoPulseBackend
from tests.test_feature1 import TestFeature1AirMicroclimate
from tests.test_feature2 import TestFeature2GreeneryHeat
from tests.test_feature3 import TestFeature3RiskAndPrediction
from tests.test_frontend_integration import TestFrontendIntegration
from tests.test_reliability_and_resilience import TestReliabilityAndResilience
from tests.test_api_security_dataflow import TestApiSecurityAndDataFlow
from tests.test_reliability_and_failure_engineering import TestReliabilityAndFailureEngineering


def run_full_suite():
    print("=" * 80)
    print("ECOPULSE MUMBAI — RUNNING COMPLETE TEST SUITE (BACKEND + FRONTEND)")
    print("=" * 80)

    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    suite.addTests(loader.loadTestsFromTestCase(TestEcoPulseBackend))
    suite.addTests(loader.loadTestsFromTestCase(TestFeature1AirMicroclimate))
    suite.addTests(loader.loadTestsFromTestCase(TestFeature2GreeneryHeat))
    suite.addTests(loader.loadTestsFromTestCase(TestFeature3RiskAndPrediction))
    suite.addTests(loader.loadTestsFromTestCase(TestFrontendIntegration))
    suite.addTests(loader.loadTestsFromTestCase(TestReliabilityAndResilience))
    suite.addTests(loader.loadTestsFromTestCase(TestApiSecurityAndDataFlow))
    suite.addTests(loader.loadTestsFromTestCase(TestReliabilityAndFailureEngineering))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    print("\n" + "=" * 80)
    print(f"Total Tests Run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    if result.wasSuccessful():
        print(">>> ALL BACKEND TEST SUITES PASSED CLEANLY (100%) <<<")
    else:
        print(">>> SOME TESTS FAILED — CHECK TRACEBACK ABOVE <<<")
    print("=" * 80)
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_full_suite()
    sys.exit(0 if success else 1)
