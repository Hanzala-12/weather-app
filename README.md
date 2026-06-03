# WeatherWise — Full-Stack Weather Intelligence Dashboard

A production-grade full-stack weather dashboard featuring real-time weather via Open-Meteo, persistent search history via Supabase, interactive maps, travel insights, YouTube travel videos, and multi-format data export.

**Built by Hanzala Yaqoob · PM Accelerator Candidate**

[![Live Demo](https://img.shields.io/badge/Live-Demo-4f46e5?style=for-the-badge)](https://weather-dashboard-kappa-ten.vercel.app)
[![Backend API](https://img.shields.io/badge/Backend-API-0ea5e9?style=for-the-badge)](https://weatherwise-backend-seven.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repo-181717?style=for-the-badge&logo=github)](https://github.com/Hanzala-12/weather-app)

---

## System Overview

WeatherWise is a **single integrated full-stack system** composed of two applications deployed on Vercel:

| Layer | Technology | Live URL |
|---|---|---|
| **Frontend** (user interface) | Vite 6 + React 19 | [weather-dashboard-kappa-ten.vercel.app](https://weather-dashboard-kappa-ten.vercel.app) |
| **Backend** (API server) | Next.js 15 (App Router) | [weatherwise-backend-seven.vercel.app](https://weatherwise-backend-seven.vercel.app) |

The frontend fetches weather data directly from Open-Meteo, maps from OpenStreetMap, and proxies `/api/*` CRUD requests to the backend via a configurable `VITE_API_URL`. During local development, the Vite dev server proxies to `localhost:3000`.

---

## Features

### Search
- **City search** — Autocomplete with 300ms debounced lookups via Open-Meteo geocoding
- **ZIP code search** — US 5-digit ZIP codes resolved via OpenWeatherMap
- **Coordinate search** — Accepts `lat, lon` format
- **GPS / Current Location** — Browser geolocation with 8s timeout and London fallback
- **Recent searches** — Last 5 searches persisted in localStorage

### Weather Display
- **Current conditions** — Temperature, feels-like, humidity, wind speed, pressure, visibility, condition icon with WMO decoding
- **12-hour forecast** — Hourly projection with precipitation probability badges and Recharts AreaChart
- **7-day forecast** — Daily min/max temperatures with scaled range bars and WMO weather code icons
- **Animated temperature counter** — Spring-animated number transitions on search
- **Weather stats row** — Wind, humidity, feels-like, visibility, pressure in a compact layout

### Visual Experience
- **Weather effects engine** — Dynamic sky gradients, volumetric clouds, canvas rain/snow/lightning, fog layers, wind streaks, night stars
- **Weather simulator** — Persistent bottom dock to toggle between Live, Clouds, Fog, Rain, Snow, and Thunder to preview visual effects
- **Animated loading screen** — Pulse-ring animation while detecting location
- **Toast notifications** — Slide-in error and info toasts with auto-dismiss

### Advanced Features
- **Interactive map** — Leaflet with OpenStreetMap tiles, fly-to animation on location change
- **Travel readiness score** — 0–100 rule-based score with dynamic recommendations (umbrella, sunscreen, wind warnings)
- **Saved weather requests** — Save destinations with date ranges and notes; full CRUD with Supabase persistence and localStorage fallback
- **YouTube travel videos** — City travel guides via YouTube Data API (falls back to a YouTube search link when no key is configured)
- **Data export** — Download saved requests as CSV, JSON, or Markdown

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
| **Markdown** | Backend (`/api/export`) + Frontend (SavedRequests) | Markdown table |

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
│       ├── supabase.ts              Supabase client + in-memory fallback store
│       └── weather.ts               Open-Meteo + OpenWeatherMap API integration
├── supabase-migration.sql           PostgreSQL schema for weather_searches
├── .vercelignore                    Vercel deployment ignore rules
├── .env.local                       Backend environment variables (gitignored)
├── package.json                     Backend dependencies
├── next.config.ts                   Next.js configuration
└── tsconfig.json

weather-dashboard/                   Frontend (Vite 6 + React 19)
├── src/
│   ├── App.tsx                      Main app (493 lines): routing, state, layout
│   ├── main.tsx                     React entry point
│   ├── index.css                    Tailwind CSS v4 + glass-panel classes
│   ├── lib/
│   │   └── weather.ts               Open-Meteo client, WMO decoder, ZIP search
│   ├── components/
│   │   ├── SearchBar.tsx            City / ZIP / coordinate search with autocomplete
│   │   ├── WeatherEffects.tsx       Canvas-based weather particle system
│   │   ├── HourlyForecast.tsx       12-hour projection with Recharts sparkline
│   │   ├── WeekForecast.tsx         7-day forecast with temperature bars
│   │   ├── MapSection.tsx           Leaflet interactive map with fly-to animation
│   │   ├── TravelInsights.tsx       Rule-based travel readiness score (0–100)
│   │   ├── YouTubeSection.tsx       Travel video results from YouTube API
│   │   └── SavedRequests.tsx        CRUD table + CSV / JSON / MD export
│   ├── vite-env.d.ts                ImportMeta type declarations
├── index.html                       HTML shell
├── vite.config.ts                   Vite config with /api proxy to :3000
├── vercel.json                      Vite deployment configuration
├── .env.example                     Frontend env var templates
├── .gitignore                       Vercel .vercel dir ignored
└── package.json                     Frontend dependencies
```

### Data Flow

```
User Input (city / ZIP / GPS)
        │
        ▼
SearchBar ──► Open-Meteo Geocoding (city search)
            └─► OpenWeatherMap Geocoding (ZIP search)
        │
        ▼
App.tsx ──► Open-Meteo Forecast API (free, no key needed)
        │
        ▼
Weather Display + Stats + Hourly + Weekly Forecast + Map + Insights
        │
        ▼ (user saves a request)
SavedRequests ──► /api/history (POST / PATCH / DELETE)
                        │
                        ▼
                 Supabase PostgreSQL
                 (or in-memory fallback)
```

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
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | No | Google Maps API key (reserved) |

### Frontend (`weather-dashboard/.env` or `weather-dashboard/.env.local`)

Injected at build time via `import.meta.env`. Only variables prefixed with `VITE_` are accessible.

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No | Backend API base URL for production (empty = same origin) |
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

## Deployment

Both applications are deployed on Vercel:

| App | URL | Config |
|---|---|---|
| **Frontend** | [weather-dashboard-kappa-ten.vercel.app](https://weather-dashboard-kappa-ten.vercel.app) | `weather-dashboard/vercel.json` (Vite) |
| **Backend** | [weatherwise-backend-seven.vercel.app](https://weatherwise-backend-seven.vercel.app) | Auto-detected Next.js |

Environment variables are configured via `vercel env add` for each project.

---

## Project Status

All core features are implemented with zero TypeScript errors and clean builds across both frontend and backend. Deployed and production-ready.
