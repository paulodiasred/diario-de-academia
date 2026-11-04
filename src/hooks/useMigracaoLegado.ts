import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { migrarDadosLegados } from "@/data/repositories/migracaoRepository";
import { chaveSessoes } from "./useSessoes";

/** Copia em segundo plano os registros antigos. Se falhar, tenta de novo no próximo acesso. */
export function useMigracaoLegado(uid: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!uid) return;
    migrarDadosLegados(uid)
      .then((migrou) => {
        if (!migrou) return;
        void queryClient.invalidateQueries({ queryKey: chaveSessoes(uid) });
        void queryClient.invalidateQueries({ queryKey: ["treinos", uid] });
      })
      .catch((erro) => console.error("Migração dos registros antigos adiada:", erro));
  }, [uid, queryClient]);
}
