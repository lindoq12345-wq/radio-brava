import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { ExpirationPlugin, NetworkFirst, Serwist, StaleWhileRevalidate } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * IMPORTANTE: não usamos o `defaultCache` do Serwist de propósito.
 * Ele tem uma regra "cross-origin" que tentaria cachear as streams de áudio
 * (respostas infinitas) e quebraria a reprodução. Aqui só declaramos rotas
 * que queremos; qualquer outra requisição (incluindo o áudio) vai direto à
 * rede, sem passar pelo SW.
 */
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Navegação: rede primeiro; se offline, usa a última cópia ou /offline.
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "rb-pages",
        networkTimeoutSeconds: 4,
        plugins: [new ExpirationPlugin({ maxEntries: 20 })],
      }),
    },
    // Listas que mudam pouco: abre instantâneo e atualiza em segundo plano.
    {
      matcher: ({ url, sameOrigin }) =>
        sameOrigin &&
        (url.pathname === "/api/countries" || url.pathname === "/api/tags"),
      handler: new StaleWhileRevalidate({
        cacheName: "rb-lists",
        plugins: [new ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 24 * 60 * 60 })],
      }),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
