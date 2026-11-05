import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { guardarPlano, lerPlanoGuardado } from "@/data/repositories/planoLocal";
import { lerAssinatura, lerContadores } from "@/data/repositories/planoRepository";
import {
  PLANO_GRATUITO,
  podeCriar,
  temPremium,
  type Contadores,
  type RecursoLimitado,
} from "@/domain/planos";
import { useAuth } from "./useAuth";

const SEM_USO: Contadores = { treinos: 0, exercicios: 0 };

/**
 * O que o plano libera na tela. A garantia dos limites de escrita está em firestore.rules.
 * Estatísticas são calculadas no aparelho: esse bloqueio é só de interface.
 */
export function usePlano() {
  const { user } = useAuth();
  const uid = user?.uid;
  const queryClient = useQueryClient();
  const chaveContadores = ["contadores", uid];

  const assinatura = useQuery({
    queryKey: ["assinatura", uid],
    queryFn: () => lerAssinatura(uid as string),
    enabled: !!uid,
  });
  const contadores = useQuery({
    queryKey: chaveContadores,
    queryFn: () => lerContadores(uid as string),
    enabled: !!uid,
  });

  const confirmada = assinatura.data;
  useEffect(() => {
    if (uid && confirmada) guardarPlano(uid, confirmada);
  }, [uid, confirmada]);

  // Falha de leitura não é mudança de plano: vale o último confirmado neste aparelho.
  const guardada = assinatura.isError && uid ? lerPlanoGuardado(uid) : null;
  const premium = temPremium(confirmada ?? guardada ?? PLANO_GRATUITO);
  const uso = contadores.data ?? SEM_USO;

  return {
    premium,
    // A contagem também: sem ela, a tela acharia que há vagas que já foram usadas.
    carregando: assinatura.isLoading || contadores.isLoading,
    uso,
    podeCriar: (recurso: RecursoLimitado) => podeCriar(recurso, premium, uso),
    ajustarUso: (recurso: RecursoLimitado, delta: 1 | -1) => {
      queryClient.setQueryData<Contadores>(chaveContadores, (atual = SEM_USO) => ({
        ...atual,
        [recurso]: Math.max(0, atual[recurso] + delta),
      }));
    },
    sincronizarUso: () => void queryClient.invalidateQueries({ queryKey: chaveContadores }),
  };
}
