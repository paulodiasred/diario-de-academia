# Fase 5: Comercialização

Registro do que mudou e do que continua pendente. **Nenhuma cobrança foi implementada.**

## Planos

| Recurso | Gratuito | Premium |
|---|---|---|
| Treinos | Até 4 | Sem limite |
| Exercícios próprios | Até 10 | Sem limite |
| Comparação entre períodos | 7 dias | 7, 30 e 90 dias |
| Volume por semana na Evolução | Não | Sim |
| Histórico por exercício | Últimos 5 treinos | Completo |
| Gráfico de carga | Últimos 10 treinos | Últimos 30 treinos |
| Metas personalizadas | Não | Sim |
| Conquistas | 4 básicas | Todas as 10 |
| Relatório por exercício | Não | Sim |
| Exportar todos os dados | Sim | Sim |

Os valores estão em `src/domain/planos.ts` e foram uma decisão inicial, fácil de ajustar. Os limites também estão em `firestore.rules`: altere os dois juntos.

## O que é garantido e o que não é

- **Garantido pelas regras do Firestore:** limites de treinos e de exercícios próprios, metas só no Premium, e o cliente não consegue conceder plano a si mesmo. Os testes tentam burlar isso pelo SDK direto.
- **Só na interface:** períodos, gráficos, histórico, conquistas e relatório. São calculados no aparelho com dados do próprio usuário, então alguém com conhecimento técnico consegue contornar. Se isso virar um problema real, o cálculo precisa ir para o servidor.
- **Exportação de todos os dados continua gratuita:** a LGPD prevê acesso e portabilidade. Vale confirmar com um advogado.

## Como os limites funcionam

- `users/{uid}/uso/contadores` conta o que foi criado. Só muda no mesmo lote da criação ou exclusão real do documento, e não pode ser apagado.
- **Quem já tem dados mantém tudo:** treinos antigos e rotinas migradas não ocupam vaga e nunca são apagados. Por isso, uma conta antiga pode passar do limite, mas não cria mais depois de usar as vagas.
- Excluir nunca é bloqueado. Excluir um treino antigo com o contador acima de zero também libera uma vaga, o que é um efeito pequeno e a favor do usuário.

## Conceder Premium no beta

No Firebase Console → Firestore, crie o documento `entitlements/<uid do usuário>` com o campo `plano` = `premium` (texto). O campo `expiraEm` (timestamp) é opcional. O uid está em Authentication → Users. O app lê o plano ao abrir, então a pessoa precisa recarregar.

## Outras entregas

- **Onboarding:** três passos logo após o cadastro, com a meta semanal. Sempre dá para pular, e não aparece em logins normais.
- **Metas personalizadas:** carga em um exercício, treinos no mês ou volume no mês, com progresso calculado dos treinos reais.
- **Conquistas:** calculadas dos treinos, sem nada guardado à parte.
- **Exportação:** histórico em CSV para Excel em português, com proteção contra fórmulas maliciosas, e todos os dados em JSON. Tudo é gerado no aparelho.
- **Compartilhar resumo:** usa o compartilhamento do celular ou copia o texto.
- **Excluir conta:** em Minha conta, com confirmação e identidade verificada antes de apagar qualquer dado.
- **Pagamentos:** decisão em aberto, em [adr/001-pagamentos.md](adr/001-pagamentos.md).

## Marca e imagens

- **Licença das fotos e dos dados do catálogo:** confirmada pelo responsável do projeto em novembro de 2026. A verificação não foi feita neste repositório, então guarde a fonte e os termos junto da documentação da empresa.
- **Logo:** versão inicial em SVG (`public/logo.svg`), com ícones de site, celular e PWA e imagem de compartilhamento. Pode ser trocada por um trabalho de designer.
- **Fotos:** convertidas para WebP com até 640 px, de 98,7 MB para 34 MB, com saturação levemente reduzida. O fundo original continua, porque remover fundo automaticamente em 1.746 fotos erraria demais.
- **Enquadramento:** `ImagemExercicio` padroniza as fotos, reduz o brilho no tema escuro e mostra um ícone quando não há foto.
- **Caminhos antigos:** o catálogo e os treinos salvos guardam `.jpg`, e `getExerciseImageUrl` converte para `.webp`. Nenhum dado precisou mudar.
- **Como fazer:** "Usar sempre este" salva a referência em `users/{uid}.vinculosExercicios`, por nome de exercício, e a miniatura aparece no treino. Dá para trocar.
- **`og:image`:** o caminho é relativo, e algumas redes exigem endereço completo. Defina com o domínio final na Fase 6.

## Bugs encontrados nesta fase

- **Faltava a regra de leitura de `entitlements`:** sem ela, o app inteiro falharia ao consultar o plano. O teste de burla pegou antes de publicar.

## Antes de publicar

- **As regras mudaram:** criar treino agora exige o contador. Depois de publicá-las, o app antigo no ar não consegue mais criar treinos, então publique regras e app em seguida um do outro, regras primeiro.
- **Conceda Premium à sua conta**, se quiser continuar vendo tudo.

## Testes

| Suíte | Resultado |
|---|---|
| Unitários | 137 passando |
| Regras no emulador | 85 passando |
| E2E em viewport de celular | 40 passando |

## Pendências

- **Sobra ao excluir conta:** `uso/contadores` e `entitlements/{uid}` continuam no banco, porque o cliente não pode apagá-los. O primeiro tem só números e um ID. A limpeza precisa de Cloud Function ao excluir a conta, o que exige plano Blaze. Isso precisa ser resolvido ou declarado na política de privacidade antes do lançamento.
- **Excluir conta com login Google não foi testado:** a confirmação usa janela do Google, que os testes automáticos não cobrem. O fluxo com senha foi testado de ponta a ponta.
- **Sem conexão,** excluir conta e exportar tudo não funcionam, e é esperado. O erro aparece como aviso.
- **Backup:** há exportação, mas não restauração a partir do arquivo.
- **Verificação de email:** ainda não existe, e o cadastro é aberto.
- **Política de privacidade e termos:** ainda não existem (Fase 6).
- **Preço e pagamento:** aguardam a decisão em `adr/001-pagamentos.md`.
- **Fase 4:** o teste em celular real continua em aberto. A migração com dados reais foi confirmada pelo responsável.
- **Insights com IA:** não implementados, como previsto.
