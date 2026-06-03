import { NextRequest, NextResponse } from "next/server";

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

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
    const values = [
      escapeCSV(city),
      escapeCSV(temperature || ""),
      escapeCSV(condition || ""),
      escapeCSV(humidity || ""),
      escapeCSV(windSpeed || ""),
      escapeCSV(data.exported_at),
    ];
    const csv = [headers.join(","), values.join(",")].join("\r\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="weather-${city.replace(/[^a-zA-Z0-9]/g, "_")}.csv"`,
      },
    });
  }

  if (format === "xml") {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<weather>
  <city>${escapeCSV(city)}</city>
  <temperature>${data.temperature ?? ""}</temperature>
  <condition>${escapeCSV(condition || "")}</condition>
  <humidity>${data.humidity ?? ""}</humidity>
  <wind_speed>${data.wind_speed ?? ""}</wind_speed>
  <exported_at>${data.exported_at}</exported_at>
</weather>`;
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="weather-${city.replace(/[^a-zA-Z0-9]/g, "_")}.xml"`,
      },
    });
  }

  if (format === "markdown") {
    const md = `# Weather Report: ${city}

| Field | Value |
|---|---|
| **City** | ${city} |
| **Temperature** | ${data.temperature ?? "N/A"} |
| **Condition** | ${condition || "N/A"} |
| **Humidity** | ${data.humidity ?? "N/A"}% |
| **Wind Speed** | ${windSpeed || "N/A"} km/h |
| **Exported At** | ${data.exported_at} |
`;
    return new NextResponse(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="weather-${city.replace(/[^a-zA-Z0-9]/g, "_")}.md"`,
      },
    });
  }

  return NextResponse.json(data, {
    headers: {
      "Content-Disposition": `attachment; filename="weather-${city.replace(/[^a-zA-Z0-9]/g, "_")}.json"`,
    },
  });
}
