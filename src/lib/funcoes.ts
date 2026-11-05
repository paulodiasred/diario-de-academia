import { app, usarEmulador } from "@/lib/firebase";

const REGIAO = "southamerica-east1";

/** O SDK de funções só carrega aqui: quem não usa a IA não baixa esse código. */
export async function chamarFuncao<Entrada, Saida>(nome: string, dados: Entrada): Promise<Saida> {
  const { connectFunctionsEmulator, getFunctions, httpsCallable } = await import("firebase/functions");
  const funcoes = getFunctions(app, REGIAO);
  if (usarEmulador) connectFunctionsEmulator(funcoes, "127.0.0.1", 5001);
  const resposta = await httpsCallable<Entrada, Saida>(funcoes, nome, { timeout: 180_000 })(dados);
  return resposta.data;
}

const CONHECIDOS = new Set(
  ["invalid-argument", "permission-denied", "failed-precondition", "resource-exhausted", "unavailable", "unauthenticated"].map(
    (codigo) => `functions/${codigo}`,
  ),
);

/** As mensagens de negócio vêm prontas do servidor. Falha de rede não tem o que explicar. */
export function mensagemDaFuncao(erro: unknown, padrao: string): string {
  const { code, message } = (erro ?? {}) as { code?: string; message?: string };
  return code && message && CONHECIDOS.has(code) ? message : padrao;
}
