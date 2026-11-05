import { Timestamp, type Firestore } from "firebase-admin/firestore";
import { mesDaCota, usadasNoMes, type RecursoDeIA, type RespostaDaAnalise } from "@/domain/analiseTreinos";
import type { Sessao } from "@/domain/sessao";

/** Evita leitura sem fim em uma conta anormal. Cobre anos de treino. */
const MAXIMO_DE_SESSOES = 1000;

const paraIso = (valor: unknown): string => {
  const comData = valor as { toDate?: () => Date } | null | undefined;
  return comData?.toDate?.().toISOString() ?? (valor as string);
};

export function criarRepositorio(db: Firestore) {
  const usoDe = (uid: string) => db.doc(`users/${uid}/uso/ia`);

  /** Grava o mês inteiro de novo: um contador de outro mês nunca sobra no documento. */
  const mudarUso = (uid: string, recurso: RecursoDeIA, agora: Date, mudar: (usadas: number) => number | null) =>
    db.runTransaction(async (t) => {
      const atual = (await t.get(usoDe(uid))).data() ?? null;
      const usadas = usadasNoMes(atual, recurso, agora);
      const nova = mudar(usadas);
      if (nova === null) return false;
      t.set(usoDe(uid), {
        mes: mesDaCota(agora),
        analises: usadasNoMes(atual, "analises", agora),
        fichas: usadasNoMes(atual, "fichas", agora),
        [recurso]: nova,
      });
      return true;
    });

  return {
    /** A mesma regra de `premium()` em firestore.rules. */
    async temPremium(uid: string, agora: Date): Promise<boolean> {
      const dados = (await db.doc(`entitlements/${uid}`).get()).data();
      if (dados?.plano !== "premium") return false;
      return !(dados.expiraEm instanceof Timestamp) || dados.expiraEm.toDate() > agora;
    },

    async lerSessoes(uid: string): Promise<Sessao[]> {
      const snap = await db
        .collection(`users/${uid}/sessions`)
        .orderBy("iniciadaEm", "desc")
        .limit(MAXIMO_DE_SESSOES)
        .get();
      return snap.docs.map((d) => {
        const dados = d.data();
        return {
          ...(dados as Sessao),
          id: d.id,
          iniciadaEm: paraIso(dados.iniciadaEm),
          finalizadaEm: paraIso(dados.finalizadaEm),
          exercicioAtual: 0,
          descanso: null,
        };
      });
    },

    reservarCota(uid: string, recurso: RecursoDeIA, limite: number, agora: Date): Promise<boolean> {
      return mudarUso(uid, recurso, agora, (usadas) => (usadas >= limite ? null : usadas + 1));
    },

    async devolverCota(uid: string, recurso: RecursoDeIA, agora: Date): Promise<void> {
      await mudarUso(uid, recurso, agora, (usadas) => (usadas > 0 ? usadas - 1 : null));
    },

    /** Só a última fica guardada: a pessoa pode apagar, e nada se acumula. */
    async salvar(uid: string, analise: RespostaDaAnalise, modelo: string, agora: Date): Promise<void> {
      await db.doc(`users/${uid}/analises/ultima`).set({
        ...analise,
        modelo,
        criadaEm: Timestamp.fromDate(agora),
      });
    },
  };
}
