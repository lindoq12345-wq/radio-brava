"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { searchStations } from "./radioBrowser";
import type { Station, StationFilters } from "./types";

export function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

/** Relógio que só roda enquanto `active` for true. */
export function useNow(intervalMs: number, active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, active]);
  return now;
}

interface UseStationsOptions {
  enabled: boolean;
  geo?: boolean;
  pageSize?: number;
}

export function useStations(
  filters: StationFilters,
  { enabled, geo = false, pageSize = 48 }: UseStationsOptions,
) {
  const { name = "", countrycode = "", tag = "" } = filters;

  const [stations, setStations] = useState<Station[]>([]);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Invalida paginações antigas quando os filtros/aba mudam.
  const requestKey = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const key = ++requestKey.current;
    const ac = new AbortController();
    setLoading(true);
    setError(null);

    searchStations({ name, countrycode, tag, geo, limit: pageSize }, ac.signal)
      .then((page) => {
        if (key !== requestKey.current) return;
        setStations(page.stations);
        setNextOffset(page.nextOffset);
        setHasMore(page.hasMore);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted || key !== requestKey.current) return;
        setError(err instanceof Error ? err.message : "Erro ao buscar estações");
        setStations([]);
        setHasMore(false);
        setLoading(false);
      });

    return () => {
      ac.abort();
      if (requestKey.current === key) requestKey.current += 1;
    };
  }, [enabled, name, countrycode, tag, geo, pageSize]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    const key = requestKey.current;
    setLoadingMore(true);
    try {
      const page = await searchStations({
        name,
        countrycode,
        tag,
        geo,
        limit: pageSize,
        offset: nextOffset,
      });
      if (key !== requestKey.current) return;
      setStations((prev) => {
        const seen = new Set(prev.map((s) => s.stationuuid));
        return [...prev, ...page.stations.filter((s) => !seen.has(s.stationuuid))];
      });
      setNextOffset(page.nextOffset);
      setHasMore(page.hasMore);
    } catch (err: unknown) {
      if (key === requestKey.current) {
        setError(err instanceof Error ? err.message : "Erro ao carregar mais");
      }
    } finally {
      if (key === requestKey.current) setLoadingMore(false);
    }
  }, [loadingMore, hasMore, name, countrycode, tag, geo, pageSize, nextOffset]);

  return { stations, loading, loadingMore, error, hasMore, loadMore };
}
