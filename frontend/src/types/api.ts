export enum DataProvenance {
  DIRECT_OBSERVATION = "DIRECT_OBSERVATION",
  MODELLED_ANALYSIS = "MODELLED_ANALYSIS",
  FORECAST = "FORECAST",
  ESTIMATED_INTERPOLATION = "ESTIMATED_INTERPOLATION",
  SATELLITE_BASELINE = "SATELLITE_BASELINE",
  BASELINE_COMPARISON = "BASELINE_COMPARISON",
  INSUFFICIENT_HISTORY = "INSUFFICIENT_HISTORY",
  UNAVAILABLE = "UNAVAILABLE",
  DATA_GAP = "DATA_GAP",
}

export interface Location {
  id: string;
  name: string;
  latitude: float;
  longitude: float;
  zone: string;
  ward: string;
  nearest_station: string;
}

export type float = number;

export interface PollutantDetail {
  pollutant: string;
  display_name: string;
  value: number | null;
  unit: string;
  naqi_sub_index: number | null;
  category: string | null;
  provenance: DataProvenance;
  source: string;
  observation_time: string | null;
  retrieval_time: string | null;
  is_available: boolean;
  status_note?: string | null;
}

export interface AirData {
  aqi: number | null;
  aqi_category: string | null;
  aqi_calculation_method: string;
  dominant_pollutant: string | null;
  pollutants_monitored_count: number;
  pm25?: PollutantDetail | null;
  pm10?: PollutantDetail | null;
  no2?: PollutantDetail | null;
  so2?: PollutantDetail | null;
  co?: PollutantDetail | null;
  o3?: PollutantDetail | null;
  station_name?: string | null;
  station_distance_km?: number | null;
  source: string;
  timestamp: string | null;
  retrieval_timestamp: string | null;
  provenance: DataProvenance;
  data_freshness: string;
}

export interface WeatherData {
  temperature_c: number | null;
  relative_humidity_pct: number | null;
  apparent_temperature_c: number | null;
  surface_pressure_hpa: number | null;
  wind_speed_kmh: number | null;
  wind_direction_deg: number | null;
  wind_cardinal: string | null;
  precipitation_mm: number | null;
  solar_radiation_wm2: number | null;
  cloud_cover_pct: number | null;
  source: string;
  timestamp: string | null;
  retrieval_timestamp: string | null;
  provenance: DataProvenance;
  data_freshness: string;
}

export interface GreeneryData {
  location_id: string;
  location_name: string;
  ndvi_mean: number | null;
  greenery_classification: string;
  ndvi_category?: string;
  tree_canopy_pct: number;
  built_up_ratio_pct: number;
  vegetation_change_5yr_pct: number;
  interpretation?: string | null;
  source: string;
  satellite_source: string;
  baseline_date: string;
  provenance: DataProvenance;
  timestamp: string;
}

export interface HeatData {
  location_id: string;
  location_name: string;
  surface_heat_index: number;
  heat_classification: string;
  heat_island_intensity?: string;
  built_up_ratio_pct: number;
  thermal_comfort_category?: string | null;
  apparent_temperature_c?: number | null;
  interpretation?: string | null;
  source: string;
  satellite_source: string;
  baseline_date: string;
  provenance: DataProvenance;
  timestamp: string;
}

export interface AnomalyItem {
  metric: string;
  observed_value: number;
  baseline_value: number;
  deviation?: number;
  z_score: number;
  status: "NORMAL" | "ELEVATED" | "ANOMALOUS";
  description: string;
  provenance: DataProvenance;
}

export interface AlertItem {
  id: string;
  alert_type: "HIGH_PM25" | "HIGH_AQI" | "EXTREME_HEAT" | "POOR_AIR_DISPERSION" | "UNUSUAL_CONDITION" | string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  message: string;
  affected_metric: string;
  reason: string;
  timestamp: string;
  provenance: DataProvenance;
}

