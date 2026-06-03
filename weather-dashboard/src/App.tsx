import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'motion/react';
import {
  Sun, Cloud, CloudSun, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning,
  Wind, Droplets, Thermometer, MapPin, X
} from 'lucide-react';
import WeatherEffects from './components/WeatherEffects';
import SearchBar from './components/SearchBar';
import HourlyForecast from './components/HourlyForecast';
import WeekForecast from './components/WeekForecast';
import MapSection from './components/MapSection';
import TravelInsights from './components/TravelInsights';
import YouTubeSection from './components/YouTubeSection';
import SavedRequests from './components/SavedRequests';
import {
  fetchWeather, decodeWMO, getTimeOfDay, getCurrentHourIndex,
  type WeatherData, type WeatherCondition,
} from './lib/weather';

// ── Animated temperature counter ───────────────────────────────────────────

function AnimatedTemp({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 60, damping: 20 });
  const display = useTransform(spring, (v) => `${Math.round(v)}°`);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return (
    <motion.span style={{ display: 'inline-block' }}>
      {display}
    </motion.span>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
  type: 'info' | 'error';
}

// ── Simulator dock buttons ─────────────────────────────────────────────────

const SIM_BUTTONS: { label: string; value: WeatherCondition | null }[] = [
  { label: 'Live', value: null },
  { label: 'Clouds', value: 'cloudy' },
  { label: 'Fog', value: 'fog' },
  { label: 'Rain', value: 'rain' },
  { label: 'Snow', value: 'snow' },
  { label: 'Thunder', value: 'thunderstorm' },
];

// ── Main page ──────────────────────────────────────────────────────────────

