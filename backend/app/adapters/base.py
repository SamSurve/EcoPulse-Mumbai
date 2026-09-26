from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from app.models.schemas import (
    Location,
    AirData,
    WeatherData,
    GreeneryData,
    HeatData,
    ForecastData,
    RiskData,
    AreaComparisonResponse,
    MumbaiMapDataResponse
)


class AirQualityProvider(ABC):
    """Abstract interface for air quality data providers (physical sensors or assimilated models)."""

    @abstractmethod
    def fetch_air_quality(self, location: Location) -> Optional[AirData]:
        """Fetch ground-truth observation or numerical model air quality data."""
        pass


class WeatherProvider(ABC):
    """Abstract interface for surface meteorological providers."""

    @abstractmethod
    def fetch_weather(self, location: Location) -> Optional[WeatherData]:
        """Fetch real-time surface microclimate parameters."""
        pass


class ForecastProvider(ABC):
    """Abstract interface for 72-hour environmental forecast providers."""

    @abstractmethod
    def fetch_72h_forecast(self, location: Location) -> Optional[ForecastData]:
        """Fetch hourly and daily 72-hour numerical atmospheric forecast."""
        pass


class SatelliteSurfaceProvider(ABC):
    """Abstract interface for satellite-derived surface vegetation and thermal indicators."""

    @abstractmethod
    def get_greenery(self, location: Location) -> GreeneryData:
        """Fetch Sentinel-2 multispectral vegetation baseline data."""
        pass

    @abstractmethod
    def get_heat(self, location: Location) -> HeatData:
        """Fetch Landsat-8/9 thermal infrared surface heat baseline data."""
        pass


class BaseEnvironmentalProvider(AirQualityProvider, WeatherProvider, ForecastProvider, ABC):
    """
    Unified abstract provider contract for composite environmental telemetry providers.
    Allows swappable, modular environmental data backends.
    """
    pass
