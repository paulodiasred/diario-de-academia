import { useEffect, useState } from "react";
import { descansoTerminou, segundosExcedidos, segundosRestantes, type Descanso } from "@/domain/sessao";

/** O relógio do descanso. O horário final é a referência: o app pode dormir sem perder a conta. */
export function useTempoDescanso(descanso: Descanso | null) {
  const [, setTique] = useState(0);
  const rodando = descanso !== null && descanso.fimEm !== null;

  useEffect(() => {
    if (!rodando) return;
    const tique = () => setTique((t) => t + 1);
    const intervalo = setInterval(tique, 500);
    document.addEventListener("visibilitychange", tique);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", tique);
    };
  }, [rodando]);

  if (!descanso) return { rodando: false, terminou: false, restante: 0, excedido: 0 };
  return {
    rodando,
    terminou: descansoTerminou(descanso),
    restante: segundosRestantes(descanso),
    excedido: segundosExcedidos(descanso),
  };
}
