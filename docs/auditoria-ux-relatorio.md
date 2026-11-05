# Relatório da auditoria de UX/UI e produto

Registro histórico de novembro de 2026: descreve o app **antes** das correções, e os arquivos e linhas citados podem ter mudado. Para o que foi feito e o que falta, veja [auditoria-ux.md](auditoria-ux.md).

## Contexto da auditoria

Diagnóstico pedido antes de qualquer mudança, para preparar o app para venda a usuários reais. Nenhum arquivo do projeto foi alterado (`git status` limpo ao final).

**Como cada afirmação foi verificada**

| Marca | Significado |
|---|---|
| **[C]** Código | Comprovado pela leitura do código, com arquivo indicado |
| **[M]** Medido | Calculado ou executado nesta auditoria |
| **[H]** Hipótese | Precisa de aparelho real ou teste com usuários |

**O que foi executado:** typecheck (sem erros), ESLint (0 erros, 7 avisos), testes unitários (142 de 142), regras do Firestore (85 de 85), E2E (47 de 47), PWA (3 de 3), `npm audit`, análise do catálogo, cálculo de contraste e tamanho do build.

**Etapa 0 concluída:** o app rodou nos emuladores, com captura de telas em 1920, 1366, 768, 390 e 360 px, nos dois temas. Limites que continuam valendo: Chromium simulando celular, sem aparelho real; sem teclado virtual, som, vibração ou notificação; e nas capturas de página inteira a barra inferior aparece no meio da tela, o que é efeito da captura, não defeito.

**Resultado das hipóteses de layout**

| Item | Resultado | Evidência |
|---|---|---|
| P-21 | **Confirmado só em tela pequena** | Em 360 × 640, o botão da 3ª série fica sob o descanso e o título do exercício seguinte abre fora da tela. Em 390 × 844, não ocorre. A barra do navegador real reduz a altura, então é preciso testar no aparelho |
| P-34 | **Confirmado nas abas** | Início → Evolução abriu com a rolagem em 359 px, e Evolução → Exercícios em 3.038 px. Item do histórico abriu no topo |
| P-42 | **Confirmado** | Foto com 932 px em 1920, 655 px em 1366 e 356 px em 768 |
| P-43 | **Confirmado, com impacto menor** | "153.600 kg" corta em 360 px por 4 px e cabe em 390 px |
| P-33 | **Confirmado** | Nenhum botão Iniciar na tela inicial sem dias |
| P-57 | **Novo** | Eixo do gráfico com rótulo cortado |

---

## A. Diagnóstico geral

**Estado atual:** a engenharia está à frente do produto. O app registra treinos de forma confiável, mas ainda não dá para vendê-lo, e o primeiro uso exige mais esforço do que deveria.

**Pontos fortes (verificados)**
- **Treino resistente a falhas:** rascunho local síncrono mais nuvem, funcionamento offline, recuperação ao reabrir e tela ligada (`SessaoAtivaProvider.tsx`, `rascunhoSessao.ts`).
- **Registro rápido:** um toque conclui a série, os valores da última vez vêm preenchidos e passam para as séries seguintes (`domain/sessao.ts`). É o mesmo princípio dos líderes de mercado.
- **Segurança:** limites e isolamento garantidos em `firestore.rules`, com testes de burla.
- **Dados honestos:** não inventa repetições nem porcentagens sem base. Gráficos têm tabela alternativa.
- **Boa base técnica:** domínio em funções puras, separação de repositórios, carregamento sob demanda, skeleton e estados de erro e vazio compartilhados.
- **Contraste de texto:** passa AA nos dois temas, com exceção de dois chips (P-26).

**Principais problemas**
1. **Não existe caminho para vender:** sem página de apresentação, sem pagamento e sem como pedir o Premium.
2. **Montar o primeiro treino é o ponto mais fraco:** sem modelos, com busca que falha em termos comuns e cards longos.
3. **Erros no histórico são permanentes:** não dá para editar nem excluir um treino finalizado. Um peso digitado errado vira recorde para sempre.
4. **O fim do descanso passa despercebido:** no iPhone, é só um aviso de 2,5 segundos, sem som.
5. **A tela inicial não atende quem treina A/B/C sem dia fixo:** ela não oferece botão para iniciar.

**Maturidade:** funcional em nível de beta avançado. Visual consistente em tokens, mas sem sistema de tipografia e componentes. Comercial em nível inicial.

---

## B. Avaliação por critérios

