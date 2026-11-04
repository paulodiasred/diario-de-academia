import { useEffect } from "react";
import { toast } from "sonner";
import { registerSW } from "virtual:pwa-register";

/**
 * A nova versão só entra quando a pessoa toca em atualizar. Recarregar sozinho poderia
 * interromper quem está no meio de uma série, mesmo sem perder o treino.
 */
export function AtualizacaoApp() {
  useEffect(() => {
    const atualizar = registerSW({
      onNeedRefresh() {
        toast("Nova versão disponível", {
          duration: Infinity,
          action: { label: "Atualizar", onClick: () => void atualizar(true) },
        });
      },
    });
  }, []);

  return null;
}
