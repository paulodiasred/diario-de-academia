# Fase 6: Lançamento

O que foi feito, o que precisa acontecer antes de abrir ao público e como voltar atrás.

## O que mudou

- **PWA:** o app é instalável e abre sem internet. Cerca de 2,9 MB ficam guardados no aparelho. As fotos não são baixadas de antemão: cada uma fica guardada depois de vista, até 400 fotos.
- **Atualização:** a nova versão aparece como aviso com o botão "Atualizar", para nunca recarregar no meio de uma série.
- **Durante o treino:** a tela fica ligada, em aparelhos com suporte, e há aviso opcional de fim do descanso.
- **Fonte no próprio app:** a Inter não vem mais do Google, o que ajuda no uso sem internet e na privacidade.
- **Conta:** email de verificação no cadastro, sem bloquear o uso, com opção de reenviar em Minha conta.
- **Legal:** política de privacidade e termos em rascunho, em `/privacidade` e `/termos`, abertos sem login.

## Desempenho

Medido com Lighthouse, em simulação de celular médio com 4G, no build.

| Página | Desempenho | Acessibilidade | Boas práticas | SEO | Tela principal |
|---|---|---|---|---|---|
| Login, antes | 61 | 98 | 100 | 100 | 5,5 s |
| Login, depois | 91 | 100 | 100 | 100 | 0,8 s |
| Privacidade, depois | 100 | 100 | 100 | 100 | 0,8 s |

- **Causa encontrada:** a divisão manual de arquivos, feita na Fase 2, fazia o pacote de gráficos carregar na abertura. O número de "cerca de 1 MB" informado naquela fase estava subestimado.
- **Correção:** divisão automática de arquivos, e banco de dados e telas carregados só depois do login. A abertura caiu para 127 KB comprimidos.
- **Limite da medição:** só as páginas abertas sem login foram medidas. As telas logadas ainda carregam o Firestore, e não têm nota medida.

## Testes

| Suíte | O que cobre |
|---|---|
| `npm test` | Cálculos e regras de negócio |
| `npm run test:rules` | Isolamento entre usuários e tentativas de burla |
| `npm run test:e2e` | Fluxos, acessibilidade (axe, WCAG A e AA, nos dois temas) e telas de 320 px a 768 px |
| `npm run test:pwa` | Manifesto, fotos fora do pré-download, e abrir, treinar e finalizar sem internet, no build |

**O que testes automáticos não substituem:** celular real, instalação de verdade no Android e no iPhone, login com Google, recebimento de emails e uso com leitor de tela.

## Vulnerabilidades

`npm audit --omit=dev` aponta 10, nenhuma crítica. Foram analisadas sem aplicar a correção sugerida, porque o comando propõe **rebaixar** o Firebase para a versão 9.

| Pacote | Situação | Avaliação |
|---|---|---|
| `@grpc/grpc-js` e os pacotes do Firebase que dependem dele | Alta | O alerta trata de `getAuthContext`, função de servidor. O risco para um app de navegador parece baixo, mas acompanhe novas versões do Firebase |
| `zod` | Alta | Consumo de memória ao validar coleções enormes. Só valida dados do próprio aparelho, e as regras limitam o tamanho. Risco baixo. A correção exige a versão 4 |
| `react-router` | Moderada | Redirecionamento aberto com barra invertida em links. O app só navega para caminhos internos, com o nome do exercício codificado. Risco baixo. A correção exige a versão 7 |
| `glob`, `minimatch`, `sucrase` | Moderada | Ferramentas de build, sem execução no navegador. `npm audit fix` não resolveu por conflito de dependências |

**Pendente:** planejar os upgrades de zod e react-router como uma tarefa própria, com os testes como rede de proteção.

## Antes de abrir ao público

### Bloqueiam o lançamento

