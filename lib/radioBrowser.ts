import type {
  CountryOption,
  Station,
  StationFilters,
  TagOption,
} from "./types";

/**
 * Helpers de CLIENTE. Todas as chamadas passam pelas rotas /api/* do próprio
 * app (User-Agent "RadioBrava/0.1" e cache de 5 min ficam no servidor).
 */
export interface SearchOptions extends StationFilters {
  limit?: number;
  offset?: number;
  /** somente estações com coordenadas (mapa) */
  geo?: boolean;
  order?: "votes" | "clickcount" | "clicktrend" | "name" | "random";
}

export interface StationsPage {
  stations: Station[];
  nextOffset: number;
  hasMore: boolean;
}

async function getJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Falha ao carregar dados (${res.status})`);
  return (await res.json()) as T;
}

export function searchStations(
  opts: SearchOptions = {},
  signal?: AbortSignal,
): Promise<StationsPage> {
  const p = new URLSearchParams();
  if (opts.name?.trim()) p.set("name", opts.name.trim());
  if (opts.countrycode) p.set("countrycode", opts.countrycode);
  if (opts.tag) p.set("tag", opts.tag);
  if (opts.geo) p.set("geo", "1");
  if (opts.order) p.set("order", opts.order);
  if (opts.limit) p.set("limit", String(opts.limit));
  if (opts.offset) p.set("offset", String(opts.offset));
  return getJSON<StationsPage>(`/api/stations?${p.toString()}`, signal);
}

export async function randomStation(
  filters: StationFilters = {},
): Promise<Station | null> {
  const page = await searchStations({ ...filters, order: "random", limit: 10 });
  return page.stations[0] ?? null;
}

export function fetchCountries(signal?: AbortSignal): Promise<CountryOption[]> {
  return getJSON<CountryOption[]>("/api/countries", signal);
}

export function fetchTags(signal?: AbortSignal): Promise<TagOption[]> {
  return getJSON<TagOption[]>("/api/tags", signal);
}

/** Conta o clique na Radio Browser (fire-and-forget). */
export function registerClick(uuid: string): void {
  void fetch(`/api/click?uuid=${encodeURIComponent(uuid)}`, {
    keepalive: true,
  }).catch(() => undefined);
}