export interface ContributingFactors {
  status?: "AVAILABLE" | "UNAVAILABLE" | string;
  reason?: string;
  air_quality_stress_score?: number | null;
  thermal_stress_score?: number | null;
  surface_heat_stress_score?: number | null;
  dispersion_stress_score?: number | null;
  ventilation_status?: "FAVORABLE" | "MODERATE" | "STAGNANT" | "UNAVAILABLE" | string;
  vegetative_buffer_status?: "STRONG" | "MODERATE" | "SPARSE" | "UNAVAILABLE" | string;
  active_weights?: Record<string, number>;
  weights?: {
    air_quality?: number;
    thermal_stress?: number;
    surface_heat?: number;
    dispersion?: number;
  };
}

export interface RiskData {
  location_id: string;
  location_name: string;
  score_label: string;
  risk_score: number | null;
  risk_level: "LOW" | "MODERATE" | "HIGH" | "SEVERE" | "UNAVAILABLE";
  primary_stressor: string;
  contributing_factors: ContributingFactors;
  explanation: string;
  anomalies: AnomalyItem[];
  alerts: AlertItem[];
  disclaimer: string;
  provenance: DataProvenance;
  timestamp: string;
}

export interface HourlyForecastPoint {
  time: string;
  temperature_c: number | null;
  apparent_temperature_c: number | null;
  relative_humidity_pct: number | null;
  precipitation_probability_pct: number | null;
  precipitation_mm: number | null;
  wind_speed_kmh: number | null;
  pm25: number | null;
  pm10: number | null;
  estimated_aqi: number | null;
  provenance: DataProvenance;
}

export interface DailyForecastPoint {
  date: string;
  temp_min_c: number | null;
  temp_max_c: number | null;
  precipitation_sum_mm: number | null;
  max_wind_speed_kmh: number | null;
  dominant_condition: string | null;
  avg_pm25: number | null;
  predicted_aqi_category: string | null;
  provenance: DataProvenance;
}

export interface ForecastData {
  location_id: string;
  location_name: string;
  forecast_hours: number;
  hourly: HourlyForecastPoint[];
  daily: DailyForecastPoint[];
  trend_summary: string;
  source: string;
  provenance: DataProvenance;
  timestamp: string;
}

export interface ResponseMetadata {
  timestamp: string;
  cached: boolean;
  provider_status: Record<string, string>;
  data_freshness: string;
  version: string;
}

export interface UnifiedEnvironmentResponse {
  location: Location;
  air: AirData | null;
  weather: WeatherData | null;
  greenery: GreeneryData | null;
  heat: HeatData | null;
  risk: RiskData | null;
  forecast: ForecastData | null;
  metadata: ResponseMetadata;
}

export interface LocationComparisonItem {
  location_id: string;
  location_name: string;
  zone: string;
  ward: string;
  ndvi_mean: number | null;
  greenery_classification: string | null;
  tree_canopy_pct: number | null;
  built_up_ratio_pct: number | null;
  surface_heat_index: number | null;
  heat_classification: string | null;
  temperature_c: number | null;
  aqi: number | null;
  aqi_category: string | null;
  dominant_pollutant: string | null;
  greenery_provenance: DataProvenance;
  heat_provenance: DataProvenance;
}

export interface AreaComparisonResponse {
  location_a: LocationComparisonItem;
  location_b: LocationComparisonItem;
  differentials: {
    ndvi_delta: number;
    canopy_pct_delta: number;
    built_up_pct_delta: number;
    surface_heat_index_delta: number;
    higher_greenery_location: string;
    higher_surface_heat_location: string;
    ambient_temperature_delta_c?: number;
    aqi_delta?: number;
  };
  interpretation: string;
  methodology_note: string;
  timestamp: string;
}

export interface LocationMapFeature {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  zone: string;
  ward: string;
  ndvi_mean: number;
  greenery_classification: string;
  tree_canopy_pct: number;
  built_up_ratio_pct: number;
  surface_heat_index: number;
  heat_classification: string;
  temperature_c: number | null;
  aqi: number | null;
  aqi_category: string | null;
  provenance: DataProvenance;
}

export interface MumbaiMapDataResponse {
  total_locations: number;
  locations: LocationMapFeature[];
  thematic_layers_available: string[];
  satellite_source: string;
  provenance: DataProvenance;
  timestamp: string;
}
