"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { WeatherData, ForecastData } from "@/lib/weather";

interface ExportButtonProps {
  weather: WeatherData;
  forecast: ForecastData;
}

export default function ExportButton({ weather, forecast }: ExportButtonProps) {
  const exportJSON = () => {
    const data = {
      current: weather,
      forecast: forecast.list,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weather-${weather.city}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ["Date", "City", "Temperature", "Feels Like", "Humidity", "Wind Speed", "Condition", "Description"];
    const rows = forecast.list.map((day) => [
      new Date(day.dt * 1000).toISOString().split("T")[0],
      weather.city,
      Math.round(day.tempMax).toString(),
      weather.feelsLike.toString(),
      weather.humidity.toString(),
      weather.windSpeed.toString(),
      day.condition,
      day.description,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weather-${weather.city}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportJSON}>
        <Download className="h-4 w-4 mr-1" /> Export JSON
      </Button>
      <Button variant="outline" size="sm" onClick={exportCSV}>
        <Download className="h-4 w-4 mr-1" /> Export CSV
      </Button>
    </div>
  );
}
