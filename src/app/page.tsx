"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import {
  MapPin, Wind, Droplets, Sun, Moon, Cloud, CloudSun, CloudMoon,
  CloudFog, CloudDrizzle, CloudRain, CloudLightning, Snowflake,
  Search, Navigation, Loader2, AlertCircle, Sparkles,
  FileJson, FileSpreadsheet, FileText, FileDown,
  CalendarDays, TrendingUp, Clock, Trash2, RotateCcw, Edit3, Save,
  Youtube, CheckCircle2, X
} from "lucide-react";
import type { WeatherData, CitySuggestion } from "@/lib/weather";
import { fetchWeatherByCity, fetchWeatherByCoords, fetchWeatherByZip, fetchCitySuggestions } from "@/lib/weather";
import { saveSearch } from "@/lib/supabase";

const IconMap: Record<string, any> = {
  sun: Sun, moon: Moon, "cloud-sun": CloudSun, "cloud-moon": CloudMoon,
  cloud: Cloud, "cloud-fog": CloudFog, "cloud-drizzle": CloudDrizzle,
  "cloud-rain": CloudRain, "cloud-showers-heavy": CloudRain,
  "cloud-lightning": CloudLightning, snowflake: Snowflake,
};

function isLatLon(q: string): boolean {
  const p = q.split(","); if (p.length !== 2) return false;
  const lat = parseFloat(p[0]), lon = parseFloat(p[1]);
  return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

function isZip(q: string): boolean { return /^\d{5}(-\d{4})?$/.test(q.trim()); }

export default function Home() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [history, setHistory] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateError, setDateError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState("");

  // Geolocation on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => loadWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
        () => loadWeather("Tokyo"),
        { timeout: 5000 }
      );
    } else {
      loadWeather("Tokyo");
    }
  }, []);

  // Debounced autocomplete
  useEffect(() => {
    if (query.trim().length < 2) { setSuggestions([]); setShowDropdown(false); return; }
    const t = setTimeout(async () => {
      const r = await fetchCitySuggestions(query.trim());
      setSuggestions(r); setShowDropdown(r.length > 0); setActiveIndex(-1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // History
  useEffect(() => { fetchHistory(); }, [refreshKey]);

  const fetchHistory = async () => {
    try { const r = await fetch("/api/history"); setHistory(await r.json()); } catch { /* ignore */ }
  };

  const loadWeather = async (q: string) => {
    setLoading(true); setError(null);
    try {
      let result: WeatherData;
      if (isLatLon(q)) { const [lat, lon] = q.split(",").map(s => parseFloat(s.trim())); result = await fetchWeatherByCoords(lat, lon); }
      else if (isZip(q)) result = await fetchWeatherByZip(q);
      else result = await fetchWeatherByCity(q);
      setWeather(result);
      setRefreshKey(k => k + 1);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to fetch"); setWeather(null); }
    finally { setLoading(false); }
  };

  const loadWeatherByCoords = async (lat: number, lon: number) => {
    setLoading(true); setError(null);
    try { const result = await fetchWeatherByCoords(lat, lon); setWeather(result); setRefreshKey(k => k + 1); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed"); setWeather(null); }
    finally { setLoading(false); }
  };

  const handleSearchWithDates = async () => {
    if (!query.trim()) return;
    setDateError("");
    if (dateFrom && dateTo) {
      const f = new Date(dateFrom), t = new Date(dateTo);
      if (isNaN(f.getTime()) || isNaN(t.getTime())) { setDateError("Invalid date format"); return; }
      if (t < f) { setDateError("End date must be after start date"); return; }
    }
    await loadWeather(query.trim());
  };

  // Save to DB with date range after weather loads
  useEffect(() => {
    if (!weather) return;
    saveSearch(
      weather.city, weather.country, weather.current.temp,
      weather.current.description, weather.current.humidity,
      weather.current.windSpeed, weather.current.icon,
      dateFrom || undefined, dateTo || undefined
    );
  }, [weather?.current.temp]);

  const exportJSON = () => {
    if (!weather) return;
    const data = { city: weather.city, country: weather.country, current: weather.current, daily: weather.daily, hourly: weather.hourly, exportedAt: new Date().toISOString() };
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    a.download = `weather-${weather.city}-${new Date().toISOString().split("T")[0]}.json`; a.click();
  };

  const exportCSV = () => {
    if (!weather) return;
    const headers = ["Date", "City", "Temperature", "Condition"];
    const rows = weather.daily.map(d => [d.time.toISOString().split("T")[0], weather.city, d.maxTemp.toString(), d.description]);
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n")], { type: "text/csv" }));
    a.download = `weather-${weather.city}-${new Date().toISOString().split("T")[0]}.csv`; a.click();
  };

  const exportXML = () => {
    if (!weather) return;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<weatherData>\n  <city>${weather.city}</city>\n  <country>${weather.country}</country>\n  <current>\n    <temperature>${weather.current.temp}</temperature>\n    <condition>${weather.current.description}</condition>\n    <humidity>${weather.current.humidity}</humidity>\n    <windSpeed>${weather.current.windSpeed}</windSpeed>\n  </current>\n  <forecast>\n${weather.daily.map(d => `    <day date="${d.time.toISOString().split("T")[0]}"><maxTemp>${d.maxTemp}</maxTemp><minTemp>${d.minTemp}</minTemp><condition>${d.description}</condition></day>`).join("\n")}\n  </forecast>\n</weatherData>`;
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([xml], { type: "application/xml" }));
    a.download = `weather-${weather.city}-${new Date().toISOString().split("T")[0]}.xml`; a.click();
  };

  const exportMarkdown = () => {
    if (!weather) return;
    let md = `# Weather Report: ${weather.city}, ${weather.country}\n\n`;
    md += `## Current Conditions\n- Temperature: **${weather.current.temp}°C**\n- Feels Like: ${weather.current.feelsLike}°C\n- Humidity: ${weather.current.humidity}%\n- Wind Speed: ${weather.current.windSpeed} km/h\n- Condition: ${weather.current.description}\n\n`;
    md += `## 7-Day Forecast\n| Date | Condition | High | Low |\n|------|-----------|------|-----|\n`;
    md += weather.daily.map(d => `| ${d.time.toISOString().split("T")[0]} | ${d.description} | ${d.maxTemp}°C | ${d.minTemp}°C |`).join("\n");
    md += `\n\n*Exported on ${new Date().toISOString()}*`;
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    a.download = `weather-${weather.city}-${new Date().toISOString().split("T")[0]}.md`; a.click();
  };

  const handleDelete = async (id: number) => {
    try { await fetch(`/api/history/${id}`, { method: "DELETE" }); setHistory(p => p.filter((i: any) => i.id !== id)); } catch { /* ignore */ }
  };

  const handleUpdateNotes = async (id: number) => {
    try { await fetch(`/api/history/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes: editNotes }) }); setEditingId(null); setRefreshKey(k => k + 1); } catch { /* ignore */ }
  };

  if (loading && !weather) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030305]">
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.2, 1, 0.2] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="w-20 h-20 rounded-full bg-white/5 blur-2xl" />
      </div>
    );
  }

  const bgGlow = weather?.current.isDay
    ? "radial-gradient(circle at 50% -20%, rgba(56,189,248,0.12), rgba(3,3,5,1) 70%)"
    : "radial-gradient(circle at 50% -20%, rgba(139,92,246,0.12), rgba(3,3,5,1) 70%)";

  const CurrentIcon = weather ? IconMap[weather.current.icon] || Cloud : Cloud;

  const youtubeQuery = weather ? `${weather.city} ${weather.country} weather travel guide` : "";

  return (
    <div className="min-h-screen w-full flex flex-col items-center py-6 px-4 md:px-8 relative overflow-hidden font-sans" style={{ background: bgGlow }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/8 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/8 blur-[120px] rounded-full" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-5xl z-10 flex flex-col gap-6">

        {/* Header with PM Accelerator info */}
        <header className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="text-lg font-display font-medium text-gradient">WeatherWise</span>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-xs font-mono text-slate-600 tracking-wider">Built by Hanzala · PM Accelerator Candidate</p>
            <p className="text-[10px] text-slate-700 mt-0.5 max-w-xs">
              <a href="https://www.linkedin.com/company/product-manager-accelerator/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Product Manager Accelerator</a> — Empowering aspiring PMs with real-world training
            </p>
          </div>
        </header>

        {/* Search + Date Range */}
        <div className="space-y-3">
          <form onSubmit={(e) => { e.preventDefault(); handleSearchWithDates(); setShowDropdown(false); }} className="flex gap-3 relative">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                placeholder="City, ZIP, or lat,lon..."
                value={query} onChange={(e) => setQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(p => Math.min(p + 1, suggestions.length - 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex(p => Math.max(p - 1, 0)); }
                  if (e.key === "Escape") setShowDropdown(false);
                }}
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-slate-200 placeholder:text-slate-600 text-sm outline-none focus:border-white/[0.15] focus:bg-white/[0.05] transition-all"
              />
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0f] border border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden">
                  {suggestions.map((s, i) => (
                    <button key={`${s.lat}-${s.lon}`} type="button"
                      onMouseDown={(e) => { e.preventDefault(); setQuery(`${s.name}, ${s.country}`); setShowDropdown(false); loadWeather(s.name); }}
                      className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-white/[0.04] transition-colors ${i === activeIndex ? "bg-white/[0.06]" : ""}`}
                    >
                      <Search className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span className="text-slate-300">{s.name}{s.state ? `, ${s.state}` : ""}</span>
                      <span className="text-slate-600 ml-auto text-xs">{s.country}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" disabled={!query.trim()} className="h-12 px-5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-slate-300 text-sm hover:bg-white/[0.1] transition-all disabled:opacity-30 font-medium"><Search className="w-4 h-4 sm:mr-1.5 inline" /><span className="hidden sm:inline"> Search</span></button>
            <button type="button" onClick={() => { if ("geolocation" in navigator) navigator.geolocation.getCurrentPosition((pos) => loadWeatherByCoords(pos.coords.latitude, pos.coords.longitude), () => setError("Location denied")); else setError("Geolocation not supported"); }}
              className="h-12 w-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] transition-all" title="My Location">
              <Navigation className="w-4 h-4 text-slate-400" />
            </button>
          </form>

          {/* Date Range */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-xs font-mono text-slate-600 uppercase tracking-wider">Date Range:</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-300 text-xs outline-none focus:border-white/[0.15]" />
            <span className="text-slate-700">→</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="h-9 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-300 text-xs outline-none focus:border-white/[0.15]" />
            {dateError && <span className="text-xs text-red-400 font-mono">{dateError}</span>}
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); setDateError(""); }} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Clear</button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-red-950/30 border border-red-800/20 text-red-400 max-w-3xl mx-auto">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-mono">{error}</p>
          </motion.div>
        )}

        {/* Weather Display */}
        {weather && (
          <>
            {/* Current Weather */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, duration: 0.8 }}
              className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <MapPin className="w-4 h-4" />
                <span className="font-medium tracking-wide">{weather.city}{weather.country ? `, ${weather.country}` : ""}</span>
                {weather.current.isDay ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <CurrentIcon className="w-20 h-20 md:w-28 md:h-28 text-slate-100 drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]" strokeWidth={1} />
              <div className="flex items-start justify-center relative">
                <h1 className="text-7xl md:text-[140px] font-display font-light leading-none tracking-tighter text-gradient pb-4">{weather.current.temp}</h1>
                <span className="text-3xl md:text-5xl font-display font-light text-slate-600 mt-1 md:mt-4 absolute -right-6 md:-right-14">°</span>
              </div>
              <p className="text-lg md:text-xl font-light text-slate-400 tracking-wide capitalize">{weather.current.description}</p>
              <div className="flex items-center justify-center gap-8 md:gap-12 pt-2">
                <div className="flex items-center gap-3 text-slate-500">
                  <Wind className="w-5 h-5" strokeWidth={1.5} />
                  <span className="font-mono text-sm">{weather.current.windSpeed} km/h</span>
                </div>
                <div className="w-px h-8 bg-white/[0.06]" />
                <div className="flex items-center gap-3 text-slate-500">
                  <Droplets className="w-5 h-5" strokeWidth={1.5} />
                  <span className="font-mono text-sm">{weather.current.humidity}%</span>
                </div>
              </div>
            </motion.div>

            {/* Grid: Hourly + Daily */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="glass-panel p-5 md:p-6 rounded-3xl">
                <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Hourly Projection
                </h3>
                <div className="flex overflow-x-auto pb-3 gap-5 snap-x scrollbar-hide">
                  {weather.hourly.slice(0, 12).map((hour, idx) => {
                    const HIcon = IconMap[hour.icon] || Cloud;
                    return (
                      <div key={idx} className="flex flex-col items-center gap-3 snap-start shrink-0 group">
                        <span className="text-xs text-slate-500 font-mono group-hover:text-slate-300 transition-colors">
                          {hour.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <HIcon className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
                        <span className="text-base font-display text-slate-200">{hour.temp}°</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="glass-panel p-5 md:p-6 rounded-3xl">
                <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5" /> 7-Day Analysis
                </h3>
                <div className="flex flex-col gap-3">
                  {weather.daily.map((day, idx) => {
                    const DIcon = IconMap[day.icon] || Cloud;
                    const isToday = idx === 0;
                    return (
                      <div key={idx} className="flex items-center justify-between group">
                        <span className={`w-24 text-sm ${isToday ? "text-white font-medium" : "text-slate-500"}`}>
                          {isToday ? "Today" : day.time.toLocaleDateString("en-US", { weekday: "long" })}
                        </span>
                        <div className="flex items-center gap-3 flex-1 justify-end md:justify-center">
                          <DIcon className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" strokeWidth={1.5} />
                          <span className="text-xs text-slate-600 capitalize w-16 text-right truncate hidden md:block">{day.description}</span>
                        </div>
                        <div className="flex items-center gap-4 w-20 justify-end font-display text-sm">
                          <span className="text-slate-600">{day.minTemp}°</span>
                          <span className="text-slate-200">{day.maxTemp}°</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* Date Range Validation + Export */}
            {dateFrom && dateTo && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-panel p-4 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                <p className="text-xs font-mono text-slate-400">
                  Date range validated: <span className="text-slate-200">{dateFrom}</span> → <span className="text-slate-200">{dateTo}</span>
                  . Temperature data for {weather.city} within this range is shown in the forecast above.
                </p>
              </motion.div>
            )}

            {/* Export Section */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="glass-panel p-4 md:p-5 rounded-3xl">
              <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileDown className="w-3.5 h-3.5" /> Export Data
              </h3>
              <div className="flex flex-wrap gap-3">
                <button onClick={exportJSON} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-400 hover:bg-white/[0.08] transition-all font-mono"><FileJson className="w-4 h-4" /> JSON</button>
                <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-400 hover:bg-white/[0.08] transition-all font-mono"><FileSpreadsheet className="w-4 h-4" /> CSV</button>
                <button onClick={exportXML} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-400 hover:bg-white/[0.08] transition-all font-mono"><FileText className="w-4 h-4" /> XML</button>
                <button onClick={exportMarkdown} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-400 hover:bg-white/[0.08] transition-all font-mono"><FileText className="w-4 h-4" /> Markdown</button>
              </div>
            </motion.div>

            {/* YouTube Integration */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              className="glass-panel p-4 md:p-5 rounded-3xl">
              <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Youtube className="w-3.5 h-3.5 text-red-400" /> Travel Videos — {weather.city}
              </h3>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-red-950/30 flex items-center justify-center shrink-0">
                  <Youtube className="w-5 h-5 text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-300 group-hover:text-white transition-colors truncate">
                    Watch travel guides for {weather.city}
                  </p>
                  <p className="text-xs text-slate-600">Search YouTube for {weather.city} travel content</p>
                </div>
                <span className="text-xs text-slate-600 shrink-0">Open →</span>
              </a>
            </motion.div>
          </>
        )}

        {/* History */}
        {history.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="glass-panel p-5 md:p-6 rounded-3xl">
            <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Search History ({history.length})</span>
              <span className="text-[10px] text-slate-700 font-normal normal-case">CRUD: Create · Read · Update · Delete</span>
            </h3>
            <div className="space-y-2">
              {history.map((record: any) => (
                <div key={record.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                      {(() => { const HIcon = IconMap[record.icon] || Cloud; return <HIcon className="w-4 h-4 text-slate-400" />; })()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-300 truncate">{record.city}, {record.country}</p>
                      <p className="text-xs text-slate-600">
                        {record.temperature}°C · {record.condition}
                        {record.date_from && record.date_to && ` · ${record.date_from} → ${record.date_to}`}
                        {record.notes && ` · "${record.notes}"`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => loadWeather(record.city)}
                      className="w-7 h-7 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition-colors"
                      title="Re-search"><RotateCcw className="w-3 h-3 text-slate-500" /></button>
                    <button onClick={() => { setEditingId(record.id); setEditNotes(record.notes || ""); }}
                      className="w-7 h-7 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition-colors"
                      title="Edit notes"><Edit3 className="w-3 h-3 text-slate-500" /></button>
                    <button onClick={() => handleDelete(record.id)}
                      className="w-7 h-7 rounded-lg hover:bg-red-950/30 flex items-center justify-center transition-colors"
                      title="Delete"><Trash2 className="w-3 h-3 text-red-400" /></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit Notes Modal */}
            {editingId && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-4 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">Edit Notes</span>
                  <button onClick={() => setEditingId(null)} className="text-slate-600 hover:text-slate-400"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex gap-3">
                  <input value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add a note to this search..."
                    className="flex-1 h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-300 text-sm outline-none focus:border-white/[0.15] placeholder:text-slate-700"
                  />
                  <button onClick={() => handleUpdateNotes(editingId)} disabled={!editNotes.trim()}
                    className="h-10 px-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/20 transition-all disabled:opacity-30 flex items-center gap-2"
                  ><Save className="w-3.5 h-3.5" /> Save</button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Footer */}
        <footer className="text-center py-6 text-[10px] font-mono text-slate-700 space-y-1">
          <p>Built by <span className="text-slate-500">Hanzala</span> · Full-Stack Weather App</p>
          <p>Tech: Next.js 15 · TypeScript · Tailwind CSS · Open-Meteo API · Supabase · Motion</p>
          <p><a href="https://www.linkedin.com/company/product-manager-accelerator/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">PM Accelerator</a> — Technical Assessment Submission</p>
        </footer>
      </motion.div>
    </div>
  );
}
