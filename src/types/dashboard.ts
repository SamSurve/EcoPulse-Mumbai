import {
  Location,
  AirData,
  WeatherData,
  GreeneryData,
  HeatData,
  RiskData,
  ForecastData,
  DataProvenance,
} from "./api";

export interface MumbaiLocationItem extends Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  zone: string;
  ward: string;
  nearest_station: string;
  aqi?: number;
  aqi_category?: string;
  temperature_c?: number;
  pm25?: number;
}

export type DashboardNavTab =
  | "dashboard"
  | "air_microclimate"
  | "greenery_heat"
  | "forecast_risk"
  | "area_comparison";

export interface DashboardState {
  selectedLocation: string;
  compareLocation: string;
  activeTab: DashboardNavTab;
  isLive: boolean;
  lastSyncTime: string;
  isSyncing: boolean;
  theme: "dark" | "light";
  mapLayer: "AQI" | "PM2.5" | "NDVI" | "LST";
}
