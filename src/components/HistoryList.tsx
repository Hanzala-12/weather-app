"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, RotateCcw } from "lucide-react";
import type { SearchRecord } from "@/lib/supabase";

interface HistoryListProps {
  onSelect: (city: string) => void;
  refreshKey: number;
}

export default function HistoryList({ onSelect, refreshKey }: HistoryListProps) {
  const [history, setHistory] = useState<SearchRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [refreshKey]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      setHistory(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/history/${id}`, { method: "DELETE" });
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch {
      // silently fail
    }
  };

  if (loading && history.length === 0) {
    return null;
  }

  if (history.length === 0) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-4 w-4" /> Search History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {history.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <img
                  src={`https://openweathermap.org/img/wn/${record.icon}.png`}
                  alt={record.condition}
                  className="h-8 w-8"
                />
                <div>
                  <p className="font-medium text-sm">
                    {record.city}, {record.country}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {record.temperature}°C - {record.condition} -{" "}
                    {new Date(record.searched_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onSelect(record.city)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(record.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
