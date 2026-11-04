import { toast as sonner } from "sonner";

const DURACAO_ERRO_MS = 7000;

/**
 * Avisos do app. Erro fica mais tempo na tela: quem lê entre uma série e outra
 * precisa conseguir terminar de ler o que deu errado.
 */
export const toast = Object.assign((...args: Parameters<typeof sonner>) => sonner(...args), sonner, {
  error: (...[mensagem, opcoes]: Parameters<typeof sonner.error>) =>
    sonner.error(mensagem, { duration: DURACAO_ERRO_MS, ...opcoes }),
});