| Critério | Nota | Justificativa |
|---|---:|---|
| Design visual | **7** (revista após ver as telas) | Visual limpo e coerente nos dois temas, com login e tela inicial de boa aparência. Faltam escala tipográfica e momentos de marca. Treinos, edição e Evolução seguem densas |
| Usabilidade | **6** | Feedback de erro existe, mas só em toast. Sucesso quase nunca é confirmado. Formulário perde dados sem avisar |
| Experiência mobile | **7** | Pensado para celular, alvos de 44 px na maioria, sem rolagem horizontal nos testes. Falhas: rolagem não acompanha o treino, X de 16 px, teclado sem apoio |
| Navegação | **7** | Quatro abas claras. Falhas: Sair exposto, conta escondida, Evolução longa demais, rolagem herdada entre telas |
| Experiência de treino | **7** | Execução 7,5 e montagem 5,5. Registro é ótimo. Falta som no descanso, troca de exercício, lista com nomes e editar depois |
| Dashboard | **6** | Dados reais e úteis, mas sem carga por grupo muscular, sem início para quem não usa dias, e volume em destaque demais |
| Acessibilidade | **7** | Boa base, com axe nos testes. Falhas reais: título de página, `autocomplete`, teclado no catálogo, dois contrastes |
| Consistência visual | **6** | Tokens bons, mas 61 usos de `text-[13px]`, 5 opacidades de fundo, 2 tipos de select, 3 padrões de cabeçalho |
| Qualidade técnica | **8** | Tipos estritos, testes amplos, regras versionadas. Faltam monitoramento de erros e limpeza de dependências |
| Potencial comercial | **4,5** | Núcleo competitivo e diferencial em português, sem aquisição, cobrança nem métricas |

---

## C. Problemas encontrados

Gravidade: **Crít.** crítica, **Alta**, **Méd.** média, **Baixa**.

### Comercial e confiabilidade dos dados

| # | Tela ou componente | Problema | Impacto | Grav. | Solução |
|---|---|---|---|---|---|
| P-01 | `App.tsx` | **[C]** Quem chega sem login vê só o formulário. Não há página que explique o produto | Sem aquisição nem anúncio possível | Crít. | Página pública simples em `/` |
| P-02 | `Planos.tsx`, `docs/adr/001-pagamentos.md` | **[C]** Sem cobrança, e o texto diz "liberado manualmente" sem dizer como pedir | O limite do plano leva a um beco sem saída | Crít. | Agora: botão de lista de espera. Depois: checkout |
| P-03 | `ResumoTreino.tsx`, `sessoesRepository.ts` | **[C]** Não há como editar ou excluir treino finalizado, embora as regras já permitam | Erro de digitação contamina recordes, gráficos e metas para sempre | Crít. | Editar e excluir no resumo, com recálculo automático |
| P-04 | `domain/sessao.ts:453` | **[C]** Tempo é arredondado para minuto: 45 s aparece como "1 min" e 20 s como "0 min" | Dado errado em prancha e isometria, em resumo e histórico | Crít. | Formatar em `m:ss` |
| P-05 | `docs/fase-6-lancamento.md` | **[C]** Abertos: revisão jurídica, licença das fotos, celular real, backup, teto de gastos | Risco legal e de perda de dados | Crít. | Concluir a lista antes de abrir o cadastro |
| P-06 | `ErrorBoundary.tsx` | **[C]** Sem monitoramento de erros: falha no aparelho do usuário é invisível | Bugs em produção só chegam por reclamação | Alta | Sentry ou similar, com atualização da política |
| P-07 | `Conta.tsx:125` | **[C]** Baixar CSV não espera o carregamento nem trata erro: pode gerar arquivo vazio sem aviso | Usuário acredita ter um backup que não tem | Alta | Desativar até carregar e avisar em caso de erro |
| P-08 | Produto | **[C]** Sem métricas de uso, e a política diz não usar análise de comportamento | Impossível saber ativação e retenção | Alta | Métricas mínimas e anônimas, com revisão da política |

### Montagem de treino

