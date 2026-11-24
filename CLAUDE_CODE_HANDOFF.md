# RÁDIO BRAVA — INSTRUÇÕES PARA CLAUDE CODE

Você é o engenheiro responsável por concluir, testar e estabilizar este projeto. Trabalhe diretamente no código existente. Não recrie o projeto do zero e não remova funcionalidades que já existem.

## Objetivo
Entregar uma aplicação web de rádios online gratuita, sem cadastro e sem publicidade inserida pelo aplicativo, pronta para execução local e deploy, com comportamento confiável em desktop e celular.

## Stack e escopo existentes
- Next.js 14 App Router, React 18 e TypeScript
- Tailwind CSS
- Zustand com persistência de estado
- Radio Browser API, usando rotas de servidor como proxy
- Leaflet / OpenStreetMap para mapa
- next-themes
- Serwist / PWA

O README existente descreve as funcionalidades e limitações conhecidas. Leia-o e inspecione todos os arquivos antes de alterar.

## Regras obrigatórias de trabalho
1. Primeiro faça auditoria do repositório e apresente um plano curto baseado no código real.
2. Não afirme que algo funciona sem executar uma verificação correspondente.
3. Preserve as funcionalidades existentes: busca, filtros, favoritos, player, equalizador, temporizador, mapa, tema, PWA e controles de mídia quando presentes.
4. Não invente endpoints nem formatos da Radio Browser API. Confira os contratos usados nas rotas atuais.
5. Trate erros de rede, streams indisponíveis, URLs HTTP, CORS, autoplay e estações sem metadados sem travar a interface.
6. Não exponha chaves ou segredos. O projeto deve continuar sem exigir chaves pagas.
7. Evite adicionar dependências sem necessidade. Se adicionar ou atualizar dependências, explique o motivo.
8. Não remova código ou recursos apenas para fazer o build passar. Corrija a causa.
9. Faça alterações pequenas e coerentes; mantenha TypeScript estrito e componentes acessíveis.
10. Ao final, liste arquivos alterados, comandos executados, resultados reais, limitações restantes e como iniciar o app.

## Etapas de execução

### Etapa 1 — Auditoria
- Leia README.md, package.json, next.config.mjs, tsconfig.json e todos os arquivos de app/, components/ e lib/.
- Verifique imports, dependências, versões e compatibilidade entre Next.js 14, Serwist e TypeScript.
- Identifique componentes não utilizados, rotas inconsistentes e possíveis problemas de SSR/hidratação.
- Confira o fluxo completo: busca → resultados → seleção → reprodução → favoritos → persistência.

### Etapa 2 — Qualidade e compilação
Execute e corrija os problemas encontrados:
```bash
npm install
npm run typecheck
npm run lint
npm run build
```
Se algum script não existir ou estiver incompatível com Next.js 14, ajuste package.json de forma apropriada e documente. Não esconda avisos relevantes.

### Etapa 3 — Player e áudio
- Teste play/pause, troca de estação, falha de stream e recuperação.
- Garanta que a troca de estação não deixe áudio anterior tocando.
- Trate streams HTTPS, formatos não suportados e autoplay bloqueado com mensagens claras.
- O equalizador deve falhar de forma segura: se CORS impedir Web Audio, desative o EQ e mantenha o áudio normal.
- Verifique limpeza de AudioContext, elementos de áudio, listeners e timers.
- Verifique Media Session sem presumir suporte do navegador.

### Etapa 4 — Radio Browser API
- Verifique paginação, ordenação, filtros, timeouts e fallback entre servidores.
- Evite respostas antigas sobrescrevendo resultados de buscas mais recentes.
- Trate respostas vazias, erros HTTP, JSON inválido e limites da API.
- Não registre cliques repetidamente nem em momentos incorretos.
- Confirme que a aplicação não promete disponibilidade garantida das emissoras.

### Etapa 5 — Interface e acessibilidade
- Confira layout responsivo em telas pequenas.
- Garanta rótulos acessíveis, foco visível, estados de carregamento, vazio e erro.
- Verifique contraste em tema claro/escuro.
- Evite botões sem ação e controles que aparentem funcionar mas não funcionem.

### Etapa 6 — PWA e deploy
- Verifique manifest, ícones, service worker, estratégia de cache e fallback offline.
- Garanta que streams de áudio não sejam armazenadas em cache indevidamente.
- Confirme que o service worker não atrapalha o desenvolvimento.
- Valide o build de produção e documente o deploy gratuito compatível com o projeto.

### Etapa 7 — Testes
Crie ou amplie testes para funções críticas quando viável. No mínimo, valide:
- typecheck;
- lint;
- build de produção;
- comportamento de estados do player e persistência;
- rotas de API com respostas de sucesso e erro, usando mocks quando necessário.

Não simule um teste manual como se tivesse sido executado. Para testes que exigem navegador, dispositivo ou stream real, indique claramente o que não foi possível validar.

## Critérios de aceite
- `npm install` conclui sem erro.
- `npm run typecheck`, `npm run lint` e `npm run build` passam.
- Busca, filtros e favoritos funcionam e não exibem resultados obsoletos.
- Player consegue iniciar/parar e recuperar-se de falhas sem áudio duplicado.
- Limitações de CORS, autoplay e compatibilidade de streams são comunicadas corretamente.
- PWA instala e oferece fallback offline sem interferir no áudio.
- README descreve comandos reais, arquitetura, limitações e deploy.

## Entrega final
Faça as correções no próprio projeto. Não entregue apenas recomendações. Ao concluir, apresente:
1. resumo do que foi corrigido;
2. lista de arquivos alterados;
3. saída/resumo dos comandos de validação;
4. testes não executados e motivo;
5. passos exatos para rodar localmente;
6. limitações conhecidas que permaneceram.

Comece pela auditoria. Depois implemente e valide em sequência, sem pedir autorização para correções técnicas comuns e reversíveis.
