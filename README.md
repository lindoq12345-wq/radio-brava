# Rádio Brava

Agregador de rádios online **gratuitas, sem anúncios e sem cadastro**.
Next.js 14 (App Router) + TypeScript, Tailwind, Zustand, Radio Browser API,
Leaflet/OpenStreetMap, next-themes e PWA com Serwist. 100% gratuito, sem chaves de API.

## Recursos

- Busca por nome, filtro por país e gênero (`/json/countries` e `/json/tags`)
- Favoritos (persistem no navegador) com botão que filtra a lista
- Tema claro/escuro/sistema, sem flash de tela (next-themes)
- Sleep timer 30/60/90 min com fade out suave nos últimos 20 s
- Mapa interativo (Leaflet + OSM) com as estações que têm coordenadas
- PWA instalável (Serwist), com página offline
- Equalizador de 5 bandas (Web Audio, `BiquadFilterNode`), com liga/desliga
- Controles na tela de bloqueio (Media Session) e botão "Surpreenda-me"

## Requisitos

- Node.js 18.17+ (recomendado 20 LTS)
- npm

## Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

> O service worker fica **desligado em `npm run dev`**. Para testar o PWA:
> ```bash
> npm run build
> npm start
> ```

### Dependências (se estiver adicionando a um projeto existente)

```bash
npm install next@14 react@18 react-dom@18 zustand next-themes leaflet react-leaflet@4 leaflet-defaulticon-compatibility lucide-react @serwist/next
npm install -D serwist typescript@5 @types/node@20 @types/react@18 @types/react-dom@18 @types/leaflet tailwindcss@3 postcss autoprefixer eslint@8 eslint-config-next@14
```

Confira também o `tsconfig.json` (precisa de `"webworker"` em `lib` e de
`"types": ["@serwist/next/typings"]`) e o `.gitignore` (ignora `public/sw.js`, gerado no build).

## Estrutura

```
app/
  api/stations|countries|tags|click/route.ts   proxies da Radio Browser (edge)
  offline/page.tsx                             fallback offline do PWA
  layout.tsx  page.tsx  sw.ts  globals.css
components/   Player, StationCard, SearchBar, Filters, SleepTimer,
              Equalizer, StationMap, MapView, ThemeToggle, InstallButton...
lib/          audioEngine (EQ/Web Audio), usePlayer (Zustand), radioBrowser,
              rbServer, hooks, utils, types
public/       manifest.json, icons/
```

## Etiqueta da Radio Browser

- Todas as chamadas saem do servidor com `User-Agent: RadioBrava/0.1`
- Buscas com cache de 5 minutos (`revalidate: 300` + `Cache-Control`)
- Listas de países/gêneros com cache de 1 hora
- Ao tocar uma estação, registramos o clique (`/json/url/{uuid}`)
- Se `de1` falhar, tenta `de2` e `fi1`. Edite a lista em `lib/rbServer.ts` se necessário.

## Limitações conhecidas (por design do navegador)

- **Equalizador x CORS:** o EQ usa Web Audio, que exige que a stream envie
  `Access-Control-Allow-Origin`. Muitas rádios enviam, algumas não. Nesse caso o app
  detecta o erro, desliga o EQ sozinho, avisa e toca normalmente.
- **Só streams HTTPS:** o site em HTTPS bloqueia áudio `http://`. A API é filtrada
  com `is_https=true` e streams HLS (`.m3u8`) são descartadas (não tocam em `<audio>` no Chrome/Firefox).
- **Autoplay:** ao reabrir o app a rádio não toca sozinha (bloqueio dos navegadores);
  a última estação fica selecionada.
- **Tiles do OpenStreetMap:** a política de uso do OSM é para uso leve. Se o site
  crescer muito, troque a URL do `TileLayer` por um provedor com plano gratuito.

## Deploy na Vercel (Hobby, grátis)

1. Suba o projeto para um repositório no GitHub (`git init`, `git add .`, `git commit`, `git push`).
2. Em https://vercel.com/new, escolha **Import Git Repository** e selecione o repositório.
3. Framework Preset: **Next.js** (detectado automaticamente). Build command e output: padrão.
4. **Não precisa de variáveis de ambiente.**
5. Clique em **Deploy**. Cada `git push` na branch principal gera um novo deploy.
6. Teste o PWA na URL `https://seu-projeto.vercel.app`: o Chrome mostra o botão
   "Instalar app" (ou o ícone de instalação na barra de endereço).

Via CLI (opcional): `npm i -g vercel`, depois `vercel` (preview) e `vercel --prod`.