| # | Tela ou componente | Problema | Impacto | Grav. | Solução |
|---|---|---|---|---|---|
| P-09 | `useCatalogoExercicios.ts:49` | **[M]** Busca só no nome. "peito" retorna 18 itens, a começar por alongamentos, e não acha supino | Iniciante não encontra o básico | Crít. | Buscar também em músculo e equipamento, com sinônimos |
| P-10 | Catálogo | **[M]** Zero resultado para extensora, abdutora, adutora, voador, peck deck, puxada frontal e burpee | Nomes usados nas academias brasileiras não existem | Alta | Curadoria de sinônimos, sem renomear IDs |
| P-11 | Catálogo | **[M]** A ordem segue o inglês: a lista abre com "Abdominal 3/4" e "Isquiotibiais 90/90". 123 alongamentos e 21 de strongman aparecem junto, sem filtro. 4 nomes duplicados | Parece aleatório e dificulta a escolha | Alta | Marcar "populares" e mostrá-los primeiro |
| P-12 | `CriarEditarTreino.tsx:217` | **[C]** Voltar descarta tudo sem avisar | Perda de vários minutos de trabalho | Alta | Confirmar a saída e guardar rascunho |
| P-13 | Onboarding, Treinos | **[C]** Sem modelos: conta nova precisa montar tudo do zero | Abandono antes do primeiro treino **[H]** | Alta | 3 a 5 modelos editáveis (ABC, Upper/Lower, Full Body) |
| P-14 | `CriarEditarTreino.tsx:330` | **[C]** Cada exercício é um card longo e sempre aberto. Reordenar é só por setas | Com 8 exercícios, muita rolagem | Alta | Cards recolhíveis e arrastar para reordenar, mantendo as setas |
| P-15 | `CriarEditarTreino.tsx:222` | **[C]** Salvar fica só no topo. Erros aparecem só em toast, sem marcar o campo | Exige voltar ao topo para salvar | Méd. | Barra fixa inferior, erro no campo |
| P-16 | `CatalogoDrawer.tsx:499` | **[C]** Sem indicação durante o download do catálogo (728 KB). O botão parece não responder com sinal ruim | Toques repetidos, sensação de travamento | Méd. | Abrir o painel com skeleton |
| P-17 | `CatalogoDrawer.tsx` | **[C]** Filtro de músculo fica escondido. Sem contador de adicionados nem botão "Concluir" | Fluxo principal com passos a mais | Méd. | Chips de músculo e barra "N adicionados · Concluir" |
| P-18 | Formulário e `LinhaSerie` | **[C]** Tempo só em minutos: 45 s exige digitar 0,75, e 1,33 vira 1,3333333 no campo | Confuso para quem faz isometria e cardio | Méd. | Campo próprio de minutos e segundos |
| P-19 | `CriarEditarTreino.tsx` | **[C]** Descanso só muda de 15 em 15 s, e não existem metas por série (12/10/8) | Muitos toques. Pirâmide não pode ser planejada | Méd. | Opções rápidas de descanso; metas por série depois |

### Execução do treino

| # | Tela ou componente | Problema | Impacto | Grav. | Solução |
|---|---|---|---|---|---|
| P-20 | `DescansoBar.tsx:44`, `avisoDescanso.ts` | **[C]** Fim do descanso: toast de 2,5 s e vibração, sem som. O iPhone não vibra pela web, e a notificação é opcional e fica escondida | O usuário perde o fim do descanso | Alta | Som opcional e aviso que fica até ser dispensado |
| P-21 | `Treino.tsx`, `sessao.ts:227` | **[M]** Sem rolagem automática. Em 360 × 640, a 3ª série fica sob o descanso e o exercício novo abre com o título fora da tela. Em 390 × 844, não ocorre | Interrupção durante o treino em telas pequenas | Alta | Rolar até a próxima série e ao topo no novo exercício |
| P-22 | `sessao.ts` | **[C]** Não dá para adicionar, trocar ou pular com clareza um exercício durante o treino | Aparelho ocupado é rotina em academia cheia | Alta | Adicionar e trocar na sessão, sem mudar a rotina salva |
| P-23 | `Treino.tsx:185` | **[C]** Exercícios aparecem só como números 1, 2, 3 | Não dá para saber o que vem a seguir | Alta | Painel com a lista de nomes e o próximo exercício visível |
| P-24 | `LinhaSerie.tsx` | **[C]** Sem botões de ± para carga e reps, e sem avançar pelo teclado. Corrigir série exige desfazer, e refazer reinicia o descanso | Vários toques para o ajuste mais comum | Alta | Stepper de carga e reps, edição sem reiniciar o timer |
| P-25 | `Treino.tsx`, `BannerSessaoAtiva` | **[C]** O descanso só aparece em `/treino`. Evolução e Exercícios nem mostram o banner | Quem consulta outra tela perde o tempo | Méd. | Mini barra global com o tempo restante |

### Acessibilidade (WCAG 2.2 AA)

