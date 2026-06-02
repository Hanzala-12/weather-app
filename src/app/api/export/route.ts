import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get("format") || "json";
  const city = searchParams.get("city");
  const temperature = searchParams.get("temperature");
  const condition = searchParams.get("condition");
  const humidity = searchParams.get("humidity");
  const windSpeed = searchParams.get("wind_speed");

  if (!city) {
    return NextResponse.json({ error: "City is required" }, { status: 400 });
  }

  const data = {
    city,
    temperature: temperature ? parseInt(temperature) : null,
    condition,
    humidity: humidity ? parseInt(humidity) : null,
    wind_speed: windSpeed ? parseInt(windSpeed) : null,
    exported_at: new Date().toISOString(),
  };

  if (format === "csv") {
    const headers = ["City", "Temperature", "Condition", "Humidity", "Wind Speed", "Exported At"];
    const values = [city, temperature || "", condition || "", humidity || "", windSpeed || "", data.exported_at];
    const csv = [headers.join(","), values.join(",")].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="weather-${city}.csv"`,
      },
    });
  }

  return NextResponse.json(data);
}
