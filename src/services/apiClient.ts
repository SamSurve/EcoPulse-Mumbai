import {
  Location,
  UnifiedEnvironmentResponse,
  AirData,
  WeatherData,
  GreeneryData,
  HeatData,
  RiskData,
  ForecastData,
  RiskSummaryResponse,
  AreaComparisonResponse,
  MumbaiMapDataResponse,
} from "../types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";


class EcoPulseApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      ...options,
    });

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status} - ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.detail) {
          errorDetail = errJson.detail;
        }
      } catch {
        // Response was not JSON
      }
      throw new Error(errorDetail);
    }

    return await response.json();
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, "");
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async getHealthDirect(): Promise<any> {
    return await this.fetchJson<any>("/health");
  }

  async getLocationsDirect(): Promise<Location[]> {
    return await this.fetchJson<Location[]>("/locations");
  }

  async getAirQualityDirect(locationId: string, forceRefresh: boolean = false): Promise<AirData> {
    const q = forceRefresh ? "?force_refresh=true" : "";
    return await this.fetchJson<AirData>(`/air-quality/${locationId}${q}`);
  }

  async getMicroclimateDirect(locationId: string, forceRefresh: boolean = false): Promise<WeatherData> {
    const q = forceRefresh ? "?force_refresh=true" : "";
    return await this.fetchJson<WeatherData>(`/microclimate/${locationId}${q}`);
  }

  async getGreeneryDirect(locationId: string): Promise<GreeneryData> {
    return await this.fetchJson<GreeneryData>(`/greenery/${locationId}`);
  }

  async getHeatDirect(locationId: string): Promise<HeatData> {
    return await this.fetchJson<HeatData>(`/heat/${locationId}`);
  }

  async getRiskDirect(locationId: string, forceRefresh: boolean = false): Promise<RiskData> {
    const q = forceRefresh ? "?force_refresh=true" : "";
    return await this.fetchJson<RiskData>(`/risk/${locationId}${q}`);
  }

  async getForecastDirect(locationId: string, forceRefresh: boolean = false): Promise<ForecastData> {
    const q = forceRefresh ? "?force_refresh=true" : "";
    return await this.fetchJson<ForecastData>(`/forecast/${locationId}${q}`);
  }

  async getRiskSummaryDirect(locationId: string): Promise<RiskSummaryResponse> {
    return await this.fetchJson<RiskSummaryResponse>(`/risk/${locationId}/summary`);
  }

  async compareLocationsDirect(locationA: string, locationB: string): Promise<AreaComparisonResponse> {
    return await this.fetchJson<AreaComparisonResponse>(
      `/environment/compare?location_a=${encodeURIComponent(locationA)}&location_b=${encodeURIComponent(locationB)}`
    );
  }

  async getUnifiedEnvironmentDirect(locationId: string, forceRefresh: boolean = false): Promise<UnifiedEnvironmentResponse> {
    const q = forceRefresh ? "?force_refresh=true" : "";
    return await this.fetchJson<UnifiedEnvironmentResponse>(`/environment/${locationId}${q}`);
  }

  async getMapFeaturesDirect(): Promise<MumbaiMapDataResponse> {
    return await this.fetchJson<MumbaiMapDataResponse>("/greenery-heat/map");
  }
}

export const apiClient = new EcoPulseApiClient();
export default apiClient;
