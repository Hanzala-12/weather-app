"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MapEmbedProps {
  city: string;
  lat: number;
  lon: number;
}

export default function MapEmbed({ city, lat, lon }: MapEmbedProps) {
  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ""}&q=${encodeURIComponent(city)}&center=${lat},${lon}&zoom=10`;

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY) {
    const osmSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.1},${lat - 0.1},${lon + 0.1},${lat + 0.1}&layer=mapnik&marker=${lat},${lon}`;
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg">Map - {city}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-64 rounded-lg overflow-hidden border">
            <iframe
              src={osmSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              title={`Map of ${city}`}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Powered by OpenStreetMap. Add a Google Maps API key for Google Maps.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">Map - {city}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-64 rounded-lg overflow-hidden border">
          <iframe
            src={mapSrc}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            title={`Map of ${city}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
