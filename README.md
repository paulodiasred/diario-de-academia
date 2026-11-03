# Diario de Academia

Aplicacao web para acompanhar treinos de musculacao e cardio, registrando series, carga e evolucao ao longo dos dias.

O projeto foi iniciado no Lovable e evoluido para desenvolvimento local com React + TypeScript.

## Sobre o projeto

Em 2026 eu cismei que queria emagrecer. Entrei na academia em 21 de janeiro e logo percebi que sempre me perdia no numero de series e, pior, esquecia o peso que tinha usado em cada aparelho.

E claro... eu nao queria pagar por app nenhum pra isso kkkkk. Entao separei uma noite e fiz esse projetinho.

Ele e simples e direto: meu treino ja estava montado, entao so organizei tudo no app. Hoje eu consigo marcar exatamente em qual serie estou, recuperar automaticamente o ultimo peso usado, consultar um historico rapido e usar um timer de descanso animado.

Esta tudo responsivo (testado no meu Redmi Note 12 Pro) e cumpre exatamente o objetivo principal: me ajudar durante o treino sem complicacao.

Nas proximas versoes, quero adicionar edicao de treino e criacao de treino do zero.

## Screenshots

![Tela de login](docs/images/login.jpg)
![Visao da semana](docs/images/semana.jpg)
![Treino selecionado](docs/images/treino-selecionado.jpg)
![Treino em execucao com descanso](docs/images/treino-descanso-execucao.jpg)

## Funcionalidades

- Autenticacao com Firebase (email/senha e Google)
- Selecao de treino por dia da semana (Segunda a Sexta)
- Registro de series por exercicio com controle de conclusao
- Temporizador de descanso entre series
- Marcacao de cardio concluido
- Historico recente por exercicio com media de carga
- Grafico de evolucao de progresso
- Persistencia dos registros no Firestore por usuario

## Stack do projeto

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui + Radix UI
- Framer Motion
- Firebase (Auth + Firestore)
- Vitest + Testing Library

## Como rodar localmente

### 1) Requisitos

- Node.js 18+ (recomendado 20+)
- npm 9+

### 2) Instalacao

```bash
git clone <URL_DO_REPOSITORIO>
cd diario-de-academia
npm install
```

### 3) Ambiente Firebase

A configuracao vem das variaveis `VITE_FIREBASE_*` (veja `.env.example`). Sem elas, o app usa o projeto de producao.

Para desenvolver sem tocar em producao, use os emuladores (exigem Java 11 ou superior):

```bash
npm run emuladores     # em um terminal
npm run dev:emulador   # em outro
```

Se quiser usar seu proprio projeto Firebase:

1. Crie um projeto no Firebase
2. Ative Authentication (Email/Senha e Google, opcional)
3. Crie um banco Firestore
4. Copie `.env.example` para `.env.local` e preencha os valores
5. Publique as regras: `npx firebase deploy --only firestore:rules`

### 4) Executar

```bash
npm run dev
```

Abra o endereco mostrado no terminal (normalmente `http://localhost:5173`).

## Scripts disponiveis

- `npm run dev`: inicia ambiente de desenvolvimento
- `npm run build`: gera build de producao
- `npm run build:dev`: gera build em modo development
- `npm run preview`: sobe servidor para visualizar o build
- `npm run lint`: executa ESLint
- `npm run test`: executa testes uma vez
- `npm run test:watch`: executa testes em modo observacao
- `npm run typecheck`: verifica os tipos
- `npm run test:rules`: testa as regras do Firestore no emulador (exige Java)
- `npm run test:e2e`: testa o fluxo principal em viewport mobile, nos emuladores (exige Java e `npx playwright install chromium`)

## Estrutura principal

```txt
src/
  components/      # componentes de UI e fluxo de treino
  contexts/        # contexto de autenticacao
  data/            # definicao dos treinos e repositorios do Firestore
  domain/          # regras de negocio em funcoes puras, com testes
  hooks/           # hooks de auth e persistencia
  lib/             # integracoes (Firebase, utils)
  pages/           # paginas principais
tests/rules/       # testes de seguranca do Firestore
e2e/               # testes de ponta a ponta
docs/              # diagnostico, roadmap e registro das fases
```

## Deploy

O projeto possui `public/_redirects`, facilitando deploy em plataformas estaticas com SPA (ex.: Netlify).

Fluxo recomendado:

1. `npm run build`
2. Publicar o conteudo da pasta `dist`

## Roadmap

Veja [docs/diagnostico-e-roadmap.md](docs/diagnostico-e-roadmap.md) e o registro da fase atual em [docs/fase-2-fundacao.md](docs/fase-2-fundacao.md).
