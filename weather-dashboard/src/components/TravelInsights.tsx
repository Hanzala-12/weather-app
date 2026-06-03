import React from 'react';
import { motion } from 'motion/react';
import { Check, X, ShieldAlert } from 'lucide-react';
import { type WeatherData } from '../lib/weather';

interface TravelInsightsProps {
  weather: WeatherData;
}

export default function TravelInsights({ weather }: TravelInsightsProps) {
  const currentTemp = weather.current.temperature;
  const isRaining = [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weather.current.weathercode);
  const isSnowing = [71, 73, 75, 77, 85, 86].includes(weather.current.weathercode);
  const uvIndex = weather.hourly.weathercode; // We don't have accurate UV in this free API, but we'll mock based on conditions
  const isClear = [0, 1].includes(weather.current.weathercode);
  
  let score = 85;
  const recommended = [];
  const avoid = [];

  if (currentTemp > 30) {
    score -= 10;
    recommended.push('Water Bottle', 'Sunglasses', 'Light Clothing');
    avoid.push('Outdoor activity 12PM-4PM', 'Heavy Fabrics');
  } else if (currentTemp < 10) {
    score -= 15;
    recommended.push('Warm Coat', 'Gloves', 'Hot Drink');
    avoid.push('Extended outdoor exposure without layers');
  } else {
    recommended.push('Comfortable Walking Shoes', 'Camera');
  }

  if (isRaining) {
    score -= 20;
    recommended.push('Umbrella', 'Waterproof Jacket');
    avoid.push('Long walking tours');
  } else if (isSnowing) {
    score -= 25;
    recommended.push('Winter Boots', 'Thick Beanie');
    avoid.push('Driving if inexperienced in snow');
  } else if (isClear && currentTemp > 10 && currentTemp <= 30) {
    score += 10;
  }

  // Cap score
  score = Math.min(100, Math.max(0, score));

  let scoreColor = '#34d399'; // green-400
  if (score < 50) scoreColor = '#f87171'; // red-400
  else if (score < 80) scoreColor = '#fbbf24'; // amber-400

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
      className="glass-panel"
      style={{
        padding: 20,
        borderRadius: '1.5rem',
        marginTop: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Travel Readiness Profile
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldAlert size={16} color={scoreColor} />
          <span style={{ fontSize: 20, fontWeight: 600, color: scoreColor }}>{score}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>/100</span></span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.8)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            Recommended
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recommended.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <Check size={16} className="text-emerald-400 shrink-0" style={{ marginTop: 2 }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.8)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            Avoid
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {avoid.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <X size={16} className="text-red-400 shrink-0" style={{ marginTop: 2 }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
