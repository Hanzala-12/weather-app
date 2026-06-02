export interface WeatherData {
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    description: string;
    icon: string;
    isDay: boolean;
  };
  hourly: {
    time: Date;
    temp: number;
    icon: string;
  }[];
  daily: {
    time: Date;
    minTemp: number;
    maxTemp: number;
    icon: string;
    description: string;
  }[];
  city: string;
  country: string;
  lat: number;
  lon: number;
}

export interface ForecastDay {
  dt: number;
  tempMin: number;
  tempMax: number;
  condition: string;
  icon: string;
  description: string;
}

export interface HourlyPoint {
  dt: number;
  temp: number;
  condition: string;
  icon: string;
}

export interface CitySuggestion {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

function getWeatherCondition(wmoCode: number, isDay: boolean = true) {
  const codeMap: Record<number, { desc: string; icon: string }> = {
    0: { desc: 'Clear sky', icon: isDay ? 'sun' : 'moon' },
    1: { desc: 'Mainly clear', icon: isDay ? 'cloud-sun' : 'cloud-moon' },
    2: { desc: 'Partly cloudy', icon: 'cloud' },
    3: { desc: 'Overcast', icon: 'cloud' },
    45: { desc: 'Fog', icon: 'cloud-fog' },
    48: { desc: 'Depositing rime fog', icon: 'cloud-fog' },
    51: { desc: 'Light drizzle', icon: 'cloud-drizzle' },
    53: { desc: 'Moderate drizzle', icon: 'cloud-drizzle' },
    55: { desc: 'Dense drizzle', icon: 'cloud-drizzle' },
    56: { desc: 'Light freezing drizzle', icon: 'cloud-drizzle' },
    57: { desc: 'Dense freezing drizzle', icon: 'cloud-drizzle' },
    61: { desc: 'Slight rain', icon: 'cloud-rain' },
    63: { desc: 'Moderate rain', icon: 'cloud-showers-heavy' },
    65: { desc: 'Heavy rain', icon: 'cloud-showers-heavy' },
    66: { desc: 'Light freezing rain', icon: 'cloud-rain' },
    67: { desc: 'Heavy freezing rain', icon: 'cloud-showers-heavy' },
    71: { desc: 'Slight snow fall', icon: 'snowflake' },
    73: { desc: 'Moderate snow fall', icon: 'snowflake' },
    75: { desc: 'Heavy snow fall', icon: 'snowflake' },
    77: { desc: 'Snow grains', icon: 'snowflake' },
    80: { desc: 'Slight rain showers', icon: 'cloud-rain' },
    81: { desc: 'Moderate rain showers', icon: 'cloud-showers-heavy' },
    82: { desc: 'Violent rain showers', icon: 'cloud-lightning' },
    85: { desc: 'Slight snow showers', icon: 'snowflake' },
    86: { desc: 'Heavy snow showers', icon: 'snowflake' },
    95: { desc: 'Thunderstorm', icon: 'cloud-lightning' },
    96: { desc: 'Thunderstorm with slight hail', icon: 'cloud-lightning' },
    99: { desc: 'Thunderstorm with heavy hail', icon: 'cloud-lightning' },
  };
  return codeMap[wmoCode] || { desc: 'Unknown', icon: 'help-circle' };
}

async function geocodeCity(query: string): Promise<{ lat: number; lon: number; name: string; country: string }> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
  );
  if (!res.ok) throw new Error("City not found");
  const data = await res.json();
  if (!data.results || data.results.length === 0) throw new Error("City not found");
  return {
    lat: data.results[0].latitude,
    lon: data.results[0].longitude,
    name: data.results[0].name,
    country: data.results[0].country || "",
  };
}

export async function fetchCitySuggestions(query: string): Promise<CitySuggestion[]> {
  if (query.length < 2) return [];
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results) return [];
    return data.results.map((r: any) => ({
      name: r.name,
      country: r.country || "",
      state: r.admin1 || undefined,
      lat: r.latitude,
      lon: r.longitude,
    }));
  } catch {
    return [];
  }
}

export async function fetchWeatherByCity(city: string): Promise<WeatherData> {
  const geo = await geocodeCity(city);
  return fetchWeatherByCoords(geo.lat, geo.lon, geo.name, geo.country);
}

export async function fetchWeatherByCoords(
  lat: number,
  lon: number,
  cityName?: string,
  countryName?: string
): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch weather data");
  const data = await response.json();

  const currentCondition = getWeatherCondition(data.current.weather_code, data.current.is_day === 1);

  const hourly: { time: Date; temp: number; icon: string }[] = [];
  const currentHour = new Date(data.current.time).getTime();
  for (let i = 0; i < data.hourly.time.length; i++) {
    const time = new Date(data.hourly.time[i]);
    if (time.getTime() >= currentHour && hourly.length < 24) {
      const condition = getWeatherCondition(data.hourly.weather_code[i], data.hourly.is_day[i] === 1);
      hourly.push({ time, temp: Math.round(data.hourly.temperature_2m[i]), icon: condition.icon });
    }
  }

  const daily: { time: Date; minTemp: number; maxTemp: number; icon: string; description: string }[] = [];
  for (let i = 0; i < data.daily.time.length; i++) {
    const condition = getWeatherCondition(data.daily.weather_code[i], true);
    daily.push({
      time: new Date(data.daily.time[i]),
      minTemp: Math.round(data.daily.temperature_2m_min[i]),
      maxTemp: Math.round(data.daily.temperature_2m_max[i]),
      icon: condition.icon,
      description: condition.desc,
    });
  }

  return {
    current: {
      temp: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      humidity: data.current.relative_humidity_2m,
      windSpeed: Math.round(data.current.wind_speed_10m),
      description: currentCondition.desc,
      icon: currentCondition.icon,
      isDay: data.current.is_day === 1,
    },
    hourly,
    daily,
    city: cityName || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
    country: countryName || "",
    lat,
    lon,
  };
}

export async function fetchWeatherByZip(zip: string): Promise<WeatherData> {
  const key = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  if (!key) throw new Error("ZIP search requires OpenWeather API key");
  const res = await fetch(
    `https://api.openweathermap.org/geo/1.0/zip?zip=${encodeURIComponent(zip)}&appid=${key}`
  );
  if (!res.ok) throw new Error("Location not found");
  const data = await res.json();
  return fetchWeatherByCoords(data.lat, data.lon, data.name, data.country);
}
