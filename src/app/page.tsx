"use client";

import { useState, useCallback } from "react";
import SearchBar from "@/components/SearchBar";
import WeatherCard from "@/components/WeatherCard";
import ForecastCard from "@/components/ForecastCard";
import MapEmbed from "@/components/MapEmbed";
import ExportButton from "@/components/ExportButton";
import HistoryList from "@/components/HistoryList";
import TravelSuggestion from "@/components/TravelSuggestion";
import type { WeatherData, ForecastData } from "@/lib/weather";
import { fetchWeatherByCity, fetchWeatherByCoords, fetchWeatherByZip } from "@/lib/weather";
import { saveSearch } from "@/lib/supabase";
import { Loader2, AlertCircle, CloudSun } from "lucide-react";

function isLatLon(query: string): boolean {
  const parts = query.split(",");
  if (parts.length === 2) {
    const lat = parseFloat(parts[0].trim());
    const lon = parseFloat(parts[1].trim());
    return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }
  return false;
}

function isZipCode(query: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(query.trim());
}

export default function Home() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSearch = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (isLatLon(query)) {
        const [lat, lon] = query.split(",").map((s) => parseFloat(s.trim()));
        result = await fetchWeatherByCoords(lat, lon);
      } else if (isZipCode(query)) {
        result = await fetchWeatherByZip(query);
      } else {
        result = await fetchWeatherByCity(query);
      }
      setWeather(result.weather);
      setForecast(result.forecast);
      setRefreshKey((k) => k + 1);

      saveSearch(
        result.weather.city,
        result.weather.country,
        result.weather.temperature,
        result.weather.condition,
        result.weather.humidity,
        result.weather.windSpeed,
        result.weather.icon
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch weather data");
      setWeather(null);
      setForecast(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLocationClick = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await handleSearch(`${latitude},${longitude}`);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location access denied. Please allow location access or search manually.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location information is unavailable");
            break;
          case err.TIMEOUT:
            setError("Location request timed out");
            break;
          default:
            setError("Failed to get location");
        }
      }
    );
  }, [handleSearch]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <header className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <CloudSun className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold tracking-tight">WeatherWise</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Built with Next.js 15 · TypeScript · Tailwind CSS · shadcn/ui · Supabase · OpenWeather API
          </p>
          <p className="text-xs text-muted-foreground">
            PM Accelerator Project
          </p>
        </header>

        <SearchBar onSearch={handleSearch} onLocationClick={handleLocationClick} loading={loading} />

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive max-w-2xl mx-auto">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {weather && forecast && (
          <>
            <TravelSuggestion weather={weather} />
            <WeatherCard weather={weather} />
            <ForecastCard days={forecast.list} />
            <div className="flex justify-center">
              <ExportButton weather={weather} forecast={forecast} />
            </div>
            <MapEmbed city={weather.city} lat={weather.coord.lat} lon={weather.coord.lon} />
          </>
        )}

        <HistoryList onSelect={handleSearch} refreshKey={refreshKey} />

        <footer className="text-center text-xs text-muted-foreground py-8">
          <p>Powered by OpenWeather API · Data updates every 3 hours</p>
          <p className="mt-1">
            {weather && forecast
              ? `Last checked: ${weather.city}, ${weather.country} - ${weather.temperature}°C`
              : "Search for a city to get started"}
          </p>
        </footer>
      </div>
    </div>
  );
}
