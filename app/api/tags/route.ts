import { NextResponse } from "next/server";
import { LIST_REVALIDATE_SECONDS, rbFetch } from "@/lib/rbServer";
import type { TagOption } from "@/lib/types";

export const runtime = "edge";

interface RBTag {
  name: string;
  stationcount: number;
}

export async function GET() {
  try {
    // /json/tags tem milhares de itens: pegamos só os 100 gêneros mais usados.
    const raw = await rbFetch<RBTag[]>(
      "/json/tags",
      new URLSearchParams({
        hidebroken: "true",
        order: "stationcount",
        reverse: "true",
        limit: "100",
      }),
      LIST_REVALIDATE_SECONDS,
    );
    const data: TagOption[] = raw
      .filter((t) => t.name && t.name.length <= 30 && t.stationcount > 0)
      .map((t) => ({ name: t.name, count: t.stationcount }));
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, max-age=${LIST_REVALIDATE_SECONDS}, s-maxage=${LIST_REVALIDATE_SECONDS}, stale-while-revalidate=600`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Falha ao carregar gêneros." }, { status: 502 });
  }
}
