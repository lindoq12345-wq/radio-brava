import type { Station, StationFilters } from "./types";

export function formatTags(tags: string, max = 3): string[] {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, max);
}

const regionNames: Intl.DisplayNames | null =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["pt-BR"], { type: "region" })
    : null;

export function countryName(code: string, fallback: string): string {
  try {
    return regionNames?.of(code.toUpperCase()) ?? fallback;
  } catch {
    return fallback;
  }
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Filtro client-side usado na lista de favoritos. */
export function matchesFilters(s: Station, f: StationFilters): boolean {
  if (f.name && !s.name.toLowerCase().includes(f.name.trim().toLowerCase())) {
    return false;
  }
  if (f.countrycode && s.countrycode.toUpperCase() !== f.countrycode.toUpperCase()) {
    return false;
  }
  if (f.tag) {
    const tags = s.tags.split(",").map((t) => t.trim().toLowerCase());
    if (!tags.includes(f.tag.toLowerCase())) return false;
  }
  return true;
}
