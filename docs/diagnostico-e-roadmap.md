# Diário de Academia: diagnóstico técnico e roadmap (Fase 1)

## Contexto

O objetivo é transformar um projeto pessoal em um SaaS comercial, sem perder dados nem o que já funciona.
Nada foi alterado no repositório. As verificações rodaram em uma cópia temporária.

## Veredito

**O app funciona como diário pessoal, mas ainda não pode ser aberto ao público.** Há quatro bloqueios:

1. **As regras do Firestore não estão no repositório.** O isolamento entre usuários não pode ser verificado, testado nem versionado.
2. **O modelo de dados não sustenta o produto.** Não há repetições, sessão de treino ou ID estável de exercício. Sem isso, não existe volume real, duração, recordes confiáveis nem recuperação de treino.
3. **Todo usuário novo vê o treino pessoal do Paulo** na tela inicial, porque ele está fixo no código.
4. **O fluxo principal tem bugs**, inclusive na criação de treinos (B1).

A base é aproveitável e a stack atende aos requisitos: React, Firebase, Tailwind e shadcn. **Não recomendo reescrever nem trocar de tecnologia.**

## 1. Resultado das verificações

| Verificação | Resultado | Leitura |
|---|---|---|
| Testes | 1 de 1 passa | O único teste é `expect(true).toBe(true)`. A cobertura real é zero |
| Lint | 3 erros, 7 avisos | Nada grave: tudo em `components/ui` e `tailwind.config.ts` |
| TypeScript (config atual) | 0 erros | Enganoso, porque `strict` está desligado |
| TypeScript com `--strict` | 9 erros | 2 deles apontam exatamente o bug B3 |
| Build | Passa | Um único JS de **2,17 MB (539 KB gzip)**, com o catálogo de 920 KB incluído |
| `npm audit` (produção) | 18 vulnerabilidades: 2 críticas, 13 altas, 3 moderadas | Diretas: react-router-dom, postcss, zod (a correção do zod exige versão major). Críticas: protobufjs e websocket-driver (transitivas). Não avaliei se são exploráveis neste app |
| Firestore sem login | HTTP 403 em `registros` e `treinos` | Bom sinal, mas **não prova isolamento entre usuários logados** |

O teste sem login foi um GET na API pública de produção. Registrei apenas o código de status, sem ler nenhum dado.

## 2. Bugs confirmados

| # | Sev. | Problema | Onde | Como confirmei |
|---|---|---|---|---|
| B1 | **Crítico** | Criar ou editar treino **sem descrição falha** ("Erro ao salvar treino"), embora o campo seja opcional. O Firestore rejeita `undefined` | CriarEditarTreino.tsx:106, firebase.ts:16 | Executei no SDK |
| B2 | **Alto** | O gráfico de evolução mostra as **10 séries mais antigas, em ordem invertida**. Depois de 10 registros, o progresso novo nunca aparece | ProgressChart.tsx:20 | Reproduzi a lógica |
| B3 | **Alto** | `exercicioId` nunca é salvo, mas a tela inicial compara por ele. O progresso do dia e o "Concluído hoje" do treino fixo **nunca funcionam** | Index.tsx:64-68, useTreinoStorage.ts:73 | Leitura + `--strict` |
| B4 | **Alto** | Desmarcar uma série pode **apagar o registro de outro treino** com o mesmo exercício no mesmo dia, porque o filtro ignora `dia` | ExerciseDetail.tsx:216 | Leitura |
| B5 | **Alto** | Sem conexão, a série não é marcada: a tela espera a confirmação do servidor e não há cache offline. Academia com sinal ruim é um caso comum | ExerciseDetail.tsx:247, firebase.ts:16 | Leitura + comportamento conhecido do SDK; não testei em aparelho |
| B6 | Médio | Pausar o descanso **perde o tempo restante**: ao retomar, ele recomeça do início | ExerciseDetail.tsx:192 | Leitura |
| B7 | Médio | Sair da tela do exercício encerra o timer e descarta o peso digitado | ExerciseDetail.tsx:60-70 | Leitura |
| B8 | Médio | Exercício concluído fica **bloqueado até o dia seguinte**. Não dá para corrigir erro nem treinar duas vezes no dia | ExerciseCard.tsx:27 | Leitura |
| B9 | Médio | Falha de carregamento vira tela vazia ou "Treino não encontrado". O usuário pode achar que perdeu os dados | useMeusTreinos.ts:68, useTreinoStorage.ts:53 | Leitura |
| B10 | Médio | A barra inferior cobre o fim da tela de exercício, que usa `pb-8` | BottomNav.tsx:13, Index.tsx:277 | Leitura; falta confirmar visualmente |
| B11 | Baixo | "Hoje" é calculado em UTC: às 22h30 em Brasília já é amanhã. Hoje o impacto é pequeno, mas o padrão invalidaria estatísticas | Index.tsx:99, TreinoPersonalizadoSession.tsx:18 | Executei |
| B12 | Baixo | O ícone de arrastar é falso: não existe reordenação | CriarEditarTreino.tsx:262 | Leitura |