- [x] **Canal de contato:** `pauloalberto13@gmail.com`, definido em `src/pages/Legal.tsx`. Para trocar, use `VITE_CONTATO_EMAIL`.
- [ ] **Revisão jurídica:** os textos são rascunhos meus, não aconselhamento jurídico. Revisar LGPD, responsável pelos dados, transferência internacional e termos de saúde.
- [ ] **Licença das fotos e dados do catálogo:** guardar a fonte e os termos. Foi confirmada pelo responsável, mas não verificada neste repositório.
- [ ] **Teste em celular real:** Android e iPhone, com instalação, uso sem sinal e tela ligada.
- [x] **Migração validada** na conta real, confirmada pelo responsável em novembro de 2026.
- [ ] **Backup do Firestore ativo e restauração testada.** Veja abaixo.
- [ ] **Limite de gastos do Firebase:** configure alertas de orçamento, já que o cadastro é aberto.

### Muito recomendados

- [ ] **Monitoramento de erros:** hoje, um erro no aparelho de um usuário é invisível. Veja abaixo.
- [ ] **App Check:** dificulta o abuso do banco por clientes que não são o app. Veja abaixo.
- [ ] **Limpeza ao excluir conta:** dois registros técnicos continuam no banco. Já está declarado na política, mas o certo é uma Cloud Function, que exige o plano Blaze.
- [ ] **Domínio próprio:** defina `og:image` e `twitter:image` com endereço completo em `index.html`, e cadastre o domínio em Firebase → Authentication → Domínios autorizados.

### Podem esperar

- [ ] Lembretes de treino: exigem FCM e Cloud Function, porque notificação com o app fechado precisa de servidor.
- [ ] Insights com IA: precisam de dados reais e Cloud Function.
- [ ] Pagamento: veja [adr/001-pagamentos.md](adr/001-pagamentos.md).
- [ ] Restaurar backup a partir do arquivo JSON exportado.

## O que depende de configuração sua

**Backup:** no Google Cloud, configure backups agendados do Firestore. Confira na documentação atual se o seu plano permite. A exportação em JSON do app é por usuário e não substitui um backup do banco.

**Monitoramento de erros:** a integração com o Sentry já está no app e na política de privacidade, mas fica desligada até existir a chave. Crie o projeto no Sentry e defina `VITE_SENTRY_DSN` nas variáveis do Render. Não são enviados nome, email, cliques nem dados de treino.

**App Check:** não está no código, porque pesava 200 KB na abertura mesmo sem uso. Para ativar: crie a chave do reCAPTCHA, adicione o App Check ao app, publique, acompanhe as métricas no Console e só depois exija nas regras. Exigir antes bloqueia todo mundo. Também entra na política de privacidade.

## Publicar

1. **Rode tudo:** `npm run lint && npm run typecheck && npm test && npm run test:rules && npm run test:e2e && npm run test:pwa && npm run build`.
2. **Regras primeiro**, se `firestore.rules` mudou: publique pelo Console ou com `npx firebase deploy --only firestore:rules --project diario-de-academia-78b61`.
3. **Variáveis no Render (opcionais):** `VITE_CONTATO_EMAIL` e `VITE_FIREBASE_*`.
4. **Configuração no Render:**
   - Comando de build: `npm ci && npm run build`.
   - Pasta publicada: `dist`.
   - Rewrite de `/*` para `/index.html`.
   - Cabeçalho `Cache-Control: no-cache` em `/sw.js`. Sem isso, as atualizações do app podem demorar a chegar.
5. **Depois do deploy:** entre, registre uma série, recarregue, abra `/evolucao` direto e confira `/privacidade` e `/termos`.

## Voltar atrás

- **App:** no Render, refaça o deploy da versão anterior. Quem já tem o app instalado recebe o aviso de atualização.
- **Regras:** Firebase Console → Firestore → Regras → histórico de versões. Cuidado: o app atual precisa das regras atuais, então volte os dois juntos.
- **Dados:** a migração só cria documentos, e `registros` continua intacta. Sem backup ativo, não há como desfazer uma exclusão.

## Limitações conhecidas

- **Aviso de descanso:** com o app fechado ou suspenso pelo sistema, o aviso não dispara. O iPhone só permite notificação no app instalado.
- **Tela ligada:** depende do aparelho, e bateria fraca pode impedir.
- **Primeiro acesso exige internet:** o uso sem sinal vale depois de abrir o app uma vez, com a conta logada. Fotos só ficam disponíveis depois de vistas.
- **Estatísticas do Premium:** o bloqueio é só de interface.
