/**
 * Motor de áudio do Rádio Brava (somente cliente).
 *
 * Por que isso existe: para o equalizador funcionar, o <audio> precisa passar
 * por um MediaElementAudioSourceNode -> BiquadFilterNode x5 -> GainNode.
 * Duas regras do navegador moldam o design:
 *
 *  1) createMediaElementSource() é IRREVERSÍVEL para aquele elemento. Então,
 *     ao ligar/desligar o EQ trocamos o elemento <audio> por um novo.
 *  2) Com o EQ ligado o áudio passa pelo Web Audio, que exige CORS na
 *     stream (crossOrigin="anonymous"). Se a rádio não enviar
 *     Access-Control-Allow-Origin, a stream falha: detectamos o erro, desligamos
 *     o EQ sozinhos e voltamos a tocar normalmente.
 */

export const EQ_BANDS = [
  { freq: 60, type: "lowshelf", label: "60 Hz" },
  { freq: 230, type: "peaking", label: "230 Hz" },
  { freq: 910, type: "peaking", label: "910 Hz" },
  { freq: 3600, type: "peaking", label: "3,6 kHz" },
  { freq: 14000, type: "highshelf", label: "14 kHz" },
] as const satisfies readonly {
  freq: number;
  type: BiquadFilterType;
  label: string;
}[];

export const EQ_MIN = -12;
export const EQ_MAX = 12;
export const EQ_FLAT: number[] = [0, 0, 0, 0, 0];

export const EQ_PRESETS: { name: string; gains: number[] }[] = [
  { name: "Flat", gains: [0, 0, 0, 0, 0] },
  { name: "Graves", gains: [6, 4, 0, -1, -1] },
  { name: "Vocal", gains: [-3, -1, 3, 4, 1] },
  { name: "Rock", gains: [5, 2, -2, 3, 5] },
  { name: "Brilho", gains: [-2, 0, 1, 4, 6] },
];

export type EngineStatus = "loading" | "playing" | "paused" | "error";

export interface EngineHandlers {
  onStatus: (status: EngineStatus) => void;
  onEqUnsupported: () => void;
}

class RadioEngine {
  private audio: HTMLAudioElement;
  private ctx: AudioContext | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private master: GainNode | null = null;
  private filters: BiquadFilterNode[] = [];

  private handlers: EngineHandlers | null = null;
  private url = "";
  private volume = 0.8;
  private fade = 1;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;
  private gains: number[] = [...EQ_FLAT];

  private wantPlay = false;
  private needsReload = false;
  private muteEvents = false;

  constructor() {
    this.audio = this.createAudio(false);
  }

  get eqActive(): boolean {
    return this.ctx !== null;
  }

  bind(handlers: EngineHandlers): () => void {
    this.handlers = handlers;
    return () => {
      if (this.handlers === handlers) this.handlers = null;
    };
  }

  // ---------- reprodução ----------

  setSource(url: string): void {
    if (!url || url === this.url) return;
    this.url = url;
    this.needsReload = false;
    this.muteBriefly();
    this.audio.src = url; // preload="none": não baixa nada até o play()
    if (this.wantPlay) this.play();
  }

  play(): void {
    if (!this.url) return;
    this.wantPlay = true;
    void this.ctx?.resume();

    if (this.needsReload) {
      // Rádio ao vivo: depois de pausar, recarrega para voltar ao "agora"
      // em vez de tocar o buffer antigo.
      this.needsReload = false;
      this.muteBriefly();
      this.audio.src = this.url;
    } else if (!this.audio.src) {
      this.audio.src = this.url;
    }

    this.handlers?.onStatus("loading");
    this.audio.play().catch((err: unknown) => {
      if (err instanceof DOMException && err.name === "AbortError") return;
      this.wantPlay = false;
      this.handlers?.onStatus("error");
    });
  }

