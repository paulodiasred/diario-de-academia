const CHAVE = "diario:avisar-descanso";

export const avisoSuportado = () => typeof Notification !== "undefined" && "serviceWorker" in navigator;

export function avisoLigado(): boolean {
  try {
    return avisoSuportado() && Notification.permission === "granted" && localStorage.getItem(CHAVE) === "1";
  } catch {
    return false;
  }
}

/** Precisa vir de um toque do usuário: é quando o navegador aceita pedir a permissão. */
export async function ligarAviso(): Promise<boolean> {
  if (!avisoSuportado()) return false;
  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") return false;
  localStorage.setItem(CHAVE, "1");
  return true;
}

export function desligarAviso(): void {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    // Sem localStorage, o aviso já não fica ligado.
  }
}

/**
 * Só avisa com o app fora de vista: na tela, o aviso visual e a vibração bastam.
 * Limitação real: com o app fechado ou suspenso pelo sistema, este código não roda.
 * Garantir o aviso nesse caso exige push enviado por um servidor.
 */
export async function avisarFimDoDescanso(): Promise<void> {
  if (!avisoLigado() || document.visibilityState === "visible") return;
  try {
    const registro = await navigator.serviceWorker.ready;
    await registro.showNotification("Descanso finalizado", {
      body: "Hora da próxima série.",
      icon: "/icon-192.png",
      tag: "descanso",
    });
  } catch (erro) {
    console.warn("Não foi possível mostrar o aviso de descanso:", erro);
  }
}
