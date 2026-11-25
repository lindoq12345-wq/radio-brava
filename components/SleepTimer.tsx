"use client";

import { useEffect, useRef } from "react";
import { getEngine } from "@/lib/audioEngine";
import { useNow } from "@/lib/hooks";
import { usePlayer } from "@/lib/usePlayer";
import { formatClock } from "@/lib/utils";

const OPTIONS_MIN = [30, 60, 90] as const;
/** O volume cai suavemente durante os últimos 20 s do timer. */
export const FADE_MS = 20_000;

/**
 * Lógica do sleep timer + painel. O Player mantém este componente SEMPRE
 * montado (open só controla o painel), então o timer continua com o painel
 * fechado.
 */
export default function SleepTimer({ open }: { open: boolean }) {
  const endsAt = usePlayer((s) => s.sleepEndsAt);
  const setEndsAt = usePlayer((s) => s.setSleepEndsAt);
  const fading = useRef(false);
  const now = useNow(1000, endsAt !== null);

  useEffect(() => {
    if (endsAt === null) {
      if (fading.current) {
        fading.current = false;
        getEngine().cancelFade(); // cancelou durante o fade: volume volta
      }
      return;
    }

    const tick = () => {
      const remaining = endsAt - Date.now();
      if (remaining > FADE_MS || fading.current) return;
      fading.current = true;
      void getEngine()
        .fadeOut(Math.max(remaining, 1000))
        .then(() => {
          fading.current = false;
          usePlayer.getState().setSleepEndsAt(null);
        });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const start = (minutes: number) => {
    getEngine().cancelFade();
    fading.current = false;
    setEndsAt(Date.now() + minutes * 60_000);
  };

  const cancel = () => setEndsAt(null);

  if (!open) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 text-sm font-semibold">Desligar a rádio em…</div>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS_MIN.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => start(m)}
            className="h-11 rounded-lg border border-zinc-200 text-sm font-medium hover:border-brand-500 hover:text-brand-600 dark:border-zinc-700"
          >
            {m} min
          </button>
        ))}
      </div>

      {endsAt !== null ? (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2 text-sm dark:bg-brand-900/20">
          <span>
            Desliga em{" "}
            <strong className="tabular-nums">{formatClock(endsAt - now)}</strong>
          </span>
          <button
            type="button"
            onClick={cancel}
            className="font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          O volume diminui aos poucos nos últimos 20 segundos.
        </p>
      )}
    </div>
  );
}
