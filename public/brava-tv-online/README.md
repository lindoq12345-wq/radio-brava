# BRAVA TV Online

Experiência de streaming gratuita com guia de canais, jornalismo, clássicos, séries, doramas e rádio em fileiras navegáveis.

## Como funciona

- Página estática em `index.html`, servida pelo Next.js em `/brava-tv-online/`.
- Títulos reproduzíveis abrem em um player dentro da própria página.
- A página usa o player oficial da TV Câmara e embeds do YouTube para transmissões e vídeos publicados pelos canais correspondentes.
- Quando uma plataforma não oferece player web incorporável, o card informa isso e não redireciona para fora do site.
- PineDrama, Sua Novela e Melolo aparecem como categorias, mas não reproduzem episódios enquanto não houver player web público autorizado.
- A pesquisa por voz usa a API do navegador em português do Brasil quando disponível.

## Hospedagem

O diretório é publicado pelo projeto Rádio Brava na Vercel em `/brava-tv-online/`. O deploy de produção acontece pela branch principal.