## 3. Problemas estruturais

### Modelo de dados
- **`registros` tem um documento por série, sem repetições.** Volume (kg × reps) é impossível de calcular, inclusive no histórico já salvo.
- **O histórico é ligado ao nome do exercício.** Renomear quebra a continuidade, e 4 nomes duplicados no catálogo misturam históricos (ex.: "Corrida na Esteira").
- **Não existe sessão de treino.** O agrupamento é por dia do calendário, então não há duração, observações, resumo ou recuperação.
- **Peso maior que zero é obrigatório** (ExerciseDetail.tsx:241). Isso impede peso corporal. Cardio só tem "feito", gravado como `peso: 0, serie: 0`.
- **`TreinoRegistro` é declarado duas vezes** com campos conflitantes (data/treino.ts:27 e :59). O `strict` desligado esconde o problema.

### Custo e desempenho
- **Cada tela relê todos os registros do usuário**, sem paginação nem cache compartilhado. Quem treina 4x/semana com 20 séries gera cerca de 4.000 documentos por ano, e os custos de leitura crescem junto com o histórico.
- **`@tanstack/react-query` está instalado, mas não é usado.**
- **Sem code-splitting**: quem só registra uma série baixa também o catálogo e os gráficos.
- **1.746 imagens estão duplicadas** em `src/exercises/exercises-img`, com hash idêntico a `public/` e sem uso (99 MB).

### Segurança e conformidade
- **Sem `firebase.json`, `firestore.rules` nem índices no repositório.** Código de update/delete depende inteiramente de regras que não consigo ver (useMeusTreinos.ts:101-109, ExerciseDetail.tsx:226).
- **Sem validação de dados** no cliente (o zod está instalado, mas sem uso nesse fluxo) e nada indica validação nas regras.
- **A config do Firebase no código não é vazamento**, como você já observou. Mover para `.env` serve para separar produção e homologação. Falta avaliar App Check e restrição da API key.
- **Auth incompleta**: sem recuperação de senha, sem verificação de email, erros crus do Firebase em inglês, e `signInWithPopup` costuma falhar em mobile e PWA.
- **LGPD**: faltam política de privacidade, termos, exclusão de conta e exportação de dados. Recomendo revisão jurídica antes do lançamento.

### Produto e experiência
- **Registrar uma série é trabalhoso.** O caminho é: tocar no card, passar pelas imagens e por um timer de 192 px e só então chegar ao peso. Há um único peso para todas as séries.
- **Toques pequenos**: botões de 24 px (`w-6 h-6`) para uso com as mãos ocupadas na academia.
- **Sem tema claro**: `:root` é só escuro e os gráficos têm cores fixas.
- **Três marcas diferentes** no rodapé e nos metadados: "Iron Buddy", "Paulo Dias - Red" e "@Lovable". O HTML está com `lang="en"` e `package.json` ainda é `vite_react_shadcn_ts`.
- **Acessibilidade**: `div` clicáveis sem suporte a teclado, botões de ícone sem rótulo.
- **Busca do catálogo sensível a acento**: "elevacao" não encontra "Elevação". Há também nomes sem tradução (cerca de 35, estimativa).
- **Licenças a confirmar para uso comercial**: as imagens e dados do catálogo (a estrutura parece vir do free-exercise-db, não confirmei) e a imagem do Flaticon em `og:image`.

### O que está bom e será mantido
- Bloqueio de toda a navegação sem login, com consultas filtradas por `userId`.
- Timer baseado em timestamp, resistente a aba em segundo plano.
- Catálogo em português com 873 exercícios, instruções e imagens.
- CRUD de treinos com confirmação de exclusão.
- Layout pensado para celular e design tokens já centralizados.

## 4. Pedido × estado atual

| Área | Estado | O que falta |
|---|---|---|
| Criar, editar e excluir treinos | ⚠️ Parcial | Corrigir B1 |
| Duplicar, reordenar, reps, carga, peso corporal, tempo, distância | ❌ Não existe | Tudo |
| Rotina semanal | ⚠️ Só etiquetas de dia | Próximo treino, agenda |
| Biblioteca de exercícios | ⚠️ Boa base | Exercícios próprios, variações, secundários visíveis |
| Treino em andamento | ⚠️ Séries e timer | Sessão, navegação, notas, resumo, recuperação |
| Histórico | ⚠️ 5 dias, por exercício | Histórico completo |
| Estatísticas, recordes, comparação | ❌ Não existe | Tudo |
| Dashboard | ❌ Não existe | Tudo |
| Metas, conquistas, calendário, sequência | ❌ Não existe | Tudo |
| Exportação, backup, compartilhamento | ❌ Não existe | Tudo |
| PWA, notificações, onboarding | ❌ Não existe | Tudo |
| Planos e limites | ❌ Não existe | Tudo |

