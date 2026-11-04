import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/aviso";
import {
  lerPerfil,
  salvarMetaSemanal,
  salvarVinculo,
  type Perfil,
  type VinculoExercicio,
} from "@/data/repositories/usuariosRepository";
import { slug } from "@/domain/texto";
import { useAuth } from "./useAuth";

const SEM_PERFIL: Perfil = { metaSemanal: null, vinculos: {} };

export function usePerfil() {
  const { user } = useAuth();
  const uid = user?.uid;
  const queryClient = useQueryClient();
  const chave = ["perfil", uid];

  const consulta = useQuery({
    queryKey: chave,
    queryFn: () => lerPerfil(uid as string),
    enabled: !!uid,
  });

  const alterar = (alteracao: (atual: Perfil) => Perfil) =>
    queryClient.setQueryData<Perfil>(chave, (atual = SEM_PERFIL) => alteracao(atual));

  const aoFalhar = (mensagem: string) => (erro: unknown) => {
    console.error(mensagem, erro);
    toast.error(mensagem);
    void queryClient.invalidateQueries({ queryKey: chave });
  };

  const definirMeta = (metaSemanal: number) => {
    if (!uid) return;
    alterar((atual) => ({ ...atual, metaSemanal }));
    salvarMetaSemanal(uid, metaSemanal).catch(aoFalhar("Não foi possível salvar a meta."));
  };

  const vincularExercicio = (nome: string, vinculo: VinculoExercicio) => {
    if (!uid) return;
    const chaveVinculo = slug(nome);
    alterar((atual) => ({ ...atual, vinculos: { ...atual.vinculos, [chaveVinculo]: vinculo } }));
    salvarVinculo(uid, chaveVinculo, vinculo).catch(aoFalhar("Não foi possível salvar a referência."));
  };

  return {
    metaSemanal: consulta.data?.metaSemanal ?? null,
    vinculos: consulta.data?.vinculos ?? SEM_PERFIL.vinculos,
    definirMeta,
    vincularExercicio,
  };
}
