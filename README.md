# WeatherWise — Full-Stack Weather Intelligence Dashboard

A weather dashboard built for the PM Accelerator AI Engineer Technical Assessment. It displays real-time weather data, forecasts, and interactive maps, and supports saved search history with Supabase persistence and multi-format data export.

**Built by Hanzala Yaqoob · PM Accelerator Candidate**

---

## Live Demo

| Layer | URL |
|---|---|
| **Frontend** (user interface) | [https://weather-dashboard-kappa-ten.vercel.app](https://weather-dashboard-kappa-ten.vercel.app) |
| **Backend** (API server) | [https://weatherwise-backend-seven.vercel.app](https://weatherwise-backend-seven.vercel.app) |
| **GitHub Repository** | [https://github.com/Hanzala-12/weather-app](https://github.com/Hanzala-12/weather-app) |

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

### Visual Experience
- **Weather effects engine** — Dynamic sky gradients, volumetric clouds, canvas rain/snow/lightning, fog layers, wind streaks, night stars
- **Weather simulator** — Bottom dock to toggle between Live, Clouds, Fog, Rain, Snow, and Thunder
- **Animated loading screen** — Pulse-ring animation while detecting location
- **Toast notifications** — Slide-in error and info toasts with auto-dismiss

### Saved Requests (CRUD)
| Operation | Endpoint | Method |
|---|---|---|
| **Create** | `/api/history` | POST |
| **Read (list)** | `/api/history` | GET |
| **Update** | `/api/history/:id` | PATCH |
| **Delete** | `/api/history/:id` | DELETE |

- Server-side validation (dates, required fields, cross-field checks)
- Supabase PostgreSQL persistence with automatic in-memory fallback
- localStorage fallback when backend is unavailable
- **Data export** — Download saved requests as CSV, JSON, or Markdown

### Additional Capabilities
- **Interactive map** — Leaflet with OpenStreetMap tiles, fly-to animation on location change
- **Travel readiness score** — 0–100 rule-based score with dynamic recommendations (umbrella, sunscreen, wind warnings)
- **YouTube travel videos** — City travel guides via YouTube Data API (falls back to a YouTube search link when no key is configured)
- **Multi-format data export** — JSON, CSV, XML, Markdown from frontend and/or backend

---

## Architecture

WeatherWise is a full-stack weather application consisting of a React frontend and a Next.js backend connected through REST APIs.

```
Root (Backend — Next.js 15)
├── src/app/api/            REST API routes (history CRUD, export)
├── src/lib/                Supabase client, Open-Meteo integration
├── supabase-migration.sql  PostgreSQL schema
├── package.json
├── next.config.ts
└── tsconfig.json

weather-dashboard/          Frontend (Vite 6 + React 19)
├── src/components/         SearchBar, WeatherEffects, HourlyForecast,
│                           WeekForecast, MapSection, TravelInsights,
│                           YouTubeSection, SavedRequests
├── src/lib/                Open-Meteo client, WMO decoder, ZIP search
├── src/App.tsx             Main app component
├── src/index.css           Tailwind CSS v4 + glass-panel styles
├── vite.config.ts          Dev proxy /api → localhost:3000
├── vercel.json             Vite deployment config
├── .env.example            Frontend env var templates
└── package.json
```

### Data Flow

- The frontend fetches weather data directly from **Open-Meteo** (free, no API key).
- ZIP code searches call **OpenWeatherMap** for lat/lon conversion, then query Open-Meteo.
- Saved requests are sent to the backend at `/api/history`, which persists to **Supabase PostgreSQL** (or an in-memory store if Supabase is not configured).
- During development, the Vite dev server proxies `/api/*` to `localhost:3000`.

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

### Database Setup (Optional)

Run `supabase-migration.sql` in your Supabase SQL Editor to create the `weather_searches` table with Row Level Security policies. If Supabase is not configured, the app falls back to an in-memory store automatically.

---

## Environment Variables

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

| API | Purpose | Auth |
|---|---|---|
| **Open-Meteo** | Weather data (current, hourly, daily) + geocoding | Free, no key |
| **OpenWeatherMap** | ZIP code → lat/lon conversion | API key |
| **OpenStreetMap** | Map tiles for Leaflet | Free |
| **YouTube Data API v3** | City travel videos | API key (optional) |
| **Supabase** | PostgreSQL database | API keys (optional) |

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
| **Frontend** | [weather-dashboard-kappa-ten.vercel.app](https://weather-dashboard-kappa-ten.vercel.app) | Vite (`vercel.json`) |
| **Backend** | [weatherwise-backend-seven.vercel.app](https://weatherwise-backend-seven.vercel.app) | Next.js (auto-detected) |

Required environment variables are documented above.

---

## Assessment Requirement Coverage

✅ Current weather

✅ City search

✅ ZIP code search

✅ GPS location support

✅ 7-day forecast

✅ CRUD operations

✅ Database persistence

✅ Error handling

✅ Data export

✅ Additional API integrations (Maps, YouTube)

✅ Responsive design

---

## Project Status

All assessment requirements have been implemented and tested, including weather search, forecasting, CRUD operations, data persistence, export functionality, and third-party API integrations. The application is deployed and accessible through the live demo links above.
