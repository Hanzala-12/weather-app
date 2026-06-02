export interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  description: string;
  icon: string;
  sunrise: number;
  sunset: number;
  dt: number;
  timezone: number;
  coord: { lat: number; lon: number };
}

export interface ForecastDay {
  dt: number;
  tempMin: number;
  tempMax: number;
  condition: string;
  icon: string;
  description: string;
}

export interface CitySuggestion {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

export async function fetchCitySuggestions(query: string): Promise<CitySuggestion[]> {
  if (query.length < 2) return [];
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export interface ForecastData {
  city: string;
  country: string;
  list: ForecastDay[];
}

export async function fetchWeatherByCity(city: string): Promise<{ weather: WeatherData; forecast: ForecastData }> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error("OpenWeather API key not configured");

  const currentRes = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`
  );
  if (!currentRes.ok) {
    if (currentRes.status === 404) throw new Error("City not found");
    throw new Error("Failed to fetch weather data");
  }
  const currentData = await currentRes.json();

  const forecastRes = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`
  );
  if (!forecastRes.ok) throw new Error("Failed to fetch forecast data");
  const forecastData = await forecastRes.json();

  return {
    weather: mapCurrentWeather(currentData),
    forecast: mapForecastData(forecastData, currentData),
  };
}

export async function fetchWeatherByCoords(lat: number, lon: number): Promise<{ weather: WeatherData; forecast: ForecastData }> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error("OpenWeather API key not configured");

  const currentRes = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
  );
  if (!currentRes.ok) throw new Error("Failed to fetch weather data");
  const currentData = await currentRes.json();

  const forecastRes = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
  );
  if (!forecastRes.ok) throw new Error("Failed to fetch forecast data");
  const forecastData = await forecastRes.json();

  return {
    weather: mapCurrentWeather(currentData),
    forecast: mapForecastData(forecastData, currentData),
  };
}

export async function fetchWeatherByZip(zip: string): Promise<{ weather: WeatherData; forecast: ForecastData }> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error("OpenWeather API key not configured");

  const currentRes = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?zip=${encodeURIComponent(zip)}&units=metric&appid=${apiKey}`
  );
  if (!currentRes.ok) {
    if (currentRes.status === 404) throw new Error("Location not found");
    throw new Error("Failed to fetch weather data");
  }
  const currentData = await currentRes.json();

  const forecastRes = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${currentData.coord.lat}&lon=${currentData.coord.lon}&units=metric&appid=${apiKey}`
  );
  if (!forecastRes.ok) throw new Error("Failed to fetch forecast data");
  const forecastData = await forecastRes.json();

  return {
    weather: mapCurrentWeather(currentData),
    forecast: mapForecastData(forecastData, currentData),
  };
}

function mapCurrentWeather(data: any): WeatherData {
  return {
    city: data.name,
    country: data.sys.country,
    temperature: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed * 3.6),
    condition: data.weather[0].main,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    sunrise: data.sys.sunrise,
    sunset: data.sys.sunset,
    dt: data.dt,
    timezone: data.timezone,
    coord: { lat: data.coord.lat, lon: data.coord.lon },
  };
}

function mapForecastData(forecast: any, current: any): ForecastData {
  const dailyMap = new Map<string, ForecastDay>();

  for (const item of forecast.list) {
    const date = new Date(item.dt * 1000).toDateString();
    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        dt: item.dt,
        tempMin: item.main.temp_min,
        tempMax: item.main.temp_max,
        condition: item.weather[0].main,
        icon: item.weather[0].icon,
        description: item.weather[0].description,
      });
    } else {
      const existing = dailyMap.get(date)!;
      existing.tempMin = Math.min(existing.tempMin, item.main.temp_min);
      existing.tempMax = Math.max(existing.tempMax, item.main.temp_max);
    }
  }

  const list = Array.from(dailyMap.values()).slice(1, 6);

  return {
    city: current.name,
    country: current.sys.country,
    list,
  };
}
