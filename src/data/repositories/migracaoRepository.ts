import { doc, getDoc, Timestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firestore";
import {
  converterRegistrosEmSessoes,
  rotinasDoTreinoFixo,
  usouTreinoFixo,
} from "@/domain/legado";
import { listarRegistrosLegados } from "./registrosRepository";
import { sessaoParaDocumento } from "./sessoesRepository";
import { listarTreinos } from "./treinosRepository";

const TAMANHO_LOTE = 400;

/**
 * Copia os registros antigos para o modelo novo, uma vez por conta.
 * Só cria documentos: `registros` e os treinos existentes não são alterados nem apagados.
 * Os IDs são determinísticos, então uma falha no meio pode ser repetida sem duplicar.
 * Retorna true se algo foi migrado.
 */
export async function migrarDadosLegados(uid: string): Promise<boolean> {
  const perfil = doc(db, "users", uid);
  if ((await getDoc(perfil)).data()?.migracaoLegadoEm) return false;

  const [registros, treinos] = await Promise.all([listarRegistrosLegados(uid), listarTreinos(uid)]);

  const escritas: Array<(lote: ReturnType<typeof writeBatch>) => void> = [];

  if (usouTreinoFixo(registros)) {
    const existentes = new Set(treinos.map((t) => t.id));
    for (const { id, dados } of rotinasDoTreinoFixo(uid)) {
      if (existentes.has(id)) continue;
      const agora = Timestamp.now();
      escritas.push((lote) =>
        lote.set(doc(db, "treinos", id), { ...dados, userId: uid, criadoEm: agora, atualizadoEm: agora }),
      );
    }
  }

  for (const sessao of converterRegistrosEmSessoes(registros, treinos, uid)) {
    escritas.push((lote) =>
      lote.set(doc(db, "users", uid, "sessions", sessao.id), sessaoParaDocumento(sessao)),
    );
  }

  for (let i = 0; i < escritas.length; i += TAMANHO_LOTE) {
    const lote = writeBatch(db);
    escritas.slice(i, i + TAMANHO_LOTE).forEach((escrever) => escrever(lote));
    await lote.commit();
  }

  // Por último: só marca como migrado depois que tudo foi confirmado pelo servidor.
  const lote = writeBatch(db);
  lote.set(perfil, { migracaoLegadoEm: Timestamp.now() }, { merge: true });
  await lote.commit();

  return escritas.length > 0;
}
