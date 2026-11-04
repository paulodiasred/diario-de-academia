import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/aviso";
import {
  excluirExercicioProprio,
  listarExerciciosProprios,
  salvarExercicioProprio,
} from "@/data/repositories/exerciciosRepository";
import { LimiteDoPlano } from "@/domain/planos";
import type { ExercicioProprioInput } from "@/domain/schemas";
import type { ExercicioCatalogo } from "@/types/catalogo";
import { useAuth } from "./useAuth";
import { usePlano } from "./usePlano";

const VAZIO: ExercicioCatalogo[] = [];

export function useExerciciosProprios() {
  const { user } = useAuth();
  const uid = user?.uid;
  const queryClient = useQueryClient();
  const plano = usePlano();
  const chave = ["exercicios-proprios", uid];

  const consulta = useQuery({
    queryKey: chave,
    queryFn: () => listarExerciciosProprios(uid as string),
    enabled: !!uid,
  });

  const aoFalhar = (mensagem: string) => (erro: unknown) => {
    console.error(mensagem, erro);
    toast.error(mensagem);
    void queryClient.invalidateQueries({ queryKey: chave });
    plano.sincronizarUso();
  };

  const salvar = (input: ExercicioProprioInput, id?: string): ExercicioCatalogo => {
    if (!uid) throw new Error("Não autenticado");
    if (!id && !plano.podeCriar("exercicios")) throw new LimiteDoPlano("exercicios");
    const { exercicio, confirmacao } = salvarExercicioProprio(uid, input, id);
    queryClient.setQueryData<ExercicioCatalogo[]>(chave, (atual = []) =>
      [...atual.filter((e) => e.id !== exercicio.id), exercicio].sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR"),
      ),
    );
    if (!id) plano.ajustarUso("exercicios", 1);
    confirmacao.catch(aoFalhar("Não foi possível salvar o exercício."));
    return exercicio;
  };

  const excluir = (id: string) => {
    if (!uid) return;
    const descontar = plano.uso.exercicios > 0;
    queryClient.setQueryData<ExercicioCatalogo[]>(chave, (atual = []) =>
      atual.filter((e) => e.id !== id),
    );
    if (descontar) plano.ajustarUso("exercicios", -1);
    excluirExercicioProprio(uid, id, descontar).catch(aoFalhar("Não foi possível excluir o exercício."));
  };

  return { exercicios: consulta.data ?? VAZIO, salvar, excluir };
}
