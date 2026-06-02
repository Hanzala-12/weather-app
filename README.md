# WeatherWise - Full-Stack Weather Application

A modern, full-stack weather application built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, and Supabase. Features real-time weather data, 5-day forecasts, search history, data export, and interactive maps.

## Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **APIs:** OpenWeather API, Geolocation API, OpenStreetMap (Google Maps optional)
- **Deployment:** Vercel

## Features

### Core Features
- **Weather Search** - Search by city name, ZIP code, or coordinates (lat,lon)
- **Current Weather** - Temperature, feels like, humidity, wind speed, condition, sunrise/sunset
- **Current Location** - "Use My Location" button with browser geolocation
- **5-Day Forecast** - Daily min/max temperatures with condition icons
- **Error Handling** - Invalid city, failed API, denied location, and network errors

### Bonus Features
- **Search History** - Saves searches to Supabase database (full CRUD)
- **Data Export** - Export weather data as JSON or CSV
- **Interactive Map** - Embedded map of searched city
- **AI Travel Suggestion** - Rule-based smart recommendations (e.g., "Carry an umbrella")

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd weather-app
npm install
```

### 2. Get API Keys

- **OpenWeather API Key**: Sign up at [OpenWeatherMap](https://openweathermap.org/api) (free tier)
- **Supabase**: Create a project at [Supabase](https://supabase.com) (free tier)
- **Google Maps API Key** (optional): Get from [Google Cloud Console](https://console.cloud.google.com)

### 3. Configure Environment

Copy `.env.local` and fill in your keys:

```env
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_google_maps_key  # optional
```

### 4. Set Up Database

In your Supabase dashboard, open the SQL Editor and run the SQL from `supabase-migration.sql` to create the `weather_searches` table.

### 5. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── export/route.ts      # Export API (JSON/CSV)
│   │   └── history/
│   │       ├── route.ts          # GET/POST history
│   │       └── [id]/route.ts     # DELETE history
│   ├── globals.css               # Tailwind CSS + shadcn theme
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page
├── components/
│   ├── ui/                       # shadcn/ui components
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── separator.tsx
│   ├── ExportButton.tsx          # JSON/CSV export
│   ├── ForecastCard.tsx          # 5-day forecast
│   ├── HistoryList.tsx           # Search history
│   ├── MapEmbed.tsx              # Interactive map
│   ├── SearchBar.tsx             # Search input
│   ├── TravelSuggestion.tsx      # AI travel tips
│   └── WeatherCard.tsx           # Current weather
└── lib/
    ├── shadcn.ts
    ├── suggestions.ts            # Rule-based AI suggestions
    ├── supabase.ts               # Supabase client + CRUD
    ├── utils.ts                  # Helper functions
    └── weather.ts                # OpenWeather API integration
```

## APIs Used

- **OpenWeather Current Weather API** - Real-time weather data
- **OpenWeather 5-Day Forecast API** - 3-hour forecast data
- **Browser Geolocation API** - User's current location
- **OpenStreetMap Embed** - Interactive map display
- **Supabase REST API** - Database CRUD operations

## Deployment

Deploy on Vercel:

```bash
npm run build
npx vercel deploy
```

Or connect your GitHub repository to Vercel for automatic deployments.

## License

MIT
