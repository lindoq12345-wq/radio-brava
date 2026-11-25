"use client";

import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { randomStation, searchStations } from "@/lib/radioBrowser";
import type { Station } from "@/lib/types";
import { usePlayer } from "@/lib/usePlayer";

interface VoiceAlternative {
  transcript: string;
}

interface VoiceResult extends ArrayLike<VoiceAlternative> {
  isFinal: boolean;
}

interface VoiceRecognitionEvent extends Event {
  results: ArrayLike<VoiceResult>;
}

interface VoiceRecognitionErrorEvent extends Event {
  error: string;
}

interface VoiceRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: VoiceRecognitionEvent) => void) | null;
  onerror: ((event: VoiceRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type VoiceWindow = Window & {
  SpeechRecognition?: new () => VoiceRecognition;
  webkitSpeechRecognition?: new () => VoiceRecognition;
};

function normalize(text: string) {
  return text
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function VoiceCommands() {
  const current = usePlayer((state) => state.current);
  const play = usePlayer((state) => state.play);
  const pause = usePlayer((state) => state.pause);
  const setVolume = usePlayer((state) => state.setVolume);
  const volume = usePlayer((state) => state.volume);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("");
  const recognitionRef = useRef<VoiceRecognition | null>(null);

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
    },
    [],
  );

  const runCommand = async (spokenText: string) => {
    const phrase = normalize(spokenText);

    if (/\b(pausar|pause|parar|pare)\b/.test(phrase)) {
      pause();
      setMessage("Rádio pausada.");
      return;
    }

    if (/\b(silenciar|mudo|mutar)\b/.test(phrase)) {
      setVolume(0);
      setMessage("Áudio silenciado.");
      return;
    }

    if (
      /^(continuar|continue|retomar|retome|voltar a tocar|tocar|play|reproduzir|ouvir)( a radio)?$/.test(
        phrase,
      )
    ) {
      if (current) {
        play();
        setMessage(`Tocando ${current.name}.`);
      } else {
        setMessage("Diga “tocar uma rádio popular” ou o nome de uma estação.");
      }
      return;
    }

    if (/\b(aumentar( o)? volume|aumenta( o)? volume|volume mais alto|mais volume)\b/.test(phrase)) {
      setVolume(Math.min(1, volume + 0.15));
      setMessage("Aumentei o volume.");
      return;
    }

    if (/\b(diminuir( o)? volume|abaixar( o)? volume|abaixa( o)? volume|volume mais baixo|menos volume)\b/.test(phrase)) {
      setVolume(Math.max(0, volume - 0.15));
      setMessage("Diminuí o volume.");
      return;
    }

    const asksForPopular =
      /\b(popular|aleatoria|proxima|surpreenda|abrir radio brava|radio brava)\b/.test(
        phrase,
      );
    if (asksForPopular) {
      try {
        const station =
          phrase.includes("proxima") || phrase.includes("aleatoria")
            ? await randomStation()
            : (await searchStations({ order: "clickcount", limit: 20 })).stations[0];
        if (!station) throw new Error("Nenhuma estação encontrada");
        play(station);
        setMessage(`Tocando ${station.name}.`);
      } catch {
        setMessage("Não consegui encontrar uma rádio agora. Tente novamente.");
      }
      return;
    }

    const stationName = phrase
      .replace(/\b(tocar|toque|ouvir|reproduzir|colocar|abrir|radio|estacao|por favor)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (stationName) {
      try {
        const { stations } = await searchStations({
          name: stationName,
          order: "clickcount",
          limit: 10,
        });
        const station =
          stations.find((item: Station) => normalize(item.name).includes(stationName)) ??
          stations[0];
        if (!station) {
          setMessage(`Não encontrei “${stationName}”. Tente outro nome.`);
          return;
        }
        play(station);
        setMessage(`Tocando ${station.name}.`);
      } catch {
        setMessage("Não consegui buscar essa rádio agora.");
      }
      return;
    }

    setMessage("Não entendi. Tente “tocar uma rádio popular” ou “pausar”.");
  };

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = (window as VoiceWindow).SpeechRecognition ??
      (window as VoiceWindow).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessage(
        "Este navegador não oferece reconhecimento de voz. Tente a versão mais recente do Chrome ou Edge.",
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const phrase = event.results[0]?.[0]?.transcript;
      if (phrase) {
        setMessage(`Você disse: “${phrase}”`);
        void runCommand(phrase);
      }
    };
    recognition.onerror = (event) => {
      const errorMessage = event.error === "not-allowed"
        ? "Permita o uso do microfone nas configurações do navegador para usar os comandos por voz."
        : event.error === "no-speech"
          ? "Não ouvi nenhum comando. Toque no microfone e tente de novo."
          : "Não consegui reconhecer sua voz. Tente novamente.";
      setMessage(errorMessage);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setMessage("Pode falar. Ex.: “tocar uma rádio popular”.");
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
      setMessage("Não consegui iniciar o microfone. Tente novamente.");
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggleListening}
        aria-pressed={listening}
        aria-label={listening ? "Parar comandos por voz" : "Ativar comandos por voz"}
        className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors ${
          listening
            ? "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
            : "border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
        }`}
      >
        {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        {listening ? "Ouvindo…" : "Comandos por voz"}
      </button>
      <p
        className="max-w-64 text-xs text-zinc-500 dark:text-zinc-400"
        role="status"
        aria-live="polite"
      >
        {message || "Toque aqui e diga: “tocar uma rádio popular”."}
      </p>
      <span className="max-w-64 text-[11px] text-zinc-400 dark:text-zinc-500">
        Requer permissão do microfone; o reconhecimento depende do navegador.
      </span>
      <span className="sr-only">
        Exemplos: tocar uma rádio popular, tocar uma estação pelo nome, pausar, continuar, próxima
        rádio, aumentar volume ou diminuir volume.
      </span>
    </div>
  );
}
