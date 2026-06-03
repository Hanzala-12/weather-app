import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { WeatherCondition, TimeOfDay } from '../lib/weather';

interface WeatherEffectsProps {
  condition: WeatherCondition;
  windspeedKph: number;
  timeOfDay: TimeOfDay;
  theme?: 'light' | 'dark';
}

// ── Sky gradient map ───────────────────────────────────────────────────────

function getSkyGradient(condition: WeatherCondition, timeOfDay: TimeOfDay): string {
  if (timeOfDay === 'dawn') {
    return 'linear-gradient(to top, #1a0a2e, #7b2d00, #ff6b35, #ffd27d)';
  }
  if (timeOfDay === 'dusk') {
    return 'linear-gradient(to top, #1a0a2e, #7c2d12, #c2410c, #92400e)';
  }
  if (timeOfDay === 'night') {
    return 'linear-gradient(to top, #000008, #03040f, #060818)';
  }
  // Day
  if (condition === 'clear' || condition === 'partly-cloudy') {
    return 'linear-gradient(to top, #0a2a5e, #1a6bc7, #56a0d3)';
  }
  if (condition === 'cloudy') {
    return 'linear-gradient(to top, #1c2333, #374151, #6b7280)';
  }
  if (condition === 'fog') {
    return 'linear-gradient(to top, #1a1f2a, #374151, #9ca3af)';
  }
  if (condition === 'snow') {
    return 'linear-gradient(to top, #0f172a, #1e3a5f, #b0c4de)';
  }
  if (condition === 'rain' || condition === 'drizzle') {
    return 'linear-gradient(to top, #0d1520, #1e2d3d, #374151)';
  }
  if (condition === 'thunderstorm') {
    return 'linear-gradient(to top, #050810, #0f1623, #1a1f2e)';
  }
  return 'linear-gradient(to top, #000008, #03040f, #060818)';
}

// ── Cloud config ───────────────────────────────────────────────────────────

interface CloudConfig {
  count: number;
  colorR: number;
  colorG: number;
  colorB: number;
  opacity: number;
  minBlur: number;
  maxBlur: number;
}

function getCloudConfig(condition: WeatherCondition): CloudConfig | null {
  if (condition === 'clear') return null;
  if (condition === 'partly-cloudy') return { count: 3, colorR: 255, colorG: 255, colorB: 255, opacity: 0.5, minBlur: 12, maxBlur: 20 };
  if (condition === 'cloudy') return { count: 8, colorR: 180, colorG: 185, colorB: 200, opacity: 0.7, minBlur: 16, maxBlur: 28 };
  if (condition === 'rain' || condition === 'drizzle') return { count: 8, colorR: 100, colorG: 110, colorB: 130, opacity: 0.75, minBlur: 20, maxBlur: 30 };
  if (condition === 'thunderstorm') return { count: 10, colorR: 30, colorG: 35, colorB: 55, opacity: 0.92, minBlur: 24, maxBlur: 40 };
  if (condition === 'snow') return { count: 5, colorR: 220, colorG: 228, colorB: 240, opacity: 0.65, minBlur: 14, maxBlur: 22 };
  if (condition === 'fog') return { count: 3, colorR: 180, colorG: 185, colorB: 200, opacity: 0.3, minBlur: 50, maxBlur: 80 };
  return { count: 5, colorR: 180, colorG: 185, colorB: 200, opacity: 0.6, minBlur: 16, maxBlur: 28 };
}

// ── Seeded random (deterministic per condition so clouds don't jump) ────────
function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

interface CloudCluster {
  id: number;
  puffs: { x: number; y: number; w: number; h: number; blur: number; opacity: number }[];
  top: string;
  left: string;
  delay: number;
}

