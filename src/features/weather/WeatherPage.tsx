import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Cloud,
  Droplets,
  Wind,
  CloudRain,
  Sun,
  AlertCircle,
} from "lucide-react";
import { weatherApi } from "@/api/endpoints/weather";
import { qk } from "@/api/queryKeys";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/feedback/ErrorState";

export function WeatherPage() {
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  const locationsQuery = useQuery({
    queryKey: ["weather", "locations"],
    queryFn: weatherApi.locations,
  });

  const locations = locationsQuery.data ?? [];
  const activeLocation =
    selectedLocation ||
    (locations[0] ? `${locations[0].city}|${locations[0].state}` : "");

  const [city, state] = activeLocation ? activeLocation.split("|") : ["", ""];

  const weatherQuery = useQuery({
    queryKey: qk.weather(city, state),
    queryFn: () => weatherApi.current(city || undefined, state || undefined),
    enabled: !!city,
  });

  const locationOptions = locations.map((loc) => ({
    value: `${loc.city}|${loc.state}`,
    label: loc.label || `${loc.city}, ${loc.state}`,
  }));

  const weather = weatherQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">
            Agri Weather Forecast
          </h1>
          <p className="mt-1 text-ink-500">
            Real-time agro-meteorological advisory and weather outlook.
          </p>
        </div>

        {locationOptions.length > 0 && (
          <div className="w-64">
            <Select
              label="Location"
              options={locationOptions}
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            />
          </div>
        )}
      </div>

      {weatherQuery.isLoading && (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-28 w-full" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      )}

      {weatherQuery.isError && (
        <ErrorState
          error={weatherQuery.error}
          onRetry={() => void weatherQuery.refetch()}
        />
      )}

      {weather && (
        <div className="space-y-6">
          {/* Hero Weather Card */}
          <Card className="bg-gradient-to-br from-primary-900 to-primary-800 p-6 text-white">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <span className="text-sm font-medium uppercase tracking-wider text-primary-200">
                  Current conditions
                </span>
                <h2 className="mt-1 text-3xl font-bold">
                  {weather.city}, {weather.state}
                </h2>
                <div className="mt-4 flex items-baseline gap-4">
                  <span className="numeric text-6xl font-bold">
                    {weather.tempCelsius}°C
                  </span>
                  <span className="text-xl font-medium text-primary-100">
                    {weather.condition}
                  </span>
                </div>
                <p className="mt-2 text-sm text-primary-200">
                  Feels like {weather.feelsLikeCelsius}°C
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3 backdrop-blur-sm">
                  <Droplets
                    className="size-6 text-primary-200"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-xs text-primary-200">Humidity</p>
                    <p className="numeric font-semibold">{weather.humidity}%</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3 backdrop-blur-sm">
                  <Wind
                    className="size-6 text-primary-200"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-xs text-primary-200">Wind</p>
                    <p className="numeric font-semibold">
                      {weather.windSpeedKmh} km/h
                    </p>
                  </div>
                </div>

                <div className="col-span-2 flex items-center gap-3 rounded-lg bg-white/10 p-3 backdrop-blur-sm sm:col-span-1">
                  <CloudRain
                    className="size-6 text-primary-200"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-xs text-primary-200">Rain chance</p>
                    <p className="numeric font-semibold">
                      {weather.rainProbability}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Farming Advisory */}
          {weather.advisory && (
            <Card className="border-l-4 border-l-primary-600 bg-primary-50/60 p-5">
              <div className="flex items-start gap-3">
                <AlertCircle
                  className="mt-0.5 size-5 shrink-0 text-primary-700"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="font-semibold text-primary-900">
                    Agricultural Advisory
                  </h3>
                  <p className="mt-1 text-sm text-ink-700">{weather.advisory}</p>
                  {weather.source && (
                    <p className="mt-2 text-xs text-ink-500">
                      Source: {weather.source}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Hourly Forecast */}
          {weather.hourly && weather.hourly.length > 0 && (
            <div>
              <h3 className="mb-3 font-semibold text-ink-900">
                Hourly outlook
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {weather.hourly.map((h, i) => (
                  <Card
                    key={i}
                    className="flex min-w-[90px] flex-col items-center p-3 text-center"
                  >
                    <span className="text-xs text-ink-500">{h.time}</span>
                    <Cloud
                      className="my-2 size-5 text-ink-500"
                      aria-hidden="true"
                    />
                    <span className="numeric font-semibold text-ink-900">
                      {h.tempCelsius}°C
                    </span>
                    <span className="numeric mt-1 text-[11px] text-info-700">
                      {h.rainProbability}% rain
                    </span>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Daily Forecast */}
          {weather.forecast && weather.forecast.length > 0 && (
            <div>
              <h3 className="mb-3 font-semibold text-ink-900">
                Multi-day forecast
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {weather.forecast.map((f, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-ink-900">{f.day}</span>
                      <Sun
                        className="size-5 text-accent-600"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="mt-1 text-xs text-ink-500">{f.condition}</p>
                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="numeric text-lg font-semibold text-ink-900">
                        {f.tempCelsius}°C
                      </span>
                      <span className="numeric text-xs text-ink-500">
                        {f.tempMinCelsius}° / {f.tempMaxCelsius}°
                      </span>
                    </div>
                    {f.rainProbability !== undefined && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-info-700">
                        <Droplets className="size-3" aria-hidden="true" />
                        <span>{f.rainProbability}% rain</span>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
