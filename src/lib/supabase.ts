import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const hasValidCredentials = supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl);

if (!hasValidCredentials) {
  console.warn("Supabase credentials not configured. Database features will be disabled.");
}

export const supabase = hasValidCredentials ? createClient(supabaseUrl!, supabaseAnonKey!) : null;

export interface SearchRecord {
  id: number;
  city: string;
  country: string;
  temperature: number;
  condition: string;
  humidity: number;
  wind_speed: number;
  icon: string;
  searched_at: string;
}

export async function saveSearch(
  city: string,
  country: string,
  temperature: number,
  condition: string,
  humidity: number,
  windSpeed: number,
  icon: string
): Promise<void> {
  if (!supabase) return;
  await supabase.from("weather_searches").insert({
    city,
    country,
    temperature,
    condition,
    humidity,
    wind_speed: windSpeed,
    icon,
  });
}

export async function getSearchHistory(): Promise<SearchRecord[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("weather_searches")
    .select("*")
    .order("searched_at", { ascending: false })
    .limit(20);
  return data || [];
}

export async function deleteSearch(id: number): Promise<void> {
  if (!supabase) return;
  await supabase.from("weather_searches").delete().eq("id", id);
}
