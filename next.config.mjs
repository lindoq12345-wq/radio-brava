import { randomUUID } from "node:crypto";
import withSerwistInit from "@serwist/next";

// Revisão única por build para a página offline pré-cacheada.
const revision = randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Em dev o SW fica desligado (evita cache atrapalhando o hot reload).
  disable: process.env.NODE_ENV === "development",
  // register: true (padrão) injeta o registro do SW no bundle do cliente.
  register: true,
  cacheOnNavigation: true,
  reloadOnOnline: true,
  additionalPrecacheEntries: [{ url: "/offline", revision }],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withSerwist(nextConfig);
