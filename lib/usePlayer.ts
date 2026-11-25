"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { EQ_FLAT, EQ_MAX, EQ_MIN, getEngine, type EngineStatus } from "./audioEngine";
import type { Station } from "./types";

export type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "error";

interface PlayerState {
  current: Station | null;
  playing: boolean;
  status: PlayerStatus;
  volume: number;
  favorites: Station[];

  eqEnabled: boolean;
  eqGains: number[];

  sleepEndsAt: number | null;

  play: (station?: Station) => void;
  pause: () => void;
  toggle: () => void;
  setVolume: (volume: number) => void;
  toggleFavorite: (station: Station) => void;
  setEngineStatus: (status: EngineStatus) => void;

  setEqEnabled: (enabled: boolean) => void;
  setEqGains: (gains: number[]) => void;
  setEqGain: (index: number, db: number) => void;

  setSleepEndsAt: (timestamp: number | null) => void;
}

const streamUrl = (s: Station) => s.url_resolved || s.url;

/**
 * Estado do player. play()/pause() chamam o engine de forma SÍNCRONA dentro
 * do clique (necessário para autoplay/AudioContext, principalmente no iOS).
 *
 * skipHydration: a hidratação do localStorage é feita no Player (useEffect),
 * evitando "hydration mismatch" do Next.js.
 */
export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => ({
      current: null,
      playing: false,
      status: "idle",
      volume: 0.8,
      favorites: [],

      eqEnabled: false, // não persiste: ligar o EQ exige um clique
      eqGains: [...EQ_FLAT],

      sleepEndsAt: null,

      play: (station) => {
        const target = station ?? get().current;
        if (!target) return;
        const engine = getEngine();
        engine.setVolume(get().volume);
        engine.setSource(streamUrl(target));
        engine.play();
        set({ current: target, playing: true, status: "loading" });
      },

      pause: () => {
        getEngine().pause();
        set({ playing: false, status: "paused" });
      },

      toggle: () => {
        if (get().playing) get().pause();
        else get().play();
      },

      setVolume: (volume) => {
        const v = Math.min(1, Math.max(0, volume));
        getEngine().setVolume(v);
        set({ volume: v });
      },

      toggleFavorite: (station) =>
        set((state) => {
          const exists = state.favorites.some(
            (f) => f.stationuuid === station.stationuuid,
          );
          return {
            favorites: exists
              ? state.favorites.filter((f) => f.stationuuid !== station.stationuuid)
              : [station, ...state.favorites],
          };
        }),

      setEngineStatus: (status) =>
        set((state) => ({
          status,
          playing:
            status === "playing"
              ? true
              : status === "paused" || status === "error"
                ? false
                : state.playing,
        })),

      setEqEnabled: (eqEnabled) => set({ eqEnabled }),
      setEqGains: (gains) => set({ eqGains: gains }),
      setEqGain: (index, db) =>
        set((state) => {
          const next = [...state.eqGains];
          next[index] = Math.min(EQ_MAX, Math.max(EQ_MIN, db));
          return { eqGains: next };
        }),

      setSleepEndsAt: (sleepEndsAt) => set({ sleepEndsAt }),
    }),
    {
      name: "radio-brava:player",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      // "playing" não persiste: navegadores bloqueiam autoplay ao reabrir.
      partialize: (state) => ({
        current: state.current,
        volume: state.volume,
        favorites: state.favorites,
        eqGains: state.eqGains,
      }),
    },
  ),
);