| # | Tela ou componente | Problema | Critério | Grav. | Solução |
|---|---|---|---|---|---|
| P-26 | `Treino.tsx:199`, `MeusTreinos.tsx:185` | **[M]** Tema claro: chip concluído com 3,94:1 e chip de dia com 4,22:1 | 1.4.3 | Méd. | Texto em `foreground` ou tom mais escuro |
| P-27 | `index.html` | **[C]** Título da página é o mesmo em todas as rotas, e o foco não muda ao navegar | 2.4.2, 2.4.3 | Méd. | Título por rota e foco no `h1` |
| P-28 | `AuthForm.tsx` | **[C]** Sem `autocomplete` em email e senha, e sem mostrar senha | 1.3.5 | Méd. | Atributos corretos e botão de ver senha |
| P-29 | `CatalogoDrawer.tsx:268,96` | **[C]** Linha expansível é `div` com clique, sem teclado. X da busca sem nome | 2.1.1, 4.1.2 | Méd. | Usar `button` com `aria-expanded` e `aria-label` |
| P-30 | `sheet.tsx:65` | **[C]** O X de fechar tem cerca de 16 px em todos os painéis, sem área extra | Usabilidade (2.5.8 pode passar por espaçamento) | Méd. | Área de toque de 44 px |
| P-31 | `sonner.tsx:14` | **[C]** Todas as mensagens somem em 2,5 s, inclusive as longas e os erros | 2.2.1 | Méd. | Erros com 6 s ou mais, ou até dispensar |
| P-32 | `BottomNav.tsx`, `Exercicios.tsx:56`, `MeusTreinos.tsx:161`, `Evolucao.tsx:260` | **[C]** Navegação sem `aria-current` nem nome; busca sem rótulo; título pula de h1 para h3; `span` com `aria-label` | 1.3.1, 4.1.2 | Baixa | Ajustes pontuais |

Os testes com axe não pegaram P-26 porque não visitam esses estados da interface.

### Navegação, dashboard e responsividade

| # | Tela ou componente | Problema | Impacto | Grav. | Solução |
|---|---|---|---|---|---|
| P-33 | `Index.tsx:143` | **[C]** Sem dias definidos, a tela inicial só mostra um aviso, sem botão de iniciar. Duplicar também apaga os dias | Quem treina A/B/C sem dia fixo fica sem ação **[H: quantos são]** | Alta | "Próximo da sequência" pelo último treino feito |
| P-34 | `AreaLogada.tsx` | **[M]** Trocar de aba mantém a rolagem: Evolução → Exercícios abriu em 3.038 px, no meio da lista | A aba abre no meio, sem título nem busca à vista | Alta | Levar ao topo a cada navegação nova |
| P-35 | `Index.tsx:102` | **[C]** Sair fica ao lado de Ajustes, sem confirmação, e limpa o cache local | Toque acidental desloga o usuário | Alta | Mover para Minha conta, com confirmação |
| P-36 | `Evolucao.tsx` | **[C]** Até 10 seções em uma rolagem só: o Histórico, muito usado, é o último | Informação frequente fica difícil de achar | Alta | Abas: Resumo, Histórico, Exercícios, Conquistas |
| P-37 | `MeusTreinos.tsx` | **[C]** Não há tela de detalhes: ver os exercícios exige abrir a edição. Card com 3 grupos de chips e 4 botões | Risco de alterar sem querer, visual carregado | Alta | Prévia ao tocar no card, ações em menu |
| P-38 | Index × Evolução | **[C]** Volume por semana aparece grátis na tela inicial e bloqueado na Evolução | Plano parece incoerente | Méd. | Definir uma regra só |
| P-39 | `estatisticas.ts` | **[C]** Recorde só considera carga: 100 kg × 1 supera 80 kg × 10, e reps não contam. Sem visão por grupo muscular | Evolução parcial, pouco útil em peso corporal | Méd. | 1RM estimado e recorde de reps |
| P-40 | `Index.tsx` | **[C]** Volume em kg ganha mais espaço do que o próximo passo do usuário. Recordes sem data | Iniciantes entendem pouco desse número **[H]** | Méd. | Reordenar (seção E) |
| P-41 | Todas as páginas | **[M]** 18 usos de `max-w-md` e nenhum breakpoint fora de `ui/`: em 1920 e 1366 é uma coluna de 448 px | Desktop subaproveitado, sobretudo em Evolução | Méd. | Layout largo só em Evolução e nos painéis |
| P-42 | `sheet.tsx`, `ExercicioDetalhes.tsx` | **[M]** Painel inferior ocupa toda a largura: fotos de 932 px em 1920 e 655 px em 1366, que empurram as instruções para fora da tela | Em computador, é preciso rolar para ler como fazer | Méd. | Limitar a largura a partir de `md` |
| P-43 | `Indicador.tsx:15` | **[M]** "153.600 kg" corta em 360 px por 4 px e cabe em 390 px | Número principal cortado só em telas pequenas e volumes altos | Baixa | Formato compacto (153,6 t) |
| P-57 | `Graficos.tsx:153,159` | **[M]** A margem esquerda de -16 corta o eixo Y: "16,5 mil" aparece como **"6,5 mil"**, entre 22 mil e 11 mil | O gráfico de volume mostra um número errado na tela inicial | Alta | Remover a margem negativa ou dar largura ao eixo |
| P-58 | Catálogo | **[M]** "Tríceps Pulley Inclinado" é de dorsais (tradução errada de *Cable Incline Pushdown*). 17 de 43 "supinos" têm tríceps como principal, então não aparecem no filtro Peito | Filtro e nome enganam | Méd. | Revisar na curadoria do catálogo |
| P-59 | `MeusTreinos.tsx:185-199` | **[M]** Dias e músculos têm quase a mesma cor e forma, e "Força" se repete sem agregar | Difícil ler o dia do treino de relance | Méd. | Dias em texto, e músculos em estilo neutro |
| P-60 | `BottomNav.tsx:18` | **[M]** Em 1920 a barra inferior tem 448 px e o conteúdo 416 px: as bordas não alinham | Detalhe que passa descuido em computador | Baixa | Mesma largura útil |
| P-44 | `AuthProvider.tsx` | **[C]** Sem `getRedirectResult`: conta Google criada por redirecionamento pula o onboarding. Reauthenticação só por popup | Fluxo incompleto em celular e PWA **[H: frequência]** | Méd. | Tratar o retorno do redirecionamento |
| P-45 | Ajustes | **[C]** Instalar o app fica escondido em Ajustes | Poucos instalam, e o offline depende de abrir o app antes **[H]** | Méd. | Convite depois do primeiro treino concluído |
| P-46 | Feedback | **[M]** Só 4 `toast.success`: salvar, duplicar e excluir não confirmam | Dúvida sobre o que aconteceu | Méd. | Confirmar ações que não têm resultado visível, com "Desfazer" ao excluir |

