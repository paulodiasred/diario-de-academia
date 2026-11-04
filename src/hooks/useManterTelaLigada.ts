import { useEffect } from "react";

/**
 * Evita que a tela apague durante o treino. O navegador solta a trava sempre que a aba
 * sai de vista, então ela é pedida de novo na volta. Sem suporte, o app só segue normal.
 */
export function useManterTelaLigada(ativo: boolean) {
  useEffect(() => {
    if (!ativo || !("wakeLock" in navigator)) return;

    let trava: WakeLockSentinel | null = null;
    let encerrado = false;

    const pedir = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const nova = await navigator.wakeLock.request("screen");
        if (encerrado) void nova.release();
        else trava = nova;
      } catch {
        // Bateria fraca ou permissão negada: a tela apenas segue a configuração do aparelho.
      }
    };

    void pedir();
    document.addEventListener("visibilitychange", pedir);
    return () => {
      encerrado = true;
      document.removeEventListener("visibilitychange", pedir);
      void trava?.release();
    };
  }, [ativo]);
}
