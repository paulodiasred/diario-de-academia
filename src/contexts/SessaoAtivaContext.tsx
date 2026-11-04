import { createContext } from "react";
import type { ErroSerie, Sessao } from "@/domain/sessao";
import type { TreinoPersonalizado } from "@/types/catalogo";

export interface SessaoAtivaContextType {
  sessao: Sessao | null;
  carregando: boolean;
  iniciar: (treino: Pick<TreinoPersonalizado, "id" | "nome" | "exercicios">) => Promise<void>;
  /** `imediato: false` é para digitação: agrupa as gravações na nuvem. */
  alterar: (alteracao: (sessao: Sessao) => Sessao, opcoes?: { imediato?: boolean }) => void;
  alternarSerie: (exercicio: number, serie: number) => ErroSerie;
  /** Grava no histórico e retorna o ID da sessão. */
  finalizar: () => string | null;
  descartar: () => void;
}

export const SessaoAtivaContext = createContext<SessaoAtivaContextType | undefined>(undefined);
