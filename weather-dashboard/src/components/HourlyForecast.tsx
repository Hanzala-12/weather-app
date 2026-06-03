import React from 'react';
import { decodeWMO, type WeatherData } from '../lib/weather';
import { Droplets } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface HourlyForecastProps {
  hourly: WeatherData['hourly'];
  currentHourIndex: number;
}

export default function HourlyForecast({ hourly, currentHourIndex }: HourlyForecastProps) {
  // Get next 12 hours
  const endIndex = Math.min(currentHourIndex + 12, hourly.time.length);
  const hours = hourly.time.slice(currentHourIndex, endIndex);
  const temps = hourly.temperature_2m.slice(currentHourIndex, endIndex);
  const codes = hourly.weathercode.slice(currentHourIndex, endIndex);
  const precip = hourly.precipitation_probability.slice(currentHourIndex, endIndex);

  const chartData = hours.map((_, i) => ({
    temp: Math.round(temps[i]),
  }));

  const minTemp = Math.min(...chartData.map(d => d.temp));
  const maxTemp = Math.max(...chartData.map(d => d.temp));

  return (
    <div className="glass-panel" style={{ padding: 20, borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <h3 style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
        Hourly Projection
      </h3>
      
      <div className="scrollbar-hide" style={{ display: 'flex', overflowX: 'auto', gap: 8, paddingBottom: 8, margin: '0 -8px', paddingLeft: 8, paddingRight: 8, scrollSnapType: 'x mandatory', position: 'relative', zIndex: 10 }}>
        {hours.map((time, idx) => {
          const date = new Date(time);
          const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const { icon: Icon } = decodeWMO(codes[idx]);
          const pop = precip[idx];
          
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, minWidth: 72, scrollSnapAlign: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 12, fontFamily: 'var(--font-ui)' }}>
                {idx === 0 ? 'Now' : timeString}
              </span>
              
              <Icon size={20} style={{ color: 'white', marginBottom: 12 }} strokeWidth={2} />
              
              <span style={{ color: 'white', fontWeight: 500, fontSize: 18, marginBottom: 4, fontFamily: 'var(--font-ui)' }}>
                {Math.round(temps[idx])}&deg;
              </span>
              
              {pop > 20 && (
                <div style={{ display: 'flex', alignItems: 'center', color: '#93c5fd', gap: 4, fontSize: 11, fontWeight: 500 }}>
                  <Droplets size={10} />
                  {pop}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', opacity: 0.3, pointerEvents: 'none' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={[minTemp - 2, maxTemp + 2]} hide />
            <Area type="monotone" dataKey="temp" stroke="rgba(255,255,255,0.8)" strokeWidth={2} fillOpacity={1} fill="url(#tempGradient)" isAnimationActive={true} animationDuration={1000} animationEasing="ease-in-out" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