  pause(): void {
    this.wantPlay = false;
    this.needsReload = true;
    this.audio.pause();
  }

  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    this.applyVolume();
  }

  // ---------- fade (sleep timer) ----------

  fadeOut(ms: number): Promise<void> {
    this.cancelFade();
    return new Promise<void>((resolve) => {
      const start = Date.now();
      this.fadeTimer = setInterval(() => {
        const t = Math.min(1, (Date.now() - start) / ms);
        this.fade = (1 - t) * (1 - t); // curva suave
        this.applyVolume();
        if (t >= 1) {
          this.stopFadeTimer();
          this.pause();
          this.fade = 1;
          this.applyVolume();
          resolve();
        }
      }, 100);
    });
  }

  /** Cancela um fade em andamento e restaura o volume (a promise nunca resolve). */
  cancelFade(): void {
    this.stopFadeTimer();
    this.fade = 1;
    this.applyVolume();
  }

  // ---------- equalizador ----------

  setEqGains(gains: number[]): void {
    this.gains = gains;
    const ctx = this.ctx;
    if (!ctx) return;
    this.filters.forEach((f, i) => {
      f.gain.setTargetAtTime(gains[i] ?? 0, ctx.currentTime, 0.02);
    });
  }

  /** Chame DENTRO de um clique: o AudioContext precisa de gesto do usuário. */
  setEq(enabled: boolean): boolean {
    if (enabled !== this.eqActive) this.swapElement(enabled);
    return this.eqActive;
  }

  // ---------- internos ----------

  private createAudio(cors: boolean): HTMLAudioElement {
    const a = new Audio();
    a.preload = "none";
    if (cors) a.crossOrigin = "anonymous";

    a.addEventListener("playing", () => {
      if (a === this.audio) this.handlers?.onStatus("playing");
    });
    const loading = () => {
      if (a === this.audio && this.wantPlay) this.handlers?.onStatus("loading");
    };
    a.addEventListener("waiting", loading);
    a.addEventListener("loadstart", loading);
    a.addEventListener("pause", () => {
      if (a === this.audio && !this.muteEvents) this.handlers?.onStatus("paused");
    });
    a.addEventListener("error", () => {
      if (a === this.audio) this.handleError();
    });
    return a;
  }

  private handleError(): void {
    if (!this.url) return;
    if (this.ctx) {
      // Provável falta de CORS na stream: desliga o EQ e tenta de novo.
      this.handlers?.onEqUnsupported();
      this.swapElement(false);
      return;
    }
    this.wantPlay = false;
    this.handlers?.onStatus("error");
  }

  private swapElement(withEq: boolean): void {
    const old = this.audio;
    this.muteBriefly();
    old.pause();
    old.removeAttribute("src");
    old.load();
    this.teardownGraph();

    this.audio = this.createAudio(withEq);
    if (withEq) {
      try {
        this.buildGraph();
      } catch {
        // Web Audio pode não existir ou falhar em alguns navegadores/dispositivos.
        // Nunca deixe essa falha impedir a reprodução normal da rádio.
        this.teardownGraph();
        this.audio.pause();
        this.audio = this.createAudio(false);
        this.handlers?.onEqUnsupported();
      }
    }
    this.applyVolume();

    if (this.url) this.audio.src = this.url;
    this.needsReload = false;
    if (this.wantPlay) this.play();
  }

  private buildGraph(): void {
    const Ctor: typeof AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) throw new Error("Web Audio não é compatível com este navegador.");
    const ctx = new Ctor();
    this.ctx = ctx;
    try {
      const source = ctx.createMediaElementSource(this.audio);
      this.source = source;

      const filters = EQ_BANDS.map((band, i) => {
      const f = ctx.createBiquadFilter();
      f.type = band.type;
      f.frequency.value = band.freq;
      f.Q.value = band.type === "peaking" ? 1 : 0.707;
      f.gain.value = this.gains[i] ?? 0;
      return f;
    });

      this.filters = filters;
      const master = ctx.createGain();
      this.master = master;

      let node: AudioNode = source;
      for (const f of filters) {
        node.connect(f);
        node = f;
      }
      node.connect(master);
      master.connect(ctx.destination);
      void ctx.resume();
    } catch (error) {
      this.teardownGraph();
      throw error;
    }
  }

  private teardownGraph(): void {
    this.filters.forEach((f) => f.disconnect());
    this.master?.disconnect();
    this.source?.disconnect();
    void this.ctx?.close();
    this.ctx = null;
    this.source = null;
    this.master = null;
    this.filters = [];
  }

  private applyVolume(): void {
    const v = this.volume * this.fade;
    if (this.master) {
      this.master.gain.value = v;
      this.audio.volume = 1;
    } else {
      this.audio.volume = v;
    }
  }

  private stopFadeTimer(): void {
    if (this.fadeTimer) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
  }

  /** Troca de src/elemento dispara "pause" espúrio: ignoramos por um instante. */
  private muteBriefly(): void {
    this.muteEvents = true;
    setTimeout(() => {
      this.muteEvents = false;
    }, 300);
  }
}

let instance: RadioEngine | null = null;

export function getEngine(): RadioEngine {
  if (!instance) instance = new RadioEngine();
  return instance;
}
