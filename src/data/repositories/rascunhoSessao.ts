import type { Sessao } from "@/domain/sessao";
import { gravarRascunhoRemoto } from "./sessoesRepository";

const PREFIXO = "diario:treino-em-andamento:";
const ESPERA_REMOTA_MS = 800;

let pendente: { uid: string; sessao: Sessao } | null = null;
let temporizador: ReturnType<typeof setTimeout> | null = null;

/** localStorage é síncrono: é ele que garante a última alteração se a aba fechar agora. */
export function lerRascunhoLocal(uid: string): Sessao | null {
  try {
    const salvo = localStorage.getItem(PREFIXO + uid);
    return salvo ? (JSON.parse(salvo) as Sessao) : null;
  } catch {
    return null;
  }
}

function gravarLocal(uid: string, sessao: Sessao) {
  try {
    localStorage.setItem(PREFIXO + uid, JSON.stringify(sessao));
  } catch (erro) {
    console.warn("Não foi possível guardar o treino neste aparelho:", erro);
  }
}

/** Envia já o que estava aguardando. */
export function descarregarRascunho(): void {
  if (temporizador) clearTimeout(temporizador);
  temporizador = null;
  if (!pendente) return;
  const { uid, sessao } = pendente;
  pendente = null;
  gravarRascunhoRemoto(uid, sessao).catch((erro) => {
    console.error("Erro ao sincronizar o treino em andamento:", erro);
  });
}

/** Digitação espera um pouco antes de ir para o Firestore; ações como concluir série, não. */
export function guardarRascunho(uid: string, sessao: Sessao, imediato: boolean): void {
  gravarLocal(uid, sessao);
  pendente = { uid, sessao };
  if (imediato) {
    descarregarRascunho();
    return;
  }
  if (temporizador) clearTimeout(temporizador);
  temporizador = setTimeout(descarregarRascunho, ESPERA_REMOTA_MS);
}

export function esquecerRascunhoLocal(uid: string): void {
  if (temporizador) clearTimeout(temporizador);
  temporizador = null;
  pendente = null;
  try {
    localStorage.removeItem(PREFIXO + uid);
  } catch {
    // Sem localStorage não há o que limpar.
  }
}

/** No logout: nada de nenhuma conta fica neste aparelho. */
export function limparRascunhosLocais(): void {
  try {
    Object.keys(localStorage)
      .filter((chave) => chave.startsWith(PREFIXO))
      .forEach((chave) => localStorage.removeItem(chave));
  } catch {
    // Sem localStorage não há o que limpar.
  }
}

/** O rascunho mais recente vence, seja do aparelho ou da nuvem. */
export function escolherRascunho(local: Sessao | null, remoto: Sessao | null): Sessao | null {
  if (!local || !remoto) return local ?? remoto;
  return new Date(local.atualizadaEm) >= new Date(remoto.atualizadaEm) ? local : remoto;
}
