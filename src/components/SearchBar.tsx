"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";
import { fetchCitySuggestions, type CitySuggestion } from "@/lib/weather";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onLocationClick: () => void;
  loading: boolean;
}

export default function SearchBar({ onSearch, onLocationClick, loading }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await fetchCitySuggestions(query.trim());
      setSuggestions(results);
      setShowDropdown(results.length > 0);
      setActiveIndex(-1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelect = (suggestion: CitySuggestion) => {
    const label = suggestion.state
      ? `${suggestion.name}, ${suggestion.state}, ${suggestion.country}`
      : `${suggestion.name}, ${suggestion.country}`;
    setQuery(label);
    setShowDropdown(false);
    onSearch(suggestion.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      handleSelect(suggestions[activeIndex]);
    } else if (query.trim()) {
      onSearch(query.trim());
    }
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-2xl mx-auto">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search city, zip code, or lat,lon..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          className="pl-9 h-11"
        />
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {suggestions.map((s, i) => (
              <button
                key={`${s.lat}-${s.lon}`}
                type="button"
                onMouseDown={() => handleSelect(s)}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-accent transition-colors ${
                  i === activeIndex ? "bg-accent" : ""
                }`}
              >
                <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>
                  {s.name}
                  {s.state ? `, ${s.state}` : ""}
                  <span className="text-muted-foreground ml-1">{s.country}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <Button type="submit" disabled={loading || !query.trim()} className="h-11">
        Search
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onLocationClick}
        disabled={loading}
        className="h-11"
        title="Use my location"
      >
        <MapPin className="h-4 w-4" />
      </Button>
    </form>
  );
}
