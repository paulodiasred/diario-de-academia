import { useQuery } from "@tanstack/react-query";
import { listarSessoes } from "@/data/repositories/sessoesRepository";
import type { Sessao } from "@/domain/sessao";
import { useAuth } from "./useAuth";

const VAZIO: Sessao[] = [];

export const chaveSessoes = (uid: string | undefined) => ["sessoes", uid];

export function useSessoes() {
  const { user } = useAuth();
  const uid = user?.uid;
  const consulta = useQuery({
    queryKey: chaveSessoes(uid),
    queryFn: () => listarSessoes(uid as string),
    enabled: !!uid,
  });
  return {
    sessoes: consulta.data ?? VAZIO,
    loading: consulta.isLoading,
    erro: consulta.isError,
    recarregar: () => consulta.refetch(),
  };
}
