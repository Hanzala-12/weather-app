"use client";

import type { WeatherData } from "@/lib/weather";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatTime } from "@/lib/utils";
import {
  Droplets,
  Wind,
  Sunrise,
  Sunset,
  Thermometer,
} from "lucide-react";

interface WeatherCardProps {
  weather: WeatherData;
}

export default function WeatherCard({ weather }: WeatherCardProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">
              {weather.city}, {weather.country}
            </h2>
            <p className="text-muted-foreground text-sm">
              {formatDate(weather.dt, weather.timezone)}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className="text-5xl font-bold">{weather.temperature}°</span>
              <img
                src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                alt={weather.description}
                className="h-16 w-16"
              />
            </div>
            <p className="text-muted-foreground capitalize">{weather.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Thermometer className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Feels Like</p>
              <p className="font-semibold">{weather.feelsLike}°C</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Droplets className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Humidity</p>
              <p className="font-semibold">{weather.humidity}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Wind className="h-5 w-5 text-teal-500" />
            <div>
              <p className="text-xs text-muted-foreground">Wind Speed</p>
              <p className="font-semibold">{weather.windSpeed} km/h</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Sunrise className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Sunrise / Sunset</p>
              <p className="font-semibold text-sm">
                {formatTime(weather.sunrise, weather.timezone)} /{" "}
                {formatTime(weather.sunset, weather.timezone)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
