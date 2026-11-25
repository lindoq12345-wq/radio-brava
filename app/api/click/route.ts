import { NextRequest, NextResponse } from "next/server";
import { rbFetch } from "@/lib/rbServer";

export const runtime = "edge";

/**
 * Etiqueta da Radio Browser: ao começar a tocar uma estação, o cliente deve
 * chamar /json/url/{uuid} (conta o clique e ajuda no ranking de votos/cliques).
 */
export async function GET(req: NextRequest) {
  const uuid = req.nextUrl.searchParams.get("uuid") ?? "";
  if (!/^[0-9a-fA-F-]{36}$/.test(uuid)) {
    return NextResponse.json({ error: "uuid inválido" }, { status: 400 });
  }
  try {
    await rbFetch(`/json/url/${uuid}`, new URLSearchParams(), 0);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
