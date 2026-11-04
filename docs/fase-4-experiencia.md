# Fase 4: Experiência premium

Registro do que mudou e do que continua pendente.

## Visual

- Temas claro, escuro e sistema, em Ajustes. O escuro continua sendo o padrão.
- **Identidade: grafite neutro com verde-limão.** O limão puro não tem contraste sobre branco, então o tema claro usa um tom mais escuro. Os gráficos têm token próprio (`--grafico`), um pouco menos luminoso que o botão, validado contra as duas superfícies.
- Cores definidas por tokens em `src/index.css`. Sem gradientes, brilhos nem desfoque, que também pesavam no celular.
- Bordas de campo com pelo menos 3:1 de contraste nos dois temas. Cantos menores e listas sem uma caixa para cada linha.
- Uma ação principal por tela: na tela de treino, só a próxima série fica em destaque. "Finalizar" ganha destaque quando tudo foi feito.
- Tela de treino com colunas KG e REPS, números maiores, "Como fazer" e "Evolução" compactos, e observações recolhidas.
- Remover série agora é um botão só e atua na última série, se ela ainda não foi feita.
- Cabeçalho único nas abas (`Cabecalho`). A saudação nunca usa o email como nome.
- Avisos no topo, mais curtos, e só quando a tela não mostra o resultado sozinha. Abrir um painel não coloca o foco na busca, para não abrir o teclado no celular.
- Esqueleto de carregamento (`TelaCarregando`), estado vazio (`EstadoVazio`) e erro (`ErrorState`) compartilhados.
- Controles principais com 44 px ou mais. Animações respeitam a preferência de movimento reduzido do aparelho.
- Números em formato brasileiro: 57,5 kg.
- **Ainda sem:** logo, ícone do app e imagens no novo padrão. Inter continua vindo do Google Fonts; hospedar a fonte no próprio app fica para o PWA (Fase 6).

## Dashboard

Próximo treino, semana × meta, sequência de semanas, resumo do mês, volume por semana, recordes recentes e último treino.

A meta semanal começa vazia: nenhum valor é assumido até a pessoa definir, em Ajustes.

## Evolução (`/evolucao`)

- Comparação de 7, 30 ou 90 dias com o período anterior. Sem base de comparação, não aparece porcentagem.
- Treinos e volume por semana, calendário, recordes, lista de exercícios e histórico completo.
- Página de cada exercício, com recorde, gráfico de carga e todas as sessões.

## Como fazer (durante o treino)

Botão em cada exercício que abre imagens de início e fim, músculos e passo a passo, por cima do treino. O descanso e as séries continuam como estão.

Exercícios antigos, como os do treino fixo, não têm ligação com o catálogo. Nesse caso, o app sugere exercícios parecidos pelo nome e pede para conferir. A ligação nunca é feita sozinha, porque um nome parecido pode ser outro movimento.

## Como os números são calculados

Tudo está em `src/domain/estatisticas.ts`, em funções puras testadas com valores conhecidos.

| Medida | Regra |
|---|---|
| Semana | Começa na segunda, no fuso do aparelho |
| Volume | Carga × repetições das séries concluídas |
| Registros antigos | Contam em treinos, séries e carga. Ficam fora de volume e tempo, e a tela avisa |
| Peso corporal e cardio | Não geram volume e não contam como dado faltando |
| Recorde | Só carga maior que o melhor valor anterior. A primeira vez e o empate não contam |
| Sequência | Semanas seguidas com treino. Não ter treinado ainda nesta semana não quebra |

## Gráficos

Seguem uma só série por gráfico, sem eixo duplo, com linha de 2 px e colunas de até 24 px. A cor primária foi validada contra as duas superfícies. Cada gráfico tem "Ver dados", com a tabela: o tooltip nunca é a única forma de ler um valor.

## Bugs encontrados nesta fase

- **Migração entre contas (grave, nunca chegou à produção):** as rotinas do treino fixo usavam o mesmo ID para todas as contas numa coleção compartilhada, e a segunda conta em diante era bloqueada pelas regras. O ID agora inclui o usuário, com teste de regressão.
- **Finalizar sem sinal:** foi corrigido no fim da Fase 3, antes de ser publicado.

## Regras do Firestore

`firestore.rules` mudou de novo: a meta semanal só aceita inteiros de 1 a 7. Publique esta versão.

## Testes

| Suíte | Resultado |
|---|---|
| Unitários | 110 passando |
| Regras no emulador | 62 passando |
| E2E em viewport de celular | 30 passando |

## Pendências

- **Critério de saída em aberto:** usar em um celular real. O E2E usa viewport de Pixel 7 no Chromium.
- **Como fazer:** a escolha de um exercício parecido não fica salva, e as imagens precisam de internet até o PWA (Fase 6).
- **Migração:** ainda não foi testada com dados reais.
- **Custo:** a lista de sessões é lida inteira e fica em cache. Com um documento por treino, isso é bem menor que antes, mas deve ganhar paginação antes de muitos usuários.
- **Sem teste automatizado:** telas de erro, recuperação de senha, login com Google e o tema "Sistema".
- **Fora desta fase:** metas avançadas, conquistas, exportação e onboarding (Fase 5).
