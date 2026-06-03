const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function isValidUrl(url: string): boolean {
  try { const u = new URL(url); return u.protocol === "http:" || u.protocol === "https:"; }
  catch { return false; }
}

const hasValidCredentials = supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl);

let clientPromise: Promise<any> | null = null;

async function getClient(): Promise<any> {
  if (clientPromise) return clientPromise;
  if (!hasValidCredentials) {
    if (typeof window === 'undefined') console.warn("Supabase credentials not configured. Database features will be disabled.");
    clientPromise = Promise.resolve(null);
    return clientPromise;
  }
  clientPromise = (async () => {
    try {
      // Dynamic import with try/catch — webpack still traces this during build,
      // so reinstall @supabase/realtime-js if the phoenix module is broken.
      const { createClient } = await import(/* webpackIgnore: true */ "@supabase/supabase-js");
      const client = createClient(supabaseUrl!, supabaseAnonKey!);
      if (typeof window === 'undefined') console.log("Supabase client initialized.");
      return client;
    } catch (e) {
      if (typeof window === 'undefined') console.warn("Supabase unavailable, using in-memory store:", e);
      return null;
    }
  })();
  return clientPromise;
}

export interface SearchRecord {
  id: number;
  city: string;
  date_from: string | null;
  date_to: string | null;
  notes: string | null;
  created_at: string;
}

const store: SearchRecord[] = [];
let nextId = 1;

export async function saveSearch(record: { city: string; date_from?: string; date_to?: string; notes?: string }): Promise<SearchRecord> {
  const supabase = await getClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("weather_searches")
      .insert({ city: record.city, date_from: record.date_from || null, date_to: record.date_to || null, notes: record.notes || null })
      .select();
    if (!error && data && data.length > 0) {
      const row = data[0];
      return { id: row.id, city: row.city, date_from: row.date_from || null, date_to: row.date_to || null, notes: row.notes || null, created_at: row.created_at || new Date().toISOString() };
    }
  }
  const item: SearchRecord = { id: nextId++, city: record.city, date_from: record.date_from || null, date_to: record.date_to || null, notes: record.notes || null, created_at: new Date().toISOString() };
  store.unshift(item);
  return item;
}

export async function getSearchHistory(): Promise<SearchRecord[]> {
  const supabase = await getClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("weather_searches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) return data.map((row: any) => ({ id: row.id, city: row.city, date_from: row.date_from || null, date_to: row.date_to || null, notes: row.notes || null, created_at: row.created_at || new Date().toISOString() }));
  }
  return [...store];
}

export async function deleteSearch(id: number): Promise<void> {
  const supabase = await getClient();
  if (supabase) {
    await supabase.from("weather_searches").delete().eq("id", id);
    return;
  }
  const idx = store.findIndex(r => r.id === id);
  if (idx !== -1) store.splice(idx, 1);
}

export async function updateSearch(id: number, updates: Partial<Pick<SearchRecord, "city" | "date_from" | "date_to" | "notes">>): Promise<void> {
  const supabase = await getClient();
  if (supabase) {
    await supabase.from("weather_searches").update(updates).eq("id", id);
    return;
  }
  const item = store.find(r => r.id === id);
  if (item) Object.assign(item, updates);
}
