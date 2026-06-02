"use client";

import { Card, CardContent } from "@/components/ui/card";
import { getTravelSuggestion } from "@/lib/suggestions";
import type { WeatherData } from "@/lib/weather";

interface TravelSuggestionProps {
  weather: WeatherData;
}

export default function TravelSuggestion({ weather }: TravelSuggestionProps) {
  const suggestion = getTravelSuggestion(
    weather.condition,
    weather.temperature,
    weather.humidity,
    weather.windSpeed,
    weather.description
  );

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4 flex items-center gap-3">
        <span className="text-3xl">{suggestion.icon}</span>
        <p className="text-sm font-medium">{suggestion.message}</p>
      </CardContent>
    </Card>
  );
}