### Design system e código

| # | Local | Problema | Grav. | Solução |
|---|---|---|---|---|
| P-47 | `button.tsx:8` | **[C]** `[&_svg]:size-4` vence `w-5 h-5`: ícones de botão ficam em 16 px mesmo pedindo 20 | Méd. | Tamanho de ícone por variante |
| P-48 | Global | **[M]** 61 `text-[13px]`, h-8 a h-12, `bg-secondary` em 5 opacidades, 8 selects nativos e 4 Radix, 29 `<button>` crus | Méd. | Tokens e componentes da seção E |
| P-49 | Cabeçalhos, selects | **[C]** 3 padrões de cabeçalho, `classeSelect` copiado, estados vazios diferentes | Méd. | `PageHeader`, `Select`, `EstadoVazio` em todas as telas |
| P-50 | `ui/`, `package.json` | **[M]** 34 de 49 arquivos de `ui/` sem uso direto. cmdk, input-otp, embla, day-picker, resizable-panels, vaul, react-hook-form e outros só aparecem ali. `App.css` órfão, tokens `--sidebar-*` inexistentes, dois sistemas de toast | Baixa | Remover. O impacto é de manutenção: o build já descarta o que não é usado |
| P-51 | Build | **[M]** Catálogo em JS (728 KB), framer-motion em um único painel (chunk de 184 KB), fontes greek e cyrillic no pré-cache | Baixa | Catálogo em JSON via fetch, animação em CSS, restringir as fontes |
| P-52 | Dependências | **[M]** `npm audit`: 7 (5 altas, 2 moderadas), diretas em firebase, react-router-dom e zod. A análise de risco baixo em `docs/fase-6` segue válida para o que foi revisado lá | Méd. | Tarefa própria de upgrade |
| P-53 | `useExerciciosProprios`, `usePlano` | **[C]** Falhas são silenciosas: sem erro para o usuário. Erro ao ler assinatura vira plano gratuito | Méd. depois da cobrança | Expor erro, manter o último plano conhecido |
| P-54 | `useSessoes` | **[C]** Lê todas as sessões, sem paginação. Hoje é pouco (cerca de 200 documentos por ano) | Baixa | Paginar antes de escalar |
| P-55 | CI | **[C]** `test:pwa` não roda no CI, e não há testes em 1366 e 1920 | Baixa | Adicionar |
| P-56 | Exercício próprio | **[C]** Histórico agrupa por nome: renomear divide a evolução em duas | Baixa | Agrupar por ID, com o nome como reserva |

**Segurança:** isolamento correto. Riscos restantes: sem App Check, cadastro aberto e sem teto de gastos (já em `docs/fase-6`), e o Premium estatístico é bloqueado só na interface. A chave Firebase no código não é vazamento.

