import type { Assinatura } from "@/domain/planos";

const PREFIXO = "diario:plano:";

/**
 * O último plano confirmado. Se a leitura falhar, quem é Premium não vira gratuito por engano.
 * A validade continua sendo conferida, e o servidor segue decidindo o que pode ser gravado.
 */
export function lerPlanoGuardado(uid: string): Assinatura | null {
  try {
    const salvo = localStorage.getItem(PREFIXO + uid);
    return salvo ? (JSON.parse(salvo) as Assinatura) : null;
  } catch {
    return null;
  }
}

export function guardarPlano(uid: string, assinatura: Assinatura): void {
  try {
    localStorage.setItem(PREFIXO + uid, JSON.stringify(assinatura));
  } catch {
    // Sem localStorage, a leitura seguinte decide.
  }
}

/** No logout: nada de nenhuma conta fica neste aparelho. */
export function limparPlanosGuardados(): void {
  try {
    Object.keys(localStorage)
      .filter((chave) => chave.startsWith(PREFIXO))
      .forEach((chave) => localStorage.removeItem(chave));
  } catch {
    // Sem localStorage não há o que limpar.
  }
}
