import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Youtube, ExternalLink, Loader2 } from 'lucide-react';

interface YouTubeSectionProps {
  city: string;
}

interface VideoResult {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
}

export default function YouTubeSection({ city }: YouTubeSectionProps) {
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!city || city === 'Your Location') return;
    setLoading(true);
    setError(false);

    const fetchVideos = async () => {
      try {
        const query = encodeURIComponent(`${city} travel tourism guide`);
        const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;

        if (apiKey) {
          const res = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&maxResults=3&type=video&key=${apiKey}`
          );
          if (!res.ok) throw new Error('YouTube API failed');
          const data = await res.json();
          setVideos(
            (data.items || []).map((item: any) => ({
              id: item.id.videoId,
              title: item.snippet.title,
              channel: item.snippet.channelTitle,
              thumbnail: item.snippet.thumbnails.medium?.url || '',
            }))
          );
        } else {
          setVideos([]);
          setError(true);
        }
      } catch {
        setError(true);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchVideos, 300);
    return () => clearTimeout(timeout);
  }, [city]);

  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(city + ' travel tourism guide')}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="glass-panel"
      style={{
        padding: 20,
        borderRadius: '1.5rem',
        marginTop: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Youtube size={14} style={{ color: '#ff4444' }} /> Travel Videos
        </h3>
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
        >
          View all <ExternalLink size={12} />
        </a>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '20px 0' }}>
          <Loader2 size={16} className="animate-spin" style={{ color: 'rgba(255,255,255,0.4)' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Loading videos...</span>
        </div>
      ) : error && videos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
            YouTube API key not configured
          </p>
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, color: 'rgba(255,255,255,0.7)',
              background: 'rgba(255,255,255,0.08)', padding: '8px 16px',
              borderRadius: '9999px', textDecoration: 'none',
            }}
          >
            <Youtube size={14} style={{ color: '#ff4444' }} />
            Search YouTube for {city}
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {videos.map((video) => (
            <a
              key={video.id}
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', gap: 12, alignItems: 'center',
                textDecoration: 'none', padding: 8, borderRadius: 12,
                transition: 'background 0.2s',
                cursor: 'pointer',
              }}
              className="hover:bg-white/5"
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                style={{ width: 120, height: 68, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                loading="lazy"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {video.title}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                  {video.channel}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </motion.div>
  );
}