---

## D. Melhorias recomendadas

**P0: obrigatórias**
- Corrigir tempo (P-04), exportação (P-07) e eixo do gráfico (P-57).
- Editar e excluir treino finalizado (P-03).
- Busca e sinônimos do catálogo (P-09, P-10).
- Proteger formulário contra perda (P-12).
- Confirmar o Sair (P-35), rolagem ao navegar (P-34).
- Monitoramento de erros (P-06).
- Lista de pendências de lançamento (P-05).
- Página pública e lista de espera (P-01, P-02). Checkout antes de cobrar.

**P1: alta prioridade**
- Treino: som e aviso de descanso, rolagem, lista de exercícios, ± de carga, adicionar e trocar exercício (P-20 a P-25).
- Montagem: modelos, cards recolhíveis, populares e chips, barra de salvar (P-11, P-13 a P-18).
- Início para quem treina sem dia fixo (P-33), detalhes do treino (P-37), abas em Evolução (P-36).
- Acessibilidade (P-26 a P-31) e feedback (P-46).
- Design system básico (P-47 a P-49).

**P2: evolução**
- 1RM estimado, recordes de reps e carga por grupo muscular (P-39).
- Sugestão de progressão, metas por série, tipos de série (aquecimento, drop-set), supersets, favoritos.
- Layout largo em desktop (P-41, P-42), convite para instalar (P-45), métricas (P-08), limpeza e upgrades (P-50 a P-52).

**P3: futuro**
- Área para personal trainers, relatórios, lembretes por push, recursos para academias, publicação em lojas e vídeos próprios.

### Quais funcionalidades valem a pena

| Funcionalidade | Hoje | Recomendação |
|---|---|---|
| Histórico completo | Existe, sem edição | **P0:** adicionar edição |
| Temporizador | Existe, aviso fraco | **P1:** som e aviso persistente |
| Carga e reps por série | Existe | Manter, adicionar ± |
| Duplicação | Existe | Manter, com confirmação |
| Modelos de fichas | Não existe | **P1:** maior ganho no primeiro uso |
| Calendário | Existe | Manter |
| Metas semanais | Existe | Manter. Avaliar liberar as personalizadas se a conversão for baixa **[H]** |
| Gráficos | Carga e frequência | **P2:** 1RM e grupos musculares, sem novos gráficos decorativos |
| Progressão automática | Só repete o último valor | **P2:** sugestão simples e explicável, sempre editável |
| Favoritos | Não existe | **P2:** a marcação de "populares" resolve a maior parte antes |
| Vídeos | Só duas fotos | **P3:** custo alto. Antes, resolver a licença das fotos |
| Notificações e lembretes | Parcial | **P3:** exigem servidor, e o iPhone tem limitações |
| Relatórios | CSV | **P3:** pouca demanda até haver base de usuários **[H]** |
| Personal trainers | Não existe | **P3:** outro produto, com B2B. Validar com 5 a 10 profissionais antes |
| Modo academia (B2B) | Não existe | Não agora: desvia do usuário individual |

---

## E. Proposta de evolução visual

**Princípio: refinar, sem refazer.** A identidade atual funciona.

- **Identidade:** manter grafite com limão, o que já diferencia o app do azul comum em fitness. Limão só em ação principal, progresso e conquistas. Hoje ele também está em chips informativos, o que dilui o destaque. O app já tem logo, um haltere em limão, funcional mas genérico: vale revisar antes do lançamento. Criar momentos de marca: fim de treino e novo recorde. O resumo hoje é só uma lista de números.
- **Cores:** manter os tokens. Adicionar `--surface-2` e `--surface-3` no lugar das 5 opacidades de `bg-secondary`. Corrigir os chips no tema claro.
- **Tipografia:** manter Inter. Criar escala: `display` 32, `title` 24, `heading` 18, `body` 15–16, `caption` 13, e `metric` com números tabulares. Substitui `text-[13px]`.
- **Componentes:**
  - Botão com alturas fixas: `sm` 36, `md` 44 e `lg` 52, com ícones de 20 px em `md` e `lg`.
  - Um `Select` só, nativo no celular.
  - `Chip` com variantes: filtro, informação e status.
  - `PageHeader`, `SectionHeader`, `StatCard`, `ListRow`, `Stepper` e `StickyActionBar`.
  - Foco com o mesmo anel em todos os elementos, e todos os estados documentados.
