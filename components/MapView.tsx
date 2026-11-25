"use client";

import dynamic from "next/dynamic";

// Leaflet usa `window`: precisa carregar só no cliente (ssr: false).
const MapView = dynamic(() => import("./StationMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[60vh] min-h-[360px] animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
  ),
});

export default MapView;
