"use client";

import { EQ_BANDS, EQ_MAX, EQ_MIN, EQ_PRESETS, getEngine } from "@/lib/audioEngine";
import { usePlayer } from "@/lib/usePlayer";

export default function Equalizer({ open }: { open: boolean }) {
  const enabled = usePlayer((s) => s.eqEnabled);
  const gains = usePlayer((s) => s.eqGains);
  const setEqEnabled = usePlayer((s) => s.setEqEnabled);
  const setEqGain = usePlayer((s) => s.setEqGain);
  const setEqGains = usePlayer((s) => s.setEqGains);

  if (!open) return null;

  // O AudioContext é criado aqui, dentro do clique (exigência dos navegadores).
  const toggle = () => {
    const next = !enabled;
    const active = getEngine().setEq(next);
    setEqEnabled(active);
  };

  const sameAs = (preset: number[]) => preset.every((g, i) => g === gains[i]);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold">Equalizador</div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={toggle}
          className={`inline-flex h-9 items-center rounded-full px-4 text-sm font-medium ${
            enabled
              ? "bg-brand-500 text-white"
              : "border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
          }`}
        >
          {enabled ? "EQ ligado" : "Ligar EQ"}
        </button>
      </div>

      <div className={enabled ? "" : "opacity-50"}>
        <div className="flex justify-between">
          {EQ_BANDS.map((band, i) => (
            <div key={band.freq} className="flex flex-col items-center gap-1">
              <span className="text-[11px] tabular-nums text-zinc-500">
                {gains[i] > 0 ? "+" : ""}
                {gains[i]} dB
              </span>
              <div className="relative h-28 w-10">
                <input
                  type="range"
                  min={EQ_MIN}
                  max={EQ_MAX}
                  step={1}
                  value={gains[i]}
                  onChange={(e) => setEqGain(i, Number(e.target.value))}
                  aria-label={`Banda de ${band.label}`}
                  className="absolute left-1/2 top-1/2 h-8 w-28 -translate-x-1/2 -translate-y-1/2 -rotate-90 cursor-pointer accent-brand-500"
                />
              </div>
              <span className="text-[11px] text-zinc-500">{band.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {EQ_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => setEqGains([...p.gains])}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                sameAs(p.gains)
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Ligar ou desligar o EQ reconecta a rádio por um instante. Algumas
        estações não liberam o EQ (restrição do servidor delas).
      </p>
    </div>
  );
}