## 5. Decisões de arquitetura propostas

**Dados: tudo aditivo, nada é apagado ou sobrescrito.**
```
treinos/{id}                       mantém; ganha campos opcionais
registros/{id}                     mantém intacto (somente leitura para o novo fluxo)
users/{uid}                        perfil, preferências, meta semanal, contadores
users/{uid}/sessions/{id}          UM documento por treino, com exercícios e séries
users/{uid}/exercises/{id}         exercícios próprios
users/{uid}/activeSession/current  treino em andamento
entitlements/{uid}                 plano; cliente só lê, só o servidor escreve
```
- **Um documento por sessão** reduz em cerca de 20x as leituras de histórico.
- **Migração sem perda**: agrupar `registros` por dia e treino em sessões com ID determinístico (`legacy-AAAA-MM-DD-dia`), o que permite rodar mais de uma vez sem duplicar. Os originais continuam intactos.
- **Dados antigos não têm repetições, e isso não será inventado.** `reps: null` fica fora do cálculo de volume, e a tela informa "X séries sem repetições registradas". A evolução de carga continua funcionando.

**Treino sem perda de dados:** cache persistente do Firestore (offline e sobrevive a recarregamento), gravações que não bloqueiam a tela e rascunho em `activeSession`. O cache é limpo no logout, para proteger aparelhos compartilhados.

**Sem tecnologia desnecessária:** vou usar o que já está instalado e sem uso (react-query, zod, next-themes, Reorder do framer-motion).
Adições previstas, só em desenvolvimento ou build: `firebase-tools` + `@firebase/rules-unit-testing`, Playwright e `vite-plugin-pwa`.

**Limites de plano, com honestidade sobre o que dá para proteger:**
- **Pode ser garantido no servidor:** limites de escrita (quantidade de treinos, exercícios próprios) via regras do Firestore com contadores, e IA via Cloud Function.
- **Não pode ser totalmente protegido:** estatísticas calculadas no aparelho a partir de dados do próprio usuário. Esse bloqueio é só de interface. Se virar um problema real, o cálculo passa para o servidor.
- **Exportação não deve ser exclusiva do Premium.** A LGPD prevê o direito de acesso e portabilidade dos dados. Proposta: exportação simples para todos; relatórios e formatos avançados no Premium. Vale confirmar com um advogado.
- **Cloud Functions exigem o plano Blaze** do Firebase, que tem cobrança por uso. Isso só é necessário a partir dos webhooks de pagamento e da IA.

## 6. Roadmap

Cada fase termina com testes + lint + build, documentação e relatório. **Só começo a fase seguinte com o seu ok.** Tamanhos são relativos.

### Fase 2: Fundação (G), proposta para a próxima etapa
1. **Regras no repositório**: `firebase.json`, `firestore.rules`, índices e testes de isolamento no emulador (usuário A não lê, altera nem apaga dados de B, e não cria registro em nome de B).
2. **Correções**: B1, B2, B3, B4, B6, B9, B11.
3. **Qualidade**: ligar `strict`, zerar erros de TypeScript e lint, remover a declaração duplicada.
4. **Offline**: cache persistente (B5).
5. **Camada de dados**: funções puras em `src/domain`, repositórios com react-query e schemas zod. As telas deixam de chamar o Firestore diretamente.
6. **Desempenho**: rotas sob demanda, catálogo carregado só quando necessário, remoção das imagens duplicadas da versão atual. **O histórico do Git não será reescrito.**
7. **Limpeza**: `npm audit fix` sem upgrades major, retirada de `lovable-tagger` e `bun.lockb`, marca unificada, `lang="pt-BR"`.
8. **Base operacional**: `.env` + `.env.example`, ErrorBoundary, erros de login em português, recuperação de senha, CI no GitHub Actions.

**Critério de saída:** isolamento comprovado por testes, os bugs listados com teste de regressão, `strict` ativo e nenhum dado existente alterado.

