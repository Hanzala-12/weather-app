import React from 'react';
import { decodeWMO, type WeatherData } from '../lib/weather';

interface WeekForecastProps {
  daily: WeatherData['daily'];
}

export default function WeekForecast({ daily }: WeekForecastProps) {
  const numDays = Math.min(7, daily.time.length);
  
  // Find global min and max to scale the range bars
  const globalMin = Math.min(...daily.temperature_2m_min.slice(0, numDays));
  const globalMax = Math.max(...daily.temperature_2m_max.slice(0, numDays));
  const tempRange = globalMax - globalMin || 1; // prevent div by 0

  return (
    <div className="glass-panel" style={{ padding: 20, borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
        7-Day Analysis
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: numDays }).map((_, i) => {
          const date = new Date(daily.time[i]);
          const dayName = i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
          const { icon: Icon, label } = decodeWMO(daily.weathercode[i]);
          const minT = Math.round(daily.temperature_2m_min[i]);
          const maxT = Math.round(daily.temperature_2m_max[i]);
          
          const leftPercent = ((daily.temperature_2m_min[i] - globalMin) / tempRange) * 100;
          const widthPercent = ((daily.temperature_2m_max[i] - daily.temperature_2m_min[i]) / tempRange) * 100;

          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', fontSize: 14, fontFamily: 'var(--font-ui)' }}>
              <span style={{ width: 48, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                {dayName}
              </span>
              
              <div style={{ width: 32, display: 'flex', justifyContent: 'center' }}>
                <Icon size={20} style={{ color: 'rgba(255,255,255,0.8)' }} strokeWidth={1.5} />
              </div>
              
              <span style={{ flex: 1, padding: '0 16px', fontSize: 12, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {label}
              </span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: 140, justifyContent: 'flex-end' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', width: 24, textAlign: 'right' }}>{minT}&deg;</span>
                
                <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 9999, position: 'relative', overflow: 'hidden' }}>
                  <div 
                    style={{ position: 'absolute', top: 0, bottom: 0, borderRadius: 9999,
                      background: i === 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)',
                      left: `${leftPercent}%`, width: `${Math.max(widthPercent, 5)}%` 
                    }}
                  />
                </div>
                
                <span style={{ color: 'white', fontWeight: 500, width: 24 }}>{maxT}&deg;</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
