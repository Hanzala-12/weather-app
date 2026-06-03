import { type LucideIcon, Sun, Cloud, CloudFog, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudSun } from 'lucide-react';

export type WeatherCondition = 'clear' | 'partly-cloudy' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunderstorm';

export interface WeatherData {
  current: {
    temperature: number;
    windspeed: number;
    weathercode: number;
    humidity: number;
    apparentTemperature: number;
    pressure: number;
    visibility: number;
    time: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weathercode: number[];
    surface_pressure: number[];
    visibility: number[];
  };
  daily: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
  timezoneOffsetSeconds: number;
}

export interface CityResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export async function fetchWeather(lat: number, lon: number, signal?: AbortSignal): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,precipitation_probability,weathercode,windspeed_10m,relativehumidity_2m,apparent_temperature,surface_pressure,visibility&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&timezone=auto&forecast_days=8`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('Failed to fetch weather data');
  const data = await res.json();

  // Find the closest hour index
  const nowStr = data.current_weather.time; // Format: "YYYY-MM-DDTHH:00"
  let hIndex = data.hourly.time.findIndex((t: string) => t === nowStr);
  if (hIndex === -1) hIndex = 0; // fallback

  // Extract exactly what we need
  return {
    current: {
      temperature: data.current_weather.temperature,
      windspeed: data.current_weather.windspeed,
      weathercode: data.current_weather.weathercode,
      humidity: data.hourly.relativehumidity_2m[hIndex],
      apparentTemperature: data.hourly.apparent_temperature[hIndex], 
      pressure: data.hourly.surface_pressure[hIndex],
      visibility: data.hourly.visibility[hIndex],
      time: data.current_weather.time
    },
    hourly: {
      time: data.hourly.time,
      temperature_2m: data.hourly.temperature_2m,
      precipitation_probability: data.hourly.precipitation_probability,
      weathercode: data.hourly.weathercode,
      surface_pressure: data.hourly.surface_pressure,
      visibility: data.hourly.visibility,
    },
    daily: {
      time: data.daily.time,
      weathercode: data.daily.weathercode,
      temperature_2m_max: data.daily.temperature_2m_max,
      temperature_2m_min: data.daily.temperature_2m_min,
    },
    timezoneOffsetSeconds: data.utc_offset_seconds,
  };
}

export function decodeWMO(code: number): { label: string; icon: LucideIcon; condition: WeatherCondition } {
  if (code === 0) return { label: 'Clear sky', icon: Sun, condition: 'clear' };
  if (code === 1 || code === 2) return { label: 'Partly cloudy', icon: CloudSun, condition: 'partly-cloudy' };
  if (code === 3) return { label: 'Cloudy', icon: Cloud, condition: 'cloudy' };
  if (code === 45 || code === 48) return { label: 'Fog', icon: CloudFog, condition: 'fog' };
  if (code >= 51 && code <= 57) return { label: 'Drizzle', icon: CloudDrizzle, condition: 'drizzle' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { label: 'Rain', icon: CloudRain, condition: 'rain' };
  if (code >= 71 && code <= 77) return { label: 'Snow', icon: CloudSnow, condition: 'snow' };
  if (code >= 95 && code <= 99) return { label: 'Thunderstorm', icon: CloudLightning, condition: 'thunderstorm' };
  
  return { label: 'Unknown', icon: Sun, condition: 'clear' };
}

export async function searchZip(zip: string): Promise<CityResult | null> {
  const key = import.meta.env.VITE_OPENWEATHER_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://api.openweathermap.org/geo/1.0/zip?zip=${encodeURIComponent(zip)}&appid=${key}`);
    if (!res.ok) return null;
    const data = await res.json();
    return { id: Date.now(), name: data.name, latitude: data.lat, longitude: data.lon, country: data.country || '' };
  } catch {
    return null;
  }
}

export async function searchCities(query: string): Promise<CityResult[]> {
  if (!query) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch cities');
  const data = await res.json();
  return data.results || [];
}

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export function getTimeOfDay(localOffsetSeconds: number): TimeOfDay {
  // Use UTC time + offset to get the local hour exactly
  const d = new Date();
  const utcHour = d.getUTCHours();
  const utcMin = d.getUTCMinutes();
  const utcTotalMinutes = utcHour * 60 + utcMin;
  const localTotalMinutes = (utcTotalMinutes + Math.floor(localOffsetSeconds / 60)) % 1440;
  
  let localHour = Math.floor(localTotalMinutes / 60);
  if (localHour < 0) localHour += 24;

  if (localHour >= 5 && localHour < 7) return 'dawn';
  if (localHour >= 7 && localHour < 18) return 'day';
  if (localHour >= 18 && localHour < 20) return 'dusk';
  return 'night';
}

export function getCurrentHourIndex(hourlyTimes: string[], offsetSeconds: number): number {
  const d = new Date();
  const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
  const localDate = new Date(utcMs + offsetSeconds * 1000);
  const hour = localDate.getHours();
  const dateStr = localDate.toISOString().slice(0, 10);
  const targetStr = `${dateStr}T${hour.toString().padStart(2, '0')}:00`;
  const idx = hourlyTimes.findIndex(t => t === targetStr);
  return idx !== -1 ? idx : 0;
}
