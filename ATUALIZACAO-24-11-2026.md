# Rádio Brava — atualização técnica

## Alterações aplicadas

- O equalizador agora trata falhas de inicialização do Web Audio e volta para um elemento de áudio comum.
- A falha do equalizador não deve bloquear a reprodução normal da estação.
- O estado visual do botão EQ passa a refletir o estado real do motor de áudio.

## Validação necessária no ambiente do projeto

Execute na pasta `radio-brava`:

```bash
npm install
npm run typecheck
npm run lint
npm run build
```

Depois teste no celular: tocar uma estação, pausar, trocar de estação, ligar/desligar o EQ e testar uma estação que não ofereça CORS.

## Limitação desta entrega

Esta atualização foi aplicada ao pacote-fonte recuperado da conversa. Não foi possível executar instalação/build nem publicar no domínio online a partir daqui: o ambiente não tem acesso ao Termux do celular nem às credenciais do GitHub/Vercel. Não considere o site publicado ou os testes aprovados até executar os comandos acima e concluir o deploy.