function generateClouds(config: CloudConfig, seed: number): CloudCluster[] {
  const clusters: CloudCluster[] = [];
  for (let i = 0; i < config.count; i++) {
    const puffCount = 5 + Math.floor(seededRandom(seed + i * 37) * 5);
    const puffs = [];
    for (let p = 0; p < puffCount; p++) {
      const w = 80 + seededRandom(seed + i * 13 + p * 7) * 320;
      const h = w * (0.4 + seededRandom(seed + i * 7 + p * 3) * 0.35);
      const xOff = (seededRandom(seed + i * 5 + p * 11) - 0.3) * 200;
      const yOff = (seededRandom(seed + i * 3 + p * 17) - 0.5) * 80;
      const blur = config.minBlur + seededRandom(seed + i + p * 41) * (config.maxBlur - config.minBlur);
      const opacity = config.opacity * (0.6 + seededRandom(seed + i * 23 + p) * 0.4);
      puffs.push({ x: xOff, y: yOff, w, h, blur, opacity });
    }
    clusters.push({
      id: i,
      puffs,
      top: `${5 + seededRandom(seed + i * 19) * 50}%`,
      left: `-20%`,
      delay: seededRandom(seed + i * 11) * -60,
    });
  }
  return clusters;
}

// ── Rain Canvas ────────────────────────────────────────────────────────────

interface RainCanvasProps {
  condition: WeatherCondition;
  windspeedKph: number;
}

function RainCanvas({ condition, windspeedKph }: RainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const dropsRef = useRef<{ x: number; y: number; length: number; speed: number; angle: number; opacity: number; width: number }[]>([]);

  const initDrops = useCallback((w: number, h: number) => {
    const isThunder = condition === 'thunderstorm';
    const isDrizzle = condition === 'drizzle';
    const count = isThunder ? 800 : isDrizzle ? 180 : 500;
    const baseAngle = isDrizzle ? -8 : isThunder ? -18 : -12;
    const windAngle = windspeedKph / 3;
    const angle = (baseAngle - windAngle) * (Math.PI / 180);

    dropsRef.current = Array.from({ length: count }, () => {
      const lengthMin = isDrizzle ? 8 : isThunder ? 20 : 14;
      const lengthRange = isDrizzle ? 6 : isThunder ? 16 : 12;
      const speedMin = isDrizzle ? 10 : isThunder ? 26 : 18;
      const speedRange = isDrizzle ? 4 : isThunder ? 8 : 8;
      const opMin = isDrizzle ? 0.25 : isThunder ? 0.4 : 0.35;
      const opRange = isDrizzle ? 0.2 : isThunder ? 0.3 : 0.3;
      const widthMin = isDrizzle ? 0.5 : isThunder ? 1.0 : 0.7;
      const widthRange = isDrizzle ? 0.5 : isThunder ? 1.0 : 0.8;

      return {
        x: Math.random() * w,
        y: Math.random() * h,
        length: lengthMin + Math.random() * lengthRange,
        speed: speedMin + Math.random() * speedRange,
        angle,
        opacity: opMin + Math.random() * opRange,
        width: widthMin + Math.random() * widthRange,
      };
    });
  }, [condition, windspeedKph]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initDrops(canvas.width, canvas.height);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(document.body);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const drop of dropsRef.current) {
        const ex = drop.x + Math.sin(drop.angle) * drop.length;
        const ey = drop.y + Math.cos(drop.angle) * drop.length;

        const grad = ctx.createLinearGradient(drop.x, drop.y, ex, ey);
        grad.addColorStop(0, `rgba(174, 214, 241, ${drop.opacity})`);
        grad.addColorStop(1, `rgba(174, 214, 241, 0)`);

        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = grad;
        ctx.lineWidth = drop.width;
        ctx.stroke();

        drop.y += drop.speed;
        drop.x += drop.speed * Math.tan(Math.abs(drop.angle)) * (drop.angle < 0 ? -1 : 1);

        if (drop.y > canvas.height + drop.length) {
          drop.y = -drop.length;
          drop.x = Math.random() * canvas.width;
        }
        if (drop.x > canvas.width + 50) drop.x = -50;
        if (drop.x < -50) drop.x = canvas.width + 50;
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [condition, windspeedKph, initDrops]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2 }}
    />
  );
}

// ── Snow Canvas ────────────────────────────────────────────────────────────

interface SnowCanvasProps {
  windspeedKph: number;
  heavy: boolean;
}

