import { useCallback, useEffect, useRef, useState } from "react";

/** Timer baseado em horário final: continua certo com a aba em segundo plano. */
export function useRestTimer(duracao: number, aoTerminar?: () => void) {
  const [restante, setRestante] = useState(0);
  const [ativo, setAtivo] = useState(false);
  const [pausado, setPausado] = useState(false);
  const fimRef = useRef<number | null>(null);
  const aoTerminarRef = useRef(aoTerminar);
  aoTerminarRef.current = aoTerminar;

  const segundosAteOFim = () =>
    fimRef.current === null ? 0 : Math.ceil((fimRef.current - Date.now()) / 1000);

  const iniciar = useCallback(() => {
    fimRef.current = Date.now() + duracao * 1000;
    setRestante(duracao);
    setPausado(false);
    setAtivo(true);
  }, [duracao]);

  const pausar = useCallback(() => {
    if (fimRef.current === null) return;
    const faltam = Math.max(0, segundosAteOFim());
    fimRef.current = null;
    setRestante(faltam);
    setAtivo(false);
    setPausado(faltam > 0);
  }, []);

  const retomar = useCallback(() => {
    fimRef.current = Date.now() + restante * 1000;
    setPausado(false);
    setAtivo(true);
  }, [restante]);

  const resetar = useCallback(() => {
    fimRef.current = null;
    setAtivo(false);
    setPausado(false);
    setRestante(duracao);
  }, [duracao]);

  useEffect(() => {
    if (!ativo) return;

    const tick = () => {
      // Já terminou: um tick pendente não pode avisar de novo.
      if (fimRef.current === null) return;
      const faltam = segundosAteOFim();
      if (faltam <= 0) {
        fimRef.current = null;
        setRestante(0);
        setAtivo(false);
        aoTerminarRef.current?.();
        return;
      }
      setRestante(faltam);
    };

    tick();
    const intervalo = setInterval(tick, 500);
    const aoVoltarParaAba = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", aoVoltarParaAba);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVoltarParaAba);
    };
  }, [ativo]);

  return { restante, ativo, pausado, iniciar, pausar, retomar, resetar };
}
