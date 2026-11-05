# Auditoria de UX e produto

Registro da auditoria de novembro de 2026 e do que foi feito a partir dela. O diagnóstico completo, com os problemas P-01 a P-60, está em [auditoria-ux-relatorio.md](auditoria-ux-relatorio.md).

## O que mudou

| Etapa | Entrega |
|---|---|
| 1. Confiança nos dados | Corrigir e excluir treino finalizado, tempo em `m:ss`, eixo dos gráficos, exportação sem arquivo vazio, rascunho do formulário, confirmação ao sair da conta |
| 2. Primeiro treino | Modelos prontos, busca por termos de academia, curadoria do catálogo, exercícios recolhíveis e arrastáveis |
| 3. Treino com uma mão | Três séries sem rolar em 360 × 640, ajustes de carga e repetições, som e aviso de descanso, lista de exercícios, trocas só no treino do dia |
| 4. Design system | Tokens de texto e superfície, botão de 44 px, seletor e cabeçalho únicos, título por tela, correções de WCAG 2.2 AA |
| 5. Início e evolução | Próximo treino para todos, semana em 7 marcadores, ficha do treino, Evolução em abas, 1RM estimado e séries por grupo muscular |
| 6. Entrada de novos usuários | Página pública, Premium pedido por email, Sentry, convite para instalar |

## Decisões de produto

- **Cobrança:** beta gratuito, com checkout depois.
- **Premium:** o volume é grátis; 1RM estimado, grupos musculares e histórico longo são pagos.
- **Computador:** secundário. Só a Evolução e os painéis se adaptam a telas grandes.
- **Público inicial:** quem já treina e usa ficha no papel ou planilha.

## Como funciona

- **Identidade do exercício:** mesmo ID ou mesmo nome é o mesmo exercício, em cadeia (`identificarExercicios`). Renomear não divide a evolução nem zera recordes.
- **Curadoria do catálogo:** `src/domain/curadoriaCatalogo.ts` corrige nomes, sinônimos e populares por cima do arquivo original, sem alterar IDs. Nunca reaproveite um nome antigo em outro exercício: o histórico também liga por nome.
- **Próximo treino:** pela agenda; sem dias definidos, o seguinte ao último feito, na ordem alfabética dos nomes.
- **1RM estimado:** fórmula de Epley, até 12 repetições. Serve para comparar treinos.
- **Sentry:** desligado sem `VITE_SENTRY_DSN`. O padrão do SDK é coletar dados pessoais, por isso `src/lib/monitoramento.ts` desliga cada categoria. Isso sustenta o que a política de privacidade promete: altere os dois juntos.

## Como liberar o Premium

No Firebase Console, em `entitlements/{uid}`, crie o campo `plano` com o valor `premium`. Para encerrar, apague o documento.

## O que falta

**Antes de abrir ao público:** revisão jurídica, licença das fotos, backup do Firestore, teto de gastos, testes em Android e iPhone e teste de primeiro uso com 5 pessoas. Veja [fase-6-lancamento.md](fase-6-lancamento.md).

**Depende de decisão:**
- Métricas de uso, que exigem mudar a política de privacidade.
- Checkout, depois do beta.

**Melhorias técnicas conhecidas:**
- 37 botões próprios ainda fora do componente `Button`.
- Histórico lido sem paginação, o que convém resolver antes de ter muitos usuários.
- Cardio medido por tempo conta no músculo principal, porque o histórico não guarda a categoria.

**Evolução futura:** progressão de carga, metas por série, supersets, tipos de série, favoritos, lembretes e área para personal trainers.
