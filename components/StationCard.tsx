"use client";

import { Heart, Pause, Play } from "lucide-react";
import { usePlayer } from "@/lib/usePlayer";
import type { Station } from "@/lib/types";
import { formatTags } from "@/lib/utils";
import StationLogo from "./StationLogo";

export default function StationCard({ station }: { station: Station }) {
  const isCurrent = usePlayer((s) => s.current?.stationuuid === station.stationuuid);
  const playing = usePlayer((s) => s.playing);
  const isFav = usePlayer((s) =>
    s.favorites.some((f) => f.stationuuid === station.stationuuid),
  );
  const play = usePlayer((s) => s.play);
  const pause = usePlayer((s) => s.pause);
  const toggleFavorite = usePlayer((s) => s.toggleFavorite);

  const isPlaying = isCurrent && playing;
  const meta = [
    station.country,
    station.bitrate > 0 ? `${station.bitrate} kbps` : "",
    station.codec,
  ].filter(Boolean);

  return (
    <li
      className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
        isCurrent
          ? "border-brand-500/60 bg-brand-50 dark:bg-brand-900/20"
          : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
      }`}
    >
      <StationLogo src={station.favicon} />

      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{station.name}</div>
        <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {meta.join(" · ")}
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {formatTags(station.tags, 3).map((t) => (
            <span
              key={t}
              className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => toggleFavorite(station)}
        aria-pressed={isFav}
        aria-label={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:text-brand-500"
      >
        <Heart className={`h-5 w-5 ${isFav ? "fill-brand-500 text-brand-500" : ""}`} />
      </button>

      <button
        type="button"
        onClick={() => (isPlaying ? pause() : play(station))}
        aria-label={isPlaying ? `Pausar ${station.name}` : `Tocar ${station.name}`}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white hover:bg-brand-600"
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
      </button>
    </li>
  );
}