### Fase 3: Produto (G)
- Modelo novo e migração não destrutiva, testada com cópia dos dados.
- **Tela de treino em andamento**: valores anteriores já preenchidos e **série registrada com 1 toque**; timer com ±15s, pular e encerrar; navegação entre exercícios; notas; resumo final; recuperação ao reabrir.
- Reps por série e tipos de exercício: carga, peso corporal, tempo, distância.
- Duplicar e reordenar exercícios, rotinas semanais, exercícios próprios.
- Biblioteca com busca sem acento, músculos secundários e "semelhantes" (mesmo músculo e equipamento). Variações verdadeiras exigem curadoria e não serão inventadas.
- O treino fixo vira **rotinas na sua conta**; usuários novos não o veem mais. Seus registros atuais permanecem.

**Critério de saída:** fechar o navegador no meio do treino, reabrir e não perder nada, testado em E2E em viewport mobile.

### Fase 4: Experiência premium (G)
- Design system: tipografia, tokens, tema claro e escuro, estados de carregamento, erro e vazio, toques de 44 px ou mais.
- Dashboard: semana × meta, último e próximo treino, volume, recordes recentes, resumo mensal.
- Evolução: histórico completo, carga por exercício, recordes, comparação entre períodos, calendário, sequência.
- Estatísticas como funções puras testadas, sempre sobre dados reais.

**Critério de saída:** valores de estatísticas conferidos por teste com dados conhecidos, e usabilidade validada em celular real.

### Fase 5: Comercialização (M)
- `entitlements` e limites nas regras, com testes que tentam burlá-los pelo SDK direto.
- Tela de planos sem cobrança; o Premium é concedido manualmente durante o beta.
- Onboarding, metas, conquistas, exportação, exclusão de conta.
- Decisão registrada (ADR) sobre Stripe × Mercado Pago, com taxas e suporte a Pix pesquisados na hora. Webhook só depois disso.
- **Usuários existentes mantêm o que já têm.**

### Fase 6: Lançamento (M)
- PWA: precache só do app; imagens em cache sob demanda. **99 MB de imagens não podem ser pré-baixados.**
- Wake Lock durante o treino.
- Notificações, com a limitação real: sem servidor, o aviso de fim de descanso com app fechado não é confiável, e no iOS push exige o PWA instalado. Lembretes dependem de FCM + Function.
- Testes E2E e de responsividade, Lighthouse, acessibilidade.
- Backup do Firestore, monitoramento de erros, App Check, política de privacidade e termos.
- Documentação e checklist de produção com plano de reversão.

### Avaliação da IA (depois da Fase 5)
**Vale a pena, mas não agora.** Ela precisa de sessões com reps, que só existirão após a Fase 3, e de Cloud Function para proteger a chave de API.
Formato recomendado: opt-in, Premium, com cota por usuário e envio apenas de dados agregados, sem nome ou email. Interpreta tendências e não prescreve, não diagnostica e não substitui profissionais.

## 7. Arquivos centrais da Fase 2

- **Novos:** firebase.json, firestore.rules, firestore.indexes.json, .env.example, .github/workflows/ci.yml, src/domain/, src/data/repositories/
- **Alterados:** src/lib/firebase.ts, src/hooks/useTreinoStorage.ts, src/hooks/useMeusTreinos.ts, src/components/ExerciseDetail.tsx, src/components/ProgressChart.tsx, src/pages/Index.tsx, src/pages/CriarEditarTreino.tsx, src/App.tsx, src/data/treino.ts, tsconfig.app.json, index.html, vite.config.ts
- **Reaproveitados:** getExerciseImageUrl (src/lib/utils.ts), AuthProvider/useAuth, componentes shadcn já em uso, catálogo JSON

## 8. Como a Fase 2 será verificada

1. `npm run test`, `npm run lint`, `npx tsc -p tsconfig.app.json --noEmit` e `npm run build` sem erros.
2. Testes de regras no emulador do Firestore, incluindo acesso cruzado entre usuários e documentos antigos sem os campos novos.
3. Testes de regressão de B1, B2, B3, B4, B6 e B11.
4. Execução real do app contra o emulador em viewport mobile: login, criar treino sem descrição, registrar série, recarregar, modo offline.
5. Comparação das regras novas com as de produção antes de qualquer deploy. **Regras e dados de produção só mudam com sua aprovação explícita.**

## 9. O que preciso de você

1. **Regras atuais**: copie de Firebase Console → Firestore → Regras. É o item mais importante, porque publicar regras sem ver as atuais pode bloquear usuários ou abrir dados.
2. **Usuários**: quantas contas reais existem além da sua? Enquanto não souber, trato como se houvesse outras.
3. **Hospedagem**: onde o app está publicado? O `_redirects` sugere Netlify. Ao mover a config para `.env`, as variáveis precisam estar lá **antes** do próximo deploy, ou o site quebra.
4. **Commits**: posso fazer commits em uma branch `fase-2-fundacao`? Sem push nem merge sem você pedir.
5. **Java**: o emulador do Firestore exige Java instalado. Se não tiver, oriento a instalação.