function SnowCanvas({ windspeedKph, heavy }: SnowCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const flakesRef = useRef<{ x: number; y: number; radius: number; speedY: number; phase: number; opacity: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const initFlakes = (w: number, h: number) => {
      const count = heavy ? 500 : 250;
      flakesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: 1 + Math.random() * 3,
        speedY: 0.4 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
        opacity: 0.6 + Math.random() * 0.4,
      }));
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initFlakes(canvas.width, canvas.height);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(document.body);

    const windDrift = windspeedKph / 60;
    let frame = 0;

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const f of flakesRef.current) {
        f.y += f.speedY;
        f.x += windDrift + Math.sin(f.phase + frame * 0.01) * 0.4;
        f.phase += 0.002;

        if (f.y > canvas.height + f.radius) { f.y = -f.radius; f.x = Math.random() * canvas.width; }
        if (f.x > canvas.width + 20) f.x = -20;
        if (f.x < -20) f.x = canvas.width + 20;

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${f.opacity})`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'white';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [windspeedKph, heavy]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2 }}
    />
  );
}

// ── Night Stars Canvas ─────────────────────────────────────────────────────

function StarsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    interface Star { x: number; y: number; radius: number; opacity: number; targetOpacity: number; bright: boolean }
    let stars: Star[] = [];

    const initStars = (w: number, h: number) => {
      stars = Array.from({ length: 300 }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: 0.3 + Math.random() * 1.2,
        opacity: 0.2 + Math.random() * 0.8,
        targetOpacity: 0.2 + Math.random() * 0.8,
        bright: i < 5,
      }));
      stars.slice(0, 5).forEach(s => { s.radius = 2; });
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars(canvas.width, canvas.height);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(document.body);

    // Twinkle interval
    const twinkleInterval = setInterval(() => {
      stars.forEach(s => {
        s.targetOpacity = 0.2 + Math.random() * 0.8;
      });
    }, 2000);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        // Lerp toward target opacity
        s.opacity += (s.targetOpacity - s.opacity) * 0.02;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
        if (s.bright) {
          ctx.shadowBlur = 6;
          ctx.shadowColor = 'white';
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      clearInterval(twinkleInterval);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1 }}
    />
  );
}

// ── Lightning ──────────────────────────────────────────────────────────────

interface BoltPath { points: [number, number][]; width: number; opacity: number }

function generateBolt(startX: number, w: number, h: number, depth = 0): BoltPath[] {
  const paths: BoltPath[] = [];
  const points: [number, number][] = [[startX, 0]];
  let x = startX;
  let y = 0;

  while (y < h * 0.85) {
    const dy = 40 + Math.random() * 40;
    const dx = (Math.random() - 0.5) * 70;
    y += dy;
    x = Math.max(w * 0.05, Math.min(w * 0.95, x + dx));
    points.push([x, y]);

    if (depth < 3 && Math.random() < 0.35) {
      const childPaths = generateBolt(x, w, h - y, depth + 1);
      // offset child paths vertically
      childPaths.forEach(cp => {
        cp.points = cp.points.map(([px, py]) => [px, py + y] as [number, number]);
        cp.width = Math.max(0.4, cp.width - 0.5);
        cp.opacity = cp.opacity * 0.7;
        paths.push(cp);
      });
    }
  }

  paths.unshift({ points, width: Math.max(0.8, 2.5 - depth * 0.6), opacity: 1 - depth * 0.2 });
  return paths;
}

function LightningOverlay() {
  const [bolts, setBolts] = React.useState<BoltPath[][]>([]);
  const [flashOpacity, setFlashOpacity] = React.useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerFlash = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const boltCount = 1 + Math.floor(Math.random() * 2);
    const newBolts: BoltPath[][] = [];
    for (let i = 0; i < boltCount; i++) {
      const startX = w * (0.2 + Math.random() * 0.6);
      newBolts.push(generateBolt(startX, w, h));
    }
    setBolts(newBolts);
    setFlashOpacity(0.18);

    setTimeout(() => setFlashOpacity(0), 80);
    setTimeout(() => setBolts([]), 220);

    const repeatCount = 2 + Math.floor(Math.random() * 2);
    if (repeatCount > 1) {
      setTimeout(() => {
        setFlashOpacity(0.12);
        setTimeout(() => setFlashOpacity(0), 60);
      }, 150);
    }

    const nextDelay = (5000 + Math.random() * 8000);
    timeoutRef.current = setTimeout(triggerFlash, nextDelay);
  }, []);

  useEffect(() => {
    const initialDelay = 1500 + Math.random() * 3000;
    timeoutRef.current = setTimeout(triggerFlash, initialDelay);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [triggerFlash]);

  return (
    <>
      {/* Ambient flash */}
      <div
        style={{
          position: 'fixed', inset: 0,
          background: `rgba(200,220,255,${flashOpacity})`,
          pointerEvents: 'none', zIndex: 6,
          transition: 'background 0.08s ease',
        }}
      />
      {/* SVG bolt overlay */}
      <svg
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 7, mixBlendMode: 'screen' }}
        viewBox={`0 0 ${typeof window !== 'undefined' ? window.innerWidth : 1000} ${typeof window !== 'undefined' ? window.innerHeight : 1000}`}
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="bolt-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {bolts.flat().map((path, i) => (
          <motion.polyline
            key={i}
            points={path.points.map(([x, y]) => `${x},${y}`).join(' ')}
            stroke={`rgba(180,205,255,${path.opacity})`}
            strokeWidth={path.width}
            fill="none"
            filter="url(#bolt-glow)"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, path.opacity, 0] }}
            transition={{ duration: 0.2, times: [0, 0.15, 1] }}
          />
        ))}
      </svg>
    </>
  );
}

// ── Wind Streaks SVG ───────────────────────────────────────────────────────

function WindStreaks() {
  const streaks = React.useMemo(() => {
    return Array.from({ length: 22 }, (_, i) => {
      const y = 5 + (i / 22) * 90;
      const x1 = -5;
      const cx = 20 + Math.random() * 30;
      const cy = y + (Math.random() - 0.5) * 6;
      const x2 = 105;
      const len = 60 + Math.random() * 40;
      const opacity = 0.06 + Math.random() * 0.07;
      const width = 0.5 + Math.random() * 1.5;
      const duration = 1.2 + Math.random() * 1.3;
      const delay = Math.random() * 2;
      return { i, y, x1, cx, cy, x2, len, opacity, width, duration, delay };
    });
  }, []);

  return (
    <svg
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 4 }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {streaks.map((s) => {
        const pathData = `M ${s.x1} ${s.y} Q ${s.cx} ${s.cy} ${s.x2} ${s.y}`;
        const pathLen = 120;
        return (
          <motion.path
            key={s.i}
            d={pathData}
            stroke={`rgba(255,255,255,${s.opacity})`}
            strokeWidth={s.width * 0.3}
            fill="none"
            initial={{ strokeDasharray: `${pathLen}`, strokeDashoffset: pathLen }}
            animate={{ strokeDashoffset: -pathLen }}
            transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'linear' }}
          />
        );
      })}
    </svg>
  );
}

// ── Fog Layers ─────────────────────────────────────────────────────────────

function FogLayers({ lite = false }: { lite?: boolean }) {
  const mult = lite ? 0.6 : 1;
  return (
    <>
      <motion.div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: '35vh',
          background: `linear-gradient(to top, rgba(160,168,180,${0.75 * mult}), transparent)`,
          filter: 'blur(50px)',
          pointerEvents: 'none', zIndex: 5,
        }}
        animate={{ x: ['-6%', '6%'] }}
        transition={{ duration: 14, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}
      />
      <motion.div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: '58vh',
          background: `linear-gradient(to top, rgba(175,182,192,${0.45 * mult}), transparent)`,
          filter: 'blur(35px)',
          pointerEvents: 'none', zIndex: 5,
        }}
        animate={{ x: ['6%', '-6%'] }}
        transition={{ duration: 20, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}
      />
      <motion.div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: '78vh',
          background: `linear-gradient(to top, rgba(190,196,205,${0.2 * mult}), transparent)`,
          filter: 'blur(70px)',
          pointerEvents: 'none', zIndex: 5,
        }}
        animate={{ x: ['-3%', '3%'] }}
        transition={{ duration: 28, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}
      />
    </>
  );
}

// ── Volumetric Clouds ──────────────────────────────────────────────────────

interface CloudLayerProps {
  condition: WeatherCondition;
  windspeedKph: number;
}

function CloudLayer({ condition, windspeedKph }: CloudLayerProps) {
  const config = getCloudConfig(condition);
  if (!config) return null;

  const seed = condition.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const clusters = generateClouds(config, seed);
  const duration = 80 / (1 + windspeedKph / 30);

  return (
    <>
      {clusters.map((cluster) => {
        const startOffset = cluster.delay / duration;
        return (
          <motion.div
            key={`${condition}-${cluster.id}`}
            style={{ position: 'absolute', top: cluster.top, left: 0, width: 0, height: 0 }}
            initial={{ x: `${startOffset * 130 - 20}%` }}
            animate={{ x: ['-20%', '120%'] }}
            transition={{
              duration,
              delay: cluster.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {cluster.puffs.map((puff, pi) => (
              <div
                key={pi}
                style={{
                  position: 'absolute',
                  left: puff.x,
                  top: puff.y,
                  width: puff.w,
                  height: puff.h,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, rgba(${config.colorR},${config.colorG},${config.colorB},${puff.opacity}), transparent 70%)`,
                  filter: `blur(${puff.blur}px)`,
                }}
              />
            ))}
          </motion.div>
        );
      })}
    </>
  );
}

