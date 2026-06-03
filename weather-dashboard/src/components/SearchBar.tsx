import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Clock, X, Loader2 } from 'lucide-react';
import { searchCities, searchZip, type CityResult } from '../lib/weather';

interface SearchBarProps {
  onLocationChange: (lat: number, lon: number, cityName: string, country: string) => void;
  onUseCurrentLocation?: () => void;
}

export default function SearchBar({ onLocationChange, onUseCurrentLocation }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(false);
  const [recentSearches, setRecentSearches] = useState<CityResult[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const saveRecentSearch = (city: CityResult) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter(c => c.id !== city.id);
      const newRecent = [city, ...filtered].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(newRecent));
      return newRecent;
    });
  };

  const removeRecentSearch = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const newRecent = prev.filter(c => c.id !== id);
      localStorage.setItem('recentSearches', JSON.stringify(newRecent));
      return newRecent;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      setError(false);
      try {
        const isZip = /^\d{5}(-\d{4})?$/.test(query.trim());
        const isCoords = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/.test(query);

        if (isZip) {
          const zipResult = await searchZip(query.trim());
          setResults(zipResult ? [zipResult] : []);
        } else if (isCoords) {
           const [lat, lon] = query.split(',').map(s => parseFloat(s.trim()));
           setResults([{ id: Date.now(), name: `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`, latitude: lat, longitude: lon, country: '' }]);
        } else {
           const cities = await searchCities(query);
           setResults(cities);
        }
        setIsOpen(true);
      } catch (err) {
        setError(true);
        setResults([]);
        setIsOpen(true);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (city: CityResult) => {
    saveRecentSearch(city);
    setQuery('');
    setIsOpen(false);
    onLocationChange(city.latitude, city.longitude, city.name, city.country || '');
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, isRecent = false) => {
    if (e.key === 'Enter') {
      handleSelect(isRecent ? recentSearches[index] : results[index]);
    }
  };

  return (
    <div ref={wrapperRef} className="relative z-50 w-full max-w-xs md:max-w-sm">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-white/50" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search city, zip, or lat, lon..."
          className="w-full bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all font-sans"
        />
        {loading && (
          <div className="absolute right-3 w-4 h-4 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-12 left-0 w-full bg-black/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl py-2">
          {query.trim() === '' ? (
            <>
              {onUseCurrentLocation && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onUseCurrentLocation();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-white/90 hover:bg-white/10 transition-colors focus:bg-white/10 focus:outline-none font-sans border-b border-white/[0.05]"
                >
                  <MapPin className="w-4 h-4 text-blue-400" />
                  Use Current Location
                </button>
              )}
              {recentSearches.length > 0 && (
                <div className="py-2">
                  <div className="px-4 text-xs font-semibold text-white/40 mb-1 tracking-wider uppercase">Recent Searches</div>
                  {recentSearches.map((city, idx) => (
                    <div key={`recent-${city.id}`} className="group relative flex items-center">
                      <button
                        onClick={() => handleSelect(city)}
                        onKeyDown={(e) => handleKeyDown(e, idx, true)}
                        className="w-full text-left pl-4 pr-10 py-2 flex items-center gap-3 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors focus:bg-white/10 focus:outline-none font-sans"
                      >
                        <Clock className="w-4 h-4 text-white/30 shrink-0" />
                        <div>
                          <div className="font-medium text-white">{city.name}</div>
                          <div className="text-xs text-white/50 truncate">
                            {city.admin1 ? `${city.admin1}, ` : ''}{city.country}
                          </div>
                        </div>
                      </button>
                      <button 
                        onClick={(e) => removeRecentSearch(e, city.id)}
                        className="absolute right-2 p-2 opacity-0 group-hover:opacity-100 hover:text-red-400 text-white/40 transition-all focus:opacity-100"
                        title="Remove from history"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {!onUseCurrentLocation && recentSearches.length === 0 && (
                <div className="px-4 py-3 text-sm text-white/40 text-center font-sans">
                  Type to search...
                </div>
              )}
            </>
          ) : error || (results.length === 0 && !loading) ? (
            <div className="px-4 py-3 text-sm text-white/60 text-center font-sans">
              City not found
            </div>
          ) : (
            results.map((city, idx) => (
              <button
                key={city.id}
                onClick={() => handleSelect(city)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className="w-full text-left px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors focus:bg-white/10 focus:outline-none font-sans"
              >
                <div className="font-medium text-white">{city.name}</div>
                <div className="text-xs text-white/50 truncate">
                  {city.admin1 ? `${city.admin1}, ` : ''}{city.country}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