- **Layout:** espaçamento em 4, 8, 12, 16, 24. Em listas, usar linhas e divisores em vez de um card para cada item.
- **Dashboard, nesta ordem:**
  1. Treino em andamento, se houver.
  2. **Próximo treino**, com botão grande. Opção "escolher outro".
  3. Semana: 7 bolinhas (feito, previsto) e meta.
  4. Recordes recentes, com data e motivação.
  5. Último treino, com "Repetir".
  6. Mês em uma linha compacta, com link para Evolução. O gráfico de volume vai para lá.
- **Evolução por abas:** Resumo, Histórico, Exercícios e Conquistas.
- **Desktop:** coluna de 448 px mantida no treino. Duas colunas em Evolução e largura limitada nos painéis.

**Tela de treino proposta (celular, uso com uma mão)**

```
← Peito e Tríceps      32:10     [Lista]
████████░░░░░░ 9 de 18 séries
─────────────────────────────────────
Supino reto com barra            [⋯]
Última vez: 60 kg × 10

#   KG           REPS
1   60           10            [✓ feita]
2  [− 60 +]     [− 10 +]       [ ✓ ]   ← em destaque
3   60           10            [ ✓ ]
─────────────────────────────────────
Próximo: Crucifixo com halteres   →
┌───────────────────────────────────┐
│ Descanso 1:24   −15  +15   Pular  │  ← zona do polegar
└───────────────────────────────────┘
```

Como fazer, evolução, observação e descartar passam para o menu `⋯`, liberando espaço. Finalizar fica na lista e ganha destaque quando tudo estiver feito.

**Navegação proposta:** manter as 4 abas. Trocar a engrenagem e o Sair por um único acesso a **Conta**, que reúne ajustes, plano e dados. Avaliar **[H]** se a aba Exercícios merece continuar, olhando as métricas de uso.

---

## Mercado e posicionamento

| | Hevy | Strong | JEFIT | Diário de Academia |
|---|---|---|---|---|
| Limite de rotinas grátis | 4 | 3 | Sem dado confiável | **4** |
| Exercícios próprios grátis | 7 | Não verificado | Sem dado confiável | **10** |
| Preço | US$ 2,99/mês ou 23,99/ano | US$ 4,99/mês ou 29,99/ano | Fontes divergem | Não definido |
| Português e academia brasileira | Não avaliado | Não avaliado | Não avaliado | **Oportunidade** |

**Leitura:**
- **O limite de 4 treinos está alinhado com o mercado:** não recomendo mudar. Eu suspeitava que era baixo, mas os dados não confirmam.
- **Requisitos mínimos do mercado que faltam:** editar histórico, modelos, adicionar exercício durante o treino, superset e aviso de descanso confiável. Fotos e vídeos também são comuns. *Esta lista vem do meu conhecimento desses apps, e não de um teste nesta auditoria.*
- **Diferenciais possíveis:**
  - Linguagem das academias brasileiras: "cadeira extensora", "voador", ficha A/B/C.
  - Pagamento em reais, com Pix.
  - Funciona sem sinal e sem instalar pela loja.
  - Sugestão de carga simples e explicada.
- **Desvantagem real:** concorrentes estão nas lojas de apps, com relógio e prova social. PWA reduz a descoberta. Preço inicial precisa considerar isso.

