"use client";

import type { ForecastDay } from "@/lib/weather";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDay } from "@/lib/utils";

interface ForecastCardProps {
  days: ForecastDay[];
}

export default function ForecastCard({ days }: ForecastCardProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">5-Day Forecast</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {days.map((day) => (
            <div
              key={day.dt}
              className="flex flex-col items-center p-3 rounded-lg bg-muted/30 text-center"
            >
              <p className="text-sm font-medium">{formatDay(day.dt)}</p>
              <img
                src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                alt={day.description}
                className="h-10 w-10"
              />
              <p className="text-xs text-muted-foreground capitalize mb-1">
                {day.condition}
              </p>
              <div className="flex gap-2 text-sm">
                <span className="font-semibold">{Math.round(day.tempMax)}°</span>
                <span className="text-muted-foreground">
                  {Math.round(day.tempMin)}°
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
