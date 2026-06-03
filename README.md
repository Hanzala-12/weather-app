# WeatherWise — Full-Stack Weather Intelligence Dashboard

A production-grade full-stack weather dashboard featuring real-time weather via Open-Meteo, persistent search history via Supabase, interactive maps, travel insights, YouTube travel videos, and multi-format data export.

**Built by Hanzala · PM Accelerator Candidate**

---

## System Overview

WeatherWise is a **single integrated full-stack system** composed of two applications that communicate during development:

| Layer | Technology | Role |
|---|---|---|
| **Backend** (API server) | Next.js 15 (App Router) | REST API for search history CRUD, data export in multiple formats, and OpenWeatherMap ZIP geocoding |
| **Frontend** (user interface) | Vite 6 + React 19 | Weather display, forecasts, interactive maps, travel insights, YouTube videos, weather visual effects |

The frontend runs on `http://localhost:5173` and proxies `/api/*` requests to the backend at `http://localhost:3000` via Vite's built-in proxy. Both applications must be running concurrently for full functionality.

---

## Features

### Search
- **City search** — Autocomplete with debounced lookups via Open-Meteo geocoding
- **ZIP code search** — US 5-digit ZIP codes resolved via OpenWeatherMap
- **Coordinate search** — Accepts `lat, lon` format
- **GPS / Current Location** — Browser geolocation with configurable timeout and fallback
- **Recent searches** — Last 5 searches persisted in localStorage

### Weather Display
- **Current conditions** — Temperature, feels-like, humidity, wind speed, pressure, visibility, condition icon
- **12-hour forecast** — Hourly projection with precipitation probability badges and Recharts AreaChart
- **7-day forecast** — Daily min/max temperatures with scaled range bars and WMO weather code icons

### Advanced Features
- **Interactive map** — Leaflet with OpenStreetMap tiles, fly-to animation on location change
- **Travel readiness score** — 0–100 rule-based score with dynamic recommendations and warnings
- **YouTube travel videos** — City travel guides via YouTube Data API (with search fallback when no key is configured)
- **Weather effects engine** — Dynamic sky gradients, volumetric clouds, canvas rain/snow/lightning, fog layers, wind streaks, night stars
- **Weather simulator** — Toggle between Live, Clouds, Fog, Rain, Snow, and Thunder to preview visual effects

### Backend (CRUD)
| Operation | Endpoint | Method |
|---|---|---|
| **Create** | `/api/history` | POST |
| **Read (list)** | `/api/history` | GET |
| **Update** | `/api/history/:id` | PATCH |
| **Delete** | `/api/history/:id` | DELETE |

- Full server-side validation (dates, required fields, cross-field checks)
- Supabase PostgreSQL persistence with automatic in-memory fallback
- Frontend localStorage fallback when backend is unavailable

### Data Export
| Format | Source | Details |
|---|---|---|
| **JSON** | Frontend + Backend | Formatted download |
| **CSV** | Frontend + Backend | Properly escaped, BOM-aware |
| **XML** | Backend (`/api/export`) | Server-side XML generation |
| **Markdown** | Backend (`/api/export`) | Markdown table |

---

## Architecture

