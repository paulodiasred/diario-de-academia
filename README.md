# Diário de Academia

**Seu treino, sua evolução, seus resultados.**

App web instalável (PWA) para registrar treinos de musculação e cardio com o celular na mão, inclusive sem internet.

## Funcionalidades

- **Treino em andamento:** série registrada com um toque, valores da última vez já preenchidos, ajustes rápidos de carga, descanso com som e aviso, troca de exercício só no dia e recuperação se o app fechar.
- **Treinos e biblioteca:** modelos prontos, rotinas por dia da semana ou em sequência, busca por termos de academia, 874 exercícios e exercícios próprios.
- **Evolução:** histórico que pode ser corrigido, gráficos de carga, recordes, calendário, comparação entre períodos, 1RM estimado e séries por grupo muscular, sempre com dados reais.
- **Plano gratuito e Premium:** limites garantidos nas regras do Firestore. Ainda não há cobrança: o Premium é pedido por email e liberado à mão.
- **Seus dados:** exportação em CSV e JSON, e exclusão de conta.

## Stack

React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, zod, Recharts, Firebase (Auth e Firestore) e vite-plugin-pwa. Testes com Vitest e Playwright.

## Como rodar localmente

Requer Node.js 20 ou superior. Os emuladores do Firebase e os testes de regras, E2E e PWA também exigem Java 11 ou superior.

```bash
npm ci
```

**Sem tocar em produção (recomendado), com os emuladores:**

```bash
npm run emuladores     # em um terminal
npm run dev:emulador   # em outro
```

**Contra um projeto Firebase real:** copie `.env.example` para `.env.local`, preencha os valores e rode `npm run dev`. Sem variáveis, o app usa o projeto de produção, então cuidado com o que testar assim.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificação de tipos |
| `npm test` | Testes unitários |
| `npm run test:rules` | Regras do Firestore no emulador, incluindo tentativas de burla |
| `npm run test:e2e` | Fluxos, acessibilidade e responsividade em viewport mobile |
| `npm run test:pwa` | App sem internet, no build real |

Para o E2E e o PWA, rode `npx playwright install chromium` uma vez. Os testes usam portas próprias, não reaproveitam servidores abertos e bloqueiam chamadas ao Firebase real.

## Estrutura

```txt
src/
  components/         componentes de interface
  contexts/           contextos de autenticação e treino em andamento
  data/repositories/  único ponto de acesso ao Firestore
  domain/             regras de negócio em funções puras, com testes
  hooks/              estado de tela e consultas
  lib/                integrações e utilitários
  pages/              telas
tests/rules/          testes de segurança do Firestore
e2e/                  testes de ponta a ponta
e2e-pwa/              testes do app instalado e sem internet
docs/                 diagnóstico, decisões e registro das fases
firestore.rules       regras de acesso, versionadas
```

## Publicar

O app é um site estático: o comando de build é `npm ci && npm run build`, e a pasta publicada é `dist`. Rotas precisam de um rewrite de `/*` para `/index.html`.

**Sempre publique `firestore.rules` antes do app.** O passo a passo, o que falta antes de abrir ao público e como voltar atrás estão em [docs/fase-6-lancamento.md](docs/fase-6-lancamento.md).

## Documentação

- [Auditoria de UX e produto](docs/auditoria-ux.md)
- [Diagnóstico e roadmap](docs/diagnostico-e-roadmap.md)
- [Fase 2: fundação](docs/fase-2-fundacao.md)
- [Fase 3: produto](docs/fase-3-produto.md)
- [Fase 4: experiência](docs/fase-4-experiencia.md)
- [Fase 5: comercialização](docs/fase-5-comercializacao.md)
- [Fase 6: lançamento](docs/fase-6-lancamento.md)
- [ADR 001: pagamentos](docs/adr/001-pagamentos.md)
