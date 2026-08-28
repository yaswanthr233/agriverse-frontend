import { api } from "../client";
import type { WeatherLocationResponse, WeatherResponse } from "../types";

export const weatherApi = {
  current: (city?: string, state?: string) =>
    api
      .get<WeatherResponse>("/api/weather", { params: { city, state } })
      .then((r) => r.data),
  locations: () =>
    api
      .get<WeatherLocationResponse[]>("/api/weather/locations")
      .then((r) => r.data),
};