export default function App() {
  const [location, setLocation] = useState<{ lat: number; lon: number; name: string; country: string }>({
    lat: 51.5074, lon: -0.1278, name: 'London', country: 'GB',
  });
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [simCondition, setSimCondition] = useState<WeatherCondition | null>(null);
  const toastIdRef = useRef(0);

  const addToast = useCallback((message: string, type: 'info' | 'error' = 'info') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const loadWeather = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const data = await fetchWeather(lat, lon, controller.signal);
      setWeather(data);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        addToast('Request timed out. Check your connection.', 'error');
      } else {
        addToast('Failed to fetch weather data. Try again.', 'error');
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [addToast]);

  const handleUseCurrentLocation = useCallback(() => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocation({ lat: latitude, lon: longitude, name: 'Your Location', country: '' });
          loadWeather(latitude, longitude);
        },
        () => {
          addToast('Failed to get location, using London', 'error');
          setLocation({ lat: 51.5074, lon: -0.1278, name: 'London', country: 'GB' });
          loadWeather(51.5074, -0.1278);
        },
        { timeout: 8000 }
      );
    } else {
      addToast('Geolocation not supported', 'error');
      loadWeather(51.5074, -0.1278);
    }
  }, [addToast, loadWeather]);

  // On mount: try geolocation, fall back to London
  useEffect(() => {
    handleUseCurrentLocation();
  }, [handleUseCurrentLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLocationChange = useCallback((lat: number, lon: number, name: string, country: string) => {
    setLocation({ lat, lon, name, country });
    loadWeather(lat, lon);
  }, [loadWeather]);

  // Derived values
  const decoded = weather ? decodeWMO(weather.current.weathercode) : { label: 'Loading...', icon: Cloud, condition: 'clear' as WeatherCondition };
  const activeCondition: WeatherCondition = simCondition ?? decoded.condition;
  
  // Use sim override for icon if set
  const ActiveIcon = simCondition ? decodeWMO(simCondition === 'clear' ? 0 : simCondition === 'snow' ? 71 : simCondition === 'thunderstorm' ? 95 : simCondition === 'fog' ? 45 : simCondition === 'rain' ? 61 : 3).icon : decoded.icon;
  const activeLabel = simCondition ? `Simulated: ${simCondition}` : decoded.label;
  
  const activeWindspeed = weather?.current.windspeed ?? 0;
  const timeOfDay = weather ? getTimeOfDay(weather.timezoneOffsetSeconds) : 'day';
  const currentHourIndex = weather ? getCurrentHourIndex(weather.hourly.time, weather.timezoneOffsetSeconds) : 0;
  const humidity = weather ? weather.current.humidity : 0;
  const feelsLike = weather ? Math.round(weather.current.apparentTemperature) : 0;

  // ── Loading screen ───────────────────────────────────────────────────────

  if (loading && !weather) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#000008',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 24,
      }}>
        <div style={{ position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            className="pulse-ring"
            style={{
              position: 'absolute', width: 64, height: 64,
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '50%',
            }}
          />
          <div
            className="pulse-ring"
            style={{
              position: 'absolute', width: 64, height: 64,
              border: '2px solid rgba(255,255,255,0.15)',
              borderRadius: '50%',
              animationDelay: '0.6s',
            }}
          />
          <MapPin size={24} style={{ color: 'rgba(255,255,255,0.8)' }} />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, fontFamily: 'var(--font-ui)', letterSpacing: '0.05em' }}>
          Detecting your location...
        </p>
      </div>
    );
  }

  // ── Main layout ──────────────────────────────────────────────────────────

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Background effects */}
      <WeatherEffects
        condition={activeCondition}
        windspeedKph={activeWindspeed}
        timeOfDay={timeOfDay}
      />

      {/* Content layer */}
      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <header
          className="glass-panel"
          style={{
            margin: '16px 16px 0',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            borderRadius: '1.25rem',
          }}
        >
          {/* Branding */}
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '0.04em',
            }}>
              WeatherWise
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.06em', marginTop: 2 }}>
              Built by Hanzala Yaqoob · PM Accelerator Candidate
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em', marginTop: 1, maxWidth: '300px' }}>
              Product Manager Accelerator
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em', maxWidth: '300px' }}>
              Empowering aspiring product managers through real-world training and experience
            </div>
          </div>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: 320, minWidth: 200 }}>
            <SearchBar onLocationChange={handleLocationChange} onUseCurrentLocation={handleUseCurrentLocation} />
          </div>
        </header>

        {/* ── Location badge ────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <MapPin size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-ui)' }}>
            {location.name}{location.country ? `, ${location.country}` : ''}
          </span>
        </div>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '24px 16px',
        }}>
          {/* Animated weather icon */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCondition}
              initial={{ opacity: 0, scale: 0.7, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: -20 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              style={{ marginBottom: 16, filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}
            >
              <ActiveIcon size={80} style={{ color: 'rgba(255,255,255,0.92)' }} strokeWidth={1.5} />
            </motion.div>
          </AnimatePresence>

          {/* Temperature */}
          {weather && (
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(100px, 14vw, 160px)',
                fontWeight: 700,
                lineHeight: 1,
                background: 'linear-gradient(to bottom, rgba(255,255,255,1), rgba(255,255,255,0.25))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.03em',
              }}
            >
              <AnimatedTemp value={weather.current.temperature} />
            </div>
          )}

          {/* Description */}
          <AnimatePresence mode="wait">
            <motion.p
              key={activeLabel}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              style={{
                marginTop: 8,
                fontSize: 18,
                color: 'rgba(255,255,255,0.65)',
                fontStyle: 'italic',
                fontFamily: 'var(--font-ui)',
                fontWeight: 300,
                textTransform: 'capitalize',
              }}
            >
              {activeLabel}
            </motion.p>
          </AnimatePresence>

        {/* Stats row */}
        {weather && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            style={{
              marginTop: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {[
              { icon: Wind, label: 'Wind', value: `${Math.round(activeWindspeed)} km/h` },
              { icon: Droplets, label: 'Humidity', value: `${humidity}%` },
              { icon: Thermometer, label: 'Feels Like', value: `${feelsLike}°` },
              { icon: CloudFog, label: 'Visibility', value: `${weather.current.visibility / 1000} km` },
              { icon: Sun, label: 'Pressure', value: `${Math.round(weather.current.pressure)} hPa` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={15} style={{ color: 'rgba(255,255,255,0.4)' }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-ui)' }}>{label}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500, fontFamily: 'var(--font-ui)' }}>{value}</span>
              </div>
            ))}
          </motion.div>
        )}
        </div>

        {/* ── Forecast grid ─────────────────────────────────────────────── */}
        {weather && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
              padding: '0 16px 20px',
              maxWidth: '1200px',
              width: '100%',
              margin: '0 auto'
            }}
          >
            <HourlyForecast hourly={weather.hourly} currentHourIndex={currentHourIndex} />
            <WeekForecast daily={weather.daily} />
          </motion.div>
        )}

        {/* ── Advanced Features ─────────────────────────────────────────────── */}
        {weather && (
          <div style={{
            maxWidth: '1200px',
            width: '100%',
            margin: '0 auto',
            padding: '0 16px 140px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
            }}>
              <MapSection lat={location.lat} lon={location.lon} city={location.name} />
              <TravelInsights weather={weather} />
            </div>

            <YouTubeSection city={location.name} />
            
            <SavedRequests currentLocation={location.name} />
          </div>
        )}
      </div>

      {/* ── Simulator dock ─────────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
        }}
      >
        <div
          className="glass-panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 8px',
            overflowX: 'auto',
            maxWidth: 'calc(100vw - 32px)',
            borderRadius: '9999px',
          }}
        >
          {SIM_BUTTONS.map((btn) => {
            const isActive = simCondition === btn.value;
            return (
              <div key={btn.label} style={{ position: 'relative', flexShrink: 0 }}>
                {isActive && (
                  <motion.div
                    layoutId="sim-active"
                    style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(255,255,255,0.95)',
                      borderRadius: 9999,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <button
                  onClick={() => setSimCondition(btn.value)}
                  style={{
                    position: 'relative',
                    padding: '7px 16px',
                    borderRadius: 20,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: 'var(--font-ui)',
                    color: isActive ? '#000' : 'rgba(255,255,255,0.65)',
                    transition: 'color 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {btn.label}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Toasts ──────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: 90,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 100,
        }}
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ duration: 0.3 }}
              className="glass-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: toast.type === 'error'
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'rgba(255,255,255,0.08)',
                maxWidth: 280,
                borderRadius: '1rem',
              }}
            >
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-ui)', flex: 1 }}>
                {toast.message}
              </span>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}
              >
                <X size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
