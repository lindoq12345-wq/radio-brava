"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchCountries, fetchTags } from "@/lib/radioBrowser";
import type { CountryOption, TagOption } from "@/lib/types";
import { countryName } from "@/lib/utils";

interface Props {
  country: string;
  tag: string;
  onCountry: (code: string) => void;
  onTag: (tag: string) => void;
}

const selectClass =
  "h-11 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-zinc-800 dark:bg-zinc-900";

export default function Filters({ country, tag, onCountry, onTag }: Props) {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);

  useEffect(() => {
    const ac = new AbortController();
    fetchCountries(ac.signal).then(setCountries).catch(() => undefined);
    fetchTags(ac.signal).then(setTags).catch(() => undefined);
    return () => ac.abort();
  }, []);

  const countryOptions = useMemo(
    () =>
      countries
        .map((c) => ({ ...c, label: countryName(c.code, c.name) }))
        .sort((a, b) => {
          if (a.code === "BR") return -1; // Brasil primeiro
          if (b.code === "BR") return 1;
          return a.label.localeCompare(b.label, "pt-BR");
        }),
    [countries],
  );

  const tagOptions = useMemo(
    () => [...tags].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [tags],
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      <select
        value={country}
        onChange={(e) => onCountry(e.target.value)}
        aria-label="Filtrar por país"
        className={selectClass}
      >
        <option value="">Todos os países</option>
        {countryOptions.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label} ({c.count})
          </option>
        ))}
      </select>

      <select
        value={tag}
        onChange={(e) => onTag(e.target.value)}
        aria-label="Filtrar por gênero"
        className={selectClass}
      >
        <option value="">Todos os gêneros</option>
        {tagOptions.map((t) => (
          <option key={t.name} value={t.name}>
            {t.name} ({t.count})
          </option>
        ))}
      </select>
    </div>
  );
}
