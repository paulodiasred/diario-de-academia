# Fase 2: Fundação

Registro do que mudou, por que mudou e o que continua pendente.

## Segurança

- `firestore.rules`, `firebase.json` e `firestore.indexes.json` agora estão no repositório.
- As regras isolam os dados por usuário, validam tipos e limites, e negam qualquer coleção não prevista.
- `registros` não aceita edição: o app só cria e apaga.
- **As regras não foram publicadas.** Veja "Antes de publicar as regras".

## Bugs corrigidos

| Bug | Correção | Teste |
|---|---|---|
| B1: treino sem descrição não salvava | Descrição vazia é gravada como `""` | `schemas.test.ts`, regras |
| B2: gráfico com os dados mais antigos, invertidos | `pontosDoGrafico` usa os mais recentes em ordem cronológica | `registros.test.ts` |
| B3: "Concluído hoje" nunca funcionava no treino fixo | Comparação por exercício e treino, os dados realmente gravados | `registros.test.ts` |
| B4: desmarcar podia apagar registro de outro treino | Busca limitada ao treino e ao dia atuais | `registros.test.ts` |
| B5: série não marcava sem conexão | Cache persistente e gravação sem bloquear a tela | E2E |
| B6: pausar perdia o tempo restante | `useRestTimer` com pausar e retomar | `useRestTimer.test.ts` |
| B8: exercício concluído ficava bloqueado | Card sempre abre, e a volta automática só ocorre ao concluir | E2E |
| B9: falha de carregamento parecia conta vazia | `ErrorState` com "Tentar novamente" | Sem teste automatizado |
| B10: barra inferior cobria a tela de exercício | Espaço inferior maior | Sem teste automatizado |
| B11: "hoje" calculado em UTC | `chaveDiaLocal` | `datas.test.ts` |
| B12: ícone de arrastar sem função | Removido até existir reordenação (Fase 3) | Não se aplica |

B8 e B10 não estavam na lista original da fase. B8 entrou porque corrigir B3 passaria a bloquear exercícios no treino fixo, onde o bloqueio nunca era acionado.

**B7 continua aberto:** sair da tela do exercício ainda encerra o timer e descarta o peso digitado. A correção depende da sessão de treino da Fase 3.

## Arquitetura

- `src/domain`: regras de negócio em funções puras, sem Firebase nem React.
- `src/data/repositories`: único ponto de acesso ao Firestore.
- `useTreinoStorage` e `useMeusTreinos` usam react-query, então as telas compartilham o cache e trocar de tela não relê o histórico.
- As consultas não usam mais `orderBy`: a ordenação é feita no cliente e não depende de índice composto.

## Offline e logout

- Gravações entram na fila local, atualizam a tela na hora e são desfeitas com aviso se o servidor recusar.
- O logout é bloqueado enquanto houver gravações pendentes, porque sair as perderia.
- O logout apaga o cache local, para proteger aparelhos compartilhados. Com o app aberto em outra aba, a limpeza pode falhar. Essa falha é registrada no console e o logout continua.
- **Limitação:** recarregar a página sem conexão só funciona depois do PWA (Fase 6). Hoje o app em si precisa de rede para abrir, mas as séries em fila sobrevivem e sincronizam na próxima abertura com conexão.

## Qualidade e desempenho

- `strict` ativo no TypeScript e zero erros de lint. Restam 7 avisos de fast refresh em `components/ui`, sem efeito em produção.
- Rotas, catálogo e gráficos são carregados sob demanda.
- Imagens duplicadas de `src/exercises/exercises-img` removidas da versão atual. O histórico do Git não foi reescrito, então o repositório não diminui.
- Removidos `lovable-tagger`, `bun.lockb` e a imagem de `og:image` com licença não confirmada.
- A porta de desenvolvimento mudou de 8080 para 5173, porque 8080 é a do emulador do Firestore.

## Antes de publicar as regras

1. Copie as regras atuais do Firebase Console e compare com `firestore.rules`.
2. Confirme que nenhum outro cliente ou script grava nessas coleções com campos diferentes. As regras novas recusam campos desconhecidos.
3. Publique só as regras: `npx firebase deploy --only firestore:rules --project diario-de-academia-78b61`.
4. Teste login, criação de treino e registro de série em produção. Para reverter, use o histórico de versões das regras no Console.

Versões antigas do app em cache continuam compatíveis, porque gravam os mesmos campos.

## Variáveis de ambiente

`src/lib/firebase.ts` lê `VITE_FIREBASE_*` e usa a configuração atual como fallback, para não quebrar o site enquanto a hospedagem não tem as variáveis. Depois de configurá-las, o fallback pode ser removido.

## Pendências

- **Comparar as regras com as de produção e publicá-las** (bloqueia o lançamento).
- `npm audit` (produção): caiu de 18 para 10 vulnerabilidades, sem críticas (5 altas, 5 moderadas). As restantes não saem com `npm audit fix` sem `--force`: cadeia do firebase, zod e react-router. Precisam de avaliação própria, porque podem exigir upgrade major.
- O CI em `.github/workflows/ci.yml` ainda não rodou no GitHub, porque nada foi enviado.
- O E2E roda no servidor de desenvolvimento, não no build de produção. A recuperação de senha não tem teste automatizado.
- Exercícios com peso corporal, repetições e sessão de treino: Fase 3.
- A verificação de email ainda não existe. O login com Google não foi testado de ponta a ponta, porque depende de um provedor real.
- O teste em celular real ainda não foi feito: o E2E usa viewport de Pixel 7 no Chromium.
