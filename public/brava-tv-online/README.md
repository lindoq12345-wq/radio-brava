# BRAVA TV Online

Portal independente que reúne links para canais brasileiros, transmissões oficiais ao vivo no YouTube, filmes, séries, nostalgia, esportes, documentários e rádios.

## Como funciona

- Página estática em `index.html`; estilos e busca por voz ficam embutidos no arquivo.
- Este diretório em `public/brava-tv-online/` é servido pelo Next.js em `/brava-tv-online/`.
- A pesquisa por voz usa a API de reconhecimento de fala disponível no navegador e requer permissão para o microfone.
- Os vídeos e transmissões abrem nos serviços oficiais; catálogo e disponibilidade mudam por região e horário.

## Hospedagem

O repositório Rádio Brava usa Vercel. Depois de integrar esta pasta ao branch principal, a página fica acessível no domínio da Vercel em `/brava-tv-online/`.
