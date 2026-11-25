"use client";

// A ordem importa: CSS do Leaflet -> CSS/JS do defaulticon-compatibility
// (conserta os ícones padrão dos marcadores quebrados por bundlers).
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { usePlayer } from "@/lib/usePlayer";
import type { Station } from "@/lib/types";
import { formatTags } from "@/lib/utils";

interface Point {
  station: Station;
  position: [number, number];
}

/** Desloca levemente estações que compartilham a mesma coordenada (centro da cidade). */
function jitter(seed: string): [number, number] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const a = ((h >>> 0) % 1000) / 1000 - 0.5;
  const b = (((h >>> 10) >>> 0) % 1000) / 1000 - 0.5;
  return [a * 0.05, b * 0.05];
}

function FitBounds({ bounds }: { bounds: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (bounds.length === 0) return;
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
  }, [map, bounds]);
  return null;
}

interface Props {
  stations: Station[];
  loading: boolean;
}

export default function StationMap({ stations, loading }: Props) {
  const play = usePlayer((s) => s.play);

  const points = useMemo<Point[]>(() => {
    const out: Point[] = [];
    for (const s of stations) {
      const { geo_lat: lat, geo_long: lng } = s;
      if (lat === null || lng === null) continue;
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
      if (lat === 0 && lng === 0) continue;
      const [dLat, dLng] = jitter(s.stationuuid);
      out.push({ station: s, position: [lat + dLat, lng + dLng] });
    }
    return out;
  }, [stations]);

  const bounds = useMemo(() => points.map((p) => p.position), [points]);

  return (
    <div className="relative isolate z-0 h-[60vh] min-h-[360px] overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <MapContainer
        center={[15, -30]}
        zoom={2}
        minZoom={2}
        scrollWheelZoom
        worldCopyJump
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
        />
        <FitBounds bounds={bounds} />
        {points.map(({ station, position }) => (
          <Marker key={station.stationuuid} position={position}>
            <Popup>
              <div className="min-w-[180px] space-y-1">
                <div className="font-semibold">{station.name}</div>
                <div className="text-xs opacity-70">
                  {[station.country, ...formatTags(station.tags, 2)]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
                <button
                  type="button"
                  onClick={() => play(station)}
                  className="mt-1 rounded-md bg-brand-500 px-3 py-1 text-sm font-medium text-white hover:bg-brand-600"
                >
                  ▶ Ouvir
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute right-2 top-2 z-[500] rounded-lg bg-white/90 px-2.5 py-1 text-xs font-medium shadow dark:bg-zinc-900/90">
        {loading ? "Carregando…" : `${points.length} estações no mapa`}
      </div>
    </div>
  );
}
