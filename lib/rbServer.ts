import type { Station } from "./types";

/**
 * Helpers SOMENTE de servidor (rotas /api/*, edge runtime).
 * Etiqueta da Radio Browser: User-Agent identificável + cache.
 * Se um servidor cair, tentamos o próximo da lista.
 */
const SERVERS = [
  "https://de1.api.radio-browser.info",
  "https://de2.api.radio-browser.info",
  "https://fi1.api.radio-browser.info",
];

export const USER_AGENT = "RadioBrava/0.1";
export const SEARCH_REVALIDATE_SECONDS = 300; // 5 min
export const LIST_REVALIDATE_SECONDS = 3600; // países/gêneros mudam pouco

export interface RBStation {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  language: string;
  codec: string;
  bitrate: number;
  votes: number;
  geo_lat: number | null;
  geo_long: number | null;
  hls: number;
}

export async function rbFetch<T>(
  path: string,
  params: URLSearchParams,
  revalidate: number,
): Promise<T> {
  let lastError: unknown = new Error("Radio Browser indisponível");

  for (const base of SERVERS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const qs = params.toString();
      const res = await fetch(`${base}${path}${qs ? `?${qs}` : ""}`, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: controller.signal,
        ...(revalidate > 0
          ? { next: { revalidate } }
          : { cache: "no-store" as const }),
      });
      if (!res.ok) throw new Error(`Radio Browser respondeu ${res.status}`);
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

/** Reduz o payload e garante url_resolved preenchida. */
export function toStation(s: RBStation): Station {
  return {
    stationuuid: s.stationuuid,
    name: (s.name ?? "").trim() || "Sem nome",
    url: s.url,
    url_resolved: s.url_resolved || s.url,
    homepage: s.homepage ?? "",
    favicon: s.favicon ?? "",
    tags: s.tags ?? "",
    country: s.country ?? "",
    countrycode: s.countrycode ?? "",
    language: s.language ?? "",
    codec: s.codec ?? "",
    bitrate: s.bitrate ?? 0,
    votes: s.votes ?? 0,
    geo_lat: s.geo_lat ?? null,
    geo_long: s.geo_long ?? null,
  };
}

export function intParam(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  const n = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
