import { NextResponse } from "next/server";
import { LIST_REVALIDATE_SECONDS, rbFetch } from "@/lib/rbServer";
import type { CountryOption } from "@/lib/types";

export const runtime = "edge";

interface RBCountry {
  name: string;
  iso_3166_1: string;
  stationcount: number;
}

export async function GET() {
  try {
    const raw = await rbFetch<RBCountry[]>(
      "/json/countries",
      new URLSearchParams({ hidebroken: "true", order: "name" }),
      LIST_REVALIDATE_SECONDS,
    );
    const data: CountryOption[] = raw
      .filter((c) => c.iso_3166_1 && c.stationcount > 0)
      .map((c) => ({
        code: c.iso_3166_1.toUpperCase(),
        name: c.name,
        count: c.stationcount,
      }));
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, max-age=${LIST_REVALIDATE_SECONDS}, s-maxage=${LIST_REVALIDATE_SECONDS}, stale-while-revalidate=600`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Falha ao carregar países." }, { status: 502 });
  }
}
