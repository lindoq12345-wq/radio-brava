# Skill Alexa da Rádio Brava

A skill permite dizer **“Alexa, abrir Rádio Brava”** para iniciar uma estação popular, ou pedir uma estação pelo nome. O serviço da skill usa a rota `/api/alexa` hospedada junto ao app Next.js na Vercel.

## Arquivos

- `interactionModels/custom/pt-BR.json`: modelo de voz para importar no console Alexa.
- A lógica e a validação das solicitações ficam em `app/api/alexa/route.ts`.

## Configuração necessária

1. No [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask), crie uma skill chamada **Rádio Brava**, selecione o idioma **Português (BR)**, o tipo **Outro** e o modelo **Personalizado**.
2. Em **Build → JSON Editor**, substitua o conteúdo pelo arquivo `interactionModels/custom/pt-BR.json`, salve e clique em **Build Model**.
3. Em **Build → Interfaces**, habilite **Audio Player** e salve.
4. Em **Endpoint**, selecione **HTTPS** e informe `https://SEU-DOMINIO-VERCEL/api/alexa`. Use o domínio estável do projeto, não o endereço temporário de uma prévia.
5. Copie o ID da skill exibido no console Alexa. Na Vercel, adicione a variável `ALEXA_SKILL_ID` com esse valor nos ambientes **Production** e **Preview**, depois faça um novo deploy.
6. Na aba **Test**, habilite o teste da skill e diga **“Alexa, abrir Rádio Brava”**.

O endpoint valida a assinatura da Amazon, a data da solicitação (tolerância máxima de 150 segundos) e o ID configurado da skill. As estações são consultadas na Radio Browser; só são oferecidos streams HTTPS, com codec MP3/AAC quando informado e bitrate dentro do limite aceito pelo AudioPlayer.

## Implantação do repositório atual

Este repositório importa o app pelo arquivo `radio-brava.zip`. Ao atualizar o GitHub, mantenha a rota e o modelo dentro desse arquivo e inclua `ask-sdk-express-adapter` nas dependências do `package.json` que a Vercel instala na raiz do repositório. O Hobby da Vercel pode hospedar o endpoint sem custo dentro dos limites do plano; a conta de desenvolvedor Amazon também é gratuita.
