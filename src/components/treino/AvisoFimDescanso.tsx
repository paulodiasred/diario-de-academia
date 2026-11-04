import { useEffect, useRef } from "react";
import { avisarFimDoDescanso } from "@/lib/avisoDescanso";
import { prepararSom, tocarSomDescanso } from "@/lib/somDescanso";
import { useSessaoAtiva } from "@/hooks/useSessaoAtiva";
import { useTempoDescanso } from "@/hooks/useTempoDescanso";

/** Reabrir o app bem depois do fim não deve apitar: o aviso já não ajuda em nada. */
const LIMITE_ATRASO_SEG = 10;

/** Fica ligado em todas as telas: o descanso termina mesmo com a pessoa olhando a evolução. */
export function AvisoFimDescanso() {
  const { sessao } = useSessaoAtiva();
  const descanso = sessao?.descanso ?? null;
  const { terminou, excedido } = useTempoDescanso(descanso);
  const avisado = useRef<number | null>(null);

  const temTreino = !!sessao;
  useEffect(() => {
    if (!temTreino) return;
    document.addEventListener("pointerup", prepararSom);
    document.addEventListener("keydown", prepararSom);
    return () => {
      document.removeEventListener("pointerup", prepararSom);
      document.removeEventListener("keydown", prepararSom);
    };
  }, [temTreino]);

  const fimEm = descanso?.fimEm ?? null;
  useEffect(() => {
    if (!terminou || fimEm === null || avisado.current === fimEm) return;
    avisado.current = fimEm;
    if (excedido > LIMITE_ATRASO_SEG) return;
    tocarSomDescanso();
    navigator.vibrate?.([200, 100, 200]);
    void avisarFimDoDescanso();
  }, [terminou, fimEm, excedido]);

  return null;
}
