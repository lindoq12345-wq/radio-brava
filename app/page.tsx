"use client";

import Link from "next/link";
import { Heart, List, Loader2, Map as MapIcon, Shuffle } from "lucide-react";
import { useMemo, useState } from "react";
import Filters from "@/components/Filters";
import InstallButton from "@/components/InstallButton";
import MapView from "@/components/MapView";
import SearchBar from "@/components/SearchBar";
import StationCard from "@/components/StationCard";
import ThemeToggle from "@/components/ThemeToggle";
import VoiceCommands from "@/components/VoiceCommands";
import { useDebounced, useStations } from "@/lib/hooks";
import { randomStation } from "@/lib/radioBrowser";
import { usePlayer } from "@/lib/usePlayer";
import { matchesFilters } from "@/lib/utils";

type View = "list" | "map";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [tag, setTag] = useState("");
  const [view, setView] = useState<View>("list");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const [shuffleError, setShuffleError] = useState(false);

  const debouncedQuery = useDebounced(query, 350);
  const filters = useMemo(
    () => ({ name: debouncedQuery, countrycode: country, tag }),
    [debouncedQuery, country, tag],
  );

  const favorites = usePlayer((s) => s.favorites);
  const play = usePlayer((s) => s.play);

  // Só busca na API quando a aba precisa (favoritos filtram localmente).
  const list = useStations(filters, {
    enabled: view === "list" && !favoritesOnly,
    pageSize: 48,
  });
  const map = useStations(filters, {
    enabled: view === "map" && !favoritesOnly,
    geo: true,
    pageSize: 300,
  });

  const favoritesFiltered = useMemo(
    () =>
      favorites.filter((s) =>
        matchesFilters(s, { name: query, countrycode: country, tag }),
      ),
    [favorites, query, country, tag],
  );

  const listItems = favoritesOnly ? favoritesFiltered : list.stations;
  const mapItems = favoritesOnly
    ? favoritesFiltered.filter((s) => s.geo_lat !== null && s.geo_long !== null)
    : map.stations;

  const active = view === "list" ? list : map;
  const loading = favoritesOnly ? false : active.loading;
  const error = favoritesOnly ? null : active.error;

  const onShuffle = async () => {
    setShuffling(true);
    setShuffleError(false);
    try {
      const s = await randomStation({ countrycode: country, tag });
      if (s) play(s);
      else setShuffleError(true);
    } catch {
      setShuffleError(true);
    } finally {
      setShuffling(false);
    }
  };

  const tabClass = (on: boolean) =>
    `inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium ${
      on
        ? "bg-brand-500 text-white"
        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
    }`;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-44 pt-6">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Rádio <span className="text-brand-500">Brava</span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Rádios do mundo todo. Sem anúncios, sem cadastro.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <InstallButton />
          <ThemeToggle />
        </div>
      </header>

      <nav className="mb-6 flex gap-2 overflow-x-auto pb-1" aria-label="Navegação BRAVA">
        <Link href="/brava-tv-online" className="inline-flex h-10 shrink-0 items-center rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white hover:opacity-90">
          BRAVA TV · Filmes e esportes
        </Link>
      </nav>

      <div className="space-y-3">
        <SearchBar value={query} onChange={setQuery} />
        <Filters country={country} tag={tag} onCountry={setCountry} onTag={setTag} />

        <div className="flex flex-wrap items-center gap-2">
          <VoiceCommands />

          <button
            type="button"
            onClick={() => setFavoritesOnly((v) => !v)}
            aria-pressed={favoritesOnly}
            className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium ${
              favoritesOnly
                ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300"
                : "border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-200"
            }`}
          >
            <Heart className={`h-4 w-4 ${favoritesOnly ? "fill-brand-500 text-brand-500" : ""}`} />
            Favoritos ({favorites.length})
          </button>

          <button
            type="button"
            onClick={onShuffle}
            disabled={shuffling}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            {shuffling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4" />}
            Surpreenda-me
          </button>

          <div className="ml-auto flex gap-1 rounded-xl border border-zinc-200 p-1 dark:border-zinc-800">
            <button type="button" onClick={() => setView("list")} aria-pressed={view === "list"} className={tabClass(view === "list")}>
              <List className="h-4 w-4" /> Lista
            </button>
            <button type="button" onClick={() => setView("map")} aria-pressed={view === "map"} className={tabClass(view === "map")}>
              <MapIcon className="h-4 w-4" /> Mapa
            </button>
          </div>
        </div>

        {shuffleError && (
          <p role="alert" className="text-sm text-red-500">
            Não encontrei uma rádio agora. Tente de novo.
          </p>
        )}
      </div>

      <section className="mt-6" aria-live="polite">
        {error && (
          <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {view === "map" ? (
          <MapView stations={mapItems} loading={loading} />
        ) : loading ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }, (_, i) => (
              <li key={i} className="h-[92px] animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
            ))}
          </ul>
        ) : listItems.length === 0 && !error ? (
          <p className="py-16 text-center text-zinc-500 dark:text-zinc-400">
            {favoritesOnly
              ? favorites.length === 0
                ? "Você ainda não favoritou nenhuma rádio. Toque no coração de uma estação."
                : "Nenhum favorito combina com esses filtros."
              : "Nenhuma estação encontrada. Tente outra busca ou outro filtro."}
          </p>
        ) : (
          <>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {listItems.map((s) => (
                <StationCard key={s.stationuuid} station={s} />
              ))}
            </ul>
            {!favoritesOnly && list.hasMore && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => void list.loadMore()}
                  disabled={list.loadingMore}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-200 px-5 text-sm font-medium hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  {list.loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                  Carregar mais
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <footer className="mt-12 text-center text-xs text-zinc-500 dark:text-zinc-500">
        Dados:{" "}
        <a className="underline" href="https://www.radio-browser.info" target="_blank" rel="noreferrer">
          Radio Browser
        </a>{" "}
        · Mapa © colaboradores do{" "}
        <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
          OpenStreetMap
        </a>
      </footer>
    </main>
  );
}
