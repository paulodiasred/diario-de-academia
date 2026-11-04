# Fase 3: Produto

Registro do que mudou, de como os dados antigos são tratados e do que continua pendente.

## Modelo de dados

Tudo é aditivo. Nenhuma coleção existente é apagada ou reescrita.

| Local | Conteúdo |
|---|---|
| `users/{uid}` | Marca de migração. A lista de campos é fechada: o cliente não consegue gravar um plano |
| `users/{uid}/sessions/{id}` | Um documento por treino finalizado, com exercícios e séries |
| `users/{uid}/activeSession/current` | Treino em andamento |
| `users/{uid}/exercises/{id}` | Exercícios próprios |
| `treinos/{id}` | Ganha campos opcionais: `medida`, `repsAlvo`, `cargaAlvo`, `duracaoAlvoSeg`, `distanciaAlvoM`, `circuito` |
| `registros/{id}` | Intacta. O app só lê, para migrar |

## Treino em andamento

- **Um toque:** os valores vêm da última vez ou da meta do treino. O check conclui a série, repassa os valores às próximas e inicia o descanso. Séries editadas à mão não são sobrescritas.
- **Tipos de exercício:** carga e repetições, peso corporal (carga extra opcional), tempo e distância. Tempo e distância aceitam só "feito", como o cardio antigo.
- **Descanso:** ±15 segundos, pausar, retomar e pular. Baseado em horário final, sobrevive à navegação e à recarga da página (corrige B7).
- **Na tela:** navegação entre exercícios, observações por exercício, adicionar e remover séries, e evolução com gráfico e últimas sessões.
- **Resumo:** duração, séries, exercícios, volume e recordes de carga, sempre a partir de dados reais. A primeira vez de um exercício não conta como recorde.

## Como o treino não se perde

1. Cada alteração vai na hora para o `localStorage`, que é síncrono e cobre a aba fechada logo depois de digitar.
2. Ações como concluir série vão direto para `activeSession`. A digitação espera 800 ms, para agrupar as gravações.
3. Ao reabrir, vale o rascunho mais recente, do aparelho ou da nuvem. Isso também recupera o treino em outro aparelho.
4. Finalizar grava o histórico e apaga o rascunho no mesmo lote. Se o servidor recusar, o treino volta a ficar em andamento.
5. As telas seguintes são pré-carregadas ao abrir o treino, para finalizar sem sinal funcionar.

## Migração dos dados antigos

`migrarDadosLegados` roda em segundo plano no login, uma vez por conta, e só marca a conta como migrada depois de tudo confirmado.

- **Nada é apagado:** `registros` não é alterada, e as regras recusam edições nessa coleção.
- **Pode repetir:** os IDs são determinísticos (`legacy-AAAA-MM-DD-dia`), então uma falha no meio não duplica nada.
- **Nada é inventado:** registros antigos não têm repetições nem duração, e esses campos ficam vazios. A série antiga fica fora do volume, e a tela informa isso.
- **Treino fixo:** vira cinco rotinas (`fixo-<uid>-segunda` etc.) só para contas que têm registros nele. Contas novas não o veem.

## Antes de publicar

**A ordem importa, e as regras vêm antes do app.**

1. Publique `firestore.rules`. Se a versão da Fase 2 já foi publicada, publique de novo: sem as regras novas, o app novo não acessa `users/{uid}`.
2. Confira no Console que `registros` e `treinos` têm os dados esperados.
3. Só então faça o merge e o deploy.
4. No Render, configure o rewrite `/*` → `/index.html` e confira o comando de build.
5. Entre com a sua conta e confira as rotinas e a evolução de carga de um exercício.

## Testes

| Suíte | Resultado | Comando |
|---|---|---|
| Unitários | 69 passando | `npm test` |
| Regras no emulador | 61 passando | `npm run test:rules` |
| E2E em viewport de celular | 17 passando | `npm run test:e2e` |

O E2E usa porta própria, não reaproveita servidor aberto e bloqueia chamadas aos domínios reais do Firebase. Isso foi corrigido depois que uma execução reaproveitou um `npm run dev` aberto e tentou cadastros em produção. Todas essas tentativas retornaram erro 400.

## Pendências

- **A migração não foi testada com dados reais.** O plano previa uma cópia dos dados, mas as regras atuais de produção bloqueiam o acesso. Ela foi testada com registros simulados no emulador. Confira sua conta logo depois de publicar.
- **Registros criados depois da migração não são copiados.** Só afeta versões antigas do app abertas em cache após a migração da conta.
- **Conta sem registros no treino fixo não recebe as rotinas automaticamente.** Os exercícios continuam em `src/data/treino.ts`.
- **Descartar em um aparelho** pode deixar o rascunho no `localStorage` de outro, e ele reaparece lá.
- **Sem conexão, o app ainda não abre do zero:** isso depende do PWA (Fase 6).
- **Telas sem teste automatizado:** estados de erro, recuperação de senha e login com Google.
- **Celular real:** ainda não testado. O E2E usa viewport de Pixel 7 no Chromium.

## Decisões e limitações

- **Reordenar usa botões de subir e descer**, não arrastar: em tela de toque, arrastar compete com a rolagem. Pode ser reavaliado na Fase 4.
- **"Semelhantes" não são variações oficiais:** são exercícios com o mesmo músculo principal e equipamento. Variações reais exigem curadoria.
- **Adicionar exercícios no meio do treino e observações gerais da sessão** ainda não existem. Imagens e instruções durante o treino chegaram na [Fase 4](fase-4-experiencia.md).
- **Histórico completo, estatísticas e dashboard** ficam para a Fase 4.