```
Root (Backend — Next.js 15 API server)
├── src/
│   ├── app/api/
│   │   ├── export/route.ts          GET /api/export?city=&format=csv|json|xml|md
│   │   └── history/
│   │       ├── route.ts             GET (list), POST (create)
│   │       └── [id]/route.ts        PATCH (update), DELETE (delete)
│   └── lib/
│       ├── supabase.ts              Supabase client + in-memory store
│       └── weather.ts               Open-Meteo + OpenWeather API integration
├── supabase-migration.sql           PostgreSQL schema
├── .env.local                       Backend environment variables
├── package.json                     Backend dependencies
├── next.config.ts                   Next.js configuration
└── tsconfig.json

weather-dashboard/                   Frontend (Vite 6 + React 19)
├── src/
│   ├── App.tsx                      Main app component
│   ├── main.tsx                     React entry point
│   ├── index.css                    Tailwind CSS v4 + glass-panel styles
│   ├── lib/
│   │   └── weather.ts               Open-Meteo client, WMO decoder, ZIP search
│   └── components/
│       ├── SearchBar.tsx            City / ZIP / coordinate search with autocomplete
│       ├── WeatherEffects.tsx       Canvas-based weather particle system
│       ├── HourlyForecast.tsx       12-hour projection with Recharts sparkline
│       ├── WeekForecast.tsx         7-day forecast with temperature bars
│       ├── MapSection.tsx           Leaflet interactive map with fly-to
│       ├── TravelInsights.tsx       Rule-based travel readiness score
│       ├── YouTubeSection.tsx       Travel video results from YouTube API
│       └── SavedRequests.tsx        CRUD table + CSV/JSON export
├── index.html                       HTML shell
├── vite.config.ts                   Vite config with /api proxy to :3000
├── .env.example                     Frontend env var templates
└── package.json                     Frontend dependencies
```

### Data Flow

The frontend fetches weather data directly from Open-Meteo (free, no API key required). ZIP code searches pass through OpenWeatherMap geocoding before querying Open-Meteo for forecast data. When a user saves a search, the frontend sends a request to its own backend (`/api/history`), which persists the record to Supabase PostgreSQL (or an in-memory fallback if Supabase is not configured).

---

## Setup

### Prerequisites

- Node.js 18+
- npm

### Quick Start

```bash
# 1. Install backend dependencies
npm install

# 2. Install frontend dependencies
cd weather-dashboard
npm install
cd ..

# 3. Start the backend (Terminal 1 — http://localhost:3000)
npm run dev

# 4. Start the frontend (Terminal 2 — http://localhost:5173)
cd weather-dashboard
npm run dev
```

The frontend at `localhost:5173` proxies `/api/*` requests to the backend at `localhost:3000`.

### Database Setup (Optional)

Run `supabase-migration.sql` in your Supabase SQL Editor to create the `weather_searches` table with Row Level Security policies. If Supabase is not configured, the app falls back to an in-memory store automatically.

---

## Environment Variables

Configuration is split between the two applications based on which process reads the value.

### Backend (`/.env.local`)

Accessed via `process.env` in Next.js API routes.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_OPENWEATHER_API_KEY` | Yes | OpenWeatherMap API key for ZIP code geocoding |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL (in-memory fallback if unset) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anonymous key |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | No | Google Maps API key (reserved for future use) |

### Frontend (`weather-dashboard/.env` or `weather-dashboard/.env.local`)

Injected at build time via `import.meta.env`. Only variables prefixed with `VITE_` are accessible.

| Variable | Required | Description |
|---|---|---|
| `VITE_OPENWEATHER_API_KEY` | Yes | OpenWeatherMap API key for ZIP code geocoding |
| `VITE_YOUTUBE_API_KEY` | No | YouTube Data API v3 key for travel videos (shows search link if unset) |

---

## APIs Used

| API | Purpose | Auth | Usage |
|---|---|---|---|
| **Open-Meteo** | Weather data (current, hourly, daily) + geocoding | Free, no key | Primary weather data source |
| **OpenWeatherMap** | ZIP code → lat/lon conversion | API key | ZIP search only |
| **OpenStreetMap** | Map tiles for Leaflet | Free | Interactive map |
| **YouTube Data API v3** | City travel videos | API key (optional) | Video recommendations |
| **Supabase** | PostgreSQL database | API keys (optional) | Persistent CRUD storage |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vite 6, React 19, TypeScript 5.8 |
| **Styling** | Tailwind CSS v4, Motion (Framer Motion), Glass-morphism |
| **Charts** | Recharts (AreaChart) |
| **Maps** | Leaflet + react-leaflet |
| **Backend** | Next.js 15 (App Router), TypeScript |
| **Database** | Supabase PostgreSQL (with in-memory fallback) |
| **Icons** | Lucide React, WMO weather code system |

---

## Project Status

All core features are implemented with zero TypeScript errors and clean builds across both frontend and backend.
