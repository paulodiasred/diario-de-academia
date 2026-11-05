// Público de propósito: é o canal para pedidos sobre dados. Para trocar sem mexer no código, defina VITE_CONTATO_EMAIL.
export const EMAIL_CONTATO =
  (import.meta.env.VITE_CONTATO_EMAIL as string | undefined) || "pauloalberto13@gmail.com";

/** Durante o beta, o Premium é liberado à mão: o email já leva a conta a ser liberada. */
export function linkPedidoPremium(emailDaConta: string | null | undefined): string {
  const assunto = "Quero testar o Premium do Diário de Academia";
  const corpo = `Olá! Quero testar o Premium.\n\nEmail da minha conta: ${emailDaConta ?? ""}`;
  return `mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
}
