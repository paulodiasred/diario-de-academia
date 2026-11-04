import { useQuery, useQueryClient } from "@tanstack/react-query";
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

  const premium = temPremium(assinatura.data ?? PLANO_GRATUITO);
  const uso = contadores.data ?? SEM_USO;

  return {
    premium,
    carregando: assinatura.isLoading,
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
