# Recursos de IA

Dois recursos do Premium, cada um em uma Cloud Function em `functions/`:

| Recurso | Função | Cota mensal | Chave no app |
|---|---|---|---|
| Análise dos últimos 30 dias | `analisarMeusTreinos` | 10 | `VITE_IA_ATIVA` |
| Ficha montada por IA | `montarMinhaFicha` | 5 | `VITE_FICHAS_IA_ATIVA` |

As duas chaves estão desligadas em produção. Com elas desligadas, nada de IA aparece no app, nem na tabela de planos, nem nos termos.

## Como funciona

- **Servidor:** a função confere login, consentimento, Premium e cota, e só depois chama o Claude. A chave da API fica no Secret Manager e nunca vai para o app.
- **Cota:** fica em `users/{uid}/uso/ia`, gravada só pelo servidor, e volta se a chamada falhar.
- **Dados enviados:**
  - Análise: só totais e exercícios, lidos no próprio servidor, sem conta, observações, nomes de treino ou datas.
  - Ficha: só as respostas de escolha do formulário.
- **Ficha:** a IA escolhe entre exercícios compatíveis com o equipamento. O servidor confere os IDs, pede uma correção se algo vier errado e devolve uma prévia. Nada é salvo sem a pessoa confirmar, e o limite de treinos do plano continua valendo.
- **Lesão, dor ou condição de saúde:** a ficha não é montada, nem no app nem no servidor.
- **Modelo:** `claude-opus-5-5`. Dá para trocar com a variável `IA_MODELO` da função. Com o Opus e o Sonnet, uma recusa é refeita em outro modelo (`fallbacks: "default"`).

## Desenvolver e testar

`npm run emuladores` e `npm run test:e2e` sobem a função nos emuladores com a resposta da IA simulada (`functions/.env.demo-diario`). Nenhuma chamada real é feita, e nada é gasto. O build cria `functions/.secret.local` com uma chave falsa, para o emulador não procurar a chave no Google Cloud.

Para testar com a IA real no emulador, troque a chave em `functions/.secret.local` e tire `IA_SIMULADA` do `.env.demo-diario`, sem fazer commit. Isso gasta crédito.

## Antes de publicar

1. Ativar o plano Blaze, com alertas de orçamento.
2. Criar a chave no Console da Anthropic, com limite de gastos, e guardar com `firebase functions:secrets:set ANTHROPIC_API_KEY`.
3. Avaliar respostas reais: números inventados na análise, fichas coerentes e custo por chamada. Os preços usados nas estimativas são de outubro de 2026; confirme antes de definir a cota.
4. Ligar o App Check, para dificultar chamadas fora do app.
5. `firebase deploy --only functions,firestore:rules`.
6. Ligar `VITE_IA_ATIVA` no Render.
7. **Ficha:** só ligar `VITE_FICHAS_IA_ATIVA` depois da revisão jurídica dos textos condicionais em `Legal.tsx` e `Landing.tsx`. Um gerador de fichas pode ser visto como prescrição de exercício.

## Planos

No beta, a IA fica dentro do Premium. Um plano intermediário sem IA fica para decidir antes do checkout, olhando uso e custo. A regra "pode usar IA" está em um lugar só: `temPremium`, em `functions/src/repositorio.ts`.
