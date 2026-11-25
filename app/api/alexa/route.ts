import { SkillRequestSignatureVerifier } from "ask-sdk-express-adapter";
import type { IncomingHttpHeaders } from "node:http";
import { NextRequest, NextResponse } from "next/server";
import { rbFetch, type RBStation } from "@/lib/rbServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const verifier = new SkillRequestSignatureVerifier();
const MAX_CLOCK_SKEW_MS = 150_000;
const HELP_TEXT =
  "Você pode pedir para tocar uma rádio pelo nome, ou dizer tocar uma rádio popular.";

type AlexaRequest = {
  type?: string;
  timestamp?: string;
  intent?: {
    name?: string;
    slots?: Record<string, { value?: string } | undefined>;
  };
};

type AlexaEnvelope = {
  request?: AlexaRequest;
  context?: {
    System?: { application?: { applicationId?: string } };
    AudioPlayer?: {
      token?: string;
      offsetInMilliseconds?: number;
      playerActivity?: string;
    };
  };
  session?: {
    application?: { applicationId?: string };
    attributes?: Record<string, unknown>;
  };
};

type AlexaResponse = {
  version: "1.0";
  response: Record<string, unknown>;
};

function jsonResponse(response: AlexaResponse, status = 200) {
  return NextResponse.json(response, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function say(text: string, shouldEndSession = true, directives?: unknown[]) {
  return jsonResponse({
    version: "1.0",
    response: {
      outputSpeech: { type: "PlainText", text },
      ...(directives?.length ? { directives } : {}),
      shouldEndSession,
    },
  });
}

function isCompatibleStation(station: RBStation): boolean {
  const streamUrl = station.url_resolved || station.url || "";
  if (!streamUrl.startsWith("https://")) return false;

  const codec = (station.codec || "").toUpperCase();
  if (codec && !/(MP3|AAC)/.test(codec)) return false;

  const bitrate = Number(station.bitrate || 0);
  if (bitrate && (bitrate < 16 || bitrate > 384)) return false;

  return true;
}

function play(station: RBStation, offsetInMilliseconds = 0, text?: string) {
  const streamUrl = station.url_resolved || station.url;
  return say(
    text ?? `Tocando ${station.name}.`,
    true,
    [
      {
        type: "AudioPlayer.Play",
        playBehavior: "REPLACE_ALL",
        audioItem: {
          stream: {
            token: station.stationuuid,
            url: streamUrl,
            offsetInMilliseconds: Math.max(0, offsetInMilliseconds),
          },
        },
      },
    ],
  );
}

function audioOnly(directives: unknown[] = []): NextResponse {
  return jsonResponse({ version: "1.0", response: { directives } });
}

async function findStations(name?: string): Promise<RBStation[]> {
  const params = new URLSearchParams({
    hidebroken: "true",
    is_https: "true",
    order: "votes",
    reverse: "true",
    limit: "50",
    offset: "0",
  });
  if (name) params.set("name", name.slice(0, 80));

  const stations = await rbFetch<RBStation[]>(
    "/json/stations/search",
    params,
    300,
  );
  return stations.filter(isCompatibleStation);
}

async function findStationById(id: string): Promise<RBStation | undefined> {
  if (!/^[a-f0-9-]{36}$/i.test(id)) return undefined;
  const stations = await rbFetch<RBStation[]>(
    `/json/stations/byuuid/${id}`,
    new URLSearchParams(),
    300,
  );
  return stations.find(isCompatibleStation);
}

function stopPlayback(text: string) {
  return say(text, true, [{ type: "AudioPlayer.Stop" }]);
}

async function handleRequest(envelope: AlexaEnvelope): Promise<NextResponse> {
  const request = envelope.request;
  const requestType = request?.type;

  if (!requestType || requestType === "SessionEndedRequest") {
    return audioOnly();
  }

  if (requestType.startsWith("AudioPlayer.")) {
    return audioOnly();
  }

  if (requestType === "LaunchRequest") {
    const station = (await findStations())[0];
    if (!station) {
      return say("Não encontrei uma rádio compatível agora. Tente novamente mais tarde.");
    }
    return play(station, 0, `Bem-vindo à Rádio Brava. Tocando ${station.name}.`);
  }

  if (requestType !== "IntentRequest") return say(HELP_TEXT, false);

  const intentName = request.intent?.name;

  if (intentName === "PlayStationIntent") {
    const name = request.intent?.slots?.stationName?.value?.trim();
    if (!name) return say("Qual rádio você quer ouvir?", false);
    const station = (await findStations(name))[0];
    if (!station) {
      return say(`Não encontrei uma rádio compatível com o nome ${name}. Tente outro nome.`);
    }
    return play(station);
  }

  if (intentName === "PlayPopularIntent") {
    const station = (await findStations())[0];
    if (!station) return say("Não encontrei uma rádio compatível agora. Tente novamente mais tarde.");
    return play(station, 0, `Tocando uma rádio popular: ${station.name}.`);
  }

  if (intentName === "AMAZON.PauseIntent") {
    return stopPlayback("Pausando a rádio.");
  }

  if (intentName === "AMAZON.ResumeIntent") {
    const player = envelope.context?.AudioPlayer;
    const station = player?.token ? await findStationById(player.token) : undefined;
    if (!station) return say("Não consegui retomar. Peça para tocar uma rádio pelo nome.");
    return play(station, player?.offsetInMilliseconds ?? 0, `Retomando ${station.name}.`);
  }

  if (
    intentName === "AMAZON.StopIntent" ||
    intentName === "AMAZON.CancelIntent"
  ) {
    return stopPlayback("Desligando a Rádio Brava.");
  }

  if (intentName === "AMAZON.HelpIntent") return say(HELP_TEXT, false);
  if (intentName === "AMAZON.FallbackIntent") return say(HELP_TEXT, false);

  return say(HELP_TEXT, false);
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  let envelope: AlexaEnvelope;

  try {
    envelope = JSON.parse(rawBody) as AlexaEnvelope;
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  try {
    const headers = Object.fromEntries(
      request.headers.entries(),
    ) as IncomingHttpHeaders;
    await verifier.verify(rawBody, headers);
  } catch {
    return NextResponse.json({ error: "Assinatura Alexa inválida." }, { status: 400 });
  }

  const requestTimestamp = Date.parse(envelope.request?.timestamp ?? "");
  if (
    !Number.isFinite(requestTimestamp) ||
    Math.abs(Date.now() - requestTimestamp) > MAX_CLOCK_SKEW_MS
  ) {
    return NextResponse.json({ error: "Data da solicitação Alexa inválida." }, { status: 400 });
  }

  const expectedSkillId = process.env.ALEXA_SKILL_ID;
  if (!expectedSkillId) {
    return NextResponse.json(
      { error: "Configure ALEXA_SKILL_ID nas variáveis da Vercel." },
      { status: 503 },
    );
  }

  const receivedSkillId =
    envelope.context?.System?.application?.applicationId ??
    envelope.session?.application?.applicationId;
  if (receivedSkillId !== expectedSkillId) {
    return NextResponse.json({ error: "ID da skill Alexa inválido." }, { status: 400 });
  }

  try {
    return await handleRequest(envelope);
  } catch (error) {
    console.error("Falha ao processar solicitação da Alexa:", error);
    return say("Tive um problema ao consultar as rádios. Tente novamente em instantes.");
  }
}