// ── Main WeatherEffects Component ──────────────────────────────────────────

export default function WeatherEffects({ condition, windspeedKph, timeOfDay }: WeatherEffectsProps) {
  const gradient = getSkyGradient(condition, timeOfDay);
  const showRain = condition === 'rain' || condition === 'drizzle' || condition === 'thunderstorm';
  const showSnow = condition === 'snow';
  const showLightning = condition === 'thunderstorm';
  const showFog = condition === 'fog';
  const showFogLite = condition === 'drizzle';
  const showWindStreaks = (condition === 'rain' || condition === 'thunderstorm') && windspeedKph > 25;
  const showStars = timeOfDay === 'night';
  const isHeavySnow = condition === 'snow'; // treat all snow as potentially heavy for the sim

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* Layer 1: Sky gradient */}
      <AnimatePresence mode="sync">
        <motion.div
          key={gradient}
          style={{ position: 'absolute', inset: 0, background: gradient }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5, ease: 'easeInOut' }}
        />
      </AnimatePresence>

      {/* Layer 2: Clouds */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <AnimatePresence mode="sync">
          <motion.div
            key={condition}
            style={{ position: 'absolute', inset: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            <CloudLayer condition={condition} windspeedKph={windspeedKph} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Layer 8: Night Stars */}
      <AnimatePresence>
        {showStars && (
          <motion.div
            key="stars"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <StarsCanvas />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layer 3: Rain */}
      <AnimatePresence>
        {showRain && (
          <motion.div
            key={`rain-${condition}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <RainCanvas condition={condition} windspeedKph={windspeedKph} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layer 4: Snow */}
      <AnimatePresence>
        {showSnow && (
          <motion.div
            key="snow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <SnowCanvas windspeedKph={windspeedKph} heavy={isHeavySnow} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layer 5: Lightning */}
      <AnimatePresence>
        {showLightning && (
          <motion.div
            key="lightning"
            className="re-invert"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <LightningOverlay />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layer 6: Fog */}
      <AnimatePresence>
        {showFog && (
          <motion.div key="fog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2 }}>
            <FogLayers />
          </motion.div>
        )}
        {showFogLite && (
          <motion.div key="fog-lite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2 }}>
            <FogLayers lite />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layer 7: Wind streaks */}
      <AnimatePresence>
        {showWindStreaks && (
          <motion.div key="wind" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
            <WindStreaks />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header gradient overlay — always on top to protect readability */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '120px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)',
          pointerEvents: 'none', zIndex: 10,
        }}
      />
    </div>
  );
}
