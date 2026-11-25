import { NextRequest, NextResponse } from "next/server";
import {
  SEARCH_REVALIDATE_SECONDS,
  intParam,
  rbFetch,
  toStation,
  type RBStation,
} from "@/lib/rbServer";

export const runtime = "edge";

const ORDERS = new Set(["votes", "clickcount", "clicktrend", "name", "random"]);

/**
 * Proxy da Radio Browser (/json/stations/search).
 * Só repassa parâmetros conhecidos (não é um proxy aberto).
 *
 * Query: name, countrycode, tag, geo=1, order, limit, offset
 * Resposta: { stations, nextOffset, hasMore }
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  // hidebroken: só estações que passaram no último check
  // is_https: páginas HTTPS (Vercel) bloqueiam áudio http:// (mixed content)
  const params = new URLSearchParams({ hidebroken: "true", is_https: "true" });

  const name = sp.get("name")?.trim().slice(0, 80);
  if (name) params.set("name", name);

  const cc = sp.get("countrycode");
  if (cc && /^[A-Za-z]{2}$/.test(cc)) params.set("countrycode", cc.toUpperCase());

  const tag = sp.get("tag")?.trim().slice(0, 60);
  if (tag) {
    params.set("tag", tag);
    params.set("tagExact", "true");
  }

  if (sp.get("geo") === "1") params.set("has_geo_info", "true");

  const orderParam = sp.get("order") ?? "votes";
  const order = ORDERS.has(orderParam) ? orderParam : "votes";
  params.set("order", order);
  params.set("reverse", order === "name" ? "false" : "true");

  const limit = intParam(sp.get("limit"), 48, 1, 500);
  const offset = intParam(sp.get("offset"), 0, 0, 100000);
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  const isRandom = order === "random";

  try {
    const raw = await rbFetch<RBStation[]>(
      "/json/stations/search",
      params,
      isRandom ? 0 : SEARCH_REVALIDATE_SECONDS,
    );

    // HLS (.m3u8) não toca em <audio> no Chrome/Firefox; http:// é bloqueado.
    const stations = raw
      .filter(
        (s) =>
          s.hls !== 1 && (s.url_resolved || s.url || "").startsWith("https://"),
      )
      .map(toStation);

    return NextResponse.json(
      { stations, nextOffset: offset + raw.length, hasMore: raw.length === limit },
      {
        headers: {
          "Cache-Control": isRandom
            ? "no-store"
            : `public, max-age=${SEARCH_REVALIDATE_SECONDS}, s-maxage=${SEARCH_REVALIDATE_SECONDS}, stale-while-revalidate=60`,
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Não foi possível consultar a Radio Browser agora." },
      { status: 502 },
    );
  }
}
