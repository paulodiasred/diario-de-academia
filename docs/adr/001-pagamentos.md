# ADR 001: gateway de pagamento

**Situação:** proposta, decisão ainda em aberto. Nada de pagamento foi implementado.
**Data da pesquisa:** novembro de 2026.

## Contexto

O Premium precisa de cobrança recorrente em reais, para um público brasileiro no celular. O app é PWA, então não paga comissão de loja de aplicativos. A liberação do Premium precisa acontecer no servidor, porque o cliente não pode gravar em `entitlements`.

## O que a pesquisa encontrou

**Não foi possível obter tabela oficial de preços de nenhum dos dois.** As fontes secundárias se contradizem, então nenhuma taxa abaixo deve ser usada para precificar.

| Ponto | Stripe | Mercado Pago |
|---|---|---|
| Assinatura por API | Sim (Billing). Preço no Brasil não encontrado | Sim, com ou sem plano associado, com novas tentativas automáticas em caso de recusa ([documentação](https://www.mercadopago.com.br/developers/pt/docs/subscriptions/overview)) |
| Cartão, taxa | Sem fonte oficial. Calculadoras de terceiros divergem: [3,99% + R$ 0,39](https://ecomcalctools.com/pt-br/payment/stripe-fee/) e [2,9% + R$ 0,30](https://www.paritydeals.com/blog/best-payment-gateways-brazil-2026/) | Sem fonte oficial. Um [post de fórum](https://www.tabnews.com.br/ownerczx/assinatura-de-planos-mercado-pago) cita de 3,99% a 4,99%, conforme o prazo de recebimento |
| Pix em assinatura | [Chargebee documenta](https://www.chargebee.com/docs/payments/2.0/payment-gateways-and-configuration/stripe-pix) Pix Automático via Stripe. Um [relato](https://www.tabnews.com.br/oraculo/3c79ef4a-1efd-42c0-a7ae-4281646623bb) diz que o acesso exige convite | A [documentação de planos](https://www.mercadopago.com.br/developers/pt/docs/subscription-plans/overview) lista Pix para recorrência. Não confirma Pix Automático |
| Disponibilidade | Há [relato](https://community.shopify.com/t/stripe-indisponivel-no-brasil/560724) de indisponibilidade via Shopify, sem data nem motivo oficial | Disponível no Brasil |

## Recomendação provisória

**Começar pelo Mercado Pago**, desde que as verificações abaixo confirmem. A documentação oficial já cobre assinatura com Pix e cartão, e a marca é conhecida do público brasileiro. A Stripe fica como alternativa se a integração ou as taxas forem piores.

## Antes de decidir

Precisa da sua conta, porque essas respostas dependem do cadastro:

1. Taxa real por transação recorrente, em cartão e em Pix, nos painéis dos dois.
2. Se Pix Automático está disponível para a sua conta, ou se o Pix recorrente exige ação do cliente a cada cobrança.
3. Se a Stripe aceita a sua empresa ou pessoa física no Brasil e libera Pix.
4. Prazo de recebimento e custo de antecipação.

## Consequências

Em qualquer das opções:

- **Exige plano Blaze do Firebase**, com cobrança por uso, para a Cloud Function que recebe o webhook.
- **A arquitetura já está pronta:** o webhook grava `plano` e `expiraEm` em `entitlements/{uid}`, as regras e o app já respeitam esses campos, e o provedor fica escondido atrás desse documento.
- **O webhook precisa validar a assinatura do provedor** e tratar eventos repetidos sem efeito duplicado.
- **Faltam:** preço, termos de assinatura, cancelamento pelo próprio usuário e regra para quando o pagamento falha.