Fontes: [Hevy, central de ajuda](https://help.hevyapp.com/hc/en-us/articles/35119778922263-Hevy-Pro-Subscription-How-to-get-Pro-and-What-Does-It-Include), [Strong na App Store](https://apps.apple.com/gb/app/id464254577), [comparativo Hevy e Strong](https://www.sensai.fit/blog/hevy-vs-strong-2026), [JEFIT (secundária)](https://www.boostcamp.app/vs/jefit). Preços variam por região e devem ser confirmados antes de precificar.

---

## F. Roadmap de implementação

A ordem prioriza maior impacto e menor risco. Cada etapa termina com lint, typecheck, testes e build. Nenhuma funcionalidade é removida.

### Etapa 0: passe visual real (concluída)
- **O quê:** rodar o app no emulador com dados de teste e capturar todas as telas em 1920, 1366, 768, 390 e 360 px, nos dois temas. Rodar E2E, regras e PWA. Confirmar as hipóteses de layout e rever as notas.
- **Por quê:** é o que esta auditoria não pôde fazer, e evita corrigir o que não está errado.
- **Telas:** todas (sem mudar código).
- **Dependências:** Java e Playwright.
- **Aceite:** galeria de telas e relatório atualizado, com P-21, P-34, P-42 e P-43 confirmados ou descartados.

### Etapa 1: confiança nos dados
- **O quê:** P-04, P-07, P-57, P-03, P-12, P-34, P-35, P-46.
- **Por quê:** perda ou erro de dados destrói a confiança. São mudanças pequenas, e as regras já permitem editar e excluir.
- **Telas:** Treino, Resumo, Conta, Criar treino, Início.
- **Dependências:** nenhuma.
- **Aceite:** corrigir um peso no histórico atualiza recordes e gráficos; 45 s aparece como 0:45; sair do formulário alterado pede confirmação; toda navegação abre no topo; testes novos para cada item.

### Etapa 2: primeiro treino em menos de 3 minutos
- **O quê:** P-09, P-10, P-11, P-58, P-13, P-14, P-15, P-16, P-17.
- **Por quê:** é o maior risco de abandono.
- **Telas:** Onboarding, Criar treino, Catálogo, Exercícios.
- **Dependências:** curadoria de sinônimos e populares, que você pode revisar.
- **Aceite:** "peito" mostra supino nos primeiros resultados; todos os termos de P-10 retornam algo; um modelo vira treino em 3 toques; teste com 5 pessoas sem ajuda, com a meta de 3 minutos.

### Etapa 3: treino com uma mão
- **O quê:** P-20 a P-25, P-18, P-19, tela proposta na seção E.
- **Por quê:** é a função que faz o usuário voltar.
- **Telas:** Treino, DescansoBar, navegação global.
- **Dependências:** Etapa 0. Celular real, Android e iPhone.
- **Aceite:** sequência de 3 séries sem rolar a tela em 360 × 640; fim do descanso percebido com a tela à vista no iPhone; trocar um exercício sem alterar a rotina salva; testes E2E atuais continuam passando.

### Etapa 4: design system
- **O quê:** tokens, componentes da seção E, P-47 a P-49, P-26 a P-32.
- **Por quê:** reduz o custo das próximas etapas. Vem depois da 3 para já incorporar o que a tela de treino precisar.
- **Telas:** todas, de forma gradual.
- **Dependências:** Etapa 3.
- **Aceite:** sem `text-[13px]` e sem select duplicado; axe nos estados que faltavam; título por rota; comparação visual antes e depois, tela a tela.

### Etapa 5: início e evolução
- **O quê:** P-33, P-36, P-37, P-59, P-38, P-39, P-40, P-41, P-42, P-43, P-60, dashboard da seção E.
- **Por quê:** dá motivo para abrir o app fora do treino.
- **Telas:** Início, Evolução, Treinos, Planos.
- **Dependências:** Etapa 4 e sua decisão sobre o que é Premium.
- **Aceite:** toda conta com treino vê um botão de iniciar; nenhum número principal cortado em 360 px; regra de Premium coerente entre telas e `COMPARACAO_PLANOS`; cálculos com testes de valores conhecidos.

### Etapa 6: pronto para vender
- **O quê:** P-01, P-02, P-05, P-06, P-08, P-44, P-45, P-53. Checkout conforme `docs/adr/001-pagamentos.md`.
- **Por quê:** só vale atrair pessoas depois que a experiência sustenta a retenção. Monitoramento pode ser antecipado.
- **Telas:** nova página pública, Planos, Conta, Legal.
- **Dependências:** suas decisões abaixo, plano Blaze do Firebase e revisão jurídica.
- **Aceite:** lista da Fase 6 concluída; pagamento de teste libera o Premium e cancelar o encerra; erro de teste aparece no monitoramento; beta fechado com 20 a 50 pessoas, medindo primeiro treino e retorno na segunda semana.

### Contínuo, em paralelo
P-50, P-51, P-52, P-54, P-55, P-56.

---

## Decisões que dependem de você

1. **Quando cobrar:** recomendo beta gratuito com lista de espera até a Etapa 5, e checkout depois.
2. **Regra do Premium:** o volume deve ser grátis? Recomendo manter grátis e cobrar por análises mais profundas, como 1RM, grupos musculares e histórico longo.
3. **Desktop:** recomendo tratar como secundário e fazer só o que está em P-41 e P-42.
4. **Quem é o público inicial:** recomendo quem já treina musculação e usa ficha no papel ou planilha. Isso define os modelos e a linguagem.

---

## Verificação

- **Desta auditoria:** comandos executados, com resultados no início do relatório, e `git status` limpo.
- **Das próximas etapas:** `npm run lint`, `typecheck`, `test`, `test:rules`, `test:e2e`, `test:pwa` e `build`, além dos critérios de aceite de cada etapa e de teste em celular real nas Etapas 3 e 6.

**A Etapa 0 está concluída, sem alterar o código do produto.** A próxima é a Etapa 1, que só começa depois da sua revisão.
