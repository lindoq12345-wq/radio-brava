"use client";

import {
  Heart,
  Loader2,
  Moon,
  Pause,
  Play,
  Shuffle,
  SlidersVertical,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getEngine } from "@/lib/audioEngine";
import { useNow } from "@/lib/hooks";
import { randomStation, registerClick } from "@/lib/radioBrowser";
import { usePlayer } from "@/lib/usePlayer";
import { formatClock } from "@/lib/utils";
import Equalizer from "./Equalizer";
import SleepTimer from "./SleepTimer";
import StationLogo from "./StationLogo";

type Panel = "sleep" | "eq" | null;

export default function Player() {
  const current = usePlayer((s) => s.current);
  const playing = usePlayer((s) => s.playing);
  const status = usePlayer((s) => s.status);
  const volume = usePlayer((s) => s.volume);
  const eqGains = usePlayer((s) => s.eqGains);
  const eqEnabled = usePlayer((s) => s.eqEnabled);
  const sleepEndsAt = usePlayer((s) => s.sleepEndsAt);
  const isFav = usePlayer((s) =>
    s.current ? s.favorites.some((f) => f.stationuuid === s.current?.stationuuid) : false,
  );
  const toggle = usePlayer((s) => s.toggle);
  const play = usePlayer((s) => s.play);
  const setVolume = usePlayer((s) => s.setVolume);
  const toggleFavorite = usePlayer((s) => s.toggleFavorite);

  const [panel, setPanel] = useState<Panel>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [shuffling, setShuffling] = useState(false);
  const lastVolume = useRef(0.8);
  const lastClick = useRef<string | null>(null);
  const now = useNow(1000, sleepEndsAt !== null);

  // Hidrata o localStorage só no cliente (store usa skipHydration).
  useEffect(() => {
    void usePlayer.persist.rehydrate();
  }, []);

  // Liga os eventos do <audio> ao store.
  useEffect(
    () =>
      getEngine().bind({
        onStatus: (s) => usePlayer.getState().setEngineStatus(s),
        onEqUnsupported: () => {
          usePlayer.getState().setEqEnabled(false);
          setNotice(
            "Esta estação não libera o equalizador (restrição CORS). EQ desligado; o áudio segue normal.",
          );
        },
      }),
    [],
  );

  // Sincroniza com o engine o que veio do localStorage.
  useEffect(() => {
    getEngine().setVolume(volume);
  }, [volume]);

  useEffect(() => {
    getEngine().setEqGains(eqGains);
  }, [eqGains]);

  useEffect(() => {
    if (current) getEngine().setSource(current.url_resolved || current.url);
  }, [current]);

  // Etiqueta da Radio Browser: registra o clique quando a estação toca de fato.
  useEffect(() => {
    if (status === "playing" && current && lastClick.current !== current.stationuuid) {
      lastClick.current = current.stationuuid;
      registerClick(current.stationuuid);
    }
  }, [status, current]);

  // Controles na tela de bloqueio / teclas de mídia.
  useEffect(() => {
    if (!current || !("mediaSession" in navigator)) return;
    const artist = [current.country, current.tags.split(",")[0]?.trim()]
      .filter(Boolean)
      .join(" · ");
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.name,
      artist: artist || "Rádio Brava",
      album: "Rádio Brava",
      artwork: current.favicon.startsWith("https://") ? [{ src: current.favicon }] : [],
    });
    navigator.mediaSession.setActionHandler("play", () => usePlayer.getState().play());
    navigator.mediaSession.setActionHandler("pause", () => usePlayer.getState().pause());
  }, [current]);

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    }
  }, [playing]);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 7000);
    return () => clearTimeout(id);
  }, [notice]);

  if (!current) return null;

  const loading = status === "loading";
  const statusLabel =
    status === "loading"
      ? "Conectando…"
      : status === "error"
        ? "Não foi possível tocar esta estação"
        : status === "playing"
          ? "Ao vivo"
          : "Pausado";

  const onShuffle = async () => {
    setShuffling(true);
    try {
      const s = await randomStation();
      if (s) play(s);
      else setNotice("Não encontrei uma rádio aleatória agora. Tente novamente.");
    } catch {
      setNotice("Não foi possível buscar uma rádio agora. Verifique sua conexão.");
    } finally {
      setShuffling(false);
    }
  };

  const onMute = () => {
    if (volume > 0) {
      lastVolume.current = volume;
      setVolume(0);
    } else {
      setVolume(lastVolume.current || 0.8);
    }
  };

  const iconBtn =
    "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800";

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="relative mx-auto max-w-5xl px-3 py-2 sm:px-4">
        {/* Wrapper SEMPRE montado: o SleepTimer guarda a lógica do timer e não pode remontar. */}
        <div className="absolute bottom-full left-3 right-3 mb-2 space-y-2 sm:left-auto sm:right-4 sm:w-96">
          {notice && (
            <div
              role="status"
              className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
            >
              {notice}
            </div>
          )}
          <SleepTimer open={panel === "sleep"} />
          <Equalizer open={panel === "eq"} />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <StationLogo src={current.favicon} className="h-11 w-11" />

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{current.name}</div>
            <div
              className={`truncate text-xs ${
                status === "error" ? "text-red-500" : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {statusLabel}
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggleFavorite(current)}
            aria-pressed={isFav}
            aria-label={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            className={iconBtn}
          >
            <Heart className={`h-5 w-5 ${isFav ? "fill-brand-500 text-brand-500" : ""}`} />
          </button>

          <button
            type="button"
            onClick={onShuffle}
            disabled={shuffling}
            aria-label="Tocar uma rádio aleatória"
            title="Rádio aleatória"
            className={`${iconBtn} hidden sm:inline-flex`}
          >
            {shuffling ? <Loader2 className="h-5 w-5 animate-spin" /> : <Shuffle className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={() => setPanel(panel === "sleep" ? null : "sleep")}
            aria-label="Sleep timer"
            aria-expanded={panel === "sleep"}
            title="Sleep timer"
            className={`${iconBtn} ${sleepEndsAt !== null ? "text-brand-500" : ""}`}
          >
            <Moon className="h-5 w-5" />
            {sleepEndsAt !== null && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-brand-500 px-1 text-[10px] font-semibold tabular-nums text-white">
                {formatClock(sleepEndsAt - now)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setPanel(panel === "eq" ? null : "eq")}
            aria-label="Equalizador"
            aria-expanded={panel === "eq"}
            title="Equalizador"
            className={`${iconBtn} ${eqEnabled ? "text-brand-500" : ""}`}
          >
            <SlidersVertical className="h-5 w-5" />
          </button>

          <div className="hidden items-center gap-2 md:flex">
            <button type="button" onClick={onMute} aria-label="Silenciar" className={iconBtn}>
              {volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
              className="w-24 accent-brand-500"
            />
          </div>

          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pausar" : "Tocar"}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white hover:bg-brand-600"
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : playing ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 translate-x-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
